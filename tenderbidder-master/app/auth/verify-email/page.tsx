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
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const verifyEmail = async () => {
      // Check if we have URL parameters indicating the result
      const success = searchParams.get("success")
      const error = searchParams.get("error")
      const token = searchParams.get("token")

      if (success === "true") {
        setVerificationStatus("success")
        return
      }

      if (error) {
        setVerificationStatus("error")
        // Set specific error messages based on the error type
        switch (error) {
          case "no-token":
            setErrorMessage("No verification token was provided. Please click the verification link from your email.")
            break
          case "verification-failed":
            setErrorMessage("The verification link is invalid or has expired. Please request a new verification email.")
            break
          case "server-error":
            setErrorMessage("A server error occurred during verification. Please try again later.")
            break
          default:
            setErrorMessage("There was an error verifying your email. The link may be invalid or expired.")
        }
        return
      }

      if (!token) {
        console.log("No token found in URL parameters")
        setVerificationStatus("error")
        setErrorMessage("No verification token was provided. Please click the verification link from your email.")
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
          const errorData = await response.json()
          setVerificationStatus("error")
          setErrorMessage(errorData.error || "There was an error verifying your email. The link may be invalid or expired.")
        }
      } catch (error) {
        console.error("Email verification error:", error)
        setVerificationStatus("error")
        setErrorMessage("A network error occurred. Please check your connection and try again.")
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
              <p className="mb-4">
                {errorMessage || "There was an error verifying your email. The link may be invalid or expired."}
                <br />
                <span className="text-xs text-gray-500 mt-2 block">
                  If you don't have the verification email, you can sign up again or request a new verification email.
                </span>
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/auth/signin")} className="w-full">
                  Back to Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/auth/signup")} 
                  className="w-full"
                >
                  Sign Up Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}