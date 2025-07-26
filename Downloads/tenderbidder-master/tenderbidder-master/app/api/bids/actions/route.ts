import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      console.error("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (payload.userType !== "tender") {
      console.error("Wrong user type:", payload.userType)
      return NextResponse.json({ error: "Only tender creators can perform bid actions" }, { status: 401 })
    }

    const body = await request.json()
    const { bidId, action, projectId } = body

    if (!bidId || !action || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const projectsCollection = db.collection("projects")
    const notificationsCollection = db.collection("notifications")

    // First, get the project to check if it exists
    const project = await projectsCollection.findOne({ 
      _id: new ObjectId(projectId)
    })
    
    if (!project) {
      console.error("Project not found:", projectId)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Debug logging
    console.log("Project found:", {
      projectId: project._id,
      createdBy: project.createdBy,
      payloadUserId: payload.userId,
      userType: payload.userType
    })

    // Verify project ownership - handle both string and ObjectId formats
    // Check both createdBy and tenderId for backward compatibility
    const projectCreatedBy = (project.createdBy || project.tenderId)?.toString()
    const currentUserId = payload.userId?.toString()
    
    if (projectCreatedBy !== currentUserId) {
      console.error("Unauthorized access attempt:", {
        projectCreatedBy: project.createdBy,
        projectTenderId: project.tenderId,
        currentUserId,
        match: projectCreatedBy === currentUserId
      })
      return NextResponse.json({ error: "Unauthorized - You don't own this project" }, { status: 403 })
    }

    // Get the bid
    const bid = await bidsCollection.findOne({ _id: new ObjectId(bidId) })
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    let updateData = {}
    let notificationMessage = ""
    let notificationTitle = ""

    switch (action) {
      case "shortlist":
        updateData = { status: "shortlisted", updatedAt: new Date() }
        notificationTitle = "🎉 Bid Shortlisted!"
        notificationMessage = `Your bid for "${project.title}" has been shortlisted. You're one step closer to winning this project!`
        break

      case "award":
        // First, reject all other bids for this project
        await bidsCollection.updateMany(
          { 
            projectId: new ObjectId(projectId),
            _id: { $ne: new ObjectId(bidId) }
          },
          { 
            $set: { 
              status: "rejected", 
              updatedAt: new Date(),
              rejectionReason: "Project awarded to another bidder"
            } 
          }
        )

        // Award this bid
        updateData = { status: "awarded", updatedAt: new Date() }
        notificationTitle = "🏆 Congratulations! Project Awarded!"
        notificationMessage = `You have been awarded the project "${project.title}". Please check your dashboard for next steps.`

        // Update project status
        await projectsCollection.updateOne(
          { _id: new ObjectId(projectId) },
          { 
            $set: { 
              status: "awarded",
              awardedTo: bid.bidderId,
              awardedCompany: bid.bidderCompany,
              awardedAmount: bid.bidAmount,
              awardedAt: new Date(),
              updatedAt: new Date()
            } 
          }
        )

        // Notify other bidders about rejection
        const otherBids = await bidsCollection.find({ 
          projectId: new ObjectId(projectId),
          _id: { $ne: new ObjectId(bidId) }
        }).toArray()

        const rejectionNotifications = otherBids.map(otherBid => ({
          userId: otherBid.bidderId,
          title: "Project Update",
          message: `The project "${project.title}" has been awarded to another bidder. Thank you for your participation.`,
          type: "project_update",
          projectId: projectId,
          bidId: otherBid._id.toString(),
          read: false,
          createdAt: new Date()
        }))

        if (rejectionNotifications.length > 0) {
          await notificationsCollection.insertMany(rejectionNotifications)
        }
        break

      case "reject":
        updateData = { 
          status: "rejected", 
          updatedAt: new Date(),
          rejectionReason: body.reason || "Not selected for this project"
        }
        notificationTitle = "Project Update"
        notificationMessage = `Your bid for "${project.title}" was not selected. Thank you for your interest.`
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update the bid
    await bidsCollection.updateOne(
      { _id: new ObjectId(bidId) },
      { $set: updateData }
    )

    // Create notification for the bidder
    await notificationsCollection.insertOne({
      userId: bid.bidderId,
      title: notificationTitle,
      message: notificationMessage,
      type: action,
      projectId: projectId,
      bidId: bidId,
      read: false,
      createdAt: new Date()
    })

    return NextResponse.json({
      message: `Bid ${action} successful`,
      bidId,
      action,
      notification: {
        title: notificationTitle,
        message: notificationMessage
      }
    })

  } catch (error) {
    console.error("Error performing bid action:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}