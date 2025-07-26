import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Function to analyze a single bid
async function analyzeSingleBid(bid: any, project: any) {
  let score = 0
  const maxScore = 100

  // Factor 1: Price competitiveness (30 points)
  const budgetRatio = bid.bidAmount / project.budget
  if (budgetRatio <= 0.8) score += 30 // Excellent price
  else if (budgetRatio <= 0.9) score += 25 // Good price
  else if (budgetRatio <= 1.0) score += 20 // Fair price
  else if (budgetRatio <= 1.1) score += 15 // Slightly high
  else score += 10 // Too expensive

  // Factor 2: Proposal quality (25 points)
  const proposalLength = bid.proposal?.length || 0
  if (proposalLength > 1000) score += 25 // Comprehensive proposal
  else if (proposalLength > 500) score += 20 // Good proposal
  else if (proposalLength > 200) score += 15 // Basic proposal
  else score += 10 // Minimal proposal

  // Factor 3: Experience (20 points)
  const experienceYears = bid.experience?.years || 0
  if (experienceYears >= 10) score += 20 // Highly experienced
  else if (experienceYears >= 5) score += 15 // Experienced
  else if (experienceYears >= 2) score += 10 // Some experience
  else score += 5 // Limited experience

  // Factor 4: Qualifications (15 points)
  const qualificationCount = bid.qualifications?.length || 0
  if (qualificationCount >= 5) score += 15 // Highly qualified
  else if (qualificationCount >= 3) score += 12 // Well qualified
  else if (qualificationCount >= 1) score += 8 // Qualified
  else score += 5 // Basic qualifications

  // Factor 5: Timeline feasibility (10 points)
  const timelineWeeks = bid.timeline?.weeks || 0
  const projectDuration = project.duration || "12 months"
  const expectedWeeks = parseInt(projectDuration) * 4 // Rough estimate
  
  if (timelineWeeks <= expectedWeeks) score += 10 // Feasible timeline
  else if (timelineWeeks <= expectedWeeks * 1.2) score += 8 // Reasonable timeline
  else if (timelineWeeks <= expectedWeeks * 1.5) score += 5 // Extended timeline
  else score += 2 // Very long timeline

  // Generate detailed review
  const review = {
    overall: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Poor",
    strengths: [],
    weaknesses: [],
    recommendation: ""
  }

  // Identify strengths
  if (budgetRatio <= 0.9) review.strengths.push("Competitive pricing")
  if (proposalLength > 1000) review.strengths.push("Comprehensive proposal")
  if (experienceYears >= 10) review.strengths.push("Extensive experience")
  if (qualificationCount >= 5) review.strengths.push("Highly qualified")
  if (timelineWeeks <= expectedWeeks) review.strengths.push("Realistic timeline")

  // Identify weaknesses
  if (budgetRatio > 1.1) review.weaknesses.push("Price exceeds budget significantly")
  if (proposalLength < 200) review.weaknesses.push("Limited proposal details")
  if (experienceYears < 2) review.weaknesses.push("Limited experience")
  if (qualificationCount < 1) review.weaknesses.push("Insufficient qualifications")
  if (timelineWeeks > expectedWeeks * 1.5) review.weaknesses.push("Unrealistic timeline")

  // Generate recommendation
  if (score >= 80) {
    review.recommendation = "Highly recommended - Strong candidate for project award"
  } else if (score >= 60) {
    review.recommendation = "Recommended - Good candidate with minor areas for improvement"
  } else if (score >= 40) {
    review.recommendation = "Consider with caution - Several areas need improvement"
  } else {
    review.recommendation = "Not recommended - Significant concerns identified"
  }

  return {
    aiScore: score,
    analysis: {
      priceCompetitiveness: budgetRatio <= 0.9 ? "Excellent" : budgetRatio <= 1.0 ? "Good" : "Needs improvement",
      proposalQuality: proposalLength > 500 ? "Comprehensive" : "Basic",
      experience: experienceYears >= 5 ? "Experienced" : "Limited",
      qualifications: qualificationCount >= 3 ? "Well qualified" : "Basic",
      timeline: timelineWeeks <= expectedWeeks ? "Feasible" : "Extended"
    },
    review,
    detailedExperience: {
      years: experienceYears,
      similarProjects: bid.experience?.similarProjects || 0,
      teamSize: bid.experience?.teamSize || 0,
      specializations: bid.qualifications || [],
      references: bid.references || []
    },
    analyzedAt: new Date()
  }
}

// Function to recalculate rankings for all bids in a project
async function recalculateRankings(projectId: string) {
  const db = await getDatabase()
  const bidsCollection = db.collection("bids")

  // Get all bids for the project
  const bids = await bidsCollection.find({ projectId: new ObjectId(projectId) }).toArray()

  // If there's only one bid, make it rank 1
  if (bids.length === 1) {
    await bidsCollection.updateOne(
      { _id: bids[0]._id },
      { 
        $set: { 
          rank: 1,
          percentile: 100,
          updatedAt: new Date()
        } 
      }
    )
    return
  }

  // Sort by AI score (highest first)
  bids.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))

  // Update each bid with its rank and percentile
  const updatePromises = bids.map((bid, index) => {
    const rank = index + 1
    const percentile = Math.round(((bids.length - index) / bids.length) * 100)
    
    return bidsCollection.updateOne(
      { _id: bid._id },
      { 
        $set: { 
          rank,
          percentile,
          updatedAt: new Date()
        } 
      }
    )
  })

  await Promise.all(updatePromises)
}

// GET - Fetch bids for a project (for tenders)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const bidderId = searchParams.get("bidderId")
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")

    // Build query
    const query: any = { projectId: new ObjectId(projectId) }
    if (bidderId) {
      query.bidderId = bidderId
    }

    const bids = await bidsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ bids })
  } catch (error) {
    console.error("Error fetching bids:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Submit a new bid (for bidders)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload || payload.userType !== "bidder") {
      return NextResponse.json({ error: "Only bidders can submit bids" }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      companyName,
      bidAmount,
      proposal,
      timeline,
      experience,
      qualifications,
      references,
      documents,
    } = body

    // Validate required fields
    if (!projectId || !companyName || !bidAmount || !proposal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const projectsCollection = db.collection("projects")

    // Check if project exists and is open for bidding
    const project = await projectsCollection.findOne({ _id: new ObjectId(projectId) })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.status !== "open" && project.status !== "active") {
      const statusMessage = project.status === "closed" ? "This project has been closed and is no longer accepting bids" :
                           project.status === "awarded" ? "This project has already been awarded" :
                           project.status === "paused" ? "This project is temporarily paused" :
                           "Project is not accepting bids"
      return NextResponse.json({ error: statusMessage }, { status: 400 })
    }

    // Check if bidder already submitted a bid for this project
    const existingBid = await bidsCollection.findOne({
      projectId,
      bidderId: payload.userId,
    })

    if (existingBid) {
      return NextResponse.json({ error: "You have already submitted a bid for this project" }, { status: 400 })
    }

    // Check if company has already submitted a bid for this project
    const existingCompanyBid = await bidsCollection.findOne({
      projectId,
      bidderCompany: companyName
    })

    if (existingCompanyBid) {
      return NextResponse.json({ 
        error: "Your company has already submitted a bid for this project. Only one bid per company is allowed." 
      }, { status: 400 })
    }

    // Analyze the bid automatically
    const analysisResult = await analyzeSingleBid({
      bidAmount: parseFloat(bidAmount),
      proposal,
      timeline,
      experience,
      qualifications,
      references
    }, project)

    const newBid = {
      projectId: new ObjectId(projectId),
      bidderId: payload.userId,
      bidderCompany: companyName || payload.companyName, // Use form company name or fallback to user's company
      bidAmount: parseFloat(bidAmount),
      proposal,
      timeline,
      experience,
      qualifications,
      references,
      documents: documents || [],
      status: "submitted",
      ...analysisResult, // Include AI analysis results
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await bidsCollection.insertOne(newBid)

    // Update project bid count and recalculate rankings
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { bidCount: 1 } }
    )

    // Recalculate rankings for all bids in this project
    await recalculateRankings(projectId)

    return NextResponse.json({
      message: "Bid submitted and analyzed successfully",
      bidId: result.insertedId,
      aiScore: analysisResult.aiScore,
      review: analysisResult.review,
    })
  } catch (error) {
    console.error("Error submitting bid:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 