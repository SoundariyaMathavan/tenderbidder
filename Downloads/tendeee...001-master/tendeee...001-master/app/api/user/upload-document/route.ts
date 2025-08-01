import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import formidable from "formidable"
import fs from "fs"
import path from "path"

// Configure formidable
const form = formidable({
  maxFileSize: 20 * 1024 * 1024, // 20MB
  keepExtensions: true,
  uploadDir: './uploads/documents',
})

// Ensure upload directory exists
const uploadDir = './uploads/documents'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 })
    }

    // Validate document type
    const allowedTypes = ['gstCertificate', 'panCard', 'incorporationCertificate', 'bankStatement', 'auditedFinancials']
    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    // Validate file type
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}` 
      }, { status: 400 })
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 20MB allowed" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFilename = `${decoded.userId}_${documentType}_${timestamp}.${fileExtension}`
    const filePath = path.join(uploadDir, uniqueFilename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)

    // Generate file URL (in production, this would be a cloud storage URL)
    const fileUrl = `/uploads/documents/${uniqueFilename}`

    // Update user document in database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const updateData = {
      [`documents.${documentType}`]: fileUrl,
      updatedAt: new Date()
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      // Clean up uploaded file if user not found
      fs.unlinkSync(filePath)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log document upload for audit trail
    const auditCollection = db.collection("document_audit")
    await auditCollection.insertOne({
      userId: decoded.userId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      filePath: fileUrl,
      uploadedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      documentUrl: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      documentType
    })

  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get current document URL
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const documentUrl = user.documents?.[documentType]
    if (!documentUrl) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Remove document from database
    const updateData = {
      [`documents.${documentType}`]: null,
      updatedAt: new Date()
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $unset: { [`documents.${documentType}`]: "" } }
    )

    // Delete physical file
    try {
      const filePath = path.join('.', documentUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (fileError) {
      console.error("Error deleting file:", fileError)
      // Continue even if file deletion fails
    }

    // Log document deletion for audit trail
    const auditCollection = db.collection("document_audit")
    await auditCollection.insertOne({
      userId: decoded.userId,
      documentType,
      action: 'deleted',
      filePath: documentUrl,
      deletedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully"
    })

  } catch (error) {
    console.error("Document deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}