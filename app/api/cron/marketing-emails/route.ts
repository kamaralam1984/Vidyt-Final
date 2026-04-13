export const dynamic = "force-dynamic";

/**
 * Automated Marketing Email Cron Job
 *
 * Call this endpoint periodically (e.g., every 6 hours via cron/Vercel cron).
 * It handles:
 * 1. Welcome emails for new users (within 1 hour of signup)
 * 2. Drip feature emails for free users (every 2 days, 5 emails total)
 * 3. Upgrade suggestion emails for paid users (after 14 days on current plan)
 *
 * Protected by CRON_SECRET env var.
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import MarketingEmail from '@/models/MarketingEmail';
import {
  sendWelcomeEmail,
  sendDripEmail,
  sendUpgradeSuggestionEmail,
} from '@/services/email';

const DRIP_TYPES = [
  'feature_drip_1',
  'feature_drip_2',
  'feature_drip_3',
  'feature_drip_4',
  'feature_drip_5',
] as const;

// Interval between drip emails in milliseconds (2 days)
const DRIP_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const stats = { welcome: 0, drip: 0, upgrade: 0, errors: 0 };

    // ─── 1. Welcome Emails ───
    // Find users created in last 24 hours who haven't received a welcome email
    const recentUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
    })
      .select('_id email name')
      .lean();

    for (const user of recentUsers) {
      try {
        const alreadySent = await MarketingEmail.findOne({
          userId: user._id,
          emailType: 'welcome',
        }).lean();
        if (alreadySent) continue;

        const sent = await sendWelcomeEmail(user.email, user.name);
        await MarketingEmail.create({
          userId: user._id,
          email: user.email,
          emailType: 'welcome',
          status: sent ? 'sent' : 'failed',
        });
        if (sent) stats.welcome++;
      } catch (e) {
        stats.errors++;
        console.error('[Marketing] Welcome email error for', user.email, e);
      }
    }

    // ─── 2. Drip Emails for Free Users ───
    // Find free users who signed up > 2 days ago and haven't completed the drip sequence
    const freeUsers = await User.find({
      subscription: 'free',
      createdAt: { $lte: new Date(Date.now() - DRIP_INTERVAL_MS) },
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
    })
      .select('_id email name createdAt')
      .lean();

    for (const user of freeUsers) {
      try {
        // Find which drip emails have already been sent
        const sentDrips = await MarketingEmail.find({
          userId: user._id,
          emailType: { $in: DRIP_TYPES },
          status: 'sent',
        })
          .select('emailType sentAt')
          .sort({ sentAt: -1 })
          .lean();

        const sentTypes = new Set(sentDrips.map((d: any) => d.emailType));

        // Find next drip to send
        let nextDripIndex = -1;
        for (let i = 0; i < DRIP_TYPES.length; i++) {
          if (!sentTypes.has(DRIP_TYPES[i])) {
            nextDripIndex = i;
            break;
          }
        }

        if (nextDripIndex === -1) continue; // All drips sent

        // Check if enough time has passed since last drip
        if (sentDrips.length > 0) {
          const lastSentAt = new Date(sentDrips[0].sentAt).getTime();
          if (Date.now() - lastSentAt < DRIP_INTERVAL_MS) continue;
        }

        const sent = await sendDripEmail(user.email, user.name, nextDripIndex);
        await MarketingEmail.create({
          userId: user._id,
          email: user.email,
          emailType: DRIP_TYPES[nextDripIndex],
          status: sent ? 'sent' : 'failed',
        });
        if (sent) stats.drip++;
      } catch (e) {
        stats.errors++;
        console.error('[Marketing] Drip email error for', user.email, e);
      }
    }

    // ─── 3. Upgrade Suggestion for Paid Users ───
    // Find starter/pro users who've been on their plan for > 14 days
    const paidUsers = await User.find({
      subscription: { $in: ['starter', 'pro'] },
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
      'subscriptionPlan.startDate': {
        $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    })
      .select('_id email name subscription')
      .lean();

    for (const user of paidUsers) {
      try {
        const alreadySent = await MarketingEmail.findOne({
          userId: user._id,
          emailType: 'upgrade_premium',
        }).lean();
        if (alreadySent) continue;

        const sent = await sendUpgradeSuggestionEmail(
          user.email,
          user.name,
          user.subscription
        );
        await MarketingEmail.create({
          userId: user._id,
          email: user.email,
          emailType: 'upgrade_premium',
          status: sent ? 'sent' : 'failed',
        });
        if (sent) stats.upgrade++;
      } catch (e) {
        stats.errors++;
        console.error('[Marketing] Upgrade email error for', user.email, e);
      }
    }

    console.log('[Marketing Cron] Stats:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Marketing Cron Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
