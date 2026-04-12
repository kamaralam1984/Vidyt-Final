/**
 * OTP Service
 * Handles OTP generation and verification for email verification
 */

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify OTP
 */
export function verifyOTP(userOtp: string, storedOtp: string | undefined, expiresAt: Date | undefined): boolean {
  if (!storedOtp || !expiresAt) {
    return false;
  }

  if (new Date() > expiresAt) {
    return false; // OTP expired
  }

  return userOtp === storedOtp;
}

/**
 * OTP expires in 10 minutes
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}
