import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
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

    const [type, entityId, filename] = params.path
    
    if (!type || !entityId || !filename) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    // Verify user has access to this file
    const db = await getDatabase()
    
    if (type === "project") {
      // Check if user is the tender who created the project or a bidder viewing the project
      const project = await db.collection("projects").findOne({ _id: new ObjectId(entityId) })
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
      
      // Allow access if user is the tender who created it or any authenticated bidder
      if (payload.userType === "tender" && project.tenderId !== payload.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    } else if (type === "proposal") {
      // Check if user is the tender who owns the project or the bidder who submitted the proposal
      const bid = await db.collection("bids").findOne({ _id: new ObjectId(entityId) })
      if (!bid) {
        return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
      }
      
      const project = await db.collection("projects").findOne({ _id: bid.projectId })
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
      
      // Allow access if user is the tender who owns the project or the bidder who submitted the proposal
      if (payload.userType === "tender" && project.tenderId !== payload.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
      if (payload.userType === "bidder" && bid.bidderId !== payload.userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Construct file path
    const filepath = join(process.cwd(), "uploads", type, entityId, filename)
    
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read and return file
    const fileBuffer = await readFile(filepath)
    
    // Determine content type based on file extension
    const getContentType = (filename: string) => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'pdf': return 'application/pdf'
        case 'doc': return 'application/msword'
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        case 'xls': return 'application/vnd.ms-excel'
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        case 'jpg':
        case 'jpeg': return 'image/jpeg'
        case 'png': return 'image/png'
        default: return 'application/octet-stream'
      }
    }

    const contentType = getContentType(filename)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}