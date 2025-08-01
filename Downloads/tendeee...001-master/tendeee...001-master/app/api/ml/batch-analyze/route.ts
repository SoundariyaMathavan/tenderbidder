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
    if (!decoded || decoded.userType !== "tender") {
      return NextResponse.json({ error: "Unauthorized - Tender access required" }, { status: 403 })
    }

    const body = await request.json()
    const { bids, tenderBudget } = body

    if (!bids || !Array.isArray(bids) || !tenderBudget) {
      return NextResponse.json({ error: "Bids array and tender budget are required" }, { status: 400 })
    }

    // Initialize ML service
    const mlService = new MLService()

    // Analyze all bids
    const analyses = await Promise.all(
      bids.map(async (bidData: BidData) => {
        const analysis = await mlService.analyzeBid(bidData, tenderBudget)
        return {
          bidId: bidData.bidAmount, // Using bidAmount as identifier for demo
          analysis,
        }
      }),
    )

    // Sort by ML score
    const rankedBids = analyses.sort((a, b) => b.analysis.scoring.score - a.analysis.scoring.score)

    return NextResponse.json({
      success: true,
      rankedBids,
      summary: {
        totalBids: bids.length,
        averageScore: Math.round(analyses.reduce((sum, a) => sum + a.analysis.scoring.score, 0) / analyses.length),
        highRiskBids: analyses.filter((a) => a.analysis.riskAssessment.overallRisk === "high").length,
        qualifiedBids: analyses.filter((a) => a.analysis.scoring.score >= 70).length,
      },
    })
  } catch (error) {
    console.error("Batch ML Analysis error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
