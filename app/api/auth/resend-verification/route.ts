import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { sendVerificationEmail } from "@/lib/email"
import { generateVerificationToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    
    // Find user by email
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken()
    
    // Update user with new verification token
    await usersCollection.updateOne(
      { email },
      { 
        $set: { 
          verificationToken,
          verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        } 
      }
    )

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, user.companyName)
      console.log("✅ Verification email resent successfully")
      
      return NextResponse.json({ 
        message: "Verification email sent successfully",
        emailSent: true,
        // In development, you might want to return the token for testing
        ...(process.env.NODE_ENV === 'development' && { verificationToken })
      })
    } catch (emailError) {
      console.error("❌ Failed to resend verification email:", emailError)
      
      return NextResponse.json({ 
        message: "Failed to send verification email. Please try again later.",
        emailSent: false,
        error: "Email delivery failed"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


