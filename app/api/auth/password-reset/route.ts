export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetOTP } from '@/services/email';
import { getClientIP, rateLimit, isIPBlocked, RATE_LIMITS } from '@/lib/rateLimiter';

/**
 * Request password reset
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  if (isIPBlocked(ip)) {
    return NextResponse.json({ success: false, message: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const rl = rateLimit(`pwd-reset:${ip}`, RATE_LIMITS.passwordReset);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many reset requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 3600) } }
    );
  }

  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    console.log("OTP request for:", email);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success (security best practice) or explicit not found if preferred by user
    // The user's snippet returns 404 for 'User not found', so I'll follow that.
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found with this email' },
        { status: 404 }
      );
    }

    // Generate reset OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (user requested 5 min)

    // Save OTP to user (bypassing full validation to handle legacy data issues)
    await User.updateOne(
      { _id: user._id },
      { 
        passwordResetToken: otp,
        passwordResetExpires: otpExpiry
      }
    );

    // Send password reset OTP email
    try {
      const emailSent = await sendPasswordResetOTP(user.email, otp, user.name);
      if (!emailSent) throw new Error('SMTP/Resend failed');
    } catch (emailError) {
      console.error("Email Error:", emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email. Please check your SMTP configuration.' },
        { status: 500 }
      );
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ OTP Code sent for', user.email);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    console.error('OTP API ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find user by email and verify OTP
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: otp, // OTP is stored in passwordResetToken
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update password and clear OTP (bypassing full validation to handle legacy data issues)
    const hashedPassword = await hashPassword(newPassword);
    await User.updateOne(
      { _id: user._id },
      { 
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error: any) {
    console.error('Password reset (PUT) error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to reset password. Please try again.',
      },
      { status: 500 }
    );
  }
}
