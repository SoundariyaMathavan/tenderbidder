import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload || payload.userType !== "tender") {
      return NextResponse.json({ error: "Only tender creators can update project status" }, { status: 401 })
    }

    const body = await request.json()
    const { status, reason } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const notificationsCollection = db.collection("notifications")
    const bidsCollection = db.collection("bids")

    // First get the project
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(params.id)
    })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify project ownership - check both createdBy and tenderId for backward compatibility
    const projectOwner = (project.createdBy || project.tenderId)?.toString()
    const currentUserId = payload.userId?.toString()
    
    if (projectOwner !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized - You don't own this project" }, { status: 403 })
    }

    let updateData = {
      status,
      updatedAt: new Date()
    }

    let notificationTitle = ""
    let notificationMessage = ""

    switch (status) {
      case "closed":
        updateData = {
          ...updateData,
          closedAt: new Date(),
          closureReason: reason || "Bidding period ended"
        }
        notificationTitle = "Bidding Closed"
        notificationMessage = `Bidding for "${project.title}" has been closed. No new bids will be accepted.`
        break

      case "paused":
        updateData = {
          ...updateData,
          pausedAt: new Date(),
          pauseReason: reason || "Temporarily paused"
        }
        notificationTitle = "Project Paused"
        notificationMessage = `The project "${project.title}" has been temporarily paused. We'll notify you when it resumes.`
        break

      case "active":
        updateData = {
          ...updateData,
          resumedAt: new Date()
        }
        notificationTitle = "Project Resumed"
        notificationMessage = `The project "${project.title}" is now accepting bids again.`
        break

      default:
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update project status
    await projectsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    // Get all bidders for this project to notify them
    const bids = await bidsCollection.find({ 
      projectId: new ObjectId(params.id),
      status: { $in: ["submitted", "shortlisted"] }
    }).toArray()

    // Create notifications for all bidders
    if (bids.length > 0) {
      const notifications = bids.map(bid => ({
        userId: bid.bidderId,
        title: notificationTitle,
        message: notificationMessage,
        type: "project_status_update",
        projectId: params.id,
        read: false,
        createdAt: new Date()
      }))

      await notificationsCollection.insertMany(notifications)
    }

    return NextResponse.json({
      message: `Project status updated to ${status}`,
      projectId: params.id,
      status,
      notifiedBidders: bids.length
    })

  } catch (error) {
    console.error("Error updating project status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}