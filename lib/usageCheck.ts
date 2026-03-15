/**
 * Check and enforce plan-based usage limits (video analyses per day/month).
 */

import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import { getPlanRoll, type PlanId } from '@/lib/planLimits';

export interface AnalysisLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  period: 'day' | 'month';
  planId: PlanId;
  message?: string;
}

/**
 * Get start of today (UTC) and start of current month (UTC).
 */
function getPeriodStart(period: 'day' | 'month'): Date {
  const now = new Date();
  if (period === 'day') {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return start;
}

/**
 * Count video analyses for user in the current period (today or this month).
 */
export async function getAnalysisUsageCount(
  userId: string,
  period: 'day' | 'month'
): Promise<number> {
  await connectDB();
  const start = getPeriodStart(period);
  const count = await Video.countDocuments({
    userId,
    uploadedAt: { $gte: start },
  });
  return count;
}

/**
 * Check if user can run one more video analysis based on their plan.
 * Returns allowed, used, limit, period.
 */
export async function checkAnalysisLimit(userId: string, planId: string): Promise<AnalysisLimitResult> {
  const plan = getPlanRoll(planId);
  const { analysesLimit, analysesPeriod } = plan.limits;

  const used = await getAnalysisUsageCount(userId, analysesPeriod);

  const allowed = used < analysesLimit;

  return {
    allowed,
    used,
    limit: analysesLimit,
    period: analysesPeriod,
    planId: plan.id,
    message: allowed
      ? undefined
      : analysesPeriod === 'day'
        ? `Daily limit reached (${analysesLimit} video analyses per day). Resets at midnight UTC.`
        : `Monthly limit reached (${analysesLimit} video analyses per month). Upgrade to Pro for more.`,
  };
}
