export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';
import { requireAdminAccess } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Stats
    const stats = await UserSession.aggregate([
      { $match: { loginTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: null,
          maxDuration: { $max: '$durationSeconds' },
          countries: { $addToSet: '$country' },
          activeToday: { $sum: { $cond: [{ $gte: ['$lastSeen', startOfDay] }, 1, 0] } }
        }
      }
    ]);

    const statData = stats[0] || { maxDuration: 0, countries: [], activeToday: 0 };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Today's sessions
    const todaySessions = await UserSession.find({ loginTime: { $gte: startOfToday } })
      .populate('userId', 'name email subscription uniqueId')
      .sort({ loginTime: -1 })
      .lean();

    // Session stats by user today
    const sessionsByUser = todaySessions.reduce((acc: any, s: any) => {
      const uid = (s.userId as any)?._id?.toString();
      if (!uid) return acc;
      if (!acc[uid]) {
        acc[uid] = {
          userId: uid,
          uniqueId: (s.userId as any)?.uniqueId,
          name: (s.userId as any)?.name || 'Unknown',
          email: (s.userId as any)?.email,
          plan: (s.userId as any)?.subscription,
          totalSessions: 0,
          totalDurationMinutes: 0,
          firstLogin: s.loginTime,
          lastLogin: s.loginTime,
          country: s.country,
          city: s.city,
          distanceFromAdmin: s.distanceFromAdmin,
        };
      }
      acc[uid].totalSessions++;
      acc[uid].totalDurationMinutes += s.durationSeconds ? Math.round(s.durationSeconds / 60) : 0;
      if (new Date(s.loginTime) < new Date(acc[uid].firstLogin)) acc[uid].firstLogin = s.loginTime;
      if (new Date(s.loginTime) > new Date(acc[uid].lastLogin)) acc[uid].lastLogin = s.loginTime;
      return acc;
    }, {});

    // Hourly active user trend today
    const hourlyTrend = await UserSession.aggregate([
      { $match: { loginTime: { $gte: startOfToday } } },
      {
        $group: {
          _id: { $hour: '$loginTime' },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      todayActiveUsers: Object.keys(sessionsByUser).length,
      sessions: Object.values(sessionsByUser),
      hourlyTrend: hourlyTrend.map((h: any) => ({
        hour: `${h._id}:00`,
        users: h.users,
      })),
      stats: {
        maxSessionMinutes: Math.round(statData.maxDuration / 60),
        countriesCount: statData.countries.filter(Boolean).length,
        activeToday: statData.activeToday
      }
    });
  } catch (error) {
    console.error('[Admin Sessions Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
