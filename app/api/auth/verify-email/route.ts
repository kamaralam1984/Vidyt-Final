export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
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

    // TODO: Send verification email
    // const verifyUrl = `${process.env.NEXT_PUBLIC_URL}/verify-email?token=${verificationToken}`;
    // await sendVerificationEmail(user.email, verifyUrl);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      // In development, return token for testing
      ...(process.env.NODE_ENV === 'development' && { verificationToken }),
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
