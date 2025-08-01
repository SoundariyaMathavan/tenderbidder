import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 30000, // 30 seconds timeout
  debug: true,
  logger: true // Enable logging
})

export async function sendVerificationEmail(email: string, token: string, companyName: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${token}`

  console.log("📧 Attempting to send verification email to:", email)
  console.log("🔗 Verification URL:", verificationUrl)
  console.log("⚙️ SMTP Config:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER ? "***configured***" : "NOT SET",
    from: process.env.SMTP_FROM
  })

  // Test SMTP connection first
  const connectionSuccessful = await testSMTPConnection()
  if (!connectionSuccessful) {
    throw new Error("SMTP connection failed")
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - TenderChain</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="color: #2563eb; margin: 0;">TenderChain</h1>
          <p style="color: #666; margin: 5px 0;">Blockchain-Enabled Tender Platform</p>
        </div>
        
        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${companyName}</strong>,
          </p>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Please verify your email address by clicking the button below. This link will expire in 24 hours.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you didn't request this email, please ignore it or contact our support team if you have any concerns.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            © 2024 TenderChain. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify Your Email - TenderChain",
    html: htmlContent,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Verification email sent successfully:", info.response)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error("❌ Error sending verification email:", err)
    throw err // Re-throw to let the calling function handle it
  }
}

export async function sendConfirmationEmail(email: string, companyName: string) {
  console.log("📧 Sending confirmation email to:", email)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verified - TenderChain</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="color: #2563eb; margin: 0;">TenderChain</h1>
          <p style="color: #666; margin: 5px 0;">Blockchain-Enabled Tender Platform</p>
        </div>
        
        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">🎉 Email Verified Successfully!</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${companyName}</strong>,
          </p>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Congratulations! Your email address has been successfully verified. You can now access all features of the TenderChain platform.
          </p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">What's Next?</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>Complete your company profile</li>
              <li>Browse available tenders</li>
              <li>Submit your first bid</li>
              <li>Set up notification preferences</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/auth/signin" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Sign In to Your Account
            </a>
          </div>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            © 2024 TenderChain. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "🎉 Email Verified Successfully - Welcome to TenderChain!",
    html: htmlContent,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Confirmation email sent successfully:", info.response)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error("❌ Error sending confirmation email:", err)
    throw err
  }
}

// Generic email sending function
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  console.log("📧 Sending email to:", options.to)
  console.log("📧 Subject:", options.subject)

  // Test SMTP connection first
  const connectionSuccessful = await testSMTPConnection()
  if (!connectionSuccessful) {
    throw new Error("SMTP connection failed")
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: options.from || process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Email sent successfully:", info.response)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error("❌ Error sending email:", err)
    throw err
  }
}

async function testSMTPConnection() {
  try {
    await transporter.verify()
    console.log("✅ SMTP connection verified successfully")
    return true
  } catch (error) {
    console.error("❌ SMTP connection test failed:", error)
    return false
  }
}