import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload || payload.userType !== "tender") {
      return NextResponse.json({ error: "Only tenders can download proposals" }, { status: 401 })
    }

    const projectId = params.id
    const db = await getDatabase()

    // Verify the tender owns this project
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.tenderId !== payload.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all bids for this project
    const bids = await db.collection("bids")
      .find({ projectId: new ObjectId(projectId) })
      .sort({ aiScore: -1 }) // Sort by AI score descending
      .toArray()

    if (bids.length === 0) {
      return NextResponse.json({ error: "No proposals found for this project" }, { status: 404 })
    }

    // Create a comprehensive text report of all proposals
    let reportContent = `PROJECT PROPOSALS REPORT
========================
Project: ${project.title}
Generated: ${new Date().toLocaleString()}
Total Proposals: ${bids.length}

`

    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i]
      reportContent += `
${'='.repeat(80)}
PROPOSAL #${i + 1} - ${bid.bidderCompany}
${'='.repeat(80)}

BASIC INFORMATION
-----------------
Company: ${bid.bidderCompany}
Bid Amount: $${bid.bidAmount?.toLocaleString()}
AI Score: ${bid.aiScore || 0}/100
Rank: #${bid.rank || 'N/A'}
Status: ${bid.status}
Submitted: ${new Date(bid.createdAt).toLocaleString()}

DETAILED PROPOSAL
-----------------
${bid.proposal}

TIMELINE
--------
Duration: ${bid.timeline?.weeks || 'N/A'} weeks
Start Date: ${bid.timeline?.startDate || 'N/A'}

EXPERIENCE
----------
Years of Experience: ${bid.experience?.years || 'N/A'}
Similar Projects: ${bid.experience?.similarProjects || 'N/A'}
Team Size: ${bid.experience?.teamSize || 'N/A'}

QUALIFICATIONS
--------------
${bid.qualifications?.join('\n') || 'None provided'}

REFERENCES
----------
${bid.references?.join('\n') || 'None provided'}

AI ANALYSIS
-----------
Overall Rating: ${bid.review?.overall || 'N/A'}
Recommendation: ${bid.review?.recommendation || 'N/A'}

Strengths:
${bid.review?.strengths?.map((s: string) => `- ${s}`).join('\n') || 'None identified'}

Areas for Improvement:
${bid.review?.weaknesses?.map((w: string) => `- ${w}`).join('\n') || 'None identified'}

DOCUMENTS
---------
${bid.documents && bid.documents.length > 0 ? 
  bid.documents.map((doc: any) => `- ${doc.originalName} (${(doc.size / 1024 / 1024).toFixed(2)} MB)`).join('\n') : 
  'No documents uploaded'}

`
    }

    const filename = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_Proposals_${new Date().toISOString().split('T')[0]}.txt`

    return new NextResponse(reportContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading proposals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}