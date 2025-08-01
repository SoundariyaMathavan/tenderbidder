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
    if (!payload || payload.userType !== "bidder") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")

    // Get bids with project details
    const bids = await bidsCollection
      .aggregate([
        { $match: { bidderId: payload.userId } },
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
            createdAt: 1,
            project: {
              _id: 1,
              title: 1,
              category: 1,
              budget: 1,
              deadline: 1,
              status: 1
            }
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray()

    return NextResponse.json({ bids })
  } catch (error) {
    console.error("Error fetching user bids:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 