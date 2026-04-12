export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const notifications = await Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const unreadCount = await Notification.countDocuments({ userId: user.id, read: false });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body.id === 'string' ? body.id : '';
    const markAll = body.all === true;

    await connectDB();
    if (markAll) {
      await Notification.updateMany({ userId: user.id, read: false }, { $set: { read: true } });
    } else if (notificationId) {
      await Notification.updateOne({ _id: notificationId, userId: user.id }, { $set: { read: true } });
    } else {
      return NextResponse.json({ error: 'Missing id or all=true' }, { status: 400 });
    }

    const unreadCount = await Notification.countDocuments({ userId: user.id, read: false });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
