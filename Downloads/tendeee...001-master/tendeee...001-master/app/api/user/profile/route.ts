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
      { projection: { password: 0, verificationToken: 0, verificationExpires: 0 } },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      companyName, 
      contactNumber, 
      phone,
      address, 
      registeredAddress,
      bio, 
      description,
      website, 
      specializations,
      contactPerson,
      businessRegistration,
      industry,
      companySize,
      establishedYear,
      // Legal details
      gstNumber,
      panNumber,
      cinNumber,
      registrationNumber,
      // Banking details
      bankAccountNumber,
      bankIFSC,
      bankName,
      // Director information
      directorName,
      directorPAN,
      // Verification status and data
      verificationStatus,
      verificationData,
      verificationErrors,
      documents
    } = body

    // Validate required fields
    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Update user profile - support both old and new field names
    const updateData: any = {
      companyName,
      contactNumber: contactNumber || phone || "",
      phone: phone || contactNumber || "",
      address: address || "",
      registeredAddress: registeredAddress || "",
      bio: bio || description || "",
      description: description || bio || "",
      website: website || "",
      specializations: specializations || [],
      contactPerson: contactPerson || "",
      businessRegistration: businessRegistration || "",
      industry: industry || "",
      companySize: companySize || "",
      establishedYear: establishedYear || "",
      // Legal details
      gstNumber: gstNumber || "",
      panNumber: panNumber || "",
      cinNumber: cinNumber || "",
      registrationNumber: registrationNumber || "",
      // Banking details
      bankAccountNumber: bankAccountNumber || "",
      bankIFSC: bankIFSC || "",
      bankName: bankName || "",
      // Director information
      directorName: directorName || "",
      directorPAN: directorPAN || "",
      updatedAt: new Date(),
    }

    // Only update verification fields if provided
    if (verificationStatus) {
      updateData.verificationStatus = verificationStatus
    }
    if (verificationData) {
      updateData.verificationData = verificationData
    }
    if (verificationErrors) {
      updateData.verificationErrors = verificationErrors
    }
    if (documents) {
      updateData.documents = documents
    }

    const result = await usersCollection.updateOne({ _id: new ObjectId(decoded.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0, verificationToken: 0, verificationExpires: 0 } },
    )

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
