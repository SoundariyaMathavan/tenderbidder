import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const projectsCollection = db.collection("projects")

    // Get project details
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get all bids for the project, sorted by rank
    const bids = await bidsCollection
      .find({ projectId: new ObjectId(projectId) })
      .sort({ rank: 1 }) // Sort by rank (1st, 2nd, 3rd, etc.)
      .toArray()

    if (bids.length === 0) {
      return NextResponse.json({ 
        message: "No bids found for this project",
        project: {
          title: project.title,
          budget: project.budget,
          totalBids: 0
        },
        rankedBids: []
      })
    }

    // Calculate analytics
    const bidAmounts = bids.map(bid => bid.bidAmount)
    const aiScores = bids.map(bid => bid.aiScore || 0)
    
    const analytics = {
      totalBids: bids.length,
      averageBidAmount: Math.round(bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length),
      lowestBid: Math.min(...bidAmounts),
      highestBid: Math.max(...bidAmounts),
      averageScore: Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length),
      topScore: Math.max(...aiScores),
      budgetVariance: {
        underBudget: bids.filter(bid => bid.bidAmount < project.budget).length,
        onBudget: bids.filter(bid => bid.bidAmount === project.budget).length,
        overBudget: bids.filter(bid => bid.bidAmount > project.budget).length
      },
      scoreDistribution: {
        excellent: bids.filter(bid => (bid.aiScore || 0) >= 80).length,
        good: bids.filter(bid => (bid.aiScore || 0) >= 60 && (bid.aiScore || 0) < 80).length,
        average: bids.filter(bid => (bid.aiScore || 0) >= 40 && (bid.aiScore || 0) < 60).length,
        poor: bids.filter(bid => (bid.aiScore || 0) < 40).length
      }
    }

    // Add competitive advantage to each bid
    const rankedBids = bids.map(bid => ({
      ...bid,
      competitiveAdvantage: bid.rank === 1 ? "Best overall bid" : 
                           bid.rank === 2 ? "Strong alternative option" :
                           bid.rank === 3 ? "Solid third choice" :
                           bid.rank <= 5 ? "Worth considering" : "Under review"
    }))

    // Get top 5 bids
    const top5Bids = rankedBids.slice(0, 5)

    return NextResponse.json({
      message: "Rankings retrieved successfully",
      project: {
        title: project.title,
        budget: project.budget,
        category: project.category,
        deadline: project.deadline,
        totalBids: bids.length
      },
      analytics,
      rankedBids,
      top5Bids,
      summary: {
        totalAnalyzed: bids.length,
        topPerformers: Math.min(5, bids.length),
        averageTopScore: top5Bids.length > 0 ? Math.round(top5Bids.reduce((sum, bid) => sum + (bid.aiScore || 0), 0) / top5Bids.length) : 0,
        budgetCompliantTop5: top5Bids.filter(bid => bid.bidAmount <= project.budget).length
      }
    })
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}