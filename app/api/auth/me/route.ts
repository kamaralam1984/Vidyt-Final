export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { PLAN_LIMITS } from '@/lib/limitChecker';

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

    let needsSave = false;

    // Check Plan Expiry
    if (user.subscription !== 'owner' && user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
      user.subscription = 'free';
      user.role = 'user';
      if (user.subscriptionPlan) {
        user.subscriptionPlan.status = 'expired';
      }
      needsSave = true;
    }

    // Auto-sync Owner tier for Super Admins
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
        isYoutubeConnected: !!user.youtube?.refresh_token,
        computedLimits: {
          analyses: user.subscription === 'owner' ? Number.MAX_SAFE_INTEGER : 
                   user.subscription === 'custom' ? ((user.customLimits as any)?.get ? (user.customLimits as any).get('analyses') : (user.customLimits as any)?.analyses || 0) :
                   (PLAN_LIMITS[user.subscription]?.analyses || PLAN_LIMITS['free'].analyses)
        }
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
