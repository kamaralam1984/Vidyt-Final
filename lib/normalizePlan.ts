/** Pure plan id normalization — safe for client bundles (no Node/Mongo imports). */

export const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'] as const;

export function normalizePlan(plan: string | undefined | null): (typeof VALID_PLANS)[number] {
  if (!plan) return 'free';
  const normalized = plan.toLowerCase().trim();
  return VALID_PLANS.includes(normalized as (typeof VALID_PLANS)[number]) ? (normalized as (typeof VALID_PLANS)[number]) : 'free';
}
