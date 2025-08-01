import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

// GET - Fetch all projects (for bidders)
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build filter
    const filter: any = {}
    if (status) filter.status = status
    if (category) filter.category = category

    // Only show active/open projects to bidders
    if (!status) filter.status = { $in: ["open", "active"] }

    const projects = await projectsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new project (for tenders)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      title,
      description,
      budget,
      location,
      deadline,
      category,
      duration,
      specifications,
      requirements,
      documents,
      hasFiles,
    } = body

    // Validate required fields
    if (!title || !description || !budget || !deadline || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    const newProject = {
      title,
      description,
      budget: parseFloat(budget),
      location,
      deadline: new Date(deadline),
      category,
      duration,
      specifications,
      requirements: requirements || [],
      documents: documents || [],
      hasFiles: hasFiles || false,
      status: "open",
      bidCount: 0,
      progress: 0,
      tenderId: payload.userId,
      createdBy: payload.userId, // Add this for consistency with other APIs
      tenderCompany: payload.companyName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await projectsCollection.insertOne(newProject)

    return NextResponse.json({
      message: "Project created successfully",
      projectId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 