import { type NextRequest, NextResponse } from "next/server"
import { MLService, type BidData } from "@/lib/ml-models"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { bidData, tenderBudget } = body

    if (!bidData || !tenderBudget) {
      return NextResponse.json({ error: "Bid data and tender budget are required" }, { status: 400 })
    }

    // Initialize ML service
    const mlService = new MLService()

    // Analyze the bid
    const analysis = await mlService.analyzeBid(bidData as BidData, tenderBudget)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error("ML Analysis error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
