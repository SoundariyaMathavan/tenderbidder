# TenderChain Company Verification System - Setup Guide

This guide will help you set up and configure the comprehensive company verification system for the TenderChain platform.

## Prerequisites

- Node.js 20.x or higher
- MongoDB 5.0 or higher
- npm or yarn package manager
- Government API access keys (for production)

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd tender-19-main/tender-19-main/tenderbidder-main/tenderbidder-main/tenderbidder-master

# Install dependencies
npm install

# Install additional dependencies for file upload
npm install formidable @types/formidable
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit the environment file
nano .env.local
```

Configure the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/tenderbidder

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Government API Configuration
GST_API_BASE=https://api.gst.gov.in
GST_API_KEY=your-gst-api-key
PAN_API_BASE=https://api.pan.gov.in
PAN_API_KEY=your-pan-api-key
CIN_API_BASE=https://api.mca.gov.in
CIN_API_KEY=your-cin-api-key
GOVT_API_KEY=your-government-api-key

# File Upload Configuration
MAX_FILE_SIZE=20971520
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Start MongoDB service
sudo systemctl start mongod

# Create database and collections (optional - will be created automatically)
mongosh
use tenderbidder
db.createCollection("users")
db.createCollection("document_audit")
db.createCollection("admin_audit")
```

### 4. Create Upload Directories

```bash
# Create directories for file uploads
mkdir -p uploads/documents
chmod 755 uploads/documents
```

### 5. Government API Setup

#### For Development (Simulation Mode)
The system includes simulation mode for development. No API keys required.

#### For Production
1. **GST API**: Register at [GST Portal Developer Section](https://developer.gst.gov.in/)
2. **PAN API**: Contact NSDL or other authorized PAN verification providers
3. **CIN API**: Register with MCA (Ministry of Corporate Affairs) API services
4. **Bank Verification**: Use services like Razorpay, Cashfree, or direct bank APIs

### 6. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Configuration Options

### Verification Modes

The system supports three verification modes:

1. **Real-time**: Automatic verification as users enter data
2. **Batch**: Verify all fields at once
3. **Step-by-step**: Guided verification process

Configure default mode in the component or add to environment variables.

### File Upload Settings

```env
# Maximum file size (in bytes)
MAX_FILE_SIZE=20971520  # 20MB

# Allowed file types
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# Upload directory
UPLOAD_DIR=./uploads/documents
```

### Verification Weights

The system uses weighted scoring for overall verification percentage:
- GST: 30%
- PAN: 25%
- CIN: 25%
- Bank: 20%

Modify in `lib/verification-service.ts`:

```typescript
const weights = { gst: 30, pan: 25, cin: 25, bank: 20 }
```

## Testing

### 1. Test User Registration

```bash
# Create test users
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "password123",
    "companyName": "Test Company Ltd",
    "userType": "tender"
  }'
```

### 2. Test Verification APIs

```bash
# Test GST verification
curl -X POST http://localhost:3000/api/user/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "gst",
    "value": "22AAAAA0000A1Z5"
  }'
```

### 3. Test File Upload

Use the web interface or test with curl:

```bash
curl -X POST http://localhost:3000/api/user/upload-document \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "documentType=gstCertificate"
```

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment
NODE_ENV=production

# Use production database
MONGODB_URI=mongodb://your-production-db/tenderbidder

# Configure production API keys
GST_API_KEY=your-production-gst-key
PAN_API_KEY=your-production-pan-key
# ... other production keys
```

### 2. Security Considerations

- Use HTTPS in production
- Implement rate limiting
- Set up proper CORS policies
- Use secure JWT secrets
- Implement file upload security
- Set up proper database access controls

### 3. File Storage

For production, consider using cloud storage:

```typescript
// Example: AWS S3 integration
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})
```

### 4. Monitoring and Logging

Set up monitoring for:
- API response times
- Verification success rates
- File upload metrics
- Error rates
- Database performance

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **File Upload Permissions**
   ```bash
   # Fix upload directory permissions
   chmod -R 755 uploads/
   chown -R www-data:www-data uploads/
   ```

3. **API Verification Failures**
   - Check API keys and endpoints
   - Verify network connectivity
   - Check rate limits
   - Review API documentation

4. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper token format

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

### API Testing

Use the included Postman collection or create test scripts:

```javascript
// Test verification endpoint
const testVerification = async () => {
  const response = await fetch('/api/user/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'gst',
      value: '22AAAAA0000A1Z5'
    })
  })
  
  const result = await response.json()
  console.log('Verification result:', result)
}
```

## API Documentation

### Verification Endpoints

#### POST /api/user/verify
Single field verification

**Request:**
```json
{
  "type": "gst|pan|cin|bank",
  "value": "verification_value",
  "additionalData": { "ifsc": "IFSC_CODE" }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* verification data */ },
  "confidence": 95,
  "overallPercentage": 75
}
```

#### PUT /api/user/verify
Batch verification

**Request:**
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

#### POST /api/user/upload-document
Document upload

**Request:** Multipart form data
- `file`: Document file
- `documentType`: Type of document

**Response:**
```json
{
  "success": true,
  "documentUrl": "/uploads/documents/filename.pdf",
  "fileName": "original-name.pdf",
  "fileSize": 1024000
}
```

## Support

For technical support:
1. Check the troubleshooting section
2. Review API logs
3. Test with simulation mode
4. Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

**Note**: This setup guide assumes a Linux/Unix environment. For Windows, adjust commands accordingly and ensure proper path handling.