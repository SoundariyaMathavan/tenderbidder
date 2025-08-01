import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyEmailToken } from "@/lib/auth"
import { sendConfirmationEmail } from "@/lib/email" // Import your email function

// Handle GET requests (when user clicks the email link directly)
export async function GET(request: NextRequest) {
  console.log("🔍 VERIFY ENDPOINT HIT (GET)")
  
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    console.log("❌ No token provided in URL");
    // Redirect to verification page with error
    return NextResponse.redirect(new URL('/auth/verify-email?error=no-token', request.url))
  }

  try {
    const result = await verifyEmailWithToken(token)
    
    if (result.success) {
      // Redirect to verification page with success
      return NextResponse.redirect(new URL('/auth/verify-email?success=true', request.url))
    } else {
      // Redirect to verification page with error
      return NextResponse.redirect(new URL('/auth/verify-email?error=verification-failed', request.url))
    }
  } catch (error) {
    console.error("💥 Email verification error (GET):", error)
    return NextResponse.redirect(new URL('/auth/verify-email?error=server-error', request.url))
  }
}

// Shared verification logic
async function verifyEmailWithToken(token: string) {
  console.log("🎫 Token received:", token.substring(0, 20) + "...");
  console.log("🔑 JWT_SECRET configured:", !!process.env.JWT_SECRET);

  // First, validate the JWT token structure
  const isValidToken = verifyEmailToken(token)
  console.log("✅ JWT token valid:", isValidToken);

  if (!isValidToken) {
    console.log("❌ JWT token validation failed");
    return { success: false, error: "Invalid token" };
  }

  const db = await getDatabase()
  const usersCollection = db.collection("users")

  // Enhanced database lookup with better logging
  console.log("🔍 Looking up user in database...");
  
  // First, check if any user has this token (regardless of expiration)
  const userWithToken = await usersCollection.findOne({
    verificationToken: token
  })
  
  if (!userWithToken) {
    console.log("❌ No user found with this verification token");
    
    // Enhanced debugging - let's see what tokens are actually in the database
    const unverifiedUsers = await usersCollection.find(
      { isVerified: false },
      { 
        projection: { 
          email: 1, 
          verificationToken: 1,
          verificationExpires: 1,
          createdAt: 1
        } 
      }
    ).toArray();
    
    console.log("📊 Total unverified users in DB:", unverifiedUsers.length);
    console.log("🔍 Unverified users and their tokens:");
    
    unverifiedUsers.forEach((user, index) => {
      console.log(`  User ${index + 1}:`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Token (first 20 chars): ${user.verificationToken?.substring(0, 20) || 'NO TOKEN'}...`);
      console.log(`    Token (last 20 chars): ...${user.verificationToken?.substring(user.verificationToken.length - 20) || 'NO TOKEN'}`);
      console.log(`    Token length: ${user.verificationToken?.length || 0}`);
      console.log(`    Expires: ${user.verificationExpires}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log(`    Token matches: ${user.verificationToken === token}`);
    });
    
    console.log("🔍 Looking for token:");
    console.log(`    Token (first 20 chars): ${token.substring(0, 20)}...`);
    console.log(`    Token (last 20 chars): ...${token.substring(token.length - 20)}`);
    console.log(`    Token length: ${token.length}`);
    
    return { success: false, error: "User not found" };
  }

  console.log("👤 User found:", userWithToken.email);
  console.log("⏰ Token expires at:", userWithToken.verificationExpires);
  console.log("🕐 Current time:", new Date());
  console.log("✅ Token still valid:", userWithToken.verificationExpires > new Date());

  // Now check if the token is still valid (not expired)
  if (userWithToken.verificationExpires <= new Date()) {
    console.log("❌ Token has expired");
    return { success: false, error: "Token expired" };
  }

  // Check if user is already verified
  if (userWithToken.isVerified) {
    console.log("ℹ️ User is already verified");
    return { success: true, message: "Already verified" };
  }

  // Update user as verified
  console.log("🔄 Updating user verification status...");
  const updateResult = await usersCollection.updateOne(
    { _id: userWithToken._id },
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

  console.log("📝 Update result:", updateResult.modifiedCount, "documents modified");

  if (updateResult.modifiedCount === 0) {
    console.log("❌ Failed to update user verification status");
    return { success: false, error: "Update failed" };
  }

  console.log("✅ User verified successfully, sending confirmation email...");
  
  try {
    await sendConfirmationEmail(userWithToken.email, userWithToken.companyName);
    console.log("📧 Confirmation email sent successfully");
  } catch (emailError) {
    console.error("⚠️ Failed to send confirmation email (but verification was successful):", emailError);
    // Don't fail the verification if confirmation email fails
  }

  return { success: true, message: "Verification successful" };
}

export async function POST(request: NextRequest) {
  console.log("🔍 VERIFY ENDPOINT HIT (POST)")
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json({ error: "Verification failed. The link may be invalid or expired. Please try signing up again or request a new verification email." }, { status: 400 });
    }

    const result = await verifyEmailWithToken(token)
    
    if (result.success) {
      if (result.message === "Already verified") {
        return NextResponse.json({ message: "Email is already verified. You can sign in to your account." }, { status: 200 });
      }
      return NextResponse.json({ message: "Verification successful! You may now sign in." });
    } else {
      let errorMessage = "Verification failed. The link may be invalid or expired. Please try signing up again or request a new verification email.";
      
      if (result.error === "Token expired") {
        errorMessage = "Verification failed. The link has expired. Please request a new verification email.";
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    console.error("💥 Email verification error (POST):", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}