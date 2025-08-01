# Company Profile Verification System

This document outlines the comprehensive company-to-company verification system implemented in the TenderChain platform.

## Overview

The verification system ensures that all companies on the platform are legitimate businesses by verifying their credentials through government APIs and document validation.

## Features

### 1. Static Navigation
- Persistent navigation bar across all authenticated pages
- Context-aware navigation based on user type (tender/bidder)
- Clean, professional interface

### 2. Comprehensive Company Profile
The system captures and verifies the following company information:

#### Basic Information
- Company Name
- Contact Number
- Email Address
- Website
- Business Address
- Registered Address
- Industry
- Company Size
- Established Year

#### Legal & Registration Details
- **GST Number** - Goods and Services Tax registration
- **PAN Number** - Permanent Account Number
- **CIN Number** - Corporate Identification Number
- **Registration Number** - Company registration number
- **Director Information** - Name and PAN of directors

#### Banking Details
- Bank Account Number
- IFSC Code
- Bank Name

#### Additional Information
- Company Description
- Specializations
- Business certifications

### 3. Government API Integration

#### Supported Verifications
1. **GST Verification**
   - Validates GST number format
   - Verifies with GST portal
   - Retrieves company legal name, trade name, registration date, status

2. **PAN Verification**
   - Validates PAN format
   - Verifies with Income Tax portal
   - Confirms company name and status

3. **CIN Verification**
   - Validates CIN format
   - Verifies with MCA (Ministry of Corporate Affairs)
   - Retrieves incorporation details, capital information

4. **Bank Account Verification**
   - Validates IFSC code
   - Verifies account existence
   - Confirms bank and branch details

### 4. Verification Modes

#### Real-time Verification
- Automatic verification as user enters data
- Immediate feedback on field validity
- Best for user experience

#### Batch Verification
- Verify all fields at once
- Efficient for complete profile setup
- Reduces API calls

#### Step-by-step Verification
- Guided verification process
- User confirmation at each step
- Ideal for first-time setup

### 5. Verification Status Tracking

#### Status Indicators
- **Verified** ✅ - Successfully verified with government APIs
- **Failed** ❌ - Verification failed or invalid data
- **Pending** ⏳ - Verification in progress
- **Not Started** ⚪ - Not yet attempted

#### Overall Completion Percentage
- Weighted scoring system
- GST: 30%, PAN: 25%, CIN: 25%, Bank: 20%
- Visual progress indicators

### 6. Security Features

#### Data Protection
- Sensitive data encryption
- Secure API communication
- Audit trail for all verifications

#### Validation
- Format validation before API calls
- Rate limiting to prevent abuse
- Error handling and retry mechanisms

## Implementation Details

### File Structure
```
components/
├── navigation.tsx                 # Static navigation component
├── company-verification.tsx       # Main verification component
├── verification-status-card.tsx   # Status display component
└── auth-provider.tsx             # Updated with new user fields

lib/
└── verification-service.ts       # Government API integration

app/api/user/
├── profile/route.ts              # Updated profile API
└── verify/route.ts               # Verification API endpoints
```

### API Endpoints

#### POST /api/user/verify
Single field verification
```json
{
  "type": "gst|pan|cin|bank",
  "value": "verification_value",
  "additionalData": { "ifsc": "IFSC_CODE" }
}
```

#### PUT /api/user/verify
Batch verification
```json
{
  "verifications": [
    {
      "type": "gst",
      "value": "GST_NUMBER"
    },
    {
      "type": "bank",
      "value": "ACCOUNT_NUMBER",
      "additionalData": { "ifsc": "IFSC_CODE" }
    }
  ]
}
```

### Environment Variables
```env
# Government API Configuration
GST_API_BASE=https://api.gst.gov.in
PAN_API_BASE=https://api.pan.gov.in
CIN_API_BASE=https://api.mca.gov.in
GOVT_API_KEY=your-api-key
```

## Usage Guide

### For Developers

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Update with your API keys
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### For Users

1. **Access Profile Verification**
   - Navigate to Profile → Edit Profile
   - Or click "Complete Verification" from dashboard

2. **Choose Verification Mode**
   - Real-time: Automatic verification as you type
   - Batch: Verify all fields at once
   - Step-by-step: Guided process

3. **Complete Profile Information**
   - Fill in all required company details
   - Upload supporting documents
   - Verify credentials through government APIs

4. **Monitor Verification Status**
   - Check progress on dashboard
   - View detailed status for each field
   - Address any failed verifications

## Benefits

### For Companies
- **Trust Building** - Verified credentials increase credibility
- **Faster Onboarding** - Streamlined verification process
- **Compliance** - Ensures regulatory compliance
- **Transparency** - Clear verification status

### For Platform
- **Quality Control** - Only verified companies participate
- **Risk Mitigation** - Reduces fraudulent activities
- **Regulatory Compliance** - Meets industry standards
- **User Confidence** - Builds trust in the platform

## Technical Considerations

### Performance
- Asynchronous API calls
- Caching of verification results
- Rate limiting and retry logic
- Optimized database queries

### Scalability
- Microservice architecture ready
- Horizontal scaling support
- Load balancing considerations
- Database indexing for verification fields

### Monitoring
- API response time tracking
- Verification success rates
- Error logging and alerting
- User experience metrics

## Future Enhancements

1. **Document Upload & OCR**
   - Automatic data extraction from documents
   - Document authenticity verification
   - Digital signature validation

2. **Advanced Verification**
   - Credit score integration
   - Financial health assessment
   - Industry-specific certifications

3. **Blockchain Integration**
   - Immutable verification records
   - Smart contract automation
   - Decentralized verification network

4. **AI-Powered Validation**
   - Anomaly detection
   - Risk scoring algorithms
   - Predictive compliance monitoring

## Support

For technical support or questions about the verification system:
- Check the API documentation
- Review error logs for troubleshooting
- Contact the development team

## Compliance

This system is designed to comply with:
- Indian regulatory requirements
- Data protection laws
- Industry best practices
- Government API guidelines