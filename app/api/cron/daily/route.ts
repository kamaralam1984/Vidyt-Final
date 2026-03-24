export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendExpiryAlertEmail } from '@/services/email';

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

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
