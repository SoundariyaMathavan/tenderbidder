"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Building2, ArrowLeft, Plus, X, Save } from "lucide-react"
import Link from "next/link"

export default function EditProfilePage() {
  const { user, token, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [newSpecialization, setNewSpecialization] = useState("")

  const [formData, setFormData] = useState({
    companyName: "",
    contactNumber: "",
    address: "",
    bio: "",
    website: "",
    specializations: [] as string[],
  })

  useEffect(() => {
    if (!user || !token) {
      router.push("/auth/signin")
      return
    }

    // Pre-fill form with existing user data
    setFormData({
      companyName: user.companyName || "",
      contactNumber: user.contactNumber || "",
      address: user.address || "",
      bio: user.bio || "",
      website: user.website || "",
      specializations: user.specializations || [],
    })
  }, [user, token, router])

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, newSpecialization.trim()],
      })
      setNewSpecialization("")
    }
  }

  const removeSpecialization = (index: number) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Update user context
        updateUser({
          companyName: data.user.companyName,
          contactNumber: data.user.contactNumber,
          address: data.user.address,
          bio: data.user.bio,
          website: data.user.website,
          specializations: data.user.specializations,
        })

        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })

        // Redirect back to dashboard
        if (user?.userType === "tender") {
          router.push("/tender/dashboard")
        } else {
          router.push("/bidder/dashboard")
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Update your company information</p>
            </div>
          </div>
          <Link href={user.userType === "tender" ? "/tender/dashboard" : "/bidder/dashboard"}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details and specializations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Your Company Ltd."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Business Street, City, State, ZIP"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.yourcompany.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Company Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.specializations.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() => removeSpecialization(index)}
                            className="hover:text-primary/70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Link href={user.userType === "tender" ? "/tender/dashboard" : "/bidder/dashboard"}>
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
    </div>
  )
}
