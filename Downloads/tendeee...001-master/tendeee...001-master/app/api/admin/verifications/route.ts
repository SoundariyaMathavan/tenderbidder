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

    // Check if user is admin (you might want to add an isAdmin field to user schema)
    const db = await getDatabase()
    const usersCollection = db.collection("users")
    
    const adminUser = await usersCollection.findOne({ _id: decoded.userId })
    if (!adminUser || adminUser.userType !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch all companies with their verification status
    const companies = await usersCollection.find(
      { userType: { $in: ['tender', 'bidder'] } },
      {
        projection: {
          password: 0,
          verificationToken: 0,
          verificationExpires: 0
        }
      }
    ).sort({ createdAt: -1 }).toArray()

    // Calculate statistics
    const stats = {
      totalCompanies: companies.length,
      fullyVerified: 0,
      partiallyVerified: 0,
      unverified: 0,
      pendingReview: 0
    }

    companies.forEach(company => {
      const overall = company.verificationStatus?.overall || 0
      const hasPending = Object.values(company.verificationStatus || {}).includes('pending')
      
      if (overall >= 100) {
        stats.fullyVerified++
      } else if (overall > 0) {
        stats.partiallyVerified++
      } else {
        stats.unverified++
      }
      
      if (hasPending) {
        stats.pendingReview++
      }
    })

    return NextResponse.json({
      companies: companies.map(company => ({
        _id: company._id,
        companyName: company.companyName,
        email: company.email,
        userType: company.userType,
        verificationStatus: company.verificationStatus || {},
        documents: company.documents || {},
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        industry: company.industry,
        companySize: company.companySize,
        gstNumber: company.gstNumber,
        panNumber: company.panNumber,
        cinNumber: company.cinNumber,
        bankAccountNumber: company.bankAccountNumber ? 
          company.bankAccountNumber.replace(/\d(?=\d{4})/g, '*') : undefined
      })),
      stats
    })

  } catch (error) {
    console.error("Admin verifications fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}