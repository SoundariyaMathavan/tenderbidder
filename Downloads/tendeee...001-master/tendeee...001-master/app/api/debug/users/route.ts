import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Debug endpoint to check user verification status
// Only enable in development
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    if (email) {
      // Get specific user info
      const user = await usersCollection.findOne({ email })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        email: user.email,
        companyName: user.companyName,
        isVerified: user.isVerified,
        hasVerificationToken: !!user.verificationToken,
        verificationTokenLength: user.verificationToken?.length || 0,
        verificationExpires: user.verificationExpires,
        tokenExpired: user.verificationExpires ? user.verificationExpires <= new Date() : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })
    } else {
      // Get summary of all users
      const totalUsers = await usersCollection.countDocuments()
      const verifiedUsers = await usersCollection.countDocuments({ isVerified: true })
      const unverifiedUsers = await usersCollection.countDocuments({ isVerified: false })
      const usersWithTokens = await usersCollection.countDocuments({ verificationToken: { $exists: true, $ne: null } })
      
      // Get recent unverified users
      const recentUnverified = await usersCollection.find(
        { isVerified: false },
        { 
          projection: { 
            email: 1, 
            companyName: 1, 
            verificationExpires: 1, 
            createdAt: 1,
            hasToken: { $cond: { if: { $ne: ["$verificationToken", null] }, then: true, else: false } }
          } 
        }
      ).sort({ createdAt: -1 }).limit(5).toArray()

      return NextResponse.json({
        summary: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers,
          usersWithTokens
        },
        recentUnverified
      })
    }
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}