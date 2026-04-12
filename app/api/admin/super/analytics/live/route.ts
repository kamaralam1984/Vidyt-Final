export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';
import User from '@/models/User';
import { requireAdminAccess } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    // Online: active sessions with lastSeen < 5 min ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [liveUsers, recentSessions] = await Promise.all([
      UserSession.find({
        isActive: true,
        lastSeen: { $gte: fiveMinutesAgo },
      })
        .sort({ lastSeen: -1 })
        .populate('userId', 'name email subscription uniqueId')
        .lean(),
      UserSession.find({
        lastSeen: { $gte: sixtyMinutesAgo, $lt: fiveMinutesAgo },
      })
        .sort({ lastSeen: -1 })
        .limit(10)
        .populate('userId', 'name email subscription uniqueId')
        .lean(),
    ]);

    const formatSession = (s: any) => ({
      sessionId: s.sessionId,
      userId: String((s.userId as any)?._id || ''),
      uniqueId: (s.userId as any)?.uniqueId,
      name: (s.userId as any)?.name || 'Unknown',
      email: (s.userId as any)?.email || '',
      plan: (s.userId as any)?.subscription || 'free',
      currentPage: s.currentPage || '/',
      country: s.country,
      state: s.state,
      city: s.city,
      distanceFromAdmin: s.distanceFromAdmin,
      sessionStart: s.loginTime,
      lastSeen: s.lastSeen,
      isActive: s.isActive,
      sessionDurationMinutes: s.loginTime
        ? Math.round((Date.now() - new Date(s.loginTime).getTime()) / 60000)
        : 0,
      pageTimeSpentSeconds: s.currentPageSince
        ? Math.max(0, Math.round((Date.now() - new Date(s.currentPageSince).getTime()) / 1000))
        : 0,
    });

    return NextResponse.json({
      liveUsers: liveUsers.map(formatSession),
      recentHistory: recentSessions.map(formatSession),
      count: liveUsers.length,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('[Admin Live Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
