export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Plan from '@/models/Plan';
import Usage from '@/models/Usage';
import ScheduledPost from '@/models/ScheduledPost';
import { getPlanRoll } from '@/lib/planLimits';
import { getAnalysisUsageCount, getUploadUsageCount } from '@/lib/usageCheck';
import { getSchedulePostsLimit, getBulkSchedulingLimit } from '@/lib/usageDisplayLimits';
import connectDB from '@/lib/mongodb';
import { maybeTriggerUsageAlerts } from '@/lib/usageAlerts';
import {
  FEATURE_LIMITS_REGISTRY,
  resolveFeatureLimit,
  type FeaturePeriod,
} from '@/lib/featureLimits';

/**
 * Compute the period bucket key used by the Usage collection.
 * Mirrors lib/usageControl.ts/periodBucket so the API and the writer
 * stay in lockstep without introducing a circular import.
 */
function periodBucket(period: FeaturePeriod, now: Date = new Date()): string {
  if (period === 'lifetime') return 'lifetime';
  if (period === 'month') return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  if (period === 'week') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  return now.toISOString().split('T')[0];
}

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
    const analysesLimit =
      plan.limits.analysesLimit ??
      plan.limits.video_analysis ??
      0;
    const uploadLimit =
      plan.limits.video_upload ??
      analysesLimit;
    const analysesPeriod = plan.limits.analysesPeriod ?? 'day';

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
    const uploadRemaining = uploadLimit === -1 ? -1 : Math.max(0, uploadLimit - uploadUsed);
    const usagePayload = {
      videoUpload: {
        used: uploadUsed,
        limit: uploadLimit,
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
    };

    // ── Registry-driven per-feature usage map ──────────────────────────
    // Iterates lib/featureLimits.ts so any feature added there automatically
    // appears in the user-facing Usage widget without changes here.
    const planDoc = await Plan.findOne({ planId }).lean();
    const planLimits = (planDoc as any)?.limits || {};
    const featureUsage: Record<string, {
      used: number;
      limit: number;
      period: FeaturePeriod;
      label: string;
      group: string;
    }> = {};

    // Pre-fetch all Usage docs for this user keyed by feature so we hit Mongo once.
    const usageDocs = await Usage.find({ userId: authUser.id }).lean();
    const usageByFeature = new Map<string, { date: string; count: number }[]>();
    for (const doc of usageDocs as any[]) {
      const arr = usageByFeature.get(doc.feature) || [];
      arr.push({ date: doc.date, count: doc.count || 0 });
      usageByFeature.set(doc.feature, arr);
    }

    for (const def of FEATURE_LIMITS_REGISTRY) {
      const resolved = resolveFeatureLimit(planLimits, def.key);
      if (!resolved) continue;
      const bucket = periodBucket(resolved.period);
      const matches = usageByFeature.get(def.key) || [];
      const bucketDoc = matches.find((m) => m.date === bucket);
      let used = bucketDoc?.count || 0;
      // Reuse already-computed counters where the registry key overlaps with
      // legacy tracking so the widget shows consistent numbers.
      if (def.key === 'analyses') used = analysisUsed;
      else if (def.key === 'scheduledPosts') used = scheduledActive;
      else if (def.key === 'competitorsTracked') used = competitorsUsed;

      featureUsage[def.key] = {
        used,
        limit: resolved.value,
        period: resolved.period,
        label: def.label,
        group: def.group,
      };
    }

    await maybeTriggerUsageAlerts(
      {
        id: authUser.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
      },
      {
        video_upload: { used: uploadUsed, limit: uploadLimit },
        video_analysis: usagePayload.videoAnalysis,
        schedule_posts: usagePayload.schedulePosts,
        bulk_scheduling: usagePayload.bulkScheduling,
      },
    );

    return NextResponse.json({
      success: true,
      usage: usagePayload,
      featureUsage,
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
