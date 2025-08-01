"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { CompanyVerification } from "@/components/company-verification"
import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EditProfilePage() {
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || !token) {
      router.push("/auth/signin")
      return
    }
  }, [user, token, router])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pt-16"> {/* reduced from pt-20 */}
  <div className="container mx-auto px-4 py-8">
    <div className="max-w-6xl mx-auto -mt-4"> {/* lift the component a bit */}
      <CompanyVerification />
    </div>
  </div>
</div>
  )
}
