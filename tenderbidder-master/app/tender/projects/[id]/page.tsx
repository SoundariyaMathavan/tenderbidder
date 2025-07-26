"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, ArrowLeft, Users, Calendar, MapPin, DollarSign, Clock, FileText, Settings } from "lucide-react"
import Link from "next/link"

// Mock project data
const mockProject = {
  id: "1",
  title: "Office Complex Construction",
  description:
    "Modern 10-story office building with parking facility. This project involves the construction of a state-of-the-art commercial complex featuring sustainable design elements, advanced HVAC systems, and modern amenities.",
  budget: "$2,500,000",
  location: "Downtown District",
  deadline: "2024-02-15",
  status: "open",
  category: "Commercial Construction",
  duration: "18 months",
  bidCount: 12,
  progress: 0,
  postedDate: "2024-01-10",
  companyName: "BuildCorp Ltd",
  specifications:
    "The building will feature reinforced concrete structure, glass facade, energy-efficient systems, underground parking for 200 vehicles, and LEED Gold certification requirements.",
  requirements: ["Construction License", "Insurance Certificate", "Previous Experience", "Safety Certification"],
}

export default function ProjectDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState(mockProject)
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500"
      case "in-progress":
        return "bg-blue-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open for Bids"
      case "in-progress":
        return "In Progress"
      case "closed":
        return "Closed"
      default:
        return status
    }
  }

  const handleStopBids = () => {
    setProject({ ...project, status: "closed" })
    // In real app, this would call your API
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Project Details</h1>
              <p className="text-sm text-muted-foreground">{project.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/tender/projects/${params.id}/bids`}>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View Bids ({project.bidCount})
              </Button>
            </Link>
            <Link href="/tender/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Project Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{project.title}</span>
                    <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                  </CardTitle>
                  <CardDescription>Posted on {project.postedDate}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {project.status === "open" && (
                    <Button variant="destructive" onClick={handleStopBids}>
                      Stop Accepting Bids
                    </Button>
                  )}
                  <Link href={`/tender/projects/${params.id}/edit`}>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">{project.budget}</p>
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
                    <p className="text-sm text-muted-foreground">{project.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{project.duration}</p>
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
              <TabsTrigger value="activity">Activity</TabsTrigger>
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
                    <CardTitle>Bid Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Bids Received</span>
                      <span className="font-bold">{project.bidCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Days Remaining</span>
                      <span className="font-bold">15</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Average Bid Score</span>
                      <span className="font-bold">82</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Progress</span>
                      <span className="font-bold">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                    <div className="text-sm text-muted-foreground">
                      {project.status === "open" ? "Collecting bids" : "Project in progress"}
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
                  <p className="text-muted-foreground leading-relaxed">{project.specifications}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bidder Requirements</CardTitle>
                  <CardDescription>Mandatory qualifications for bidders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-primary">
                      <div className="text-sm">
                        <p className="font-medium">Project created</p>
                        <p className="text-muted-foreground">Posted on {project.postedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500">
                      <div className="text-sm">
                        <p className="font-medium">First bid received</p>
                        <p className="text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500">
                      <div className="text-sm">
                        <p className="font-medium">AI analysis completed</p>
                        <p className="text-muted-foreground">1 day ago</p>
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
