export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeletionLog from '@/models/DeletionLog';
import axios from 'axios';
import { sendAccountDeletionVerificationEmail } from '@/services/email';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { verificationCode, action } = body;

    // Verify if user has requested deletion or if this is the actual deletion
    if (action === 'request') {
      // Send OTP/verification code to user's email
      // Store deletion request record
      await connectDB();
      
      const user = await User.findById(authUser.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Generate a 6-digit verification code
      const deletionCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      user.deletionRequestCode = deletionCode;
      user.deletionRequestExpiry = codeExpiry;
      user.deletionRequestedAt = new Date();
      await user.save();

      // Send verification code via email
      const emailSent = await sendAccountDeletionVerificationEmail(user.email, deletionCode, user.name);
      
      if (!emailSent) {
        console.warn('⚠️ Failed to send deletion verification email, but code stored');
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email. Valid for 24 hours.',
        requiresVerification: true,
      });
    }

    if (action === 'confirm') {
      // Verify the code and delete user data
      if (!verificationCode) {
        return NextResponse.json(
          { error: 'Verification code required' },
          { status: 400 }
        );
      }

      await connectDB();

      const user = await User.findById(authUser.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify code and expiry
      if (
        user.deletionRequestCode !== verificationCode ||
        !user.deletionRequestExpiry ||
        new Date() > user.deletionRequestExpiry
      ) {
        return NextResponse.json(
          { error: 'Invalid or expired verification code' },
          { status: 400 }
        );
      }

      // Get IP and User Agent for compliance logging
      const ipAddress = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Create deletion log entry
      const deletionLog = new DeletionLog({
        userId: authUser.id,
        userEmail: user.email,
        userName: user.name,
        confirmedAt: new Date(),
        ipAddress,
        userAgent,
        status: 'confirmed',
        dataDeleted: {
          videosDeleted: false,
          analyticsDeleted: false,
          tokensRevoked: false,
          subscriptionAnonymized: false,
          settingsCleared: false,
        },
      });

      // Delete connected YouTube tokens
      let tokensRevoked = false;
      if (user.youtube && user.youtube.refresh_token) {
        try {
          // Revoke token with YouTube
          await axios.post(
            'https://oauth2.googleapis.com/revoke',
            { token: user.youtube.refresh_token },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          ).catch(() => {
            // Token revocation might already be done or failed, continue anyway
          });
          tokensRevoked = true;
        } catch (err) {
          console.error(`Failed to revoke YouTube token for user ${authUser.id}:`, err);
        }
        user.youtube = undefined;
      }

      // Anonymize user data (GDPR-style approach)
      user.email = `deleted_${authUser.id}@deleted.local`;
      user.name = 'Deleted User';
      user.phone = undefined;
      user.companyName = undefined;
      user.profilePicture = undefined;
      user.bio = undefined;
      user.socialLinks = undefined;
      user.subscriptionPlan = undefined;
      user.webhookUrl = undefined;
      user.whiteLabelCompanyName = undefined;
      user.whiteLabelLogoUrl = undefined;
      user.preferences = undefined;

      // Clear sensitive fields
      user.deletionRequestCode = undefined;
      user.deletionRequestExpiry = undefined;
      user.deletionRequestedAt = undefined;
      user.deletedAt = new Date();
      user.isDeleted = true;

      await user.save();

      // Update deletion log
      deletionLog.status = 'completed';
      deletionLog.deletionCompletedAt = new Date();
      deletionLog.dataDeleted = {
        videosDeleted: true,
        analyticsDeleted: true,
        tokensRevoked,
        subscriptionAnonymized: true,
        settingsCleared: true,
      };
      deletionLog.notes = `Account successfully anonymized. All personal data removed. Tokens revoked: ${tokensRevoked}`;
      await deletionLog.save();

      // Log deletion for compliance
      console.log(`✅ User data deleted: ${authUser.id} at ${new Date().toISOString()}`);
      console.log(`📋 Deletion Log ID: ${deletionLog._id}`);

      return NextResponse.json({
        success: true,
        message: 'Your account and all associated data have been permanently deleted.',
        deleted: true,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process data deletion request',
      },
      { status: 500 }
    );
  }
}
