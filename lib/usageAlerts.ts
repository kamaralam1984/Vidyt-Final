import Notification from '@/models/Notification';
import { sendBroadcastNotificationEmail } from '@/services/email';

type UsageValue = {
  used: number;
  limit: number;
};

type UserForAlerts = {
  id: string;
  email?: string;
  name?: string;
  preferences?: {
    notifications?: boolean;
    emailUpdates?: boolean;
  };
};

const TRACKED_FEATURES: Record<string, string> = {
  video_upload: 'Video Upload',
  video_analysis: 'Video Analysis',
  schedule_posts: 'Schedule Posts',
  bulk_scheduling: 'Bulk Scheduling',
};

export async function maybeTriggerUsageAlerts(
  user: UserForAlerts,
  usageMap: Record<string, UsageValue>,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const wantsInApp = user.preferences?.notifications !== false;
  const wantsEmail = user.preferences?.emailUpdates !== false;

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
      await sendBroadcastNotificationEmail(
        user.email,
        type === 'limit_reached' ? 'Limit Reached - Vid YT' : 'Usage Warning - Vid YT',
        `${message}\n\nPlan details: https://vidyt.com/subscription\nUpgrade: https://vidyt.com/pricing`,
        user.name,
      );
    }
  });

  await Promise.allSettled(jobs);
}
