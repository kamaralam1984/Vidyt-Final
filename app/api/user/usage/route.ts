import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { getSubscriptionLimits } from '@/services/payments/stripe';
import connectDB from '@/lib/mongodb';

/**
 * Get user usage stats and limits
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

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const limits = getSubscriptionLimits(user.subscription);
    const usage = user.usageStats || {
      videosAnalyzed: 0,
      analysesThisMonth: 0,
      competitorsTracked: 0,
    };

    return NextResponse.json({
      success: true,
      usage: {
        videos: {
          used: usage.videosAnalyzed || 0,
          limit: limits.videos,
          remaining: limits.videos === -1 ? -1 : Math.max(0, limits.videos - (usage.videosAnalyzed || 0)),
        },
        analyses: {
          used: usage.analysesThisMonth || 0,
          limit: limits.analyses,
          remaining: limits.analyses === -1 ? -1 : Math.max(0, limits.analyses - (usage.analysesThisMonth || 0)),
        },
        competitors: {
          used: usage.competitorsTracked || 0,
          limit: limits.competitors,
          remaining: limits.competitors === -1 ? -1 : Math.max(0, limits.competitors - (usage.competitorsTracked || 0)),
        },
      },
      subscription: {
        plan: user.subscription,
        expiresAt: user.subscriptionExpiresAt,
      },
    });
  } catch (error: any) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}
