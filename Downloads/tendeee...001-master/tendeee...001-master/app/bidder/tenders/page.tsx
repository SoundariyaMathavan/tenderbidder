"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Eye,
  FileText,
  Clock,
  DollarSign,
  MapPin,
  Building2,
  Star,
  Users,
  Calendar,
  Filter
} from "lucide-react"
import Link from "next/link"

export default function TendersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [tenders, setTenders] = useState([])
  const [loadingTenders, setLoadingTenders] = useState(true)
  const [bidStatuses, setBidStatuses] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== "bidder")) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  // Check bid status for each project
  const checkBidStatuses = async (projects: any[]) => {
    if (!user) return
    
    const token = localStorage.getItem("auth_token")
    if (!token) return

    const statuses: any = {}
    
    for (const project of projects) {
      try {
        const response = await fetch(`/api/bids?projectId=${project._id}&bidderId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.bids && data.bids.length > 0) {
            statuses[project._id] = data.bids[0].status
          }
        }
      } catch (error) {
        console.error(`Error checking bid status for project ${project._id}:`, error)
      }
    }
    
    setBidStatuses(statuses)
  }

  // Fetch available tenders
  useEffect(() => {
    const fetchTenders = async () => {
      if (!user || user.userType !== "bidder") return

      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          const data = await response.json()
          const projects = data.projects || []
          setTenders(projects)
          
          // Check bid status for each project
          await checkBidStatuses(projects)
        }
      } catch (error) {
        console.error("Error fetching tenders:", error)
      } finally {
        setLoadingTenders(false)
      }
    }

    fetchTenders()
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
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500"
      case "active":
        return "bg-green-500"
      case "closing-soon":
        return "bg-yellow-500"
      case "closed":
        return "bg-red-500"
      case "awarded":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open"
      case "active":
        return "Active"
      case "closing-soon":
        return "Closing Soon"
      case "closed":
        return "Closed"
      case "awarded":
        return "Awarded"
      default:
        return status
    }
  }

  // Calculate tender rating based on various factors
  const calculateTenderRating = (tender: any) => {
    let rating = 3.0 // Base rating
    
    // Increase rating based on budget (higher budget = higher rating)
    if (tender.budget > 1000000) rating += 1.0
    else if (tender.budget > 500000) rating += 0.5
    else if (tender.budget > 100000) rating += 0.3
    
    // Increase rating based on bid count (more competitive = higher rating)
    if (tender.bidCount > 20) rating += 0.5
    else if (tender.bidCount > 10) rating += 0.3
    else if (tender.bidCount > 5) rating += 0.2
    
    // Decrease rating if deadline is very close
    const daysUntilDeadline = Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilDeadline < 3) rating -= 0.5
    else if (daysUntilDeadline < 7) rating -= 0.2
    
    // Ensure rating is between 1 and 5
    return Math.max(1.0, Math.min(5.0, rating))
  }

  // Filter and search functions
  const filteredTenders = tenders.filter((tender: any) => {
    const matchesSearch = searchTerm === "" || 
      tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.tenderCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || tender.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || tender.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "budget-high":
        return (b.budget || 0) - (a.budget || 0)
      case "budget-low":
        return (a.budget || 0) - (b.budget || 0)
      case "deadline":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      case "rating":
        return calculateTenderRating(b) - calculateTenderRating(a)
      default:
        return 0
    }
  })

  // Get unique categories from tenders for filter dropdown
  const categories = [...new Set(tenders.map((tender: any) => tender.category).filter(Boolean))]

  const renderStarRating = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return stars
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Available Tenders</h1>
              <p className="text-muted-foreground mt-1">
                Browse and bid on available tender opportunities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {filteredTenders.length} tenders available
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closing-soon">Closing Soon</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="budget-high">Highest Budget</SelectItem>
                  <SelectItem value="budget-low">Lowest Budget</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                  setSelectedStatus("all")
                  setSortBy("newest")
                }}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tenders List */}
        {loadingTenders ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredTenders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tenders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                  ? "No tenders match your search criteria." 
                  : "No tenders are currently available."}
              </p>
              {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all") && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedStatus("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredTenders.map((tender: any) => {
              const rating = calculateTenderRating(tender)
              const daysUntilDeadline = Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <Card key={tender._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold">{tender.title}</h3>
                          <div className="flex items-center space-x-1">
                            {renderStarRating(rating)}
                            <span className="text-sm text-muted-foreground ml-1">
                              ({rating.toFixed(1)})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-4 w-4" />
                            <span>{tender.tenderCompany}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{tender.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{tender.bidCount || 0} bids</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground">{tender.description}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(tender.status)}>
                          {getStatusText(tender.status)}
                        </Badge>
                        {bidStatuses[tender._id] && (
                          <Badge className={`${getBidStatusColor(bidStatuses[tender._id])} text-white`}>
                            {getBidStatusText(bidStatuses[tender._id])}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Budget</p>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <p className="text-lg font-bold text-green-600">
                            ${tender.budget?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <p className="text-sm font-semibold">
                            {new Date(tender.deadline).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Expired'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                        <p className="text-sm font-semibold">{tender.category}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <p className="text-sm font-semibold">{tender.duration || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Posted {new Date(tender.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/bidder/tenders/${tender._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {bidStatuses[tender._id] ? (
                          <Badge className={`${getBidStatusColor(bidStatuses[tender._id])} text-white px-4 py-2`}>
                            {getBidStatusText(bidStatuses[tender._id])}
                          </Badge>
                        ) : (tender.status === "open" || tender.status === "active") && daysUntilDeadline > 0 ? (
                          <Link href={`/bidder/tenders/${tender._id}/submit-bid`}>
                            <Button size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Submit Bid
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}