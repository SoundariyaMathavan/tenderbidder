"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { DocumentUploadManager } from "@/components/document-upload"
import {
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  Globe,
  Users,
  Calendar,
  Loader2,
  Upload
} from "lucide-react"

interface VerificationStatus {
  gst?: 'pending' | 'verified' | 'failed'
  pan?: 'pending' | 'verified' | 'failed'
  cin?: 'pending' | 'verified' | 'failed'
  bank?: 'pending' | 'verified' | 'failed'
  overall?: number
}

interface CompanyFormData {
  // Basic Information
  companyName: string
  contactNumber: string
  email: string
  website: string
  address: string
  registeredAddress: string
  
  // Company Details
  gstNumber: string
  panNumber: string
  cinNumber: string
  registrationNumber: string
  industry: string
  companySize: string
  establishedYear: string
  
  // Banking Details
  bankAccountNumber: string
  bankIFSC: string
  bankName: string
  
  // Director Information
  directorName: string
  directorPAN: string
  
  // Additional Information
  bio: string
  specializations: string[]
}

export function CompanyVerification() {
  const { user, token, updateUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [verifyingField, setVerifyingField] = useState<string | null>(null)
  const [verificationMode, setVerificationMode] = useState<'realtime' | 'batch' | 'step'>('realtime')
  const [currentStep, setCurrentStep] = useState(0)
  const [newSpecialization, setNewSpecialization] = useState("")

  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: "",
    contactNumber: "",
    email: "",
    website: "",
    address: "",
    registeredAddress: "",
    gstNumber: "",
    panNumber: "",
    cinNumber: "",
    registrationNumber: "",
    industry: "",
    companySize: "",
    establishedYear: "",
    bankAccountNumber: "",
    bankIFSC: "",
    bankName: "",
    directorName: "",
    directorPAN: "",
    bio: "",
    specializations: []
  })

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({})
  const [documents, setDocuments] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        contactNumber: user.contactNumber || "",
        email: user.email || "",
        website: user.website || "",
        address: user.address || "",
        registeredAddress: user.registeredAddress || "",
        gstNumber: user.gstNumber || "",
        panNumber: user.panNumber || "",
        cinNumber: user.cinNumber || "",
        registrationNumber: user.registrationNumber || "",
        industry: user.industry || "",
        companySize: user.companySize || "",
        establishedYear: user.establishedYear || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankIFSC: user.bankIFSC || "",
        bankName: user.bankName || "",
        directorName: user.directorName || "",
        directorPAN: user.directorPAN || "",
        bio: user.bio || "",
        specializations: user.specializations || []
      })
      setVerificationStatus(user.verificationStatus || {})
      setDocuments(user.documents || {})
    }
  }, [user])

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time verification for specific fields
    if (verificationMode === 'realtime' && ['gstNumber', 'panNumber', 'cinNumber'].includes(field)) {
      if (value.length >= getMinLength(field)) {
        handleFieldVerification(field, value)
      }
    }
  }

  const getMinLength = (field: string): number => {
    switch (field) {
      case 'gstNumber': return 15
      case 'panNumber': return 10
      case 'cinNumber': return 21
      default: return 0
    }
  }

  const handleFieldVerification = async (field: string, value: string) => {
    if (!token) return

    setVerifyingField(field)
    
    try {
      const verifyType = field.replace('Number', '')
      const additionalData = field === 'bankAccountNumber' ? { ifsc: formData.bankIFSC } : undefined

      const response = await fetch('/api/user/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: verifyType,
          value,
          additionalData
        })
      })

      const result = await response.json()

      if (result.success) {
        setVerificationStatus(prev => ({
          ...prev,
          [verifyType]: 'verified',
          overall: result.overallPercentage
        }))
        
        toast({
          title: "Verification Successful",
          description: `${field} has been verified successfully`,
        })
      } else {
        setVerificationStatus(prev => ({
          ...prev,
          [verifyType]: 'failed'
        }))
        
        toast({
          title: "Verification Failed",
          description: result.error || `Failed to verify ${field}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to verify at this time. Please try again.",
        variant: "destructive"
      })
    } finally {
      setVerifyingField(null)
    }
  }

  const handleBatchVerification = async () => {
    if (!token) return

    setIsLoading(true)
    
    try {
      const verifications = [
        { type: 'gst', value: formData.gstNumber },
        { type: 'pan', value: formData.panNumber },
        { type: 'cin', value: formData.cinNumber },
        { 
          type: 'bank', 
          value: formData.bankAccountNumber, 
          additionalData: { ifsc: formData.bankIFSC } 
        }
      ].filter(v => v.value)

      const response = await fetch('/api/user/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verifications })
      })

      const result = await response.json()

      if (result.success) {
        // Update verification status based on results
        const newStatus: VerificationStatus = { overall: result.overallPercentage }
        
        Object.keys(result.results).forEach(type => {
          newStatus[type as keyof VerificationStatus] = result.results[type].success ? 'verified' : 'failed'
        })
        
        setVerificationStatus(newStatus)
        
        toast({
          title: "Batch Verification Complete",
          description: `Verification completed with ${result.overallPercentage}% success rate`,
        })
      } else {
        toast({
          title: "Batch Verification Failed",
          description: "Some verifications failed. Please check individual fields.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to complete batch verification. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!token) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        updateUser(result.user)
        toast({
          title: "Profile Updated",
          description: "Your company profile has been updated successfully",
        })
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Unable to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }))
      setNewSpecialization("")
    }
  }

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }))
  }

  const handleDocumentUpdate = async (documentType: string, documentUrl: string | null) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: documentUrl || ""
    }))

    // Update user profile with new document
    if (token) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            documents: {
              ...documents,
              [documentType]: documentUrl
            }
          })
        })

        if (response.ok) {
          toast({
            title: documentUrl ? "Document Updated" : "Document Removed",
            description: `${documentType} has been ${documentUrl ? 'uploaded' : 'removed'} successfully`,
          })
        }
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Failed to update document. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const getVerificationIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
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

  const overallPercentage = verificationStatus.overall || 0

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Company Verification Status</CardTitle>
                <CardDescription>Complete your company verification to build trust</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{overallPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={overallPercentage} className="w-full" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {getVerificationIcon(verificationStatus.gst)}
                <span className="text-sm">GST</span>
                {getVerificationBadge(verificationStatus.gst)}
              </div>
              <div className="flex items-center space-x-2">
                {getVerificationIcon(verificationStatus.pan)}
                <span className="text-sm">PAN</span>
                {getVerificationBadge(verificationStatus.pan)}
              </div>
              <div className="flex items-center space-x-2">
                {getVerificationIcon(verificationStatus.cin)}
                <span className="text-sm">CIN</span>
                {getVerificationBadge(verificationStatus.cin)}
              </div>
              <div className="flex items-center space-x-2">
                {getVerificationIcon(verificationStatus.bank)}
                <span className="text-sm">Bank</span>
                {getVerificationBadge(verificationStatus.bank)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="verification-mode">Verification Mode:</Label>
              <Select value={verificationMode} onValueChange={(value: any) => setVerificationMode(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                  <SelectItem value="step">Step-by-step</SelectItem>
                </SelectContent>
              </Select>
              
              {verificationMode === 'batch' && (
                <Button onClick={handleBatchVerification} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Profile Form */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="legal">Legal Details</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="additional">Additional</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Basic Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Your Company Ltd."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="establishedYear"
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      placeholder="2020"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address *</Label>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Business Street, City, State, PIN"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Textarea
                  id="registeredAddress"
                  value={formData.registeredAddress}
                  onChange={(e) => handleInputChange('registeredAddress', e.target.value)}
                  placeholder="Same as business address or different registered address"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Legal & Registration Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      required
                    />
                    {verifyingField === 'gstNumber' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      getVerificationIcon(verificationStatus.gst)
                    )}
                    {verificationMode !== 'realtime' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldVerification('gstNumber', formData.gstNumber)}
                        disabled={!formData.gstNumber || formData.gstNumber.length < 15}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                      placeholder="AAAAA0000A"
                      maxLength={10}
                      required
                    />
                    {verifyingField === 'panNumber' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      getVerificationIcon(verificationStatus.pan)
                    )}
                    {verificationMode !== 'realtime' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldVerification('panNumber', formData.panNumber)}
                        disabled={!formData.panNumber || formData.panNumber.length < 10}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cinNumber">CIN Number</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="cinNumber"
                      value={formData.cinNumber}
                      onChange={(e) => handleInputChange('cinNumber', e.target.value.toUpperCase())}
                      placeholder="L99999MH2020PTC123456"
                      maxLength={21}
                    />
                    {verifyingField === 'cinNumber' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      getVerificationIcon(verificationStatus.cin)
                    )}
                    {verificationMode !== 'realtime' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldVerification('cinNumber', formData.cinNumber)}
                        disabled={!formData.cinNumber || formData.cinNumber.length < 21}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    placeholder="Company registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="directorName">Director Name</Label>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="directorName"
                      value={formData.directorName}
                      onChange={(e) => handleInputChange('directorName', e.target.value)}
                      placeholder="Managing Director Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="directorPAN">Director PAN</Label>
                  <Input
                    id="directorPAN"
                    value={formData.directorPAN}
                    onChange={(e) => handleInputChange('directorPAN', e.target.value.toUpperCase())}
                    placeholder="AAAAA0000A"
                    maxLength={10}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Banking Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                    placeholder="1234567890123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankIFSC">IFSC Code</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bankIFSC"
                      value={formData.bankIFSC}
                      onChange={(e) => handleInputChange('bankIFSC', e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      maxLength={11}
                    />
                    {verifyingField === 'bankAccountNumber' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      getVerificationIcon(verificationStatus.bank)
                    )}
                    {verificationMode !== 'realtime' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldVerification('bankAccountNumber', formData.bankAccountNumber)}
                        disabled={!formData.bankAccountNumber || !formData.bankIFSC}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="State Bank of India"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Supporting Documents</span>
              </CardTitle>
              <CardDescription>
                Upload supporting documents to strengthen your company verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadManager
                documents={documents}
                onDocumentUpdate={handleDocumentUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Company Description</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Brief description of your company, services, and expertise..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-4">
                <Label>Specializations</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="Add a specialization"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
                  />
                  <Button type="button" onClick={addSpecialization} size="sm">
                    Add
                  </Button>
                </div>

                {formData.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specializations.map((spec, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSpecialization(index)}
                      >
                        {spec} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSaveProfile} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Profile
        </Button>
      </div>
    </div>
  )
}