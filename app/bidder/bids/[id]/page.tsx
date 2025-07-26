"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, ArrowLeft, FileText, Download, Eye, Calendar, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"

// Mock bid data
const mockBid = {
  id: "1",
  tenderId: "1",
  title: "Office Complex Construction",
  company: "BuildCorp Ltd",
  submittedDate: "2024-01-12",
  bidAmount: "$2,350,000",
  timeline: "18 months",
  status: "under-review",
  aiScore: 87,
  rank: 2,
  approach:
    "Our approach focuses on sustainable construction practices with advanced project management methodologies. We will utilize BIM technology for precise planning and execution, ensuring minimal environmental impact while maintaining the highest quality standards.",
  experience: "15 years in commercial construction",
  teamSize: "25 professionals",
  additionalNotes:
    "We offer a 2-year extended warranty and post-completion maintenance services at no additional cost.",
  uploadedFiles: [
    "Company_License.pdf",
    "Insurance_Certificate.pdf",
    "Previous_Projects_Portfolio.pdf",
    "Technical_Specifications.docx",
    "Project_Timeline.xlsx",
  ],
  feedback:
    "Strong technical proposal with competitive pricing. Excellent compliance with all requirements and innovative approach to sustainability.",
  compliance: 95,
  completeness: 88,
  quality: 89,
}

export default function BidDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under-review":
        return "bg-blue-500"
      case "awarded":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "under-review":
        return "Under Review"
      case "awarded":
        return "Awarded"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const handleDownloadFile = (fileName: string) => {
    // Mock file download
    const link = document.createElement("a")
    link.href = `/placeholder.pdf?file=${fileName}`
    link.download = fileName
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Bid Details</h1>
              <p className="text-sm text-muted-foreground">{mockBid.title}</p>
            </div>
          </div>
          <Link href="/bidder/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Bid Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{mockBid.title}</span>
                    <Badge className={getStatusColor(mockBid.status)}>{getStatusText(mockBid.status)}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Submitted to {mockBid.company} on {mockBid.submittedDate}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">#{mockBid.rank}</div>
                  <p className="text-sm text-muted-foreground">Current Rank</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Bid Amount</p>
                    <p className="text-sm text-muted-foreground">{mockBid.bidAmount}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-sm text-muted-foreground">{mockBid.timeline}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">AI Score</p>
                    <p className="text-sm text-muted-foreground">{mockBid.aiScore}/100</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Documents</p>
                    <p className="text-sm text-muted-foreground">{mockBid.uploadedFiles.length} files</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Results</CardTitle>
              <CardDescription>Automated evaluation of your bid submission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">{mockBid.aiScore}</div>
                  <p className="text-sm text-muted-foreground">Overall AI Score</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">#{mockBid.rank}</div>
                  <p className="text-sm text-muted-foreground">Current Ranking</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">{getStatusText(mockBid.status)}</div>
                  <p className="text-sm text-muted-foreground">Bid Status</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Compliance Score</span>
                    <span>{mockBid.compliance}%</span>
                  </div>
                  <Progress value={mockBid.compliance} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completeness Score</span>
                    <span>{mockBid.completeness}%</span>
                  </div>
                  <Progress value={mockBid.completeness} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quality Score</span>
                    <span>{mockBid.quality}%</span>
                  </div>
                  <Progress value={mockBid.quality} />
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">AI Feedback:</p>
                <p className="text-sm text-muted-foreground">{mockBid.feedback}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Bid Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Approach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{mockBid.approach}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Experience</span>
                      <span className="font-medium">{mockBid.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team Size</span>
                      <span className="font-medium">{mockBid.teamSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted Date</span>
                      <span className="font-medium">{mockBid.submittedDate}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {mockBid.additionalNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{mockBid.additionalNotes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>All files submitted with your bid</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockBid.uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{file}</p>
                            <p className="text-sm text-muted-foreground">Uploaded on {mockBid.submittedDate}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadFile(file)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadFile(file)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bid Timeline</CardTitle>
                  <CardDescription>Track your bid progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-primary">
                      <div className="text-sm">
                        <p className="font-medium">Bid Submitted</p>
                        <p className="text-muted-foreground">{mockBid.submittedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500">
                      <div className="text-sm">
                        <p className="font-medium">AI Analysis Completed</p>
                        <p className="text-muted-foreground">Score: {mockBid.aiScore}/100</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-500">
                      <div className="text-sm">
                        <p className="font-medium">Under Review</p>
                        <p className="text-muted-foreground">Currently ranked #{mockBid.rank}</p>
                      </div>
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
