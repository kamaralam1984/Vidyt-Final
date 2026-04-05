import connectDB from './mongodb';
import Usage from '../models/Usage';
import Notification from '../models/Notification';
import User from '../models/User';
import { getPlanLimits } from './planLimits';
import { Resend } from 'resend';

let resend: Resend | null = null;
const getResend = () => {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

export interface UsageResult {
  allowed: boolean;
  current: number;
  limit: number;
  feature: string;
}

/**
 * Checks if a user has reached their limit for a specific feature.
 * Triggers warnings at 80% and blocks at 100%.
 */
export async function checkUsageLimit(userId: string, planId: string, feature: string): Promise<UsageResult> {
  await connectDB();
  const limits = getPlanLimits(planId);
  const limit = (limits as any)[feature];

  // -1 means Infinity
  if (limit === -1 || limit === undefined) {
    return { allowed: true, current: 0, limit: -1, feature };
  }

  const today = new Date().toISOString().split('T')[0];
  const usage = await Usage.findOne({ userId, feature, date: today });
  const current = usage?.count || 0;

  if (current >= limit) {
    // Ensure 100% notification is sent if not already sent for today
    await triggerNotification(userId, feature, current, limit, 'limit_reached');
    return { allowed: false, current, limit, feature };
  }

  // 80% Warning Logic
  const threshold = Math.floor(limit * 0.8);
  if (current >= threshold && threshold > 0) {
    await triggerNotification(userId, feature, current, limit, 'warning');
  }

  return { allowed: true, current, limit, feature };
}

/**
 * Increments the usage count for a feature.
 */
export async function recordUsage(userId: string, feature: string) {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];
  
  await Usage.findOneAndUpdate(
    { userId, feature, date: today },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
}

/**
 * Triggers in-app and email notifications based on usage level.
 */
async function triggerNotification(
  userId: string, 
  feature: string, 
  current: number, 
  limit: number, 
  type: 'warning' | 'limit_reached'
) {
  const today = new Date().toISOString().split('T')[0];
  const featureLabel = feature.replace('_', ' ');
  
  // Check if we already sent this type of notification today to avoid spam
  const existing = await Notification.findOne({
    userId,
    type,
    message: { $regex: featureLabel, $options: 'i' },
    createdAt: { $gte: new Date(today) }
  });

  if (existing) return;

  const message = type === 'warning' 
    ? `⚠️ Almost reached your limit! You've used ${current}/${limit} of your daily ${featureLabel}.`
    : `🚫 Limit reached! You've used all ${limit} of your daily ${featureLabel}. Upgrade to continue.`;

  // 1. Create In-App Notification
  await Notification.create({
    userId,
    type,
    message,
    read: false
  });

  // 2. Send Email (if user has email)
  const user = await User.findById(userId).select('email').lean();
  const resendClient = getResend();
  if (user?.email && resendClient) {
    try {
      await resendClient.emails.send({
        from: 'VidYT <alerts@vidyt.com>',
        to: user.email as string,
        subject: type === 'warning' ? '⚠️ Almost reached your limit' : '🚫 Limit reached',
        html: `<p>${message}</p><p><a href="https://vidyt.com/pricing">Upgrade Plan</a></p>`
      });
    } catch (err) {
      console.error('Email alert failed:', err);
    }
  }
}
