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
    if (!payload || payload.userType !== "tender") {
      return NextResponse.json({ error: "Only tenders can analyze bids" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

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

    // Get all bids for the project
    const bids = await bidsCollection.find({ projectId: new ObjectId(projectId) }).toArray()

    if (bids.length === 0) {
      return NextResponse.json({ error: "No bids found for this project" }, { status: 404 })
    }

    // Analyze each bid and calculate AI scores
    const analyzedBids = await Promise.all(
      bids.map(async (bid) => {
        // Calculate AI score based on multiple factors
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

        // Update bid with AI score
        await bidsCollection.updateOne(
          { _id: bid._id },
          { $set: { aiScore: score, analyzedAt: new Date() } }
        )

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
          ...bid,
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
          }
        }
      })
    )

    // Sort by AI score (highest first)
    analyzedBids.sort((a, b) => b.aiScore - a.aiScore)

    // Add ranking to each bid and update in database
    const rankedBids = await Promise.all(
      analyzedBids.map(async (bid, index) => {
        const rank = index + 1
        const percentile = Math.round(((analyzedBids.length - index) / analyzedBids.length) * 100)
        
        // Update the bid in database with rank and percentile
        await bidsCollection.updateOne(
          { _id: bid._id },
          { 
            $set: { 
              rank: rank,
              percentile: percentile,
              updatedAt: new Date()
            } 
          }
        )
        
        return {
          ...bid,
          rank: rank,
          percentile: percentile
        }
      })
    )

    // Calculate comparative analytics
    const bidAmounts = analyzedBids.map(bid => bid.bidAmount)
    const aiScores = analyzedBids.map(bid => bid.aiScore)
    
    const analytics = {
      totalBids: analyzedBids.length,
      averageBidAmount: Math.round(bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length),
      lowestBid: Math.min(...bidAmounts),
      highestBid: Math.max(...bidAmounts),
      averageScore: Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length),
      topScore: Math.max(...aiScores),
      budgetVariance: {
        underBudget: analyzedBids.filter(bid => bid.bidAmount < project.budget).length,
        onBudget: analyzedBids.filter(bid => bid.bidAmount === project.budget).length,
        overBudget: analyzedBids.filter(bid => bid.bidAmount > project.budget).length
      },
      experienceDistribution: {
        expert: analyzedBids.filter(bid => (bid.experience?.years || 0) >= 10).length,
        experienced: analyzedBids.filter(bid => (bid.experience?.years || 0) >= 5 && (bid.experience?.years || 0) < 10).length,
        intermediate: analyzedBids.filter(bid => (bid.experience?.years || 0) >= 2 && (bid.experience?.years || 0) < 5).length,
        junior: analyzedBids.filter(bid => (bid.experience?.years || 0) < 2).length
      },
      scoreDistribution: {
        excellent: analyzedBids.filter(bid => bid.aiScore >= 80).length,
        good: analyzedBids.filter(bid => bid.aiScore >= 60 && bid.aiScore < 80).length,
        average: analyzedBids.filter(bid => bid.aiScore >= 40 && bid.aiScore < 60).length,
        poor: analyzedBids.filter(bid => bid.aiScore < 40).length
      }
    }

    // Generate recommendations
    const recommendations = []
    const topBid = rankedBids[0]
    
    if (topBid.bidAmount > project.budget) {
      recommendations.push("Consider negotiating with top-ranked bidders as they exceed budget")
    }
    
    if (analytics.averageBidAmount > project.budget * 1.1) {
      recommendations.push("Budget may be too low - consider increasing or adjusting requirements")
    }
    
    if (analytics.totalBids < 3) {
      recommendations.push("Low bid count - consider extending deadline or improving project visibility")
    }
    
    if (analytics.scoreDistribution.excellent === 0) {
      recommendations.push("No excellent bids found - review project requirements or extend deadline")
    }

    // Get top 5 bids with detailed information
    const top5Bids = rankedBids.slice(0, 5).map(bid => ({
      ...bid,
      isTopRanked: true,
      competitiveAdvantage: bid.rank === 1 ? "Best overall bid" : 
                           bid.rank === 2 ? "Strong alternative option" :
                           bid.rank === 3 ? "Solid third choice" :
                           bid.rank <= 5 ? "Worth considering" : "Under review"
    }))

    // Add more detailed recommendations for top bids
    if (top5Bids.length > 0) {
      const topBid = top5Bids[0]
      if (topBid.aiScore >= 80) {
        recommendations.push(`Top bid from ${topBid.bidderCompany} shows excellent potential - recommend immediate consideration`)
      }
      
      if (top5Bids.filter(bid => bid.bidAmount <= project.budget).length > 0) {
        recommendations.push("Multiple competitive bids within budget - good negotiation position")
      }
    }

    return NextResponse.json({
      message: "Bids analyzed successfully",
      project: {
        title: project.title,
        budget: project.budget,
        category: project.category,
        deadline: project.deadline
      },
      analytics,
      recommendations,
      top5Bids,
      allBids: rankedBids,
      summary: {
        totalAnalyzed: rankedBids.length,
        topPerformers: top5Bids.length,
        averageTopScore: top5Bids.length > 0 ? Math.round(top5Bids.reduce((sum, bid) => sum + bid.aiScore, 0) / top5Bids.length) : 0,
        budgetCompliantTop5: top5Bids.filter(bid => bid.bidAmount <= project.budget).length
      }
    })
  } catch (error) {
    console.error("Error analyzing bids:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 