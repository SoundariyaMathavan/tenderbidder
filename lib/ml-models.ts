// Machine Learning Models for Tender Platform

export interface BidData {
  bidAmount: number
  timeline: string
  companyExperience: number
  teamSize: number
  pastProjects: number
  rating: number
  compliance: number
  completeness: number
  technicalScore: number
  documents: string[]
  specializations: string[]
}

export interface MLPrediction {
  score: number
  confidence: number
  riskLevel: "low" | "medium" | "high"
  recommendations: string[]
}

export interface DocumentAnalysis {
  compliance: number
  completeness: number
  quality: number
  missingDocuments: string[]
  issues: string[]
}

// Bid Scoring Model
export class BidScoringModel {
  private weights = {
    price: 0.25,
    experience: 0.2,
    technical: 0.2,
    compliance: 0.15,
    timeline: 0.1,
    rating: 0.1,
  }

  async scoreBid(bidData: BidData, tenderBudget: number): Promise<MLPrediction> {
    // Price score (inverse relationship - lower price = higher score)
    const priceScore = Math.max(0, 100 - (bidData.bidAmount / tenderBudget) * 100)

    // Experience score
    const experienceScore = Math.min(100, (bidData.companyExperience / 20) * 100)

    // Technical score based on approach and team
    const technicalScore = bidData.technicalScore || this.calculateTechnicalScore(bidData)

    // Compliance score
    const complianceScore = bidData.compliance

    // Timeline score (reasonable timeline gets higher score)
    const timelineScore = this.calculateTimelineScore(bidData.timeline)

    // Rating score
    const ratingScore = (bidData.rating / 5) * 100

    // Calculate weighted score
    const finalScore = Math.round(
      priceScore * this.weights.price +
        experienceScore * this.weights.experience +
        technicalScore * this.weights.technical +
        complianceScore * this.weights.compliance +
        timelineScore * this.weights.timeline +
        ratingScore * this.weights.rating,
    )

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(bidData)

    // Determine risk level
    const riskLevel = this.assessRisk(bidData, finalScore)

    // Generate recommendations
    const recommendations = this.generateRecommendations(bidData, finalScore)

    return {
      score: finalScore,
      confidence,
      riskLevel,
      recommendations,
    }
  }

  private calculateTechnicalScore(bidData: BidData): number {
    let score = 50 // Base score

    // Team size factor
    if (bidData.teamSize > 20) score += 20
    else if (bidData.teamSize > 10) score += 10

    // Past projects factor
    if (bidData.pastProjects > 30) score += 20
    else if (bidData.pastProjects > 15) score += 10

    // Specializations match
    score += Math.min(20, bidData.specializations.length * 5)

    return Math.min(100, score)
  }

  private calculateTimelineScore(timeline: string): number {
    const months = this.parseTimelineToMonths(timeline)
    if (months >= 12 && months <= 24) return 100
    if (months >= 6 && months < 12) return 80
    if (months >= 24 && months <= 36) return 70
    return 50
  }

  private parseTimelineToMonths(timeline: string): number {
    const match = timeline.match(/(\d+)\s*(month|year)/i)
    if (!match) return 12

    const value = Number.parseInt(match[1])
    const unit = match[2].toLowerCase()

    return unit.startsWith("year") ? value * 12 : value
  }

  private calculateConfidence(bidData: BidData): number {
    let confidence = 0

    if (bidData.bidAmount > 0) confidence += 20
    if (bidData.companyExperience > 0) confidence += 20
    if (bidData.pastProjects > 0) confidence += 20
    if (bidData.documents.length > 0) confidence += 20
    if (bidData.compliance > 80) confidence += 20

    return confidence
  }

  private assessRisk(bidData: BidData, score: number): "low" | "medium" | "high" {
    if (score >= 80 && bidData.rating >= 4.0 && bidData.companyExperience >= 5) {
      return "low"
    } else if (score >= 60 && bidData.rating >= 3.5) {
      return "medium"
    }
    return "high"
  }

  private generateRecommendations(bidData: BidData, score: number): string[] {
    const recommendations: string[] = []

    if (score < 70) {
      recommendations.push("Consider requesting additional documentation")
    }

    if (bidData.compliance < 90) {
      recommendations.push("Review compliance requirements with bidder")
    }

    if (bidData.companyExperience < 5) {
      recommendations.push("Assess risk due to limited experience")
    }

    if (bidData.rating < 4.0) {
      recommendations.push("Check references and past project reviews")
    }

    if (score >= 85) {
      recommendations.push("Strong candidate - consider for shortlist")
    }

    return recommendations
  }
}

// Document Analysis Model
export class DocumentAnalysisModel {
  private requiredDocuments = [
    "company_registration",
    "tax_certificate",
    "insurance_certificate",
    "technical_proposal",
    "financial_proposal",
    "experience_certificate",
    "safety_certificate",
  ]

  async analyzeDocuments(documents: string[]): Promise<DocumentAnalysis> {
    const compliance = this.calculateCompliance(documents)
    const completeness = this.calculateCompleteness(documents)
    const quality = this.assessQuality(documents)
    const missingDocuments = this.findMissingDocuments(documents)
    const issues = this.identifyIssues(documents)

    return {
      compliance,
      completeness,
      quality,
      missingDocuments,
      issues,
    }
  }

  private calculateCompliance(documents: string[]): number {
    const requiredFound = this.requiredDocuments.filter((req) =>
      documents.some((doc) => doc.toLowerCase().includes(req)),
    ).length

    return Math.round((requiredFound / this.requiredDocuments.length) * 100)
  }

  private calculateCompleteness(documents: string[]): number {
    let score = 0
    const totalPossible = 100

    // Basic documents (60 points)
    const basicDocs = ["registration", "tax", "insurance", "proposal"]
    const basicFound = basicDocs.filter((doc) => documents.some((d) => d.toLowerCase().includes(doc))).length
    score += (basicFound / basicDocs.length) * 60

    // Additional documents (40 points)
    const additionalDocs = ["experience", "safety", "quality", "reference"]
    const additionalFound = additionalDocs.filter((doc) => documents.some((d) => d.toLowerCase().includes(doc))).length
    score += (additionalFound / additionalDocs.length) * 40

    return Math.round(score)
  }

  private assessQuality(documents: string[]): number {
    // Simulate quality assessment based on document types and naming
    let qualityScore = 70 // Base score

    // Professional naming convention
    const wellNamed = documents.filter((doc) => doc.includes("_") || doc.includes("-") || /\d{4}/.test(doc)).length
    qualityScore += (wellNamed / documents.length) * 20

    // Document variety
    const uniqueTypes = new Set(documents.map((doc) => doc.split("_")[0] || doc.split(".")[0])).size
    qualityScore += Math.min(10, uniqueTypes * 2)

    return Math.min(100, Math.round(qualityScore))
  }

  private findMissingDocuments(documents: string[]): string[] {
    return this.requiredDocuments
      .filter((req) => !documents.some((doc) => doc.toLowerCase().includes(req)))
      .map((doc) => doc.replace("_", " ").toUpperCase())
  }

  private identifyIssues(documents: string[]): string[] {
    const issues: string[] = []

    if (documents.length < 5) {
      issues.push("Insufficient number of documents submitted")
    }

    if (!documents.some((doc) => doc.toLowerCase().includes("proposal"))) {
      issues.push("Technical or financial proposal missing")
    }

    if (!documents.some((doc) => doc.toLowerCase().includes("registration"))) {
      issues.push("Company registration certificate missing")
    }

    const duplicates = documents.filter((doc, index) => documents.indexOf(doc) !== index)
    if (duplicates.length > 0) {
      issues.push("Duplicate documents detected")
    }

    return issues
  }
}

// Risk Assessment Model
export class RiskAssessmentModel {
  async assessBidderRisk(bidData: BidData): Promise<{
    overallRisk: "low" | "medium" | "high"
    riskFactors: string[]
    riskScore: number
    mitigation: string[]
  }> {
    const riskFactors: string[] = []
    let riskScore = 0

    // Financial risk
    if (bidData.bidAmount < 1000000) riskScore += 10
    else if (bidData.bidAmount > 10000000) riskScore += 20

    // Experience risk
    if (bidData.companyExperience < 3) {
      riskScore += 30
      riskFactors.push("Limited company experience")
    }

    // Performance risk
    if (bidData.rating < 3.5) {
      riskScore += 25
      riskFactors.push("Below average performance rating")
    }

    // Capacity risk
    if (bidData.teamSize < 10) {
      riskScore += 15
      riskFactors.push("Small team size for project scale")
    }

    // Compliance risk
    if (bidData.compliance < 80) {
      riskScore += 20
      riskFactors.push("Compliance documentation incomplete")
    }

    const overallRisk = riskScore < 30 ? "low" : riskScore < 60 ? "medium" : "high"
    const mitigation = this.generateMitigation(riskFactors, overallRisk)

    return {
      overallRisk,
      riskFactors,
      riskScore,
      mitigation,
    }
  }

  private generateMitigation(riskFactors: string[], riskLevel: string): string[] {
    const mitigation: string[] = []

    if (riskFactors.includes("Limited company experience")) {
      mitigation.push("Require additional insurance coverage")
      mitigation.push("Request detailed project references")
    }

    if (riskFactors.includes("Below average performance rating")) {
      mitigation.push("Implement enhanced monitoring")
      mitigation.push("Require performance bonds")
    }

    if (riskFactors.includes("Small team size for project scale")) {
      mitigation.push("Verify subcontractor arrangements")
      mitigation.push("Request resource scaling plan")
    }

    if (riskLevel === "high") {
      mitigation.push("Consider requiring parent company guarantee")
      mitigation.push("Implement milestone-based payments")
    }

    return mitigation
  }
}

// ML Service Integration
export class MLService {
  private bidScoringModel: BidScoringModel
  private documentAnalysisModel: DocumentAnalysisModel
  private riskAssessmentModel: RiskAssessmentModel

  constructor() {
    this.bidScoringModel = new BidScoringModel()
    this.documentAnalysisModel = new DocumentAnalysisModel()
    this.riskAssessmentModel = new RiskAssessmentModel()
  }

  async analyzeBid(bidData: BidData, tenderBudget: number) {
    const [scoring, documentAnalysis, riskAssessment] = await Promise.all([
      this.bidScoringModel.scoreBid(bidData, tenderBudget),
      this.documentAnalysisModel.analyzeDocuments(bidData.documents),
      this.riskAssessmentModel.assessBidderRisk(bidData),
    ])

    return {
      scoring,
      documentAnalysis,
      riskAssessment,
      timestamp: new Date().toISOString(),
    }
  }
}
