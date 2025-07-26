"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, Users, Award, TrendingUp, FileText, Clock, Trophy, Star, Target } from "lucide-react"
import Link from "next/link"

export default function ProjectRankingsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState(null)
  const [rankedBids, setRankedBids] = useState([])
  const [top5Bids, setTop5Bids] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/bids/rankings?projectId=${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data.project)
          setRankedBids(data.rankedBids)
          setTop5Bids(data.top5Bids)
          setAnalytics(data.analytics)
          setSummary(data.summary)
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to load rankings.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching rankings:", error)
        toast({
          title: "Error",
          description: "Failed to load project rankings.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchRankings()
  }, [params.id, toast])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Award className="h-6 w-6 text-gray-400" />
      case 3:
        return <Star className="h-6 w-6 text-orange-400" />
      default:
        return <Target className="h-6 w-6 text-blue-500" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-400 bg-yellow-50"
      case 2:
        return "border-gray-400 bg-gray-50"
      case 3:
        return "border-orange-400 bg-orange-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-blue-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
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
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Bid Rankings</h1>
              <p className="text-sm text-muted-foreground">{project.title}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/tender/projects/${params.id}/bids`}>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View All Bids
              </Button>
            </Link>
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
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-lg font-bold text-primary">${project.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Bids</p>
                  <p className="text-lg font-bold">{project.totalBids}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm">{project.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Summary */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Rankings Analytics</CardTitle>
                <CardDescription>Key metrics from bid analysis</CardDescription>
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
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{analytics.averageScore}</p>
                    <p className="text-sm text-purple-600">Average Score</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{analytics.scoreDistribution.excellent}</p>
                    <p className="text-sm text-orange-600">Excellent Bids</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Budget Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Under Budget</span>
                        <Badge className="bg-green-100 text-green-800">{analytics.budgetVariance.underBudget}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">On Budget</span>
                        <Badge className="bg-blue-100 text-blue-800">{analytics.budgetVariance.onBudget}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Over Budget</span>
                        <Badge className="bg-red-100 text-red-800">{analytics.budgetVariance.overBudget}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Score Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Excellent (80-100)</span>
                        <Badge className="bg-green-100 text-green-800">{analytics.scoreDistribution.excellent}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Good (60-79)</span>
                        <Badge className="bg-blue-100 text-blue-800">{analytics.scoreDistribution.good}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average (40-59)</span>
                        <Badge className="bg-yellow-100 text-yellow-800">{analytics.scoreDistribution.average}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Poor (&lt;40)</span>
                        <Badge className="bg-red-100 text-red-800">{analytics.scoreDistribution.poor}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparative Analysis for Many Bids */}
          {rankedBids.length > 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  📊 Comparative Analysis
                </CardTitle>
                <CardDescription>Score-based comparison of all {rankedBids.length} bids</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{rankedBids.filter((b: any) => (b.aiScore || 0) >= 80).length}</p>
                      <p className="text-sm text-green-600">Excellent Bids (80-100)</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{rankedBids.filter((b: any) => (b.aiScore || 0) >= 60 && (b.aiScore || 0) < 80).length}</p>
                      <p className="text-sm text-blue-600">Good Bids (60-79)</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{rankedBids.filter((b: any) => (b.aiScore || 0) < 60).length}</p>
                      <p className="text-sm text-yellow-600">Needs Improvement (&lt;60)</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Competitive Landscape:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Score Range:</span> {Math.min(...rankedBids.map((b: any) => b.aiScore || 0))} - {Math.max(...rankedBids.map((b: any) => b.aiScore || 0))} points
                      </div>
                      <div>
                        <span className="font-medium">Average Score:</span> {Math.round(rankedBids.reduce((sum: number, b: any) => sum + (b.aiScore || 0), 0) / rankedBids.length)} points
                      </div>
                      <div>
                        <span className="font-medium">Price Range:</span> ${Math.min(...rankedBids.map((b: any) => b.bidAmount)).toLocaleString()} - ${Math.max(...rankedBids.map((b: any) => b.bidAmount)).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Competition Level:</span> {rankedBids.length > 10 ? 'High' : rankedBids.length > 5 ? 'Medium' : 'Low'} ({rankedBids.length} bids)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 5 Podium */}
          {top5Bids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  🏆 Top 5 Performers
                </CardTitle>
                <CardDescription>Highest ranked bids with detailed analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {top5Bids.slice(0, 3).map((bid: any) => (
                    <div key={bid._id} className={`p-6 rounded-lg border-2 ${getRankColor(bid.rank)}`}>
                      <div className="text-center mb-4">
                        <div className="flex justify-center mb-2">
                          {getRankIcon(bid.rank)}
                        </div>
                        <h3 className="font-bold text-lg">{bid.bidderCompany}</h3>
                        <p className="text-sm text-muted-foreground">Rank #{bid.rank}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                          <Badge className={getScoreColor(bid.aiScore || 0)}>
                            Score: {bid.aiScore || 0}/100
                          </Badge>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Experience:</span>
                            <span className="font-medium">{bid.detailedExperience?.years || 'N/A'} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Team Size:</span>
                            <span className="font-medium">{bid.detailedExperience?.teamSize || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <Badge className={`${
                            bid.review?.overall === 'Excellent' ? 'bg-green-500' : 
                            bid.review?.overall === 'Good' ? 'bg-blue-500' : 
                            bid.review?.overall === 'Average' ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}>
                            {bid.review?.overall || 'Not Rated'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Remaining top 5 */}
                {top5Bids.length > 3 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Other Top Performers</h4>
                    <div className="space-y-3">
                      {top5Bids.slice(3).map((bid: any) => (
                        <div key={bid._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                              #{bid.rank}
                            </div>
                            <div>
                              <h4 className="font-semibold">{bid.bidderCompany}</h4>
                              <p className="text-sm text-muted-foreground">{bid.competitiveAdvantage}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                            <Badge className={getScoreColor(bid.aiScore || 0)} size="sm">
                              {bid.aiScore || 0}/100
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Complete Rankings List */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Rankings</CardTitle>
              <CardDescription>All bids ranked by AI analysis score</CardDescription>
            </CardHeader>
            <CardContent>
              {rankedBids.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bids have been submitted for this project yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rankedBids.map((bid: any) => (
                    <div key={bid._id} className={`border rounded-lg p-4 ${
                      bid.rank <= 3 ? getRankColor(bid.rank) : 'bg-white'
                    }`}>
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
                            <h3 className="font-semibold text-lg">{bid.bidderCompany}</h3>
                            <p className="text-sm text-muted-foreground">
                              {bid.competitiveAdvantage} • Submitted {new Date(bid.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getScoreColor(bid.aiScore || 0)}>
                              Score: {bid.aiScore || 0}/100
                            </Badge>
                            {bid.percentile && (
                              <Badge variant="outline" className="text-purple-600">
                                Top {100 - bid.percentile}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Experience</p>
                          <p className="text-sm">{bid.detailedExperience?.years || 'N/A'} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Team Size</p>
                          <p className="text-sm">{bid.detailedExperience?.teamSize || 'N/A'} members</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">AI Rating</p>
                          <Badge className={`${
                            bid.review?.overall === 'Excellent' ? 'bg-green-500' : 
                            bid.review?.overall === 'Good' ? 'bg-blue-500' : 
                            bid.review?.overall === 'Average' ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}>
                            {bid.review?.overall || 'Not Rated'}
                          </Badge>
                        </div>
                      </div>

                      {bid.review?.recommendation && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-blue-700">
                            <strong>AI Recommendation:</strong> {bid.review.recommendation}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {bid.rank <= 5 && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Award className="h-4 w-4 mr-2" />
                            Shortlist
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