import { NextRequest, NextResponse } from 'next/server';
import {
  checkUsageLimit,
  checkFeatureLimit,
  recordUsage,
  recordFeatureUsage,
} from '@/lib/usageControl';
import { getUserFromRequest } from '@/lib/auth';

export type ProtectedHandler = (
  req: NextRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to protect API routes with plan-based usage limits.
 */
export function withUsageLimit(handler: ProtectedHandler, feature: string) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const planId = (user.subscription || 'free') as string;

    // 1. Pre-check usage
    const check = await checkUsageLimit(userId, planId, feature);

    if (!check.allowed) {
      return NextResponse.json({
        error: 'LIMIT_REACHED',
        message: `You have reached your limit for ${feature.replace('_', ' ')}. Upgrade your plan.`,
        current: check.current,
        limit: check.limit
      }, { status: 403 });
    }

    // 2. Execute actual handler
    const response = await handler(req);

    // 3. Increment usage on success (2xx)
    if (response.status >= 200 && response.status < 300) {
      await recordUsage(userId, feature);

      // OPTIONAL: Add usage headers or inject into response body if it's JSON
      // For now, we'll keep it simple as requested
    }

    return response;
  };
}

/**
 * Registry-aware variant. Uses lib/featureLimits.ts FEATURE_LIMITS_REGISTRY
 * via checkFeatureLimit / recordFeatureUsage so it correctly handles
 * day / week / month / lifetime period buckets defined per-feature on the plan.
 *
 * Use this for features that live in the featureLimits map (keyword_research,
 * trendAnalysis, hashtagsPerPost, etc.) rather than the legacy numeric fields
 * on plan.limits (video_upload, video_analysis).
 */
export function withFeatureLimit(handler: ProtectedHandler, featureKey: string) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const planId = (user.subscription || 'free') as string;

    const check = await checkFeatureLimit(userId, planId, featureKey);

    if (!check.allowed) {
      return NextResponse.json({
        error: 'LIMIT_REACHED',
        message: `You have reached your ${featureKey.replace(/_/g, ' ')} limit. Upgrade your plan.`,
        current: check.current,
        limit: check.limit,
        period: check.period,
      }, { status: 403 });
    }

    const response = await handler(req);

    if (response.status >= 200 && response.status < 300) {
      await recordFeatureUsage(userId, planId, featureKey);
    }

    return response;
  };
}
