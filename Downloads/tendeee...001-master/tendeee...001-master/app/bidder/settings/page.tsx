"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "@/components/logout-button"
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
} from "lucide-react"
import Link from "next/link"
import { VerificationStatusCard } from "@/components/verification-status-card"

export default function BidderSettings() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("security")
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Profile form state
  const [profileData, setProfileData] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    contactPerson: "",
    businessRegistration: "",
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    bidUpdates: true,
    newTenders: true,
    marketingEmails: false,
    smsNotifications: false,
  })

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== "bidder")) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      // Load user profile data
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileData({
          companyName: data.companyName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          website: data.website || "",
          description: data.description || "",
          contactPerson: data.contactPerson || "",
          businessRegistration: data.businessRegistration || "",
        })
        
        // Load notification preferences if they exist
        if (data.notificationPreferences) {
          setNotifications(data.notificationPreferences)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        alert("Profile updated successfully!")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        alert("Password updated successfully!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update password")
      }
    } catch (error) {
      console.error("Error updating password:", error)
      alert("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(notifications),
      })

      if (response.ok) {
        alert("Notification preferences updated successfully!")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update notification preferences")
      }
    } catch (error) {
      console.error("Error updating notifications:", error)
      alert("Failed to update notification preferences")
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/user/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        alert("Verification email sent successfully! Please check your email.")
      } else {
        alert(data.error || "Failed to send verification email")
      }
    } catch (error) {
      console.error("Error resending verification:", error)
      alert("Failed to send verification email")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pt-16">
  <div className="container mx-auto px-4 py-8 -mt-2">
       
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Security Tab */}
       
          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <VerificationStatusCard />
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Company Documents
                    </CardTitle>
                    <CardDescription>
                      Upload and manage your company verification documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">GST Certificate</p>
                          <p className="text-sm text-muted-foreground">Upload your GST registration certificate</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">PAN Card</p>
                          <p className="text-sm text-muted-foreground">Upload company PAN card</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">CIN Certificate</p>
                          <p className="text-sm text-muted-foreground">Corporate Identification Number certificate</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Bank Statement</p>
                          <p className="text-sm text-muted-foreground">Recent bank statement for verification</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Verification Benefits</CardTitle>
                    <CardDescription>
                      Why complete your company verification?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Higher Trust Score</p>
                          <p className="text-sm text-muted-foreground">Verified companies get priority in tender evaluations</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Access to Premium Tenders</p>
                          <p className="text-sm text-muted-foreground">Some tenders require verified bidders only</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Faster Bid Processing</p>
                          <p className="text-sm text-muted-foreground">Verified bids are processed with priority</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Compliance Badge</p>
                          <p className="text-sm text-muted-foreground">Display verification badge on your profile</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Verification Actions</CardTitle>
                <CardDescription>
                  Quick actions to complete your verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href="/profile/edit">
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      Complete Profile
                    </Button>
                  </Link>
                  <Link href="/verification-report">
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      View Detailed Report
                    </Button>
                  </Link>
                  <Button variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Verify Company Details
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bid Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about bid status changes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.bidUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, bidUpdates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Tenders</Label>
                      <p className="text-sm text-muted-foreground">
                        Be notified when new tenders are posted
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newTenders}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newTenders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, smsNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive promotional emails and updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, marketingEmails: checked })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleNotificationUpdate} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}