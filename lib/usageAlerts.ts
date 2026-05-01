import Notification from '@/models/Notification';
import {
  sendUsageAlertEmail,
  sendLimitReachedMarketingEmail,
} from '@/services/email';

type UsageValue = {
  used: number;
  limit: number;
};

type UserForAlerts = {
  id: string;
  email?: string;
  name?: string;
  language?: 'en' | 'hi';
  preferences?: {
    notifications?: boolean;
    emailUpdates?: boolean;
  };
};

const TRACKED_FEATURES: Record<string, string> = {
  // Core
  video_upload: 'Video Upload',
  video_analysis: 'Video Analysis',
  schedule_posts: 'Schedule Posts',
  bulk_scheduling: 'Bulk Scheduling',
  analyses: 'Video Analyses',
  titleSuggestions: 'Title Suggestions',
  // AI Studio
  daily_ideas: 'Daily Ideas',
  ai_coach: 'AI Coach',
  keyword_research: 'Keyword Research',
  script_writer: 'Script Writer',
  ai_thumbnail_maker: 'AI Thumbnail Maker',
  ai_shorts_clipping: 'AI Shorts Clipping',
};

export async function maybeTriggerUsageAlerts(
  user: UserForAlerts,
  usageMap: Record<string, UsageValue>,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const wantsInApp = user.preferences?.notifications !== false;
  const wantsEmail = user.preferences?.emailUpdates !== false;
  const lang = user.language === 'hi' ? 'hi' : 'en';

  const jobs = Object.entries(TRACKED_FEATURES).map(async ([featureKey, label]) => {
    const usage = usageMap[featureKey];
    if (!usage || usage.limit <= 0 || usage.limit === -1) return;

    const ratio = usage.used / usage.limit;
    const type = ratio >= 1 ? 'limit_reached' : ratio >= 0.8 ? 'warning' : null;
    if (!type) return;

    const existing = await Notification.findOne({
      userId: user.id,
      type,
      feature: featureKey,
      dayKey: today,
    }).lean();
    if (existing) return;

    const message =
      type === 'limit_reached'
        ? `Limit reached for ${label}: ${usage.used}/${usage.limit}. Upgrade to continue.`
        : `Usage warning for ${label}: ${usage.used}/${usage.limit} used.`;

    if (wantsInApp) {
      await Notification.create({
        userId: user.id,
        type,
        message,
        feature: featureKey,
        threshold: type === 'warning' ? 80 : 100,
        dayKey: today,
        read: false,
      });
    }

    if (wantsEmail && user.email) {
      if (type === 'limit_reached') {
        await sendLimitReachedMarketingEmail(user.email, user.name, label, lang);
      } else {
        await sendUsageAlertEmail(user.email, user.name, 'near', lang);
      }
    }
  });

  await Promise.allSettled(jobs);
}
