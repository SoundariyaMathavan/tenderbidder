import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyEmailToken } from "@/lib/auth"
import { sendConfirmationEmail } from "@/lib/email" // Import your email function

export async function POST(request: NextRequest) {
  console.log("VERIFY ENDPOINT HIT") // <-- Make sure you see this in your terminal
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const isValidToken = verifyEmailToken(token)
    console.log("Token received:", token);
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);
    console.log("isValidToken:", isValidToken);

    if (!isValidToken) {
      console.log("Invalid or expired token")
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    })

    if (!user) {
      console.log("User not found or token expired in DB")
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          updatedAt: new Date(),
        },
        $unset: {
          verificationToken: "",
          verificationExpires: "",
        },
      },
    )

    console.log("User verified, sending confirmation email...")
    await sendConfirmationEmail(user.email, user.companyName)

    return NextResponse.json({
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}