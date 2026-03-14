import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/services/email';

/**
 * Request password reset
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    
    // Always return success (security best practice - don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl, user.name);
    
    // In development, also log the URL
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password Reset Link Generated:');
      console.log('   Email:', user.email);
      console.log('   Reset URL:', resetUrl);
      console.log('   Email Sent:', emailSent ? 'Yes' : 'No (check SMTP config)');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
      // In development, return the reset URL for testing
      ...(process.env.NODE_ENV === 'development' && { 
        resetUrl,
        emailSent,
        note: emailSent ? 'Email sent successfully' : 'Email not configured - check console for reset link'
      }),
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process password reset request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Reset password with token (from email link)
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new password reset.' },
        { status: 400 }
      );
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error: any) {
    console.error('Password reset (PUT) error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset password. The link may have expired.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
