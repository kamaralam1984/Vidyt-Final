import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { sanitizeInput, isValidEmail } from '@/lib/security';
import connectDB from '@/lib/mongodb';

/**
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(authUser.id).select('-password -twoFactorSecret -emailVerificationToken -passwordResetToken');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
        profilePicture: user.profilePicture,
        bio: user.bio,
        socialLinks: user.socialLinks,
        preferences: user.preferences,
        usageStats: user.usageStats,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        accountManagerEmail: user.accountManagerEmail,
        whiteLabelCompanyName: user.whiteLabelCompanyName,
        whiteLabelLogoUrl: user.whiteLabelLogoUrl,
        webhookUrl: user.webhookUrl,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    await connectDB();

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.name) {
      user.name = sanitizeInput(body.name);
    }
    if (body.bio !== undefined) {
      user.bio = sanitizeInput(body.bio);
    }
    if (body.profilePicture) {
      user.profilePicture = body.profilePicture;
    }
    if (body.socialLinks) {
      user.socialLinks = {
        youtube: body.socialLinks.youtube || user.socialLinks?.youtube,
        facebook: body.socialLinks.facebook || user.socialLinks?.facebook,
        instagram: body.socialLinks.instagram || user.socialLinks?.instagram,
        tiktok: body.socialLinks.tiktok || user.socialLinks?.tiktok,
      };
    }
    if (body.preferences) {
      user.preferences = {
        notifications: body.preferences.notifications ?? user.preferences?.notifications ?? true,
        emailUpdates: body.preferences.emailUpdates ?? user.preferences?.emailUpdates ?? true,
        darkMode: body.preferences.darkMode ?? user.preferences?.darkMode ?? false,
      };
    }
    if (body.whiteLabelCompanyName !== undefined) user.whiteLabelCompanyName = body.whiteLabelCompanyName ? sanitizeInput(body.whiteLabelCompanyName) : undefined;
    if (body.whiteLabelLogoUrl !== undefined) user.whiteLabelLogoUrl = body.whiteLabelLogoUrl || undefined;
    if (body.webhookUrl !== undefined) user.webhookUrl = body.webhookUrl && body.webhookUrl.startsWith('http') ? body.webhookUrl : undefined;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: user._id.toString(),
        name: user.name,
        bio: user.bio,
        profilePicture: user.profilePicture,
        socialLinks: user.socialLinks,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
