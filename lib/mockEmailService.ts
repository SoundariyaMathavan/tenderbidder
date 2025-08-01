export async function mockSendVerificationEmail(email: string, token: string, companyName: string) {
  console.log(`Mock: Sending verification email to ${email}`);
  console.log(`Mock: Verification URL: http://localhost:3000/auth/verify-email?token=${token}`);
  console.log(`Mock: Company Name: ${companyName}`);
  return { success: true, messageId: 'mock-message-id' };
}

export async function mockSendConfirmationEmail(email: string, companyName: string) {
  console.log(`Mock: Sending confirmation email to ${email}`);
  console.log(`Mock: Company Name: ${companyName}`);
  return { success: true, messageId: 'mock-message-id' };
}