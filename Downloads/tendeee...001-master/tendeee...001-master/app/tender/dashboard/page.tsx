"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogoutButton } from "@/components/logout-button"
import {
  Building2,
  Plus,
  Eye,
  Edit,
  Users,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  User,
  Download
} from "lucide-react"
import Link from "next/link"
import { NotificationBell } from "@/components/notifications"
import { VerificationStatusCard } from "@/components/verification-status-card"
import { Settings as SettingsIcon, Medal } from "lucide-react"

export default function TenderDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("projects")
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [downloadingProposals, setDownloadingProposals] = useState<string | null>(null)
  const [allBids, setAllBids] = useState([])
  const [bidStats, setBidStats] = useState(null)
  const [bidsByProject, setBidsByProject] = useState({})
  const [loadingBids, setLoadingBids] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== "tender")) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user || user.userType !== "tender") return

      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return

        const response = await fetch("/api/projects/my-projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [user])

  const handleDownloadProposals = async (projectId: string, projectTitle: string) => {
    setDownloadingProposals(projectId)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch(`/api/projects/${projectId}/download-proposals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Proposals.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        console.error("Download failed:", errorData.error)
      }
    } catch (error) {
      console.error("Error downloading proposals:", error)
    } finally {
      setDownloadingProposals(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.userType !== "tender") {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "closed":
        return "bg-red-500"
      case "draft":
        return "bg-yellow-500"
      case "awarded":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "closed":
        return "Closed"
      case "draft":
        return "Draft"
      case "awarded":
        return "Awarded"
      default:
        return status
    }
  }

  return (
  <div className="min-h-screen bg-background">
     {/* Header */}
    <div className="ml-9 mt-4 mb-2">
  <h1 className="text-2xl font-bold">Welcome, {user?.companyName || "User"}</h1>
  <p className="text-muted-foreground">Welcome to your Tender Dashboard</p>
</div>

      <div className="container mx-auto px-4 py-8">
       
        <div className="space-y-6">
          {/* Verification Status Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <VerificationStatusCard />
            </div>
            <div className="lg:col-span-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your tenders and projects</CardDescription>
                </CardHeader>
                <Card className="col-span-3">
  
  <CardContent>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link href="/profile/edit">
        <Button variant="outline" className="w-full justify-start space-x-2">
          <User className="h-5 w-5" />
          <span>Update Profile</span>
        </Button>
      </Link>
      <Link href="/tender/reports">
        <Button variant="outline" className="w-full justify-start space-x-2">
          <FileText className="h-5 w-5" />
          <span>View Report</span>
        </Button>
      </Link>
      <Link href="/tender/settings">
        <Button variant="outline" className="w-full justify-start space-x-2">
          <SettingsIcon className="h-5 w-5" />
          <span>Settings</span>
        </Button>
      </Link>
      <Link href="/tender/achievements">
        <Button variant="outline" className="w-full justify-start space-x-2">
          <Medal className="h-5 w-5" />
          <span>Achievements</span>
        </Button>
      </Link>
    </div>
  </CardContent>
</Card>

              </Card>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.filter((p: any) => p.status === "active" || p.status === "open").length}</div>
                <p className="text-xs text-muted-foreground">Currently accepting bids</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.reduce((sum: number, project: any) => sum + (project.bidCount || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(projects.reduce((sum: number, project: any) => sum + (project.budget || 0), 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Combined project value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">11.7</div>
                <p className="text-xs text-muted-foreground">Bids per project</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="projects">My Projects</TabsTrigger>
              <TabsTrigger value="bids">All Bids</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>My Projects</CardTitle>
                      <CardDescription>Manage your tender projects and track bids</CardDescription>
                    </div>
                    <Link href="/tender/projects/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No projects created yet.</p>
                      <Link href="/tender/projects/new">
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Project
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project: any) => (
                        <div key={project._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{project.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Created on {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            </div>
                            <Badge className={getStatusColor(project.status)}>{getStatusText(project.status)}</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium">Budget</p>
                              <p className="text-lg font-bold text-primary">${project.budget?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Deadline</p>
                              <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Bids Received</p>
                              <p className="text-lg font-bold">{project.bidCount || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Category</p>
                              <p className="text-sm">{project.category}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {project.status === "active" ? "Accepting bids" : "Bidding closed"}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <Link href={`/tender/projects/${project._id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </Link>
                              <Link href={`/tender/projects/${project._id}/bids`}>
                                <Button variant="outline" size="sm">
                                  <Users className="h-4 w-4 mr-2" />
                                  View Bids ({project.bidCount || 0})
                                </Button>
                              </Link>
                              {(project.bidCount || 0) > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadProposals(project._id, project.title)}
                                  disabled={downloadingProposals === project._id}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {downloadingProposals === project._id ? "Downloading..." : "Download All"}
                                </Button>
                              )}
                              <Link href={`/tender/projects/${project._id}/edit`}>
                                <Button size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Performance</CardTitle>
                    <CardDescription>Overview of your tender projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Projects</span>
                        <span className="font-bold">{projects.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Projects</span>
                        <span className="font-bold text-green-600">
                          {projects.filter((p: any) => p.status === "active" || p.status === "open").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Projects</span>
                        <span className="font-bold">
                          {projects.filter((p: any) => p.status === "closed" || p.status === "awarded").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Bids per Project</span>
                        <span className="font-bold text-primary">11.7</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bid Statistics</CardTitle>
                    <CardDescription>Bidding activity across projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Bids Received</span>
                        <span className="font-bold">
                          {projects.reduce((sum: number, project: any) => sum + (project.bidCount || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Highest Bid Count</span>
                        <span className="font-bold text-green-600">
                          {projects.length > 0 ? Math.max(...projects.map((p: any) => p.bidCount || 0)) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projects with 10+ Bids</span>
                        <span className="font-bold">{projects.filter((p: any) => (p.bidCount || 0) >= 10).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Response Rate</span>
                        <span className="font-bold text-primary">92%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates on your projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New bid received</p>
                        <p className="text-xs text-muted-foreground">Office Complex Construction - $2,350,000</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Project created</p>
                        <p className="text-xs text-muted-foreground">Highway Bridge Renovation</p>
                      </div>
                      <span className="text-xs text-muted-foreground">3 days ago</span>
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
