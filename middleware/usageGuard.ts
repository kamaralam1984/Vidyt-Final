import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, recordUsage } from '@/lib/usageControl';
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
