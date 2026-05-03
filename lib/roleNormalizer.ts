// Single source of truth for role naming.
//
// New convention: role NAME == subscription plan NAME for the 5 paid tiers.
//   free / starter / pro / enterprise / custom — each plan has a same-named role.
// Owner stays as `super-admin` (keeps the existing requireSuperAdminAccess gate).
//
// Legacy roles (user / manager / admin) still work everywhere — every check
// goes through the helpers below so we can flip new signups to plan-name roles
// without breaking the existing user base.

export const VALID_PLANS = [
  'free',
  'starter',
  'pro',
  'enterprise',
  'custom',
  'owner',
] as const;

export type PlanId = (typeof VALID_PLANS)[number];

/** Plan-name roles + the legacy ones we still accept on read. */
export const VALID_ROLES = [
  // New (plan-name)
  'free',
  'starter',
  'pro',
  'enterprise',
  'custom',
  'super-admin',
  // Legacy aliases — kept so existing user/admin/manager docs keep working.
  'user',
  'manager',
  'admin',
  'superadmin',
] as const;

export type RoleId = (typeof VALID_ROLES)[number];

/** New canonical mapping. New signups land on plan-name roles. */
export const PLAN_ROLE_MAP: Record<string, string> = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  enterprise: 'enterprise',
  custom: 'custom',
  owner: 'super-admin',
};

/** Hierarchical tier — lets `hasRoleTier(actual, 'admin-tier')` etc. cover both old & new naming. */
const TIER: Record<string, number> = {
  free: 1,
  user: 1,           // legacy ≈ free/starter
  starter: 2,
  pro: 3,
  manager: 3,        // legacy ≈ pro
  enterprise: 4,
  custom: 4,
  admin: 4,          // legacy ≈ enterprise/custom
  'super-admin': 99,
  superadmin: 99,
};

export function roleTier(role: string | undefined | null): number {
  return TIER[String(role || '').toLowerCase()] ?? 0;
}

export function isSuperAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const r = String(role).toLowerCase().replace(/_/g, '-');
  return r === 'super-admin' || r === 'superadmin';
}

/** Admin-tier — covers old `admin` and new `enterprise` / `custom`, plus super-admin. */
export function isAdminRole(role: string | undefined | null): boolean {
  return roleTier(role) >= 4;
}

/**
 * Pick the canonical role for a user given their subscription plan.
 * Used at signup + on the migration endpoint.
 */
export function roleForPlan(planId: string | undefined | null): string {
  const id = String(planId || 'free').toLowerCase();
  return PLAN_ROLE_MAP[id] || 'free';
}

/** Map a legacy role + subscription back to the new plan-name role. */
export function migrateRole(legacyRole: string, planId: string): string {
  if (isSuperAdminRole(legacyRole)) return 'super-admin';
  return roleForPlan(planId);
}

/** Display label — used in admin tables. */
export function roleLabel(role: string | undefined | null): string {
  const r = String(role || '').toLowerCase();
  if (r === 'super-admin' || r === 'superadmin') return 'Owner';
  if (r === 'user') return 'Free';
  if (r === 'manager') return 'Pro';
  if (r === 'admin') return 'Enterprise';
  // New plan-name roles render with first letter uppercased.
  if (!r) return '—';
  return r.charAt(0).toUpperCase() + r.slice(1);
}
