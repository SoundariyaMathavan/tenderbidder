"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, Users, Award, TrendingUp, FileText, Clock, Trophy } from "lucide-react"
import Link from "next/link"

export default function ProjectBidsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState(null)
  const [bids, setBids] = useState([])
  const [top5Bids, setTop5Bids] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Function to assign basic rankings to bids
  const assignBasicRankings = (bidsArray: any[]) => {
    return bidsArray.map((bid, index) => ({
      ...bid,
      rank: bid.rank || index + 1,
      percentile: bid.percentile || Math.round(((bidsArray.length - index) / bidsArray.length) * 100)
    }))
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${params.id}`)
        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData.project)
        }

        // Fetch bids
        const bidsResponse = await fetch(`/api/bids?projectId=${params.id}`)
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json()
          // Sort bids by AI score (highest first), then by bid amount (lowest first) as tiebreaker
          const sortedBids = (bidsData.bids || []).sort((a, b) => {
            if (b.aiScore !== a.aiScore) {
              return (b.aiScore || 0) - (a.aiScore || 0)
            }
            return (a.bidAmount || 0) - (b.bidAmount || 0)
          })
          // Assign basic rankings if not already present
          const rankedBids = assignBasicRankings(sortedBids)
          setBids(rankedBids)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load project bids.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchData()
  }, [params.id, toast])

  const analyzeBids = async () => {
    setAnalyzing(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to analyze bids.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/bids/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: params.id }),
      })

      const data = await response.json()

      if (response.ok) {
        // Sort the analyzed bids by AI score
        const sortedBids = (data.allBids || data.bids || []).sort((a, b) => {
          if (b.aiScore !== a.aiScore) {
            return (b.aiScore || 0) - (a.aiScore || 0)
          }
          return (a.bidAmount || 0) - (b.bidAmount || 0)
        })
        setBids(sortedBids)
        setTop5Bids(data.top5Bids || [])
        setAnalytics(data.analytics)
        setRecommendations(data.recommendations)
        setSummary(data.summary)
        toast({
          title: "Success",
          description: "Bids analyzed successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to analyze bids.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze bids.",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleBidAction = async (bidId: string, action: string, bidderCompany?: string) => {
    setActionLoading(bidId)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to perform this action.",
          variant: "destructive",
        })
        return
      }

      console.log("Sending bid action:", {
        bidId,
        action,
        projectId: params.id,
        user: user?.email
      })

      const response = await fetch("/api/bids/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bidId,
          action,
          projectId: params.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `${bidderCompany || 'Bidder'} has been ${action}ed successfully!`,
        })
        
        // Update the bid status locally instead of full page reload
        setBids(prevBids => 
          prevBids.map(bid => 
            bid._id === bidId 
              ? { ...bid, status: action === 'shortlist' ? 'shortlisted' : action === 'award' ? 'awarded' : 'rejected' }
              : bid
          )
        )
      } else {
        console.error(`${action} error:`, {
          status: response.status,
          statusText: response.statusText,
          data: data,
          projectId: params.id,
          bidId: bidId
        })
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} bid. Status: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} bid.`,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewProposal = (bidId: string, bidderCompany: string) => {
    // Open proposal in a new window with authentication token
    const token = localStorage.getItem("auth_token")
    if (!token) {
      toast({
        title: "Error",
        description: "Please sign in to view proposal details.",
        variant: "destructive",
      })
      return
    }
    
    // Create a URL with token as a query parameter for the new window
    const proposalUrl = `/tender/bids/${bidId}/proposal?token=${encodeURIComponent(token)}`
    window.open(proposalUrl, '_blank')
  }

  const handleStopReceivingBids = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to perform this action.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/projects/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "closed",
          reason: "Stopped accepting new bids"
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project closed. No new bids will be accepted.",
        })
        
        // Refresh the data
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to close project.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close project.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500"
      case "shortlisted":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "awarded":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submitted"
      case "shortlisted":
        return "Shortlisted"
      case "rejected":
        return "Rejected"
      case "awarded":
        return "Awarded"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return <div>Project not found.</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Project Bids</h1>
              <p className="text-sm text-muted-foreground">{project.title}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/tender/projects/${params.id}/rankings`}>
              <Button>
                <Trophy className="h-4 w-4 mr-2" />
                View Rankings
              </Button>
            </Link>
            <Button onClick={analyzeBids} disabled={analyzing || bids.length === 0}>
              {analyzing ? "Analyzing..." : "Re-analyze Bids"}
            </Button>
            {project.status === "active" && (
              <Button 
                variant="destructive" 
                onClick={handleStopReceivingBids}
                className="bg-red-600 hover:bg-red-700"
              >
                <Clock className="h-4 w-4 mr-2" />
                Stop Receiving Bids
              </Button>
            )}
            <Link href="/tender/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-lg font-bold text-primary">${project.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Bids</p>
                  <p className="text-lg font-bold">{bids.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          {analytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Bid Analytics</CardTitle>
                  <CardDescription>Comprehensive analysis of all submitted bids</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">${analytics.averageBidAmount?.toLocaleString()}</p>
                      <p className="text-sm text-blue-600">Average Bid</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">${analytics.lowestBid?.toLocaleString()}</p>
                      <p className="text-sm text-green-600">Lowest Bid</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">${analytics.highestBid?.toLocaleString()}</p>
                      <p className="text-sm text-red-600">Highest Bid</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{analytics.averageScore}</p>
                      <p className="text-sm text-purple-600">Average Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Budget Distribution */}
                    <div>
                      <h4 className="font-semibold mb-3">Budget Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Under Budget</span>
                          <span className="text-sm font-medium text-green-600">{analytics.budgetVariance.underBudget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">On Budget</span>
                          <span className="text-sm font-medium text-blue-600">{analytics.budgetVariance.onBudget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Over Budget</span>
                          <span className="text-sm font-medium text-red-600">{analytics.budgetVariance.overBudget}</span>
                        </div>
                      </div>
                    </div>

                    {/* Experience Distribution */}
                    <div>
                      <h4 className="font-semibold mb-3">Experience Levels</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Expert (10+ years)</span>
                          <span className="text-sm font-medium">{analytics.experienceDistribution.expert}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Experienced (5-10 years)</span>
                          <span className="text-sm font-medium">{analytics.experienceDistribution.experienced}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Intermediate (2-5 years)</span>
                          <span className="text-sm font-medium">{analytics.experienceDistribution.intermediate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Junior (&lt;2 years)</span>
                          <span className="text-sm font-medium">{analytics.experienceDistribution.junior}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Distribution */}
                    <div>
                      <h4 className="font-semibold mb-3">Score Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Excellent (80-100)</span>
                          <span className="text-sm font-medium text-green-600">{analytics.scoreDistribution.excellent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Good (60-79)</span>
                          <span className="text-sm font-medium text-blue-600">{analytics.scoreDistribution.good}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average (40-59)</span>
                          <span className="text-sm font-medium text-yellow-600">{analytics.scoreDistribution.average}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Poor (&lt;40)</span>
                          <span className="text-sm font-medium text-red-600">{analytics.scoreDistribution.poor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Insights and suggestions based on bid analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-yellow-800">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Section */}
              {summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Summary</CardTitle>
                    <CardDescription>Key insights from bid analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{summary.totalAnalyzed}</p>
                        <p className="text-sm text-blue-600">Total Bids Analyzed</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{summary.topPerformers}</p>
                        <p className="text-sm text-green-600">Top Performers</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{summary.averageTopScore}</p>
                        <p className="text-sm text-purple-600">Avg Top 5 Score</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{summary.budgetCompliantTop5}</p>
                        <p className="text-sm text-orange-600">Within Budget (Top 5)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top 5 Bids Section */}
              {top5Bids.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>🏆 Top 5 Ranked Bids</CardTitle>
                    <CardDescription>
                      Highest scoring bids with detailed reviews and experience analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {top5Bids.map((bid: any, index) => (
                        <div key={bid._id} className={`border-2 rounded-lg p-6 ${
                          bid.rank === 1 ? 'border-gold bg-yellow-50' : 
                          bid.rank === 2 ? 'border-silver bg-gray-50' : 
                          bid.rank === 3 ? 'border-bronze bg-orange-50' : 
                          'border-gray-200 bg-white'
                        }`}>
                          {/* Header with Ranking */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                bid.rank === 1 ? 'bg-yellow-500' : 
                                bid.rank === 2 ? 'bg-gray-400' : 
                                bid.rank === 3 ? 'bg-orange-400' : 
                                'bg-blue-500'
                              }`}>
                                #{bid.rank}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">{bid.bidderCompany}</h3>
                                <p className="text-sm text-muted-foreground">{bid.competitiveAdvantage}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                              <Badge className={`${
                                bid.aiScore >= 80 ? 'bg-green-500' : 
                                bid.aiScore >= 60 ? 'bg-blue-500' : 
                                bid.aiScore >= 40 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}>
                                Score: {bid.aiScore}/100
                              </Badge>
                            </div>
                          </div>

                          {/* Experience Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center">
                                <Award className="h-4 w-4 mr-2" />
                                Experience & Qualifications
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Years of Experience:</span>
                                  <span className="font-medium">{bid.detailedExperience?.years || 'N/A'} years</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Similar Projects:</span>
                                  <span className="font-medium">{bid.detailedExperience?.similarProjects || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Team Size:</span>
                                  <span className="font-medium">{bid.detailedExperience?.teamSize || 'N/A'} members</span>
                                </div>
                                <div className="mt-3">
                                  <span className="font-medium">Specializations:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {bid.detailedExperience?.specializations?.slice(0, 3).map((spec: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {spec}
                                      </Badge>
                                    )) || <span className="text-muted-foreground text-xs">None listed</span>}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                AI Review & Analysis
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm font-medium">Overall Rating: </span>
                                  <Badge className={`${
                                    bid.review?.overall === 'Excellent' ? 'bg-green-500' : 
                                    bid.review?.overall === 'Good' ? 'bg-blue-500' : 
                                    bid.review?.overall === 'Average' ? 'bg-yellow-500' : 
                                    'bg-red-500'
                                  }`}>
                                    {bid.review?.overall || 'Not Rated'}
                                  </Badge>
                                </div>
                                
                                {bid.review?.strengths?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 mb-1">Strengths:</p>
                                    <ul className="text-xs space-y-1">
                                      {bid.review.strengths.slice(0, 3).map((strength: string, idx: number) => (
                                        <li key={idx} className="flex items-center">
                                          <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                                          {strength}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {bid.review?.weaknesses?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-red-600 mb-1">Areas for Improvement:</p>
                                    <ul className="text-xs space-y-1">
                                      {bid.review.weaknesses.slice(0, 2).map((weakness: string, idx: number) => (
                                        <li key={idx} className="flex items-center">
                                          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                                          {weakness}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* AI Recommendation */}
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h5 className="font-semibold text-blue-800 mb-2">AI Recommendation:</h5>
                            <p className="text-sm text-blue-700">{bid.review?.recommendation || 'No recommendation available'}</p>
                          </div>

                          {/* Proposal Preview */}
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">Proposal Summary:</h5>
                            <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                              {bid.proposal?.substring(0, 300)}...
                            </p>
                          </div>

                          {/* References */}
                          {bid.detailedExperience?.references?.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-semibold mb-2">References:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {bid.detailedExperience.references.slice(0, 2).map((ref: string, idx: number) => (
                                  <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                                    {ref}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewProposal(bid._id, bid.bidderCompany)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Full Proposal
                            </Button>
                            {bid.status === "submitted" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBidAction(bid._id, "shortlist", bid.bidderCompany)}
                                disabled={actionLoading === bid._id}
                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              >
                                <Award className="h-4 w-4 mr-2" />
                                {actionLoading === bid._id ? "Processing..." : "Shortlist"}
                              </Button>
                            )}
                            {(bid.status === "submitted" || bid.status === "shortlisted") && (
                              <Button 
                                size="sm"
                                onClick={() => handleBidAction(bid._id, "award", bid.bidderCompany)}
                                disabled={actionLoading === bid._id}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Trophy className="h-4 w-4 mr-2" />
                                {actionLoading === bid._id ? "Processing..." : "Award Project"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Bids List */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted Bids</CardTitle>
              <CardDescription>
                {bids.length === 0 
                  ? "No bids submitted yet" 
                  : `${bids.length} bid${bids.length > 1 ? 's' : ''} received`
                }
                {bids.length > 0 && !bids.some(bid => bid.aiScore > 0) && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    💡 Click "Re-analyze Bids" to get AI scores and detailed rankings for better decision making.
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bids have been submitted for this project yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid: any) => (
                    <div key={bid._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{bid.bidderCompany}</h3>
                          <p className="text-sm text-muted-foreground">
                            Submitted on {new Date(bid.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {bid.aiScore > 0 && (
                            <Badge 
                              variant="outline" 
                              className={`font-bold ${
                                bid.aiScore >= 80 ? 'text-green-600 border-green-600' : 
                                bid.aiScore >= 60 ? 'text-blue-600 border-blue-600' : 
                                bid.aiScore >= 40 ? 'text-yellow-600 border-yellow-600' : 
                                'text-red-600 border-red-600'
                              }`}
                            >
                              🏆 Score: {bid.aiScore}/100
                            </Badge>
                          )}
                          {bid.rank && (
                            <Badge 
                              variant="outline" 
                              className={`font-bold ${
                                bid.rank === 1 ? 'text-yellow-600 border-yellow-600 bg-yellow-50' :
                                bid.rank === 2 ? 'text-gray-600 border-gray-600 bg-gray-50' :
                                bid.rank === 3 ? 'text-orange-600 border-orange-600 bg-orange-50' :
                                'text-blue-600 border-blue-600'
                              }`}
                            >
                              {bid.rank === 1 ? '🥇' : bid.rank === 2 ? '🥈' : bid.rank === 3 ? '🥉' : '📊'} Rank #{bid.rank}
                            </Badge>
                          )}
                          {bid.percentile && (
                            <Badge variant="outline" className="text-purple-600">
                              Top {100 - bid.percentile}%
                            </Badge>
                          )}
                          <Badge className={getStatusColor(bid.status)}>
                            {getStatusText(bid.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Bid Amount</p>
                          <p className="text-lg font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Timeline</p>
                          <p className="text-sm">{bid.timeline?.weeks || "N/A"} weeks</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Experience</p>
                          <p className="text-sm">{bid.experience?.years || "N/A"} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Team Size</p>
                          <p className="text-sm">{bid.experience?.teamSize || "N/A"} members</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Proposal Summary</p>
                        <p className="text-sm text-muted-foreground">
                          {bid.proposal?.substring(0, 200)}...
                        </p>
                      </div>

                      {bid.analysis && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">AI Analysis</p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Price:</span> {bid.analysis.priceCompetitiveness}
                            </div>
                            <div>
                              <span className="font-medium">Proposal:</span> {bid.analysis.proposalQuality}
                            </div>
                            <div>
                              <span className="font-medium">Experience:</span> {bid.analysis.experience}
                            </div>
                            <div>
                              <span className="font-medium">Qualifications:</span> {bid.analysis.qualifications}
                            </div>
                            <div>
                              <span className="font-medium">Timeline:</span> {bid.analysis.timeline}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProposal(bid._id, bid.bidderCompany)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Proposal
                        </Button>
                        {bid.status === "submitted" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBidAction(bid._id, "shortlist", bid.bidderCompany)}
                            disabled={actionLoading === bid._id}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            <Award className="h-4 w-4 mr-2" />
                            {actionLoading === bid._id ? "Processing..." : "Shortlist"}
                          </Button>
                        )}
                        {(bid.status === "submitted" || bid.status === "shortlisted") && (
                          <Button 
                            size="sm"
                            onClick={() => handleBidAction(bid._id, "award", bid.bidderCompany)}
                            disabled={actionLoading === bid._id}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            {actionLoading === bid._id ? "Processing..." : "Award Project"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
