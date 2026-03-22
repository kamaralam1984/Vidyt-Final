import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      // Return 401 but don't throw error - AuthGuard will handle it
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          authenticated: false,
          message: 'Your session has expired. Please login again.'
        },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(authUser.id).select('-password -twoFactorSecret');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Auto-sync Owner tier for Super Admins
    let needsSave = false;
    if (user.role === 'super-admin') {
        if (user.subscription !== 'owner') {
            user.subscription = 'owner';
            needsSave = true;
        }
        if (!user.subscriptionPlan || user.subscriptionPlan.status !== 'active' || user.subscriptionPlan.planId !== 'owner') {
            user.subscriptionPlan = {
                ...user.subscriptionPlan,
                currency: user.subscriptionPlan?.currency || 'USD',
                planId: 'owner',
                planName: 'Owner',
                status: 'active',
                billingPeriod: 'year',
                price: 0
            };
            needsSave = true;
        }
        if (needsSave) {
            await user.save();
        }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        uniqueId: user.uniqueId,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
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
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
