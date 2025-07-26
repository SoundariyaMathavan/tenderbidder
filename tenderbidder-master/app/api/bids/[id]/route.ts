import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const bid = await bidsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }
    return NextResponse.json({ bid })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const body = await request.json()
    const updateFields = { ...body, updatedAt: new Date() }
    delete updateFields._id // never update _id

    const result = await bidsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateFields }
    )
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Bid updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}