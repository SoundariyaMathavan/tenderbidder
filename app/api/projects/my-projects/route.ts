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
    const projectsCollection = db.collection("projects")

    const projects = await projectsCollection
      .find({ tenderId: payload.userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching user projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 