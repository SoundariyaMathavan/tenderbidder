"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from "lucide-react"

export function VerificationStatusCard() {
  const { user } = useAuth()

  if (!user) return null

  const verificationStatus = user.verificationStatus || {}
  const overallPercentage = verificationStatus.overall || 0

  const getVerificationIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500 text-xs">Verified</Badge>
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Not Started</Badge>
    }
  }

  const getStatusColor = () => {
    if (overallPercentage >= 80) return "text-green-600"
    if (overallPercentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusMessage = () => {
    if (overallPercentage >= 100) return "Fully verified company profile"
    if (overallPercentage >= 80) return "Almost complete - verify remaining details"
    if (overallPercentage >= 50) return "Good progress - continue verification"
    if (overallPercentage > 0) return "Verification in progress"
    return "Start your company verification"
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Company Verification</CardTitle>
          </div>
          <div className={`text-right ${getStatusColor()}`}>
            <div className="text-2xl font-bold">{overallPercentage}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={overallPercentage} className="w-full" />
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              {getVerificationIcon(verificationStatus.gst)}
              <span className="text-sm font-medium">GST</span>
            </div>
            {getVerificationBadge(verificationStatus.gst)}
          </div>
          
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              {getVerificationIcon(verificationStatus.pan)}
              <span className="text-sm font-medium">PAN</span>
            </div>
            {getVerificationBadge(verificationStatus.pan)}
          </div>
          
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              {getVerificationIcon(verificationStatus.cin)}
              <span className="text-sm font-medium">CIN</span>
            </div>
            {getVerificationBadge(verificationStatus.cin)}
          </div>
          
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center space-x-2">
              {getVerificationIcon(verificationStatus.bank)}
              <span className="text-sm font-medium">Bank</span>
            </div>
            {getVerificationBadge(verificationStatus.bank)}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Link href="/profile/edit">
            <Button className="w-full" variant={overallPercentage >= 100 ? "outline" : "default"}>
              {overallPercentage >= 100 ? "View Profile" : "Complete Verification"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          {overallPercentage > 0 && (
            <Link href="/verification-report">
              <Button className="w-full" variant="outline" size="sm">
                View Detailed Report
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}