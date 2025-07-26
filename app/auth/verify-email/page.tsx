"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token")
      if (!token) {
        setVerificationStatus("error")
        return
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          setVerificationStatus("success")
        } else {
          setVerificationStatus("error")
        }
      } catch (error) {
        console.error("Email verification error:", error)
        setVerificationStatus("error")
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>Verifying your email address</CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStatus === "loading" && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Verifying your email...</p>
            </div>
          )}
          {verificationStatus === "success" && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600 mb-2">Email Verified Successfully!</h3>
              <p className="mb-4">Your email has been verified. You can now sign in to your account.</p>
              <Button onClick={() => router.push("/auth/signin")}>Sign In</Button>
            </div>
          )}
          {verificationStatus === "error" && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Verification Failed</h3>
              <p className="mb-4">There was an error verifying your email. The link may be invalid or expired.</p>
              <Button onClick={() => router.push("/auth/signin")}>Back to Sign In</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}