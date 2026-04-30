/**
 * Central registry for every numerical/usage limit the admin can configure
 * per plan. The admin UI, schema defaults, and runtime enforcement all read
 * from this single source of truth — adding a new feature limit only requires
 * a new entry here.
 */

export type FeaturePeriod = 'day' | 'week' | 'month' | 'lifetime';

export type FeatureGroupId =
  | 'core'
  | 'ai_studio'
  | 'analytics'
  | 'social'
  | 'storage'
  | 'collaboration';

export interface FeatureLimitDef {
  key: string;
  label: string;
  group: FeatureGroupId;
  defaultValue: number;
  defaultPeriod: FeaturePeriod;
  description?: string;
  /**
   * Legacy mapping: older code paths reference these limit fields directly
   * on `plan.limits` (e.g. `analysesLimit`, `titleSuggestions`). When set,
   * the admin UI mirrors writes to that legacy key as well so existing
   * enforcement continues to work without changes.
   */
  legacyKey?: string;
}

export interface FeatureGroupDef {
  id: FeatureGroupId;
  label: string;
  description: string;
  order: number;
}

export const FEATURE_GROUPS: FeatureGroupDef[] = [
  { id: 'core', label: 'Core Limits', description: 'Primary usage caps', order: 0 },
  { id: 'ai_studio', label: 'AI Studio', description: 'Generative AI tools', order: 1 },
  { id: 'analytics', label: 'Analytics & Predictions', description: 'Insight & prediction features', order: 2 },
  { id: 'social', label: 'Social & Publishing', description: 'Posting and connected accounts', order: 3 },
  { id: 'storage', label: 'Storage & Media', description: 'Uploads and storage caps', order: 4 },
  { id: 'collaboration', label: 'Team & API', description: 'Team seats and API quotas', order: 5 },
];

export const FEATURE_LIMITS_REGISTRY: FeatureLimitDef[] = [
  // ── Core ──────────────────────────────────────────────────────────────
  { key: 'analyses', label: 'Video Analyses', group: 'core', defaultValue: 5, defaultPeriod: 'month', legacyKey: 'analysesLimit' },
  { key: 'titleSuggestions', label: 'Title Suggestions', group: 'core', defaultValue: 3, defaultPeriod: 'day', legacyKey: 'titleSuggestions' },
  { key: 'hashtagsPerPost', label: 'Hashtags per Post', group: 'core', defaultValue: 10, defaultPeriod: 'lifetime', legacyKey: 'hashtagCount' },
  { key: 'competitorsTracked', label: 'Competitors Tracked', group: 'core', defaultValue: 3, defaultPeriod: 'lifetime', legacyKey: 'competitorsTracked' },

  // ── AI Studio ─────────────────────────────────────────────────────────
  { key: 'daily_ideas', label: 'Daily Ideas Generations', group: 'ai_studio', defaultValue: 5, defaultPeriod: 'day' },
  { key: 'ai_coach', label: 'AI Coach Sessions', group: 'ai_studio', defaultValue: 3, defaultPeriod: 'day' },
  { key: 'keyword_research', label: 'Keyword Research Queries', group: 'ai_studio', defaultValue: 10, defaultPeriod: 'day' },
  { key: 'script_writer', label: 'Scripts Generated', group: 'ai_studio', defaultValue: 3, defaultPeriod: 'day' },
  { key: 'title_generator', label: 'Title Generator Calls', group: 'ai_studio', defaultValue: 10, defaultPeriod: 'day' },
  { key: 'ai_shorts_clipping', label: 'AI Shorts Clips', group: 'ai_studio', defaultValue: 3, defaultPeriod: 'day' },
  { key: 'ai_thumbnail_maker', label: 'AI Thumbnails', group: 'ai_studio', defaultValue: 5, defaultPeriod: 'day' },
  { key: 'channel_audit_tool', label: 'Channel Audits', group: 'ai_studio', defaultValue: 1, defaultPeriod: 'month' },
  { key: 'optimize', label: 'AI Optimization Runs', group: 'ai_studio', defaultValue: 5, defaultPeriod: 'day' },
  { key: 'ultraAiEngine', label: 'Ultra AI Engine', group: 'ai_studio', defaultValue: 5, defaultPeriod: 'day' },

  // ── Analytics ─────────────────────────────────────────────────────────
  { key: 'viralPrediction', label: 'Viral Predictions', group: 'analytics', defaultValue: 5, defaultPeriod: 'day' },
  { key: 'trendAnalysis', label: 'Trend Analysis Reports', group: 'analytics', defaultValue: 3, defaultPeriod: 'day' },
  { key: 'postingTimePrediction', label: 'Posting Time Predictions', group: 'analytics', defaultValue: 10, defaultPeriod: 'day' },
  { key: 'analyticsExports', label: 'Analytics Exports', group: 'analytics', defaultValue: 5, defaultPeriod: 'month' },

  // ── Social ────────────────────────────────────────────────────────────
  { key: 'socialAccountsConnected', label: 'Social Accounts Connected', group: 'social', defaultValue: 1, defaultPeriod: 'lifetime' },
  { key: 'scheduledPosts', label: 'Scheduled Posts', group: 'social', defaultValue: 10, defaultPeriod: 'month' },

  // ── Storage ───────────────────────────────────────────────────────────
  { key: 'storageGB', label: 'Storage (GB)', group: 'storage', defaultValue: 1, defaultPeriod: 'lifetime' },
  { key: 'videoUploads', label: 'Video Uploads', group: 'storage', defaultValue: 5, defaultPeriod: 'month' },
  { key: 'videoDurationMinutes', label: 'Max Video Duration (min)', group: 'storage', defaultValue: 10, defaultPeriod: 'lifetime' },

  // ── Collaboration ─────────────────────────────────────────────────────
  { key: 'teamSeats', label: 'Team Seats', group: 'collaboration', defaultValue: 1, defaultPeriod: 'lifetime' },
  { key: 'apiCalls', label: 'API Calls', group: 'collaboration', defaultValue: 100, defaultPeriod: 'day' },
];

export const PERIOD_OPTIONS: { value: FeaturePeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'lifetime', label: 'Lifetime' },
];

export interface FeatureLimitValue {
  value: number;
  period: FeaturePeriod;
}

export type FeatureLimitsMap = Record<string, FeatureLimitValue>;

export function getFeatureLimitDef(key: string): FeatureLimitDef | undefined {
  return FEATURE_LIMITS_REGISTRY.find((f) => f.key === key);
}

/**
 * Maps sidebar feature IDs (from utils/features.ts, group: 'sidebar') to
 * a limit registry key. Used by the Usage widget so the per-user list
 * mirrors the sidebar 1:1 — every sidebar item the user can see shows up
 * with its associated quota. Items without a mapping render as
 * label-only rows ("Available", no progress bar).
 */
export const SIDEBAR_LIMIT_MAP: Record<string, string> = {
  videos: 'videoUploads',
  youtube_seo: 'analyses',
  keyword_intelligence: 'keyword_research',
  facebook_seo: 'analyses',
  instagram_seo: 'analyses',
  viral_optimizer: 'ultraAiEngine',
  facebook_audit: 'channel_audit_tool',
  trending: 'trendAnalysis',
  hashtags: 'hashtagsPerPost',
  posting_time: 'postingTimePrediction',
  analytics: 'analyticsExports',
  calendar: 'scheduledPosts',
  script_generator: 'script_writer',
  ai_coach: 'ai_coach',
  thumbnail_generator: 'ai_thumbnail_maker',
  hook_generator: 'titleSuggestions',
  shorts_creator: 'ai_shorts_clipping',
  // dashboard, youtube_growth → no quota; render as label-only rows.
};

export function getFeaturesByGroup(group: FeatureGroupId): FeatureLimitDef[] {
  return FEATURE_LIMITS_REGISTRY.filter((f) => f.group === group);
}

/**
 * Build the default `featureLimits` map for a brand-new plan, optionally
 * scaled by a multiplier (e.g. enterprise gets 10x the free defaults).
 */
export function buildDefaultFeatureLimits(multiplier = 1): FeatureLimitsMap {
  const out: FeatureLimitsMap = {};
  for (const def of FEATURE_LIMITS_REGISTRY) {
    out[def.key] = {
      value: def.defaultValue === -1 ? -1 : Math.round(def.defaultValue * multiplier),
      period: def.defaultPeriod,
    };
  }
  return out;
}

/**
 * Resolve the effective numerical limit for a feature on a plan, falling back
 * to the legacy field on `plan.limits` if the new map is missing the key.
 * Returns -1 for unlimited, undefined if the feature is not registered.
 */
export function resolveFeatureLimit(
  planLimits: any,
  featureKey: string
): { value: number; period: FeaturePeriod } | undefined {
  const def = getFeatureLimitDef(featureKey);
  if (!def) return undefined;

  const fromMap = planLimits?.featureLimits?.[featureKey];
  if (fromMap && typeof fromMap.value === 'number') {
    return { value: fromMap.value, period: fromMap.period || def.defaultPeriod };
  }

  if (def.legacyKey && typeof planLimits?.[def.legacyKey] === 'number') {
    const legacyPeriod =
      def.legacyKey === 'analysesLimit' && planLimits?.analysesPeriod
        ? (planLimits.analysesPeriod as FeaturePeriod)
        : def.defaultPeriod;
    return { value: planLimits[def.legacyKey], period: legacyPeriod };
  }

  return { value: def.defaultValue, period: def.defaultPeriod };
}
