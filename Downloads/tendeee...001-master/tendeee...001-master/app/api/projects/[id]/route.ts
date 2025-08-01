import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const project = await projectsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const body = await request.json()
    const updateFields = { ...body, updatedAt: new Date() }
    delete updateFields._id // never update _id

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateFields }
    )
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Project updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const body = await request.json()
    const updateFields = { ...body, updatedAt: new Date() }
    delete updateFields._id // never update _id

    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateFields }
    )
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Project updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 