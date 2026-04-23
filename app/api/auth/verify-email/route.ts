export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { sendVerificationEmail } from '@/services/email';
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimiter';
import crypto from 'crypto';

/**
 * Send verification email
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Throttle to avoid mail-bombing
    const ip = getClientIP(request);
    const rl = rateLimit(`verify-email:${authUser.id}:${ip}`, RATE_LIMITS.auth);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many verification emails requested. Please wait a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 600) } }
      );
    }

    await connectDB();

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    const origin =
      process.env.NEXT_PUBLIC_URL || new URL(request.url).origin;
    const verifyUrl = `${origin}/verify-email?token=${verificationToken}`;
    const sent = await sendVerificationEmail(user.email, verifyUrl).catch((e: any) => {
      console.error('[verify-email] sendVerificationEmail failed:', e);
      return false;
    });

    if (!sent && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Could not send verification email. Try again shortly.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      ...(process.env.NODE_ENV === 'development' && { verificationToken, verifyUrl }),
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

/**
 * Verify email with token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
