"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          toast({
            title: "Success",
            description: "You have been logged out successfully.",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to logout. Please try again.",
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
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    }

    logout()
  }, [router, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogOut className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Logging Out...</CardTitle>
          <CardDescription>
            Please wait while we log you out and redirect you to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 