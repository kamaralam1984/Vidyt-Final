export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { sendBroadcastNotificationEmail } from '@/services/email';

/**
 * POST: Send notification (email) to all users. Super-admin only.
 * Body: { subject: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const subject = (body.subject || 'Notification from Vid YT').trim();
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const users = await User.find({
      email: { $exists: true, $ne: '', $regex: /@/ },
    }).select('email name');

    let sent = 0;
    const failed: string[] = [];

    for (const user of users) {
      if (!user.email) continue;
      const ok = await sendBroadcastNotificationEmail(
        user.email,
        subject,
        message,
        user.name || undefined
      );
      if (ok) sent++;
      else failed.push(user.email);
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${sent} user(s).`,
      sent,
      total: users.length,
      failed: failed.length,
      failedEmails: failed.length > 0 ? failed : undefined,
    });
  } catch (error: any) {
    console.error('Send notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
