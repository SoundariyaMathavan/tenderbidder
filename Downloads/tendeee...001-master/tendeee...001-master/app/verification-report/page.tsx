"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { VerificationReport } from "@/components/verification-report"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerificationReportPage() {
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
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 print:hidden">
            <div>
              <h1 className="text-3xl font-bold">Verification Report</h1>
              <p className="text-muted-foreground">Comprehensive company verification status</p>
            </div>
            <Link href={user.userType === "tender" ? "/tender/dashboard" : "/bidder/dashboard"}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <VerificationReport />
        </div>
      </div>
    </div>
  )
}