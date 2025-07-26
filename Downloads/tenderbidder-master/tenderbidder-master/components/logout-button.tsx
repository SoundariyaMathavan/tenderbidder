"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function LogoutButton() {
  const router = useRouter()
  const { logout } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        logout() // Clear the auth context
        toast({
          title: "Success",
          description: "You have been logged out successfully.",
        })
        router.push("/")
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
    }
  }

  return (
    <Button onClick={handleLogout} variant="outline" size="sm">
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
} 