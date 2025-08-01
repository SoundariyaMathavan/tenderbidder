import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0, verificationToken: 0, verificationExpires: 0 } }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate comprehensive verification report data
    const verificationStatus = user.verificationStatus || {}
    const documents = user.documents || {}
    
    const reportData = {
      company: {
        name: user.companyName,
        email: user.email,
        userType: user.userType,
        contactNumber: user.contactNumber,
        address: user.address,
        registeredAddress: user.registeredAddress,
        website: user.website,
        industry: user.industry,
        companySize: user.companySize,
        establishedYear: user.establishedYear,
        bio: user.bio,
        specializations: user.specializations || []
      },
      verification: {
        overall: verificationStatus.overall || 0,
        gst: {
          status: verificationStatus.gst || 'not_started',
          number: user.gstNumber,
          verifiedAt: user.verificationData?.gst?.verifiedAt
        },
        pan: {
          status: verificationStatus.pan || 'not_started',
          number: user.panNumber,
          verifiedAt: user.verificationData?.pan?.verifiedAt
        },
        cin: {
          status: verificationStatus.cin || 'not_started',
          number: user.cinNumber,
          verifiedAt: user.verificationData?.cin?.verifiedAt
        },
        bank: {
          status: verificationStatus.bank || 'not_started',
          bankName: user.bankName,
          ifsc: user.bankIFSC,
          verifiedAt: user.verificationData?.bank?.verifiedAt
        }
      },
      documents: {
        gstCertificate: !!documents.gstCertificate,
        panCard: !!documents.panCard,
        incorporationCertificate: !!documents.incorporationCertificate,
        bankStatement: !!documents.bankStatement,
        auditedFinancials: !!documents.auditedFinancials,
        totalUploaded: Object.keys(documents).filter(key => documents[key]).length
      },
      director: {
        name: user.directorName,
        pan: user.directorPAN
      },
      timestamps: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        reportGeneratedAt: new Date()
      },
      compliance: {
        level: getComplianceLevel(verificationStatus.overall || 0),
        score: verificationStatus.overall || 0,
        verifiedFields: Object.values(verificationStatus).filter(status => status === 'verified').length,
        totalFields: 4,
        pendingFields: Object.values(verificationStatus).filter(status => status === 'pending').length,
        failedFields: Object.values(verificationStatus).filter(status => status === 'failed').length
      }
    }

    // Check if PDF generation is requested
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    if (format === 'pdf') {
      // In a real implementation, you would use a PDF generation library like puppeteer or jsPDF
      // For now, we'll return JSON data that can be used to generate PDF on the client side
      return NextResponse.json({
        success: true,
        message: "PDF generation not implemented yet. Use client-side PDF generation.",
        data: reportData
      })
    }

    return NextResponse.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error("Verification report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getComplianceLevel(percentage: number): string {
  if (percentage >= 100) return "Fully Compliant"
  if (percentage >= 75) return "Highly Compliant"
  if (percentage >= 50) return "Moderately Compliant"
  return "Low Compliance"
}