import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Create a response that clears the auth cookie
    const response = NextResponse.json({ message: "Logged out successfully" })
    
    // Clear the authentication cookie
    response.cookies.delete("auth-token")
    
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 