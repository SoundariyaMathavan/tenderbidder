"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Building2 className="h-12 w-12 text-primary" />
              <Mail className="h-6 w-6 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>We've sent you a verification link</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-700">
              We've sent a verification email to:
            </p>
            {email && (
              <p className="font-semibold text-blue-700 mt-1">
                {email}
              </p>
            )}
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Next steps:</strong>
            </p>
            <ol className="text-left space-y-2 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected back to sign in</li>
            </ol>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => router.push("/auth/signin")}
                className="w-full"
              >
                Go to Sign In
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push("/auth/signup")}
                className="w-full"
              >
                Try Signing Up Again
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}