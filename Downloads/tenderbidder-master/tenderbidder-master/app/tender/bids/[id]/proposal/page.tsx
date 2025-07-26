"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, FileText, Award, TrendingUp, Clock, DollarSign, Users, Star } from "lucide-react"

export default function ProposalViewPage() {
  const { user } = useAuth()
  const params = useParams()
  const { toast } = useToast()
  const [bid, setBid] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true)
      try {
        // Try to get token from URL parameters first, then from localStorage
        const urlParams = new URLSearchParams(window.location.search)
        const urlToken = urlParams.get('token')
        const token = urlToken || localStorage.getItem("auth_token")
        
        if (!token) {
          toast({
            title: "Error",
            description: "Please sign in to view this proposal.",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(`/api/bids/${params.id}/proposal`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBid(data.bid)
          setProject(data.project)
        } else {
          const errorData = await response.json()
          toast({
            title: "Error",
            description: errorData.error || "Failed to load proposal.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching proposal:", error)
        toast({
          title: "Error",
          description: "Failed to load proposal.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchProposal()
  }, [params.id, toast])

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

  if (!bid || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Proposal Not Found</h2>
          <p className="text-muted-foreground">The requested proposal could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Full Proposal</h1>
              <p className="text-sm text-muted-foreground">{bid.bidderCompany}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.close()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Project & Bid Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-lg font-bold text-primary">${project.budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm">{project.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm">{project.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bid Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{bid.bidderCompany}</h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(bid.status)}>
                    {getStatusText(bid.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Bid Amount</p>
                    <p className="text-2xl font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Score</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getScoreColor(bid.aiScore || 0)} text-white`}>
                        {bid.aiScore || 0}/100
                      </Badge>
                      {bid.rank && (
                        <Badge variant="outline">Rank #{bid.rank}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-sm">{bid.timeline?.weeks || "N/A"} weeks</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm">
                      {bid.timeline?.startDate ? new Date(bid.timeline.startDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Proposal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Detailed Proposal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {bid.proposal}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Qualifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Experience & Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Years of Experience:</span>
                    <span>{bid.experience?.years || 'N/A'} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Similar Projects:</span>
                    <span>{bid.experience?.similarProjects || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Team Size:</span>
                    <span>{bid.experience?.teamSize || 'N/A'} members</span>
                  </div>
                </div>

                {bid.qualifications && bid.qualifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Qualifications & Certifications</h4>
                    <div className="space-y-1">
                      {bid.qualifications.map((qual: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-500 mr-2" />
                          <span className="text-sm">{qual}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  AI Analysis & Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bid.review && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-medium">Overall Rating:</span>
                      <Badge className={`${
                        bid.review.overall === 'Excellent' ? 'bg-green-500' : 
                        bid.review.overall === 'Good' ? 'bg-blue-500' : 
                        bid.review.overall === 'Average' ? 'bg-yellow-500' : 
                        'bg-red-500'
                      } text-white`}>
                        {bid.review.overall}
                      </Badge>
                    </div>

                    {bid.review.strengths && bid.review.strengths.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-green-600 mb-2">Strengths:</h5>
                        <ul className="space-y-1">
                          {bid.review.strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {bid.review.weaknesses && bid.review.weaknesses.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-red-600 mb-2">Areas for Improvement:</h5>
                        <ul className="space-y-1">
                          {bid.review.weaknesses.map((weakness: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {bid.review.recommendation && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-1">AI Recommendation:</h5>
                        <p className="text-sm text-blue-700">{bid.review.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}

                {bid.analysis && (
                  <div>
                    <h5 className="font-medium mb-2">Detailed Analysis:</h5>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Price Competitiveness:</span>
                        <span className="font-medium">{bid.analysis.priceCompetitiveness}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Proposal Quality:</span>
                        <span className="font-medium">{bid.analysis.proposalQuality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Experience Level:</span>
                        <span className="font-medium">{bid.analysis.experience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Qualifications:</span>
                        <span className="font-medium">{bid.analysis.qualifications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeline Feasibility:</span>
                        <span className="font-medium">{bid.analysis.timeline}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* References */}
          {bid.references && bid.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bid.references.map((reference: string, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{reference}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {bid.documents && bid.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Attached Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bid.documents.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(doc.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}