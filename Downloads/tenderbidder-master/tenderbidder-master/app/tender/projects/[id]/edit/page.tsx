"use client"

import type React from "react"

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
import { Building2, ArrowLeft, Plus, X, Save } from "lucide-react"
import Link from "next/link"

export default function EditProjectPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [requirements, setRequirements] = useState<string[]>([])
  const [newRequirement, setNewRequirement] = useState("")
  const [loadingProject, setLoadingProject] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    location: "",
    deadline: "",
    category: "",
    duration: "",
    specifications: "",
  })
  const [documents, setDocuments] = useState<File[]>([])
  const [existingDocuments, setExistingDocuments] = useState<any[]>([])

  // Fetch project details from API
  useEffect(() => {
    const fetchProject = async () => {
      setLoadingProject(true)
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          const project = data.project
          setFormData({
            title: project.title || "",
            description: project.description || "",
            budget: project.budget ? String(project.budget) : "",
            location: project.location || "",
            deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
            category: project.category || "",
            duration: project.duration || "",
            specifications: project.specifications || "",
          })
          setRequirements(project.requirements || [])
          setExistingDocuments(project.documents || [])
        } else {
          toast({ title: "Error", description: "Project not found.", variant: "destructive" })
          router.push("/tender/dashboard")
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load project.", variant: "destructive" })
        router.push("/tender/dashboard")
      } finally {
        setLoadingProject(false)
      }
    }
    if (params.id) fetchProject()
  }, [params.id, router, toast])

  const addRequirement = () => {
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setRequirements([...requirements, newRequirement.trim()])
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDocuments(files)
  }

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index))
  }

  const removeExistingDocument = (index: number) => {
    setExistingDocuments(existingDocuments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast({
          title: "Error",
          description: "Please sign in to update the project.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          requirements,
          documents: [
            ...existingDocuments,
            ...documents.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type
            }))
          ]
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project updated successfully!",
        })
        router.push(`/tender/projects/${params.id}`)
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update project. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Edit Project</h1>
              <p className="text-sm text-muted-foreground">Update project details</p>
            </div>
          </div>
          <Link href={`/tender/projects/${params.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Update your project information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Office Complex Construction"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial Construction</SelectItem>
                      <SelectItem value="residential">Residential Construction</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget *</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g., $2,500,000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Downtown District"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Bid Submission Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Project Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 18 months"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of the project..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">Technical Specifications</Label>
                <Textarea
                  id="specifications"
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  placeholder="Include technical requirements, materials, standards, etc..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-4">
                <Label>Requirements & Qualifications</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add a requirement..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((req, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 bg-secondary px-3 py-1 rounded-full text-sm"
                      >
                        <span>{req}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Link href={`/tender/projects/${params.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
