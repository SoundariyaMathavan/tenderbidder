"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Eye,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  Building2,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Filter
} from "lucide-react"
import Link from "next/link"

export default function BidsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bids, setBids] = useState([])
  const [loadingBids, setLoadingBids] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== "bidder")) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  // Fetch user's bids
  useEffect(() => {
    const fetchBids = async () => {
      if (!user || user.userType !== "bidder") return

      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return

        const response = await fetch("/api/bids/my-bids", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setBids(data.bids || [])
        }
      } catch (error) {
        console.error("Error fetching bids:", error)
      } finally {
        setLoadingBids(false)
      }
    }

    fetchBids()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.userType !== "bidder") {
    return null
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
      case "under-review":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getBidStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submitted"
      case "shortlisted":
        return "Shortlisted"
      case "awarded":
        return "Awarded"
      case "rejected":
        return "Rejected"
      case "under-review":
        return "Under Review"
      default:
        return status
    }
  }

  const getBidStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <FileText className="h-4 w-4" />
      case "shortlisted":
        return <CheckCircle className="h-4 w-4" />
      case "awarded":
        return <Trophy className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "under-review":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500"
      case "active":
        return "bg-green-500"
      case "closed":
        return "bg-red-500"
      case "awarded":
        return "bg-purple-500"
      case "completed":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getProjectStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open"
      case "active":
        return "Active"
      case "closed":
        return "Closed"
      case "awarded":
        return "Awarded"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  // Filter and search functions
  const filteredBids = bids.filter((bid: any) => {
    const matchesSearch = searchTerm === "" || 
      bid.project?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.project?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.project?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.bidderCompany?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === "all" || bid.status === selectedStatus
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "active" && (bid.status === "submitted" || bid.status === "shortlisted" || bid.status === "under-review")) ||
      (activeTab === "awarded" && bid.status === "awarded") ||
      (activeTab === "rejected" && bid.status === "rejected")
    
    return matchesSearch && matchesStatus && matchesTab
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "amount-high":
        return (b.bidAmount || 0) - (a.bidAmount || 0)
      case "amount-low":
        return (a.bidAmount || 0) - (b.bidAmount || 0)
      case "score":
        return (b.aiScore || 0) - (a.aiScore || 0)
      default:
        return 0
    }
  })

  // Calculate statistics
  const stats = {
    total: bids.length,
    submitted: bids.filter(bid => bid.status === "submitted").length,
    shortlisted: bids.filter(bid => bid.status === "shortlisted").length,
    awarded: bids.filter(bid => bid.status === "awarded").length,
    rejected: bids.filter(bid => bid.status === "rejected").length,
    totalValue: bids.reduce((sum, bid) => sum + (bid.bidAmount || 0), 0),
    averageScore: bids.length > 0 ? bids.reduce((sum, bid) => sum + (bid.aiScore || 0), 0) / bids.length : 0,
    successRate: bids.length > 0 ? (bids.filter(bid => bid.status === "awarded").length / bids.length) * 100 : 0
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Bids</h1>
              <p className="text-muted-foreground mt-1">
                Track and manage all your submitted bids
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredBids.length} of {bids.length} bids
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.awarded} of {stats.total} bids won
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.totalValue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Combined bid value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. AI Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Out of 100</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different bid statuses */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Bids ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({stats.submitted + stats.shortlisted})
            </TabsTrigger>
            <TabsTrigger value="awarded">
              Awarded ({stats.awarded})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bids..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">Highest Amount</SelectItem>
                  <SelectItem value="amount-low">Lowest Amount</SelectItem>
                  <SelectItem value="score">Highest Score</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                  setSortBy("newest")
                }}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bids List */}
        {loadingBids ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredBids.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bids found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== "all" 
                  ? "No bids match your search criteria." 
                  : activeTab === "all" 
                    ? "You haven't submitted any bids yet."
                    : `No ${activeTab} bids found.`}
              </p>
              {(searchTerm || selectedStatus !== "all") ? (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedStatus("all")
                  }}
                >
                  Clear Filters
                </Button>
              ) : activeTab === "all" ? (
                <Link href="/bidder/tenders">
                  <Button>
                    Browse Tenders
                  </Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBids.map((bid: any) => (
              <Card key={bid._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{bid.project?.title}</h3>
                        {bid.aiScore && (
                          <Badge className={getScoreBadgeColor(bid.aiScore)}>
                            AI Score: {bid.aiScore}/100
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span>{bid.project?.category}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted {new Date(bid.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {bid.proposal?.substring(0, 150)}...
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getBidStatusColor(bid.status)}>
                        <div className="flex items-center space-x-1">
                          {getBidStatusIcon(bid.status)}
                          <span>{getBidStatusText(bid.status)}</span>
                        </div>
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getProjectStatusColor(bid.project?.status)}
                      >
                        Project: {getProjectStatusText(bid.project?.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bid Amount</p>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <p className="text-lg font-bold text-green-600">
                          ${bid.bidAmount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Project Budget</p>
                      <p className="text-sm font-semibold">
                        ${bid.project?.budget?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bid.project?.budget && bid.bidAmount 
                          ? `${((bid.bidAmount / bid.project.budget) * 100).toFixed(1)}% of budget`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                      <p className="text-sm font-semibold">
                        {bid.timeline?.weeks ? `${bid.timeline.weeks} weeks` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Experience</p>
                      <p className="text-sm font-semibold">
                        {bid.experience?.years ? `${bid.experience.years} years` : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Status-specific information */}
                  {bid.status === "awarded" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800">Congratulations! You won this bid</h4>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Your proposal was selected for this project. The client will contact you soon.
                      </p>
                    </div>
                  )}

                  {bid.status === "shortlisted" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">You're shortlisted!</h4>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">
                        Your bid is among the top candidates. The final decision is pending.
                      </p>
                    </div>
                  )}

                  {bid.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">Bid not selected</h4>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        Unfortunately, your bid was not selected for this project. Keep improving and try again!
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Project deadline: {new Date(bid.project?.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/bidder/bids/${bid._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/bidder/tenders/${bid.project?._id}`}>
                        <Button variant="outline" size="sm">
                          <Building2 className="h-4 w-4 mr-2" />
                          View Project
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}