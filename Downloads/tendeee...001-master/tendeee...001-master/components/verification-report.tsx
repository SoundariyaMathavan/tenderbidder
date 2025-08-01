"use client"

import React from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Building2,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Users,
  CreditCard,
  Printer
} from "lucide-react"

interface VerificationReportProps {
  showActions?: boolean
}

export function VerificationReport({ showActions = true }: VerificationReportProps) {
  const { user } = useAuth()

  if (!user) return null

  const verificationStatus = user.verificationStatus || {}
  const overallPercentage = verificationStatus.overall || 0

  const getVerificationIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
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
        return <Badge variant="outline">Not Verified</Badge>
    }
  }

  const getStatusColor = () => {
    if (overallPercentage >= 100) return "text-green-600"
    if (overallPercentage >= 75) return "text-blue-600"
    if (overallPercentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getComplianceLevel = () => {
    if (overallPercentage >= 100) return "Fully Compliant"
    if (overallPercentage >= 75) return "Highly Compliant"
    if (overallPercentage >= 50) return "Moderately Compliant"
    return "Low Compliance"
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/user/verification-report', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${user.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Verification_Report.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to download report:", error)
    }
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:block">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-primary print:hidden" />
          <div>
            <h1 className="text-3xl font-bold print:text-2xl">Company Verification Report</h1>
            <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        {showActions && (
          <div className="flex space-x-2 print:hidden">
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        )}
      </div>

      {/* Company Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Company Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{user.companyName}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                {user.contactNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.contactNumber}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{user.website}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span>{user.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {user.industry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{user.industry}</p>
                  </div>
                )}
                {user.companySize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Company Size</p>
                    <p className="font-medium">{user.companySize}</p>
                  </div>
                )}
                {user.establishedYear && (
                  <div>
                    <p className="text-sm text-muted-foreground">Established</p>
                    <p className="font-medium">{user.establishedYear}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">User Type</p>
                  <Badge variant="outline">{user.userType}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status Overview</CardTitle>
          <CardDescription>Current compliance and verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getStatusColor()}`}>
                {overallPercentage}%
              </div>
              <p className="text-muted-foreground">Overall Completion</p>
              <Badge variant="outline" className="mt-2">
                {getComplianceLevel()}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Progress value={overallPercentage} className="w-full" />
              <div className="text-sm text-muted-foreground">
                Verification Progress
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verified Fields:</span>
                <span className="font-medium">
                  {Object.values(verificationStatus).filter(status => status === 'verified').length}/4
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Fields:</span>
                <span className="font-medium">
                  {Object.values(verificationStatus).filter(status => status === 'pending').length}/4
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Failed Fields:</span>
                <span className="font-medium">
                  {Object.values(verificationStatus).filter(status => status === 'failed').length}/4
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Verification Status</CardTitle>
          <CardDescription>Individual verification field status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GST Verification */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.gst)}
                  <h3 className="font-semibold">GST Verification</h3>
                </div>
                {getVerificationBadge(verificationStatus.gst)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GST Number:</span>
                  <span className="font-mono">{user.gstNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize">{verificationStatus.gst || 'Not started'}</span>
                </div>
              </div>
            </div>

            {/* PAN Verification */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.pan)}
                  <h3 className="font-semibold">PAN Verification</h3>
                </div>
                {getVerificationBadge(verificationStatus.pan)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>PAN Number:</span>
                  <span className="font-mono">{user.panNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize">{verificationStatus.pan || 'Not started'}</span>
                </div>
              </div>
            </div>

            {/* CIN Verification */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.cin)}
                  <h3 className="font-semibold">CIN Verification</h3>
                </div>
                {getVerificationBadge(verificationStatus.cin)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>CIN Number:</span>
                  <span className="font-mono">{user.cinNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize">{verificationStatus.cin || 'Not started'}</span>
                </div>
              </div>
            </div>

            {/* Bank Verification */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(verificationStatus.bank)}
                  <h3 className="font-semibold">Bank Verification</h3>
                </div>
                {getVerificationBadge(verificationStatus.bank)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bank Name:</span>
                  <span>{user.bankName || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span>IFSC Code:</span>
                  <span className="font-mono">{user.bankIFSC || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize">{verificationStatus.bank || 'Not started'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Status */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload Status</CardTitle>
          <CardDescription>Supporting documents for verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'gstCertificate', label: 'GST Certificate' },
              { key: 'panCard', label: 'PAN Card' },
              { key: 'incorporationCertificate', label: 'Certificate of Incorporation' },
              { key: 'bankStatement', label: 'Bank Statement' },
              { key: 'auditedFinancials', label: 'Audited Financial Statements' }
            ].map((doc) => (
              <div key={doc.key} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{doc.label}</span>
                </div>
                {user.documents?.[doc.key] ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Uploaded
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {overallPercentage < 100 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Steps to improve your verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!verificationStatus.gst && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                  <div>
                    <p className="font-medium">Complete GST Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Provide your GST number to verify your business registration
                    </p>
                  </div>
                </div>
              )}
              {!verificationStatus.pan && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                  <div>
                    <p className="font-medium">Complete PAN Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Verify your company's PAN number for tax compliance
                    </p>
                  </div>
                </div>
              )}
              {!verificationStatus.cin && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                  <div>
                    <p className="font-medium">Complete CIN Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Provide your Corporate Identification Number for company verification
                    </p>
                  </div>
                </div>
              )}
              {!verificationStatus.bank && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-1" />
                  <div>
                    <p className="font-medium">Complete Bank Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Verify your bank account details for financial transactions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground print:mt-8">
        <p>This report was generated automatically by the TenderChain verification system.</p>
        <p>For questions or support, please contact our verification team.</p>
      </div>
    </div>
  )
}