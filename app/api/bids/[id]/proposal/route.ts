import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const projectsCollection = db.collection("projects")

    // Get the bid
    const bid = await bidsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    // Get the project to verify access
    const project = await projectsCollection.findOne({ _id: bid.projectId })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user has access (either the bidder or the project owner)
    if (payload.userId !== bid.bidderId && payload.userId !== project.createdBy) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Return full proposal details
    return NextResponse.json({
      bid: {
        _id: bid._id,
        bidderCompany: bid.bidderCompany,
        bidAmount: bid.bidAmount,
        proposal: bid.proposal,
        timeline: bid.timeline,
        experience: bid.experience,
        qualifications: bid.qualifications,
        references: bid.references,
        documents: bid.documents,
        status: bid.status,
        aiScore: bid.aiScore,
        rank: bid.rank,
        percentile: bid.percentile,
        analysis: bid.analysis,
        review: bid.review,
        detailedExperience: bid.detailedExperience,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt
      },
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        budget: project.budget,
        category: project.category,
        location: project.location,
        deadline: project.deadline,
        status: project.status
      }
    })

  } catch (error) {
    console.error("Error fetching proposal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}