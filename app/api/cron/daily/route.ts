export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendExpiryAlertEmail } from '@/services/email';
import ScheduledPost from '@/models/ScheduledPost';
import { getPlanRoll } from '@/lib/planLimits';
import { getAnalysisUsageCount, getUploadUsageCount } from '@/lib/usageCheck';
import { getSchedulePostsLimit, getBulkSchedulingLimit } from '@/lib/usageDisplayLimits';
import { maybeTriggerUsageAlerts } from '@/lib/usageAlerts';

export async function GET(request: NextRequest) {
  // Validate CRON Secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    // Find users with an expiration date who are not on 'owner' plan
    const users = await User.find({
      subscription: { $ne: 'owner' },
      subscriptionExpiresAt: { $exists: true, $ne: null }
    });

    const results = {
      warningsSent: 0,
      expiredSent: 0,
      usageAlertsProcessed: 0,
      errors: 0
    };

    const now = new Date();
    // Normalize to start of today for safe math
    now.setHours(0, 0, 0, 0);

    for (const user of users) {
      if (!user.subscriptionExpiresAt || user.subscription === 'free') continue;
      
      const expiry = new Date(user.subscriptionExpiresAt);
      expiry.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const language = user.language || 'en';

      // Ensure we don't spam. Check lastExpiryAlertSent
      const lastSent = user.lastExpiryAlertSent ? new Date(user.lastExpiryAlertSent) : null;
      if (lastSent) lastSent.setHours(0,0,0,0);

      if (daysLeft === 3 && (!lastSent || lastSent.getTime() < now.getTime())) {
        // Send 3-day warning
        const success = await sendExpiryAlertEmail(user.email, user.name, 'warning', language);
        if (success) {
          user.lastExpiryAlertSent = new Date();
          await user.save();
          results.warningsSent++;
        } else {
          results.errors++;
        }
      } else if (daysLeft <= 0 && (!lastSent || lastSent.getTime() < now.getTime())) {
        // Send expired email once
        // (The downgrade to free happens continuously in /api/auth/me, but we can formally demote them here too if desired, 
        // though /auth/me covers active users heavily. For analytics reasons, let's demote them.)
        user.subscription = 'free';
        if (user.subscriptionPlan) {
           user.subscriptionPlan.status = 'expired';
        }
        user.role = 'user';
        
        const success = await sendExpiryAlertEmail(user.email, user.name, 'expired', language);
        if (success) {
          user.lastExpiryAlertSent = new Date(); // ensures we only send this expired notice once after dropping to 'free'
          results.expiredSent++;
        } else {
          results.errors++;
        }
        await user.save();
      }
    }

    // Usage sweep: trigger usage notifications/emails for all active users.
    const usageUsers = await User.find({ isDeleted: { $ne: true } })
      .select('_id email name preferences role subscription')
      .lean();

    for (const user of usageUsers) {
      try {
        const planId = (user.role === 'super-admin' || user.role === 'superadmin')
          ? 'owner'
          : (user.subscription || 'free');
        const plan = getPlanRoll(planId);
        const period = plan.limits.analysesPeriod;
        const analysesLimit = plan.limits.analysesLimit;

        const [analysisUsed, uploadUsed, scheduledActive, bulkTotal] = await Promise.all([
          getAnalysisUsageCount(String(user._id), period),
          getUploadUsageCount(String(user._id), period),
          ScheduledPost.countDocuments({ userId: user._id, status: 'scheduled' }),
          ScheduledPost.countDocuments({
            userId: user._id,
            status: { $in: ['scheduled', 'posted', 'failed'] },
          }),
        ]);

        await maybeTriggerUsageAlerts(
          {
            id: String(user._id),
            email: (user as any).email,
            name: (user as any).name,
            preferences: (user as any).preferences,
          },
          {
            video_upload: { used: uploadUsed, limit: analysesLimit },
            video_analysis: { used: analysisUsed, limit: analysesLimit },
            schedule_posts: { used: scheduledActive, limit: getSchedulePostsLimit(planId) },
            bulk_scheduling: { used: bulkTotal, limit: getBulkSchedulingLimit(planId) },
          },
        );
        results.usageAlertsProcessed++;
      } catch (e) {
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
