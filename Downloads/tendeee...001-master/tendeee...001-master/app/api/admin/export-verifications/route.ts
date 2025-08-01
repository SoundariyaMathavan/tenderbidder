import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

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
    
    // Check if user is admin
    const adminUser = await usersCollection.findOne({ _id: decoded.userId })
    if (!adminUser || adminUser.userType !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch all companies with verification data
    const companies = await usersCollection.find(
      { userType: { $in: ['tender', 'bidder'] } },
      {
        projection: {
          password: 0,
          verificationToken: 0,
          verificationExpires: 0
        }
      }
    ).sort({ companyName: 1 }).toArray()

    // Generate CSV content
    const csvHeaders = [
      'Company Name',
      'Email',
      'User Type',
      'Industry',
      'Company Size',
      'GST Number',
      'GST Status',
      'PAN Number',
      'PAN Status',
      'CIN Number',
      'CIN Status',
      'Bank Status',
      'Overall Percentage',
      'Documents Uploaded',
      'Created Date',
      'Last Updated'
    ].join(',')

    const csvRows = companies.map(company => {
      const verificationStatus = company.verificationStatus || {}
      const documents = company.documents || {}
      const documentCount = Object.keys(documents).filter(key => documents[key]).length

      return [
        `"${company.companyName || ''}"`,
        `"${company.email || ''}"`,
        `"${company.userType || ''}"`,
        `"${company.industry || ''}"`,
        `"${company.companySize || ''}"`,
        `"${company.gstNumber || ''}"`,
        `"${verificationStatus.gst || 'Not Started'}"`,
        `"${company.panNumber || ''}"`,
        `"${verificationStatus.pan || 'Not Started'}"`,
        `"${company.cinNumber || ''}"`,
        `"${verificationStatus.cin || 'Not Started'}"`,
        `"${verificationStatus.bank || 'Not Started'}"`,
        `"${verificationStatus.overall || 0}%"`,
        `"${documentCount}"`,
        `"${company.createdAt ? new Date(company.createdAt).toLocaleDateString() : ''}"`,
        `"${company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : ''}"`
      ].join(',')
    })

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    // Log export action for audit trail
    const auditCollection = db.collection("admin_audit")
    await auditCollection.insertOne({
      adminId: decoded.userId,
      adminEmail: adminUser.email,
      action: 'export_verifications',
      exportedCount: companies.length,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="verification-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error("Admin export verifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}