"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, FileText, DollarSign, Clock, Award, X } from "lucide-react"
import Link from "next/link"

export default function SubmitBidPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)
  const [project, setProject] = useState(null)

  const [formData, setFormData] = useState({
    companyName: "",
    bidAmount: "",
    proposal: "",
    timeline: {
      weeks: "",
      startDate: "",
      milestones: []
    },
    experience: {
      years: "",
      similarProjects: "",
      teamSize: ""
    },
    qualifications: [],
    references: [],
    documents: []
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const [newQualification, setNewQualification] = useState("")
  const [newReference, setNewReference] = useState("")

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      setLoadingProject(true)
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProject(data.project)
        } else {
          toast({ title: "Error", description: "Project not found.", variant: "destructive" })
          router.push("/bidder/dashboard")
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load project.", variant: "destructive" })
        router.push("/bidder/dashboard")
      } finally {
        setLoadingProject(false)
      }
    }
    if (params.id) fetchProject()
  }, [params.id, router, toast])

  const addQualification = () => {
    if (newQualification.trim() && !formData.qualifications.includes(newQualification.trim())) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, newQualification.trim()]
      })
      setNewQualification("")
    }
  }

  const removeQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((_, i) => i !== index)
    })
  }

  const addReference = () => {
    if (newReference.trim() && !formData.references.includes(newReference.trim())) {
      setFormData({
        ...formData,
        references: [...formData.references, newReference.trim()]
      })
      setNewReference("")
    }
  }

  const removeReference = (index: number) => {
    setFormData({
      ...formData,
      references: formData.references.filter((_, i) => i !== index)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to submit a bid.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: params.id,
          ...formData,
          documents: uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          }))
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Bid submitted and analyzed! AI Score: ${data.aiScore}/100`,
        })
        
        // Show analysis results in a more detailed toast
        setTimeout(() => {
          toast({
            title: "AI Analysis Complete",
            description: `Your bid received a score of ${data.aiScore}/100. Rating: ${data.review?.overall || 'Pending'}`,
          })
        }, 2000)
        
        // Redirect back to tender detail page to show "Submitted" status
        router.push(`/bidder/tenders/${params.id}`)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit bid. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return <div>Project not found.</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Submit Bid</h1>
              <p className="text-sm text-muted-foreground">{project.title}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Budget</Label>
                  <p className="text-lg font-bold text-primary">${project.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{project.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm">{project.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Deadline</Label>
                  <p className="text-sm">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bid Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Bid Proposal</CardTitle>
                <CardDescription>Submit your comprehensive bid for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Name */}
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Enter your company name"
                      required
                    />
                  </div>

                  {/* Bid Amount */}
                  <div>
                    <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      value={formData.bidAmount}
                      onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                      placeholder="Enter your bid amount"
                      required
                    />
                  </div>

                  {/* Proposal */}
                  <div>
                    <Label htmlFor="proposal">Detailed Proposal</Label>
                    <Textarea
                      id="proposal"
                      value={formData.proposal}
                      onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                      placeholder="Describe your approach, methodology, and why you're the best choice for this project..."
                      rows={6}
                      required
                    />
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timelineWeeks">Project Duration (weeks)</Label>
                      <Input
                        id="timelineWeeks"
                        type="number"
                        value={formData.timeline.weeks}
                        onChange={(e) => setFormData({
                          ...formData,
                          timeline: { ...formData.timeline, weeks: e.target.value }
                        })}
                        placeholder="Estimated weeks"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="startDate">Proposed Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.timeline.startDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          timeline: { ...formData.timeline, startDate: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="experienceYears">Years of Experience</Label>
                      <Input
                        id="experienceYears"
                        type="number"
                        value={formData.experience.years}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: { ...formData.experience, years: e.target.value }
                        })}
                        placeholder="Years"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="similarProjects">Similar Projects Completed</Label>
                      <Input
                        id="similarProjects"
                        type="number"
                        value={formData.experience.similarProjects}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: { ...formData.experience, similarProjects: e.target.value }
                        })}
                        placeholder="Number of projects"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Input
                        id="teamSize"
                        type="number"
                        value={formData.experience.teamSize}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: { ...formData.experience, teamSize: e.target.value }
                        })}
                        placeholder="Team members"
                        required
                      />
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <Label>Qualifications & Certifications</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        placeholder="Add qualification"
                      />
                      <Button type="button" onClick={addQualification} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.qualifications.map((qual, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm">{qual}</span>
                          <Button
                            type="button"
                            onClick={() => removeQualification(index)}
                            variant="ghost"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* References */}
                  <div>
                    <Label>References</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={newReference}
                        onChange={(e) => setNewReference(e.target.value)}
                        placeholder="Add reference"
                      />
                      <Button type="button" onClick={addReference} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.references.map((ref, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm">{ref}</span>
                          <Button
                            type="button"
                            onClick={() => removeReference(index)}
                            variant="ghost"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label>Supporting Documents</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          id="bid-file-upload"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.jpeg"
                        />
                        <label htmlFor="bid-file-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center space-y-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Upload Documents</p>
                              <p className="text-xs text-muted-foreground">
                                Certificates, references, portfolio, etc. (max 10MB each)
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Files</Label>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Submitting..." : "Submit Bid"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
