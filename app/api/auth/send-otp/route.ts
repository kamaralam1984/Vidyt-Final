import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateOTP, getOTPExpiry } from '@/services/otp';
import { sendOTPEmail } from '@/services/email';
import { generateUniqueNumericId } from '@/lib/auth';
import { z } from 'zod';

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = sendOtpSchema.parse(body);
    const { email } = validated;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = getOTPExpiry();

    if (user) {
      // Update existing user's OTP
      user.emailOtp = otp;
      user.emailOtpExpires = otpExpires;
      await user.save();
    } else {
      // Create temporary user record for OTP (will be finalized after OTP verification)
      const tempUser = new User({
        uniqueId: await generateUniqueNumericId(),
        email: email.toLowerCase(),
        name: '', // Will be set during signup
        password: '', // Will be set during signup
        emailOtp: otp,
        emailOtpExpires: otpExpires,
        emailVerified: false,
      });
      await tempUser.save();
    }

    // Send OTP email (best-effort, don't hard fail signup on email issues in non-production)
    const emailSent = await sendOTPEmail(email, otp, user?.name);

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
