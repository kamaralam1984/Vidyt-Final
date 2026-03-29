export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import ScheduledPost from '@/models/ScheduledPost';
import { getPlanRoll } from '@/lib/planLimits';
import { getAnalysisUsageCount, getUploadUsageCount } from '@/lib/usageCheck';
import { getSchedulePostsLimit, getBulkSchedulingLimit } from '@/lib/usageDisplayLimits';
import connectDB from '@/lib/mongodb';

/**
 * Plan usage from database counts (Video, ScheduledPost), not stale usageStats counters.
 */
export async function GET(request: NextRequest) {
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

    const planId = user.role === 'super-admin' ? 'owner' : user.subscription || 'free';
    const plan = getPlanRoll(planId);
    const { analysesLimit, analysesPeriod } = plan.limits;

    const [analysisUsed, uploadUsed] = await Promise.all([
      getAnalysisUsageCount(authUser.id, analysesPeriod),
      getUploadUsageCount(authUser.id, analysesPeriod),
    ]);

    const usageStats = user.usageStats || { competitorsTracked: 0 };
    const competitorsLimit = plan.limits.competitorsTracked === -1 ? -1 : plan.limits.competitorsTracked;
    const competitorsUsed = usageStats.competitorsTracked || 0;
    const competitorsRemaining = competitorsLimit === -1 ? -1 : Math.max(0, competitorsLimit - competitorsUsed);

    const scheduleLimit = getSchedulePostsLimit(planId);
    const bulkLimit = getBulkSchedulingLimit(planId);

    let scheduledActive = 0;
    let bulkTotal = 0;
    try {
      const oid = new mongoose.Types.ObjectId(authUser.id);
      [scheduledActive, bulkTotal] = await Promise.all([
        ScheduledPost.countDocuments({ userId: oid, status: 'scheduled' }),
        ScheduledPost.countDocuments({
          userId: oid,
          status: { $in: ['scheduled', 'posted', 'failed'] },
        }),
      ]);
    } catch {
      // invalid id shape — leave zeros
    }

    const analysisRemaining = analysesLimit === -1 ? -1 : Math.max(0, analysesLimit - analysisUsed);
    const uploadRemaining = analysesLimit === -1 ? -1 : Math.max(0, analysesLimit - uploadUsed);

    return NextResponse.json({
      success: true,
      usage: {
        videoUpload: {
          used: uploadUsed,
          limit: analysesLimit,
          remaining: uploadRemaining,
          period: analysesPeriod,
        },
        videoAnalysis: {
          used: analysisUsed,
          limit: analysesLimit,
          remaining: analysisRemaining,
          period: analysesPeriod,
        },
        schedulePosts: {
          used: scheduledActive,
          limit: scheduleLimit,
          remaining:
            scheduleLimit === -1 ? -1 : scheduleLimit === 0 ? 0 : Math.max(0, scheduleLimit - scheduledActive),
        },
        bulkScheduling: {
          used: bulkTotal,
          limit: bulkLimit,
          remaining:
            bulkLimit === -1 ? -1 : bulkLimit === 0 ? 0 : Math.max(0, bulkLimit - bulkTotal),
        },
        videos: {
          used: analysisUsed,
          limit: analysesLimit,
          remaining: analysisRemaining,
          period: analysesPeriod,
        },
        analyses: {
          used: analysisUsed,
          limit: analysesLimit,
          remaining: analysisRemaining,
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
  } catch (error: unknown) {
    console.error('Get usage error:', error);
    return NextResponse.json({ error: 'Failed to get usage stats' }, { status: 500 });
  }
}
