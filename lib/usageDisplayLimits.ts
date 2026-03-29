import type { PlanId } from '@/lib/planLimits';

/** Max upcoming scheduled posts (active queue). */
export function getSchedulePostsLimit(planId: string | undefined): number {
  const id = (planId || 'free').toLowerCase() as PlanId;
  switch (id) {
    case 'free':
      return 0;
    case 'starter':
    case 'pro':
      return 10;
    case 'enterprise':
    case 'custom':
    case 'owner':
      return -1;
    default:
      return 0;
  }
}

/** Max posts in the scheduler (scheduled + posted + failed, excluding cancelled). */
export function getBulkSchedulingLimit(planId: string | undefined): number {
  const id = (planId || 'free').toLowerCase() as PlanId;
  switch (id) {
    case 'free':
      return 0;
    case 'starter':
      return 10;
    case 'pro':
      return 50;
    case 'enterprise':
    case 'custom':
    case 'owner':
      return -1;
    default:
      return 0;
  }
}
