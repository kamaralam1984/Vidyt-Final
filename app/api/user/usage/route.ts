import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { getPlanRoll } from '@/lib/planLimits';
import { getAnalysisUsageCount } from '@/lib/usageCheck';
import connectDB from '@/lib/mongodb';

/**
 * Get user usage stats and limits (plan-based: Pro/Enterprise = per day, Free = per month).
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

    const planId = user.subscription || 'free';
    const plan = getPlanRoll(planId);
    const { analysesLimit, analysesPeriod } = plan.limits;
    const used = await getAnalysisUsageCount(authUser.id, analysesPeriod);
    const remaining = analysesLimit === -1 ? -1 : Math.max(0, analysesLimit - used);
    const usageStats = user.usageStats || { competitorsTracked: 0 };
    const competitorsLimit = plan.limits.competitorsTracked === -1 ? -1 : plan.limits.competitorsTracked;
    const competitorsUsed = usageStats.competitorsTracked || 0;
    const competitorsRemaining = competitorsLimit === -1 ? -1 : Math.max(0, competitorsLimit - competitorsUsed);

    return NextResponse.json({
      success: true,
      usage: {
        videos: {
          used,
          limit: analysesLimit,
          remaining,
          period: analysesPeriod,
        },
        analyses: {
          used,
          limit: analysesLimit,
          remaining,
          period: analysesPeriod,
        },
        competitors: {
          used: competitorsUsed,
          limit: competitorsLimit,
          remaining: competitorsRemaining,
        },
      },
      subscription: {
        plan: planId,
        planName: plan.name,
        limitsDisplay: plan.limitsDisplay,
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
