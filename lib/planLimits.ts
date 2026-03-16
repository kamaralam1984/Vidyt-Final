/**
 * Single source of truth for plan limits and features.
 * Pro and Enterprise users get exactly what is defined here.
 */

export type PlanId = 'free' | 'pro' | 'enterprise' | 'owner';

export interface PlanLimits {
  /** Video analyses: per day (pro/enterprise) or per month (free) */
  analysesLimit: number;
  /** 'day' for pro/enterprise, 'month' for free */
  analysesPeriod: 'day' | 'month';
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
}

export interface PlanRoll {
  id: PlanId;
  name: string;
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

const FREE_ROLL: PlanRoll = {
  id: 'free',
  name: 'Free',
  limits: {
    analysesLimit: 5,
    analysesPeriod: 'month',
    titleSuggestions: 3,
    hashtagCount: 10,
    competitorsTracked: 3,
  },
  limitsDisplay: {
    videos: '5/month',
    analyses: 'Basic',
    storage: '—',
    support: 'Community',
  },
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
  },
  featureList: [
    '5 video analyses per month',
    'Basic viral score prediction',
    'Thumbnail analysis',
    'Title optimization (3 suggestions)',
    'Hashtag generator (10 hashtags)',
    'Community support',
  ],
};

const PRO_ROLL: PlanRoll = {
  id: 'pro',
  name: 'Pro',
  limits: {
    analysesLimit: 30,
    analysesPeriod: 'day',
    titleSuggestions: 10,
    hashtagCount: 20,
    competitorsTracked: 50,
  },
  limitsDisplay: {
    videos: '30/days',
    analyses: 'Advanced AI',
    storage: '—',
    support: 'Email',
  },
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
  },
  featureList: [
    '30 video analyses per day',
    'Advanced AI viral prediction',
    'Real-time trend analysis',
    'Title optimization (10 suggestions)',
    'Hashtag generator (20 hashtags)',
    'Best posting time predictions',
    'Competitor analysis',
    'Email support',
    'Priority processing',
  ],
};

/** Enterprise: paid plan with 100/day limits (distinct from Owner). */
const ENTERPRISE_ROLL: PlanRoll = {
  id: 'enterprise',
  name: 'Enterprise',
  limits: {
    analysesLimit: 100,
    analysesPeriod: 'day',
    titleSuggestions: 10,
    hashtagCount: 20,
    competitorsTracked: -1,
  },
  limitsDisplay: {
    videos: '100 Videos/Days',
    analyses: 'Custom AI',
    storage: '—',
    support: '24/7 Priority',
  },
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
  },
  featureList: [
    'Everything in Pro',
    'Team collaboration (up to 10 users)',
    'White-label reports',
    'Custom AI model training',
    'Dedicated account manager',
    '24/7 priority support',
    'Advanced analytics dashboard',
    '100 videos /days',
    'Custom integrations',
  ],
};

/** Owner: super-admin only. No limits (not the same as Enterprise). */
const OWNER_ROLL: PlanRoll = {
  id: 'owner',
  name: 'Owner',
  limits: {
    analysesLimit: -1,
    analysesPeriod: 'month',
    titleSuggestions: -1,
    hashtagCount: -1,
    competitorsTracked: -1,
  },
  limitsDisplay: {
    videos: 'Unlimited',
    analyses: 'Unlimited',
    storage: '—',
    support: 'Full',
  },
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
  },
  featureList: ['Unlimited access', 'No limits', 'All features'],
};

export const PLAN_ROLLS: Record<PlanId, PlanRoll> = {
  free: FREE_ROLL,
  pro: PRO_ROLL,
  enterprise: ENTERPRISE_ROLL,
  owner: OWNER_ROLL,
};

export function getPlanRoll(planId: string | undefined): PlanRoll {
  const id = (planId || 'free') as PlanId;
  return PLAN_ROLLS[id] ?? FREE_ROLL;
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

/** For backward compatibility: numeric limits used by stripe/usage APIs (videos = analyses limit, period implied) */
export function getSubscriptionLimitsForApi(planId: string | undefined): {
  videos: number;
  analyses: number;
  competitors: number;
  analysesPeriod: 'day' | 'month';
} {
  const limits = getPlanLimits(planId);
  return {
    videos: limits.analysesLimit,
    analyses: limits.analysesLimit,
    competitors: limits.competitorsTracked === -1 ? -1 : limits.competitorsTracked,
    analysesPeriod: limits.analysesPeriod,
  };
}
