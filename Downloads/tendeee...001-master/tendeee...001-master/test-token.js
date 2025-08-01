// Test script to debug JWT token generation and verification
// Run with: node test-token.js

require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

console.log('🔑 JWT_SECRET configured:', !!JWT_SECRET);
console.log('🔑 JWT_SECRET length:', JWT_SECRET?.length || 0);

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not configured!');
  process.exit(1);
}

// Test token generation
console.log('\n📝 Testing token generation...');
const testToken = jwt.sign({ purpose: "email-verification" }, JWT_SECRET, { expiresIn: "24h" });
console.log('✅ Generated token:', testToken.substring(0, 50) + '...');

// Test token verification
console.log('\n🔍 Testing token verification...');
try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('✅ Token verified successfully:', decoded);
  console.log('✅ Purpose check:', decoded.purpose === "email-verification");
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}

// Test with expired token
console.log('\n⏰ Testing expired token...');
const expiredToken = jwt.sign({ purpose: "email-verification" }, JWT_SECRET, { expiresIn: "1ms" });
setTimeout(() => {
  try {
    const decoded = jwt.verify(expiredToken, JWT_SECRET);
    console.log('⚠️ Expired token still valid (unexpected):', decoded);
  } catch (error) {
    console.log('✅ Expired token correctly rejected:', error.message);
  }
}, 10);

// Test the actual verification function
console.log('\n🧪 Testing verifyEmailToken function...');
function verifyEmailToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.purpose === "email-verification";
  } catch {
    return false;
  }
}

console.log('✅ Fresh token verification:', verifyEmailToken(testToken));
console.log('❌ Invalid token verification:', verifyEmailToken('invalid.token.here'));