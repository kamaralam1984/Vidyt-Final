/**
 * Single source of truth for plan limits and features.
 * Reads from MongoDB in the background to provide a synchronous API.
 */

// NOTE: connectDB and getApiConfig are intentionally NOT top-level imported.
// They transitively import Mongoose which must NOT be bundled into the client.
// Use dynamic imports inside server-only functions (guarded by typeof window check).
import { normalizePlan } from './normalizePlan';

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise' | 'custom' | 'owner';

export interface PlanLimits {
  video_upload: number;
  video_analysis: number;
  /** Backward-compatible aliases used in multiple routes/components */
  analysesLimit: number;
  analysesPeriod: 'day' | 'month';
  schedule_posts: number;
  bulk_scheduling: number;
  /** Legacy/Extra */
  titleSuggestions: number;
  hashtagCount: number;
  competitorsTracked: number;
}

export interface PlanFeatures {
  advancedAiViralPrediction: boolean;
  realTimeTrendAnalysis: boolean;
  bestPostingTimePredictions: boolean;
  competitorAnalysis: boolean;
  emailSupport: boolean;
  priorityProcessing: boolean;
  /** Enterprise-only */
  teamCollaboration: boolean;
  whiteLabelReports: boolean;
  customAiModelTraining: boolean;
  dedicatedAccountManager: boolean;
  prioritySupport24x7: boolean;
  advancedAnalyticsDashboard: boolean;
  customIntegrations: boolean;
  /** AI Studio Features */
  daily_ideas: boolean;
  ai_coach: boolean;
  keyword_research: boolean;
  script_writer: boolean;
  title_generator: boolean;
  channel_audit_tool: boolean;
  ai_shorts_clipping: boolean;
  ai_thumbnail_maker: boolean;
  optimize: boolean;
}

export interface PlanRoll {
  id: PlanId;
  name: string;
  role: string;
  limits: PlanLimits;
  features: PlanFeatures;
  /** Display labels for limits (e.g. "30/days", "5/month") */
  limitsDisplay: {
    videos: string;
    analyses: string;
    storage: string;
    support: string;
  };
  /** Feature list for UI */
  featureList: string[];
}

// ──────────────── Static Fallbacks ────────────────

const FREE_ROLL: PlanRoll = {
  id: 'free',
  name: 'Free',
  role: 'user',
  limits: { 
    video_upload: 5, 
    video_analysis: 5, 
    analysesLimit: 5,
    analysesPeriod: 'month',
    schedule_posts: 0, 
    bulk_scheduling: 0,
    titleSuggestions: 3, 
    hashtagCount: 10, 
    competitorsTracked: 3 
  },
  limitsDisplay: { videos: '5/month', analyses: 'Basic', storage: '—', support: 'Community' },
  features: {
    advancedAiViralPrediction: false,
    realTimeTrendAnalysis: false,
    bestPostingTimePredictions: false,
    competitorAnalysis: false,
    emailSupport: false,
    priorityProcessing: false,
    teamCollaboration: false,
    whiteLabelReports: false,
    customAiModelTraining: false,
    dedicatedAccountManager: false,
    prioritySupport24x7: false,
    advancedAnalyticsDashboard: false,
    customIntegrations: false,
    daily_ideas: false,
    ai_coach: false,
    keyword_research: false,
    script_writer: false,
    title_generator: false,
    channel_audit_tool: false,
    ai_shorts_clipping: false,
    ai_thumbnail_maker: false,
    optimize: false,
  },
  featureList: ['5 video analyses/month', 'Basic viral score', 'Title optimization (3)', 'Hashtag generator (10)', 'Community support'],
};

const STARTER_ROLL: PlanRoll = {
  id: 'starter',
  name: 'Starter',
  role: 'user',
  limits: { 
    video_upload: 15, 
    video_analysis: 15, 
    analysesLimit: 15,
    analysesPeriod: 'day',
    schedule_posts: 5, 
    bulk_scheduling: 10,
    titleSuggestions: 5, 
    hashtagCount: 15, 
    competitorsTracked: 10 
  },
  limitsDisplay: { videos: '10/days', analyses: 'Standard AI', storage: '—', support: 'Email' },
  features: {
    advancedAiViralPrediction: true,
    realTimeTrendAnalysis: true,
    bestPostingTimePredictions: false,
    competitorAnalysis: true,
    emailSupport: true,
    priorityProcessing: false,
    teamCollaboration: false,
    whiteLabelReports: false,
    customAiModelTraining: false,
    dedicatedAccountManager: false,
    prioritySupport24x7: false,
    advancedAnalyticsDashboard: false,
    customIntegrations: false,
    daily_ideas: true,
    ai_coach: false,
    keyword_research: true,
    script_writer: true,
    title_generator: true,
    channel_audit_tool: false,
    ai_shorts_clipping: false,
    ai_thumbnail_maker: false,
    optimize: true,
  },
  featureList: ['10 video analyses/day', 'Standard viral prediction', 'Real-time trends', 'Email support'],
};

const PRO_ROLL: PlanRoll = {
  id: 'pro',
  name: 'Pro',
  role: 'manager',
  limits: { 
    video_upload: 30, 
    video_analysis: 30, 
    analysesLimit: 30,
    analysesPeriod: 'day',
    schedule_posts: 10, 
    bulk_scheduling: 50,
    titleSuggestions: 10, 
    hashtagCount: 20, 
    competitorsTracked: 50 
  },
  limitsDisplay: { videos: '30/days', analyses: 'Advanced AI', storage: '—', support: 'Email' },
  features: {
    advancedAiViralPrediction: true,
    realTimeTrendAnalysis: true,
    bestPostingTimePredictions: true,
    competitorAnalysis: true,
    emailSupport: true,
    priorityProcessing: true,
    teamCollaboration: false,
    whiteLabelReports: false,
    customAiModelTraining: false,
    dedicatedAccountManager: false,
    prioritySupport24x7: false,
    advancedAnalyticsDashboard: false,
    customIntegrations: false,
    daily_ideas: true,
    ai_coach: true,
    keyword_research: true,
    script_writer: true,
    title_generator: true,
    channel_audit_tool: true,
    ai_shorts_clipping: true,
    ai_thumbnail_maker: true,
    optimize: true,
  },
  featureList: ['30 video analyses/day', 'Advanced AI prediction', 'Best posting times', 'Priority support'],
};

const ENTERPRISE_ROLL: PlanRoll = {
  id: 'enterprise',
  name: 'Enterprise',
  role: 'admin',
  limits: { 
    video_upload: -1, 
    video_analysis: -1, 
    analysesLimit: -1,
    analysesPeriod: 'day',
    schedule_posts: -1, 
    bulk_scheduling: -1,
    titleSuggestions: 10, 
    hashtagCount: 20, 
    competitorsTracked: -1 
  },
  limitsDisplay: { videos: '100/days', analyses: 'Custom AI', storage: '—', support: '24/7 Priority' },
  features: {
    advancedAiViralPrediction: true,
    realTimeTrendAnalysis: true,
    bestPostingTimePredictions: true,
    competitorAnalysis: true,
    emailSupport: true,
    priorityProcessing: true,
    teamCollaboration: true,
    whiteLabelReports: true,
    customAiModelTraining: true,
    dedicatedAccountManager: true,
    prioritySupport24x7: true,
    advancedAnalyticsDashboard: true,
    customIntegrations: true,
    daily_ideas: true,
    ai_coach: true,
    keyword_research: true,
    script_writer: true,
    title_generator: true,
    channel_audit_tool: true,
    ai_shorts_clipping: true,
    ai_thumbnail_maker: true,
    optimize: true,
  },
  featureList: ['100 videos /day', 'Team collaboration', 'White-label reports', '24/7 priority support'],
};

const CUSTOM_ROLL: PlanRoll = {
  id: 'custom',
  name: 'Custom',
  role: 'admin',
  limits: { 
    video_upload: -1, 
    video_analysis: -1, 
    analysesLimit: -1,
    analysesPeriod: 'day',
    schedule_posts: -1, 
    bulk_scheduling: -1,
    titleSuggestions: 50, 
    hashtagCount: 50, 
    competitorsTracked: -1 
  },
  limitsDisplay: { videos: '500/days', analyses: 'Custom AI', storage: '—', support: '24/7 Priority' },
  features: {
    advancedAiViralPrediction: true,
    realTimeTrendAnalysis: true,
    bestPostingTimePredictions: true,
    competitorAnalysis: true,
    emailSupport: true,
    priorityProcessing: true,
    teamCollaboration: true,
    whiteLabelReports: true,
    customAiModelTraining: true,
    dedicatedAccountManager: true,
    prioritySupport24x7: true,
    advancedAnalyticsDashboard: true,
    customIntegrations: true,
    daily_ideas: true,
    ai_coach: true,
    keyword_research: true,
    script_writer: true,
    title_generator: true,
    channel_audit_tool: true,
    ai_shorts_clipping: true,
    ai_thumbnail_maker: true,
    optimize: true,
  },
  featureList: ['Everything in Enterprise', 'Custom usage limits', 'Dedicated support team'],
};

const OWNER_ROLL: PlanRoll = {
  id: 'owner',
  name: 'Owner',
  role: 'superadmin',
  limits: { 
    video_upload: -1, 
    video_analysis: -1, 
    analysesLimit: -1,
    analysesPeriod: 'day',
    schedule_posts: -1, 
    bulk_scheduling: -1,
    titleSuggestions: -1, 
    hashtagCount: -1, 
    competitorsTracked: -1 
  },
  limitsDisplay: { videos: 'Unlimited', analyses: 'Unlimited', storage: '—', support: 'Full' },
  features: {
    advancedAiViralPrediction: true,
    realTimeTrendAnalysis: true,
    bestPostingTimePredictions: true,
    competitorAnalysis: true,
    emailSupport: true,
    priorityProcessing: true,
    teamCollaboration: true,
    whiteLabelReports: true,
    customAiModelTraining: true,
    dedicatedAccountManager: true,
    prioritySupport24x7: true,
    advancedAnalyticsDashboard: true,
    customIntegrations: true,
    daily_ideas: true,
    ai_coach: true,
    keyword_research: true,
    script_writer: true,
    title_generator: true,
    channel_audit_tool: true,
    ai_shorts_clipping: true,
    ai_thumbnail_maker: true,
    optimize: true,
  },
  featureList: ['Unlimited access', 'All features enabled'],
};

export const PLAN_ROLLS: Record<PlanId, PlanRoll> = {
  free: FREE_ROLL,
  starter: STARTER_ROLL,
  pro: PRO_ROLL,
  enterprise: ENTERPRISE_ROLL,
  custom: CUSTOM_ROLL,
  owner: OWNER_ROLL,
};

// ──────────────── Runtime Cache (client-safe) ────────────────
// DB sync logic lives in lib/planSync.ts (server-only, imports mongoose).
// This file is safe to import from client components.

let planCache: Record<string, PlanRoll> = { ...PLAN_ROLLS };

/** Called by lib/planSync.ts (server-only) to push DB-fetched plans into cache */
export function _setPlanCache(newCache: Record<string, PlanRoll>) {
  planCache = newCache;
}

/**
 * Returns the plan configuration synchronously.
 * Falls back to hardcoded PLAN_ROLLS if the DB cache hasn't been populated yet.
 */
export function getPlanRoll(planId: string | undefined): PlanRoll {
  const id = (planId || 'free') as PlanId;
  return planCache[id] || PLAN_ROLLS[id] || FREE_ROLL;
}

/**
 * @deprecated Use refreshPlanCache from lib/planSync.ts in server/API code.
 * This is a no-op stub kept for backward compat. Actual refresh is in planSync.ts.
 */
export async function refreshPlanCache() {
  // No-op: DB sync moved to lib/planSync.ts (server-only, no client imports)
}

export function isOwnerPlan(planId: string | undefined): boolean {
  return (planId || '').toLowerCase() === 'owner';
}

export function getPlanLimits(planId: string | undefined): PlanLimits {
  return getPlanRoll(planId).limits;
}

export function getPlanFeatures(planId: string | undefined): PlanFeatures {
  return getPlanRoll(planId).features;
}

const UNLIMITED_CAP = 999;

export function getTitleSuggestionsCount(planId: string | undefined): number {
  const n = getPlanLimits(planId).titleSuggestions;
  return n < 0 ? UNLIMITED_CAP : n;
}

export function getHashtagCount(planId: string | undefined): number {
  const n = getPlanLimits(planId).hashtagCount;
  return n < 0 ? UNLIMITED_CAP : n;
}

/** For backward compatibility: numeric limits used by payment/usage APIs */
export function getSubscriptionLimitsForApi(planId: string | undefined): {
  videos: number;
  analyses: number;
  competitors: number;
  analysesPeriod: 'day' | 'month';
} {
  const limits = getPlanLimits(planId);
  return {
    videos: limits.video_upload,
    analyses: limits.video_analysis,
    competitors: limits.competitorsTracked,
    analysesPeriod: 'day', // New system is primarily daily-tracked
  };
}
