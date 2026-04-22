/**
 * Server-only plan DB sync.
 * Imports Mongoose — MUST NOT be imported by client components.
 * Use getPlanRoll() from lib/planLimits.ts for client-safe access.
 */
import connectDB from './mongodb';
import { PLAN_ROLLS, _setPlanCache, type PlanRoll, type PlanId } from './planLimits';

const FREE_ROLL = PLAN_ROLLS.free;

let isFetching = false;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function syncPlansFromDB() {
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
            analysesLimit: p.limits?.analysesLimit ?? p.limits?.video_analysis ?? staticRoll.limits.analysesLimit,
            analysesPeriod: p.limits?.analysesPeriod ?? staticRoll.limits.analysesPeriod,
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

      _setPlanCache(newCache);
      lastFetchTime = Date.now();
    }
  } catch (error) {
    console.error('[planSync] DB sync failed:', error);
  } finally {
    isFetching = false;
  }
}

/** Force-refresh the plan cache (use in API routes after plan changes). */
export async function refreshPlanCache() {
  await syncPlansFromDB();
}

/** Background refresh if stale — call from server-side request handlers. */
export function syncIfStale() {
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    syncPlansFromDB().catch(console.error);
  }
}
