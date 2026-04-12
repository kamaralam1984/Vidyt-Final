import { IUser } from '@/models/User';
import { sendUsageAlertEmail } from '@/services/email';

export const PLAN_ROLE_MAP: Record<string, string> = {
  free: "user",
  starter: "user",
  pro: "manager",
  enterprise: "admin",
  custom: "admin",
  owner: "super-admin" // Mapping owner to super-admin based on existing app logic
};

export const PLAN_LIMITS: Record<string, Record<string, number | typeof Infinity>> = {
  free: { analyses: 5, hashtags: 10, competitors: 3, bulkUploads: 0 },
  starter: { analyses: 100, hashtags: 15, competitors: 10, bulkUploads: 5 },
  pro: { analyses: 1000, hashtags: 20, competitors: 50, bulkUploads: 20 },
  enterprise: { analyses: Infinity, hashtags: Infinity, competitors: Infinity, bulkUploads: Infinity },
  // owner and custom are handled dynamically in the checker
};

export type FeatureType = 'analyses' | 'hashtags' | 'competitors' | 'bulkUploads';

/**
 * Checks if the user has reached the limit for a specific feature based on their current plan.
 * @param user The user object (from mongoose model)
 * @param feature The feature enum to check
 * @returns boolean true if they CAN proceed, false if they have HIT THEIR LIMIT
 */
export function checkLimit(user: any, feature: FeatureType): boolean {
  if (!user || !user.subscription) return false;

  // 1. OWNER plan -> unlimited, skip all checks
  if (user.subscription === 'owner') return true;

  // Usage resolution
  const usageStats = user.usageStats || {};
  let currentUsage = 0;
  
  if (feature === 'analyses') {
    currentUsage = usageStats.analysesThisMonth || 0;
  } else if (feature === 'hashtags') {
    currentUsage = usageStats.hashtagsGenerated || 0;
  } else if (feature === 'competitors') {
    currentUsage = usageStats.competitorsTracked || 0;
  }
  // Add other features mapped to user.usageStats as necessary

  // 2. CUSTOM plan -> check user.customLimits mapping
  if (user.subscription === 'custom') {
    const customLimit = user.customLimits?.get 
      ? user.customLimits.get(feature) 
      : user.customLimits?.[feature];
      
    if (customLimit === undefined || customLimit === null) {
      return false; // Safely block if no custom limit defined
    }
    return currentUsage < customLimit;
  }

  // 3. STANDARD plan logic
  const planLimits = PLAN_LIMITS[user.subscription] || PLAN_LIMITS['free'];
  const limit = planLimits[feature];

  const percent = currentUsage / limit;
  const allowed = currentUsage < limit;

  // Background Async Trigger for Email Alerting (80% / 100%)
  if (!allowed || percent >= 0.8) {
    (async () => {
      try {
        const now = new Date();
        const lastSent = user.lastUsageAlertSent ? new Date(user.lastUsageAlertSent) : null;
        // Global cooldown of 24h for limit alerts to prevent spamming
        if (!lastSent || (now.getTime() - lastSent.getTime() > 24 * 60 * 60 * 1000)) {
          user.lastUsageAlertSent = now;
          await sendUsageAlertEmail(user.email, user.name, percent >= 1 ? 'reached' : 'near', user.language);
          await user.save();
        }
      } catch(e) {}
    })();
  }

  return allowed;
}

/**
 * Generates the standardized Limit Exceeded JSON response.
 */
export function getLimitExceededResponse() {
  return {
    success: false,
    error: "🚫 Your plan limit is over. Please upgrade your plan.", // Returning under 'error' to match general Next.js patterns, mapping to user request
    message: "🚫 Your plan limit is over. Please upgrade your plan."
  };
}
