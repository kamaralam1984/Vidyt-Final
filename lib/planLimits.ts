/**
 * Single source of truth for plan limits and features.
 * Reads from MongoDB in the background to provide a synchronous API.
 */

import connectDB from './mongodb';
import { normalizePlan } from './normalizePlan';
import { getApiConfig } from './apiConfig';

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

// ──────────────── Runtime Cache (Sync) ────────────────

let planCache: Record<string, PlanRoll> = { ...PLAN_ROLLS };
let lastFetchTime = 0;
let isFetching = false;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Background sync function. Updates the planCache variable.
 * Does not block execution.
 */
async function syncPlansFromDB() {
  // Mongoose / DB only exist on the server — never sync from client (e.g. useUser, app/page).
  if (typeof window !== 'undefined') {
    return;
  }
  if (isFetching) return;
  isFetching = true;
  try {
    const Plan = (await import('@/models/Plan')).default;
    await connectDB();
    const dbPlans = await Plan.find({}).lean();
    
    if (dbPlans && dbPlans.length > 0) {
      const newCache: Record<string, PlanRoll> = { ...PLAN_ROLLS };
      
      dbPlans.forEach((p: any) => {
        const planId = p.planId as PlanId;
        const staticRoll = PLAN_ROLLS[planId] || FREE_ROLL;
        
        newCache[planId] = {
          id: planId,
          name: p.name || staticRoll.name,
          role: p.role || staticRoll.role,
          limits: {
            video_upload: p.limits?.video_upload ?? p.limits?.analysesLimit ?? staticRoll.limits.video_upload,
            video_analysis: p.limits?.video_analysis ?? p.limits?.analysesLimit ?? staticRoll.limits.video_analysis,
            analysesLimit:
              p.limits?.analysesLimit ??
              p.limits?.video_analysis ??
              staticRoll.limits.analysesLimit,
            analysesPeriod:
              p.limits?.analysesPeriod ??
              staticRoll.limits.analysesPeriod,
            schedule_posts: p.limits?.schedule_posts ?? staticRoll.limits.schedule_posts,
            bulk_scheduling: p.limits?.bulk_scheduling ?? staticRoll.limits.bulk_scheduling,
            titleSuggestions: p.limits?.titleSuggestions ?? staticRoll.limits.titleSuggestions,
            hashtagCount: p.limits?.hashtagCount ?? staticRoll.limits.hashtagCount,
            competitorsTracked: p.limits?.competitorsTracked ?? staticRoll.limits.competitorsTracked,
          },
          features: {
            advancedAiViralPrediction: p.featureFlags?.advancedAiViralPrediction ?? staticRoll.features.advancedAiViralPrediction,
            realTimeTrendAnalysis: p.featureFlags?.realTimeTrendAnalysis ?? staticRoll.features.realTimeTrendAnalysis,
            bestPostingTimePredictions: p.featureFlags?.bestPostingTimePredictions ?? staticRoll.features.bestPostingTimePredictions,
            competitorAnalysis: p.featureFlags?.competitorAnalysis ?? staticRoll.features.competitorAnalysis,
            emailSupport: p.featureFlags?.emailSupport ?? staticRoll.features.emailSupport,
            priorityProcessing: p.featureFlags?.priorityProcessing ?? staticRoll.features.priorityProcessing,
            teamCollaboration: p.featureFlags?.teamCollaboration ?? staticRoll.features.teamCollaboration,
            whiteLabelReports: p.featureFlags?.whiteLabelReports ?? staticRoll.features.whiteLabelReports,
            customAiModelTraining: p.featureFlags?.customAiModelTraining ?? staticRoll.features.customAiModelTraining,
            dedicatedAccountManager: p.featureFlags?.dedicatedAccountManager ?? staticRoll.features.dedicatedAccountManager,
            prioritySupport24x7: p.featureFlags?.prioritySupport24x7 ?? staticRoll.features.prioritySupport24x7,
            advancedAnalyticsDashboard: p.featureFlags?.advancedAnalyticsDashboard ?? staticRoll.features.advancedAnalyticsDashboard,
            customIntegrations: p.featureFlags?.customIntegrations ?? staticRoll.features.customIntegrations,
            // AI Studio
            daily_ideas: p.featureFlags?.daily_ideas ?? staticRoll.features.daily_ideas,
            ai_coach: p.featureFlags?.ai_coach ?? staticRoll.features.ai_coach,
            keyword_research: p.featureFlags?.keyword_research ?? staticRoll.features.keyword_research,
            script_writer: p.featureFlags?.script_writer ?? staticRoll.features.script_writer,
            title_generator: p.featureFlags?.title_generator ?? staticRoll.features.title_generator,
            channel_audit_tool: p.featureFlags?.channel_audit_tool ?? staticRoll.features.channel_audit_tool,
            ai_shorts_clipping: p.featureFlags?.ai_shorts_clipping ?? staticRoll.features.ai_shorts_clipping,
            ai_thumbnail_maker: p.featureFlags?.ai_thumbnail_maker ?? staticRoll.features.ai_thumbnail_maker,
            optimize: p.featureFlags?.optimize ?? staticRoll.features.optimize,
          },
          limitsDisplay: {
            videos: p.limitsDisplay?.videos ?? staticRoll.limitsDisplay.videos,
            analyses: p.limitsDisplay?.analyses ?? staticRoll.limitsDisplay.analyses,
            storage: p.limitsDisplay?.storage ?? staticRoll.limitsDisplay.storage,
            support: p.limitsDisplay?.support ?? staticRoll.limitsDisplay.support,
          },
          featureList: p.features && p.features.length > 0 ? p.features : staticRoll.featureList,
        };
      });
      planCache = newCache;
      lastFetchTime = Date.now();
    }
  } catch (error) {
    console.error('Plan background sync failed:', error);
  } finally {
    isFetching = false;
  }
}

/**
 * Returns the plan configuration SYNCLY. 
 * If cache is stale, triggers a background refresh for next time.
 */
export function getPlanRoll(planId: string | undefined): PlanRoll {
  const id = (planId || 'free') as PlanId;
  
  // Trigger background refresh if stale
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    syncPlansFromDB(); 
  }
  
  return planCache[id] || PLAN_ROLLS[id] || FREE_ROLL;
}

/**
 * Force refresh the plan cache (can be awaited from API route)
 */
export async function refreshPlanCache() {
  await syncPlansFromDB();
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
