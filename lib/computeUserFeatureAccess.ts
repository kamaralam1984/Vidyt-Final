import { normalizePlan } from '@/lib/auth';
import { ALL_FEATURES } from '@/utils/features';

export interface FeatureAccessDoc {
  feature: string;
  enabled?: boolean;
  allowedRoles?: string[];
}

export interface PlanLean {
  planId: string;
  featureFlags?: Record<string, boolean>;
  /** Unified Feature Matrix plan-column toggles for sidebar/dashboard/yt sections */
  navFeatureAccess?: Record<string, boolean>;
}

export interface PlatformControlLean {
  platform: string;
  isEnabled: boolean;
  allowedPlans: string[];
}

export interface ComputeUserFeatureAccessInput {
  role: string;
  subscription: string;
  featureAccessDocs: FeatureAccessDoc[];
  plan: PlanLean | null;
  platforms: PlatformControlLean[];
}

/** Sidebar items that also require the matching platform’s plan allow-list (Unified Matrix / PlatformControl). */
const FEATURE_PLATFORM_GATE: Record<string, string> = {
  youtube_seo: 'youtube',
  videos: 'youtube',
  viral_optimizer: 'youtube',
  channel_audit: 'youtube',
  facebook_seo: 'facebook',
  facebook_audit: 'facebook',
  instagram_seo: 'instagram',
};

function isPlatformAllowedForPlan(
  platformId: string,
  planId: string,
  platforms: PlatformControlLean[]
): boolean {
  const pc = platforms.find((p) => p.platform === platformId);
  if (!pc) return true;
  if (!pc.isEnabled) return false;
  const ap = pc.allowedPlans;
  if (!ap || ap.length === 0) return true;
  return ap.includes(planId);
}

function isPlatformFeatureRowAllowed(
  featureId: string,
  planId: string,
  platforms: PlatformControlLean[]
): boolean {
  const platformId = featureId.replace(/^platform_/, '');
  return isPlatformAllowedForPlan(platformId, planId, platforms);
}

function planAiStudioFlagTrue(plan: PlanLean | null, flagKey: string): boolean {
  if (!plan?.featureFlags) return false;
  return (plan.featureFlags as Record<string, boolean>)[flagKey] === true;
}

/** Legacy plan gating when navFeatureAccess has no explicit key (platform-only). */
function legacyNavAllowed(
  f: { id: string; group: string },
  planId: string,
  platforms: PlatformControlLean[]
): boolean {
  if (f.group === 'yt_seo_sections') {
    return isPlatformAllowedForPlan('youtube', planId, platforms);
  }
  const gate = FEATURE_PLATFORM_GATE[f.id];
  if (gate) {
    return isPlatformAllowedForPlan(gate, planId, platforms);
  }
  return true;
}

/** Defaults when `free` plan has no `navFeatureAccess` in DB yet (matches seeded matrix). */
export const DEFAULT_FREE_NAV: Record<string, boolean> = {
  dashboard: true,
  videos: true,
  trending: true,
  hashtags: true,
  posting_time: true,
  analytics: true,
  youtube_seo: false,
  facebook_seo: false,
  instagram_seo: false,
  viral_optimizer: false,
  channel_audit: false,
  facebook_audit: false,
  calendar: false,
  script_generator: false,
  ai_coach: false,
  thumbnail_generator: false,
  hook_generator: false,
  shorts_creator: false,
  youtube_growth: false,
};

/**
 * Plan column + platform gates for sidebar, dashboard, other, yt_seo_sections.
 * `navFeatureAccess[featureId] === false` hides. For plan `free`, merges with DEFAULT_FREE_NAV
 * so existing DBs without nav still match the intended Free tier until admins override.
 */
export function navPlanAllowsFeature(
  f: { id: string; group: string },
  plan: PlanLean | null,
  planId: string,
  platforms: PlatformControlLean[]
): boolean {
  const pid = normalizePlan(planId);
  const raw = plan?.navFeatureAccess || {};
  const merged = pid === 'free' ? { ...DEFAULT_FREE_NAV, ...raw } : raw;
  const nav = merged[f.id];
  if (nav === false) return false;
  return legacyNavAllowed(f, pid, platforms);
}

/**
 * Per-feature visibility for the logged-in user: Feature Matrix (roles + global on/off)
 * plus plan (AI Studio flags, platform allow-lists) — same rules as admin matrix, scoped to one plan.
 */
export function computeUserFeatureAccess(
  input: ComputeUserFeatureAccessInput
): Record<string, boolean> {
  const role = input.role || 'user';
  const planId = normalizePlan(input.subscription);
  const isSuper = role === 'super-admin' || role === 'superadmin';

  const out: Record<string, boolean> = {};

  for (const f of ALL_FEATURES) {
    const db = input.featureAccessDocs.find((d) => d.feature === f.id);
    const enabled = db?.enabled !== false;
    const allowedRoles =
      db?.allowedRoles && db.allowedRoles.length > 0 ? db.allowedRoles : f.defaultRoles;
    const roleOk = allowedRoles.includes(role);

    if (!enabled) {
      out[f.id] = false;
      continue;
    }

    if (isSuper) {
      out[f.id] = true;
      continue;
    }

    if (!roleOk) {
      out[f.id] = false;
      continue;
    }

    let planOk = true;

    if (f.group === 'ai_studio') {
      if (!input.plan) {
        planOk = true;
      } else {
        planOk = planAiStudioFlagTrue(input.plan, f.id);
      }
    } else if (f.group === 'platform') {
      planOk = isPlatformFeatureRowAllowed(f.id, planId, input.platforms);
    } else if (
      f.group === 'sidebar' ||
      f.group === 'dashboard' ||
      f.group === 'other' ||
      f.group === 'yt_seo_sections'
    ) {
      planOk = navPlanAllowsFeature(f, input.plan, planId, input.platforms);
    } else {
      planOk = true;
    }

    out[f.id] = planOk;
  }

  return out;
}
