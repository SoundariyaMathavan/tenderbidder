import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload || payload.userType !== "tender") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const projectsCollection = db.collection("projects")

    // Get all projects for this tender
    const projects = await projectsCollection
      .find({ tenderId: payload.userId })
      .toArray()

    const projectIds = projects.map(project => project._id)

    // Get all bids for these projects with project details
    const bids = await bidsCollection
      .aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project"
          }
        },
        { $unwind: "$project" },
        {
          $project: {
            _id: 1,
            bidAmount: 1,
            proposal: 1,
            status: 1,
            aiScore: 1,
            rank: 1,
            percentile: 1,
            bidderCompany: 1,
            bidderId: 1,
            createdAt: 1,
            updatedAt: 1,
            timeline: 1,
            experience: 1,
            qualifications: 1,
            references: 1,
            analysis: 1,
            review: 1,
            detailedExperience: 1,
            project: {
              _id: 1,
              title: 1,
              category: 1,
              budget: 1,
              deadline: 1,
              status: 1,
              createdAt: 1
            }
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray()

    // Calculate statistics
    const stats = {
      totalBids: bids.length,
      totalProjects: projects.length,
      awardedBids: bids.filter(bid => bid.status === "awarded").length,
      shortlistedBids: bids.filter(bid => bid.status === "shortlisted").length,
      submittedBids: bids.filter(bid => bid.status === "submitted").length,
      rejectedBids: bids.filter(bid => bid.status === "rejected").length,
      averageScore: bids.length > 0 ? bids.reduce((sum, bid) => sum + (bid.aiScore || 0), 0) / bids.length : 0,
      totalBidValue: bids.reduce((sum, bid) => sum + (bid.bidAmount || 0), 0),
      averageBidAmount: bids.length > 0 ? bids.reduce((sum, bid) => sum + (bid.bidAmount || 0), 0) / bids.length : 0
    }

    // Group bids by project for easier display
    const bidsByProject = bids.reduce((acc, bid) => {
      const projectId = bid.project._id.toString()
      if (!acc[projectId]) {
        acc[projectId] = {
          project: bid.project,
          bids: []
        }
      }
      acc[projectId].bids.push(bid)
      return acc
    }, {})

    return NextResponse.json({ 
      bids, 
      stats, 
      bidsByProject,
      projects 
    })
  } catch (error) {
    console.error("Error fetching all bids:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}