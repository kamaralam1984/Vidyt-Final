import connectDB from './mongodb';
import Usage from '../models/Usage';
import Notification from '../models/Notification';
import User from '../models/User';
import Plan from '../models/Plan';
import { getPlanLimits } from './planLimits';
import { sendBroadcastNotificationEmail } from '@/services/email';
import { resolveFeatureLimit, type FeaturePeriod } from './featureLimits';

export interface UsageResult {
  allowed: boolean;
  current: number;
  limit: number;
  feature: string;
  period?: FeaturePeriod;
}

/**
 * Compute the bucket key used to scope usage counts by reset period.
 * - day:      YYYY-MM-DD
 * - week:     YYYY-Www  (ISO week)
 * - month:    YYYY-MM
 * - lifetime: 'lifetime'
 */
function periodBucket(period: FeaturePeriod, now: Date = new Date()): string {
  if (period === 'lifetime') return 'lifetime';
  if (period === 'month') return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  if (period === 'week') {
    // ISO week: Thursday-of-the-week trick.
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
 * Generic, registry-driven limit check. Resolves the limit for `featureKey`
 * from the user's plan (new `featureLimits` map → legacy fields → registry
 * default), then enforces it against usage counted in the appropriate
 * period bucket. Records 80% warning and 100% block notifications.
 */
export async function checkFeatureLimit(userId: string, planId: string, featureKey: string): Promise<UsageResult> {
  await connectDB();

  const planDoc = await Plan.findOne({ planId }).lean();
  const planLimits = (planDoc as any)?.limits || {};
  const resolved = resolveFeatureLimit(planLimits, featureKey);

  if (!resolved) {
    // Unregistered feature → fall back to legacy daily check.
    return checkUsageLimit(userId, planId, featureKey);
  }

  const { value: limit, period } = resolved;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, feature: featureKey, period };
  }

  const bucket = periodBucket(period);
  const usage = await Usage.findOne({ userId, feature: featureKey, date: bucket });
  const current = usage?.count || 0;

  if (current >= limit) {
    await triggerNotification(userId, featureKey, current, limit, 'limit_reached');
    return { allowed: false, current, limit, feature: featureKey, period };
  }

  const threshold = Math.floor(limit * 0.8);
  if (current >= threshold && threshold > 0) {
    await triggerNotification(userId, featureKey, current, limit, 'warning');
  }

  return { allowed: true, current, limit, feature: featureKey, period };
}

/**
 * Checks if a user has reached their limit for a specific feature.
 * Triggers warnings at 80% and blocks at 100%.
 */
export async function checkUsageLimit(userId: string, planId: string, feature: string): Promise<UsageResult> {
  await connectDB();
  const limits = getPlanLimits(planId);
  const limit = (limits as any)[feature];

  // -1 means Infinity
  if (limit === -1 || limit === undefined) {
    return { allowed: true, current: 0, limit: -1, feature };
  }

  const today = new Date().toISOString().split('T')[0];
  const usage = await Usage.findOne({ userId, feature, date: today });
  const current = usage?.count || 0;

  if (current >= limit) {
    // Ensure 100% notification is sent if not already sent for today
    await triggerNotification(userId, feature, current, limit, 'limit_reached');
    return { allowed: false, current, limit, feature };
  }

  // 80% Warning Logic
  const threshold = Math.floor(limit * 0.8);
  if (current >= threshold && threshold > 0) {
    await triggerNotification(userId, feature, current, limit, 'warning');
  }

  return { allowed: true, current, limit, feature };
}

/**
 * Increments the usage count for a feature.
 *
 * If `period` is provided, the count is bucketed by that period (week / month /
 * lifetime). Defaults to daily so existing callers continue to work unchanged.
 */
export async function recordUsage(userId: string, feature: string, period: FeaturePeriod = 'day') {
  await connectDB();
  const bucket = periodBucket(period);

  await Usage.findOneAndUpdate(
    { userId, feature, date: bucket },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
}

/**
 * Convenience wrapper: increment usage for `featureKey` using the period
 * configured for that feature on the given plan.
 */
export async function recordFeatureUsage(userId: string, planId: string, featureKey: string) {
  await connectDB();
  const planDoc = await Plan.findOne({ planId }).lean();
  const resolved = resolveFeatureLimit((planDoc as any)?.limits || {}, featureKey);
  await recordUsage(userId, featureKey, resolved?.period || 'day');
}

/**
 * Triggers in-app and email notifications based on usage level.
 */
async function triggerNotification(
  userId: string, 
  feature: string, 
  current: number, 
  limit: number, 
  type: 'warning' | 'limit_reached'
) {
  const today = new Date().toISOString().split('T')[0];
  const featureLabel = feature.replace(/_/g, ' ');
  
  // Check if we already sent this type of notification today to avoid spam
  const existing = await Notification.findOne({
    userId,
    type,
    feature,
    dayKey: today,
  });

  if (existing) return;

  const message = type === 'warning' 
    ? `⚠️ Almost reached your limit! You've used ${current}/${limit} of your daily ${featureLabel}.`
    : `🚫 Limit reached! You've used all ${limit} of your daily ${featureLabel}. Upgrade to continue.`;

  // 1. Create In-App Notification
  await Notification.create({
    userId,
    type,
    message,
    feature,
    threshold: type === 'warning' ? 80 : 100,
    dayKey: today,
    read: false
  });

  // 2. Send Email (if user has email + has email updates on)
  const user = await User.findById(userId).select('email name preferences').lean();
  const shouldEmail = user?.preferences?.emailUpdates !== false;
  if (user?.email && shouldEmail) {
    try {
      await sendBroadcastNotificationEmail(
        user.email as string,
        type === 'warning' ? 'Usage Warning - Vid YT' : 'Limit Reached - Vid YT',
        `${message}\n\nFeature: ${featureLabel}\n\nUpgrade plan: https://www.vidyt.com/pricing`,
        (user as any).name
      );
    } catch (err) {
      console.error('Email alert failed:', err);
    }
  }
}
