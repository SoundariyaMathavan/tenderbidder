"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, Upload, Calendar, MapPin, DollarSign, Clock, FileText, Star } from "lucide-react"
import Link from "next/link"

// Mock tender data
const mockTender = {
  id: "1",
  title: "Office Complex Construction",
  company: "BuildCorp Ltd",
  description:
    "Modern 10-story office building with parking facility. This project involves the construction of a state-of-the-art commercial complex featuring sustainable design elements, advanced HVAC systems, and modern amenities.",
  budget: "$2,500,000",
  location: "Downtown District",
  deadline: "2024-02-15",
  category: "Commercial Construction",
  duration: "18 months",
  status: "open",
  postedDate: "2024-01-10",
  specifications:
    "The building will feature reinforced concrete structure, glass facade, energy-efficient systems, underground parking for 200 vehicles, and LEED Gold certification requirements.",
  requirements: ["Construction License", "Insurance Certificate", "Previous Experience", "Safety Certification"],
  companyRating: 4.6,
  companyProjects: 15,
}

export default function TenderDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [bidStatus, setBidStatus] = useState(null) // null, 'submitted', 'shortlisted', 'awarded', 'rejected'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkBidStatus = async () => {
      if (!user || !params.id) return
      
      setLoading(true)
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(`/api/bids?projectId=${params.id}&bidderId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.bids && data.bids.length > 0) {
            setBidStatus(data.bids[0].status)
          }
        }
      } catch (error) {
        console.error("Error checking bid status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkBidStatus()
  }, [user, params.id])

  const handleSubmitBid = () => {
    router.push(`/bidder/tenders/${params.id}/submit-bid`)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Tender Details</h1>
              <p className="text-sm text-muted-foreground">{mockTender.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loading ? (
              <Button disabled>
                <Clock className="h-4 w-4 mr-2" />
                Loading...
              </Button>
            ) : bidStatus ? (
              <Badge className={`${getBidStatusColor(bidStatus)} text-white px-4 py-2 text-sm`}>
                {getBidStatusText(bidStatus)}
              </Badge>
            ) : mockTender.status === "open" ? (
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
                    <span>{mockTender.title}</span>
                    <Badge className={getStatusColor(mockTender.status)}>{getStatusText(mockTender.status)}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Posted by {mockTender.company} on {mockTender.postedDate}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{mockTender.companyRating}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{mockTender.companyProjects} projects completed</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">{mockTender.budget}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{mockTender.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-sm text-muted-foreground">{mockTender.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{mockTender.duration}</p>
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
              <TabsTrigger value="company">Company Info</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{mockTender.description}</p>
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
                      <span className="font-medium">{mockTender.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posted Date</span>
                      <span className="font-medium">{mockTender.postedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bid Deadline</span>
                      <span className="font-medium">{mockTender.deadline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Project Duration</span>
                      <span className="font-medium">{mockTender.duration}</span>
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
                      <Badge className={getStatusColor(mockTender.status)}>{getStatusText(mockTender.status)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Days Remaining</span>
                      <span className="font-medium">15 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Bids</span>
                      <span className="font-medium">12 submitted</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Status</span>
                      <span className="font-medium text-muted-foreground">Not submitted</span>
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
                  <p className="text-muted-foreground leading-relaxed">{mockTender.specifications}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockTender.requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
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
                    <h3 className="font-semibold text-lg">{mockTender.company}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(mockTender.companyRating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{mockTender.companyRating}</span>
                      <span className="text-muted-foreground">({mockTender.companyProjects} projects)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Industry Experience</p>
                      <p className="text-sm text-muted-foreground">15+ years in construction</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Specialization</p>
                      <p className="text-sm text-muted-foreground">Commercial & Residential</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">Downtown District</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Contact</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `mailto:contact@buildcorp.com?subject=Inquiry about ${mockTender.title}&body=Dear BuildCorp team,\n\nI am interested in learning more about the ${mockTender.title} project.\n\nBest regards,\n${user?.companyName}`,
                            "_blank",
                          )
                        }
                      >
                        Send Email
                      </Button>
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
