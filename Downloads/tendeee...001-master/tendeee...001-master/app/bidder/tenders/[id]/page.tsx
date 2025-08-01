"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, Upload, Calendar, MapPin, DollarSign, Clock, FileText, Star, Download } from "lucide-react"
import Link from "next/link"

export default function TenderDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [bidStatus, setBidStatus] = useState(null) // null, 'submitted', 'shortlisted', 'awarded', 'rejected'
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)

  useEffect(() => {
    const fetchProjectAndBidStatus = async () => {
      if (!user || !params.id) return
      
      setLoading(true)
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setLoading(false)
          return
        }

        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${params.id}`)
        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData.project)
        }

        // Check bid status
        const bidResponse = await fetch(`/api/bids?projectId=${params.id}&bidderId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (bidResponse.ok) {
          const bidData = await bidResponse.json()
          if (bidData.bids && bidData.bids.length > 0) {
            setBidStatus(bidData.bids[0].status)
          }
        }
      } catch (error) {
        console.error("Error fetching project data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectAndBidStatus()
  }, [user, params.id])

  const handleSubmitBid = () => {
    router.push(`/bidder/tenders/${params.id}/submit-bid`)
  }

  const handleDownloadFile = async (filename: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to download files.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/files/download/project/${params.id}/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to download file.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500"
      case "closing-soon":
        return "bg-yellow-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500"
      case "shortlisted":
        return "bg-green-500"
      case "awarded":
        return "bg-purple-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getBidStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Bid Submitted"
      case "shortlisted":
        return "Shortlisted"
      case "awarded":
        return "Awarded"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open for Bids"
      case "closing-soon":
        return "Closing Soon"
      case "closed":
        return "Closed"
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground">The requested project could not be found.</p>
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
              <h1 className="text-2xl font-bold">Tender Details</h1>
              <p className="text-sm text-muted-foreground">{project.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {bidStatus ? (
              <Badge className={`${getBidStatusColor(bidStatus)} text-white px-4 py-2 text-sm`}>
                {getBidStatusText(bidStatus)}
              </Badge>
            ) : project.status === "open" ? (
              <Button onClick={handleSubmitBid}>
                <Upload className="h-4 w-4 mr-2" />
                Submit Bid
              </Button>
            ) : null}
            <Link href="/bidder/dashboard">
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
          {/* Tender Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{project.title}</span>
                    <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Posted by {project.tenderCompany} on {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">${project.budget?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{project.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-sm text-muted-foreground">{new Date(project.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{project.duration || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="company">Company Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Category</span>
                      <span className="font-medium">{project.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posted Date</span>
                      <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bid Deadline</span>
                      <span className="font-medium">{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Project Duration</span>
                      <span className="font-medium">{project.duration || 'Not specified'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bidding Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Days Remaining</span>
                      <span className="font-medium">
                        {Math.max(0, Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Bids</span>
                      <span className="font-medium">{project.bidCount || 0} submitted</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Status</span>
                      <span className="font-medium text-muted-foreground">
                        {bidStatus ? getBidStatusText(bidStatus) : 'Not submitted'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.specifications || 'No technical specifications provided.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bidder Requirements</CardTitle>
                  <CardDescription>Mandatory qualifications and documents needed</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.requirements && project.requirements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.requirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specific requirements listed.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Documents</CardTitle>
                  <CardDescription>Download project-related documents and specifications</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.documents && project.documents.length > 0 ? (
                    <div className="space-y-3">
                      {project.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{doc.originalName}</p>
                              <p className="text-sm text-muted-foreground">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(doc.filename)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No documents available for this project.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{project.tenderCompany}</h3>
                    <p className="text-sm text-muted-foreground">
                      Posted on {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Project Category</p>
                      <p className="text-sm text-muted-foreground">{project.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Budget Range</p>
                      <p className="text-sm text-muted-foreground">${project.budget?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
