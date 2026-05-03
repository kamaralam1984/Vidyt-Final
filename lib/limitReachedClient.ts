// Detects the 403 "LIMIT_REACHED" response shape produced by
// middleware/usageGuard.ts (withFeatureLimit / withUsageLimit). Used by
// client tool pages to swap their result UI for an upgrade notice when
// the user has exhausted a plan-based feature limit.

export interface LimitReachedInfo {
  reached: boolean;
  message?: string;
  current?: number;
  limit?: number;
  period?: string;
  feature?: string;
}

export function extractLimitReached(err: any): LimitReachedInfo {
  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data ?? err?.data;
  if (status === 403 && data?.error === 'LIMIT_REACHED') {
    return {
      reached: true,
      message: data.message,
      current: data.current,
      limit: data.limit,
      period: data.period,
      feature: data.feature,
    };
  }
  return { reached: false };
}
