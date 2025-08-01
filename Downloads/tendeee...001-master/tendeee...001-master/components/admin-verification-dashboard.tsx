"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  Building2,
  Users,
  TrendingUp,
  Calendar
} from "lucide-react"

interface CompanyVerification {
  _id: string
  companyName: string
  email: string
  userType: string
  verificationStatus: {
    gst?: 'pending' | 'verified' | 'failed'
    pan?: 'pending' | 'verified' | 'failed'
    cin?: 'pending' | 'verified' | 'failed'
    bank?: 'pending' | 'verified' | 'failed'
    overall?: number
  }
  documents: Record<string, string>
  createdAt: string
  updatedAt: string
  industry?: string
  companySize?: string
}

interface VerificationStats {
  totalCompanies: number
  fullyVerified: number
  partiallyVerified: number
  unverified: number
  pendingReview: number
}

export function AdminVerificationDashboard() {
  const [companies, setCompanies] = useState<CompanyVerification[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyVerification[]>([])
  const [stats, setStats] = useState<VerificationStats>({
    totalCompanies: 0,
    fullyVerified: 0,
    partiallyVerified: 0,
    unverified: 0,
    pendingReview: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [industryFilter, setIndustryFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    filterCompanies()
  }, [companies, searchTerm, statusFilter, industryFilter])

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/verifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies)
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch verification data",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load verification dashboard",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterCompanies = () => {
    let filtered = companies

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(company => {
        const overall = company.verificationStatus?.overall || 0
        switch (statusFilter) {
          case "verified":
            return overall >= 100
          case "partial":
            return overall > 0 && overall < 100
          case "unverified":
            return overall === 0
          case "pending":
            return Object.values(company.verificationStatus || {}).includes('pending')
          default:
            return true
        }
      })
    }

    // Industry filter
    if (industryFilter !== "all") {
      filtered = filtered.filter(company => company.industry === industryFilter)
    }

    setFilteredCompanies(filtered)
  }

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getOverallStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge variant="default" className="bg-green-500">Fully Verified</Badge>
    } else if (percentage >= 50) {
      return <Badge variant="secondary" className="bg-yellow-500">Partially Verified</Badge>
    } else if (percentage > 0) {
      return <Badge variant="outline">In Progress</Badge>
    } else {
      return <Badge variant="destructive">Unverified</Badge>
    }
  }

  const handleApproveVerification = async (companyId: string, field: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyId,
          field,
          action: 'approve'
        })
      })

      if (response.ok) {
        toast({
          title: "Verification Approved",
          description: `${field.toUpperCase()} verification has been approved`,
        })
        fetchCompanies() // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Failed to approve verification",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve verification",
        variant: "destructive"
      })
    }
  }

  const handleRejectVerification = async (companyId: string, field: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyId,
          field,
          action: 'reject'
        })
      })

      if (response.ok) {
        toast({
          title: "Verification Rejected",
          description: `${field.toUpperCase()} verification has been rejected`,
        })
        fetchCompanies() // Refresh data
      } else {
        toast({
          title: "Error",
          description: "Failed to reject verification",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive"
      })
    }
  }

  const exportVerificationReport = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/export-verifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `verification-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Successful",
          description: "Verification report has been downloaded",
        })
      } else {
        toast({
          title: "Export Failed",
          description: "Failed to export verification report",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export verification report",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verification Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage company verifications</p>
        </div>
        <Button onClick={exportVerificationReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fullyVerified}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompanies > 0 ? Math.round((stats.fullyVerified / stats.totalCompanies) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partially Verified</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.partiallyVerified}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompanies > 0 ? Math.round((stats.partiallyVerified / stats.totalCompanies) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unverified}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompanies > 0 ? Math.round((stats.unverified / stats.totalCompanies) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Fully Verified</SelectItem>
                  <SelectItem value="partial">Partially Verified</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle>Company Verifications ({filteredCompanies.length})</CardTitle>
          <CardDescription>Review and manage company verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCompanies.map((company) => (
              <div key={company._id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-lg">{company.companyName}</h3>
                      <p className="text-sm text-muted-foreground">{company.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{company.userType}</Badge>
                        {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
                        {company.companySize && <Badge variant="outline">{company.companySize}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getOverallStatusBadge(company.verificationStatus?.overall || 0)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {company.verificationStatus?.overall || 0}% Complete
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['gst', 'pan', 'cin', 'bank'].map((field) => (
                    <div key={field} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{field.toUpperCase()}</p>
                        {getVerificationBadge(company.verificationStatus?.[field as keyof typeof company.verificationStatus])}
                      </div>
                      {company.verificationStatus?.[field as keyof typeof company.verificationStatus] === 'pending' && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleApproveVerification(company._id, field)}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleRejectVerification(company._id, field)}
                          >
                            ✗
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    <span>Created: {new Date(company.createdAt).toLocaleDateString()}</span>
                    <span className="ml-4">Updated: {new Date(company.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      Documents
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCompanies.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No companies found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}