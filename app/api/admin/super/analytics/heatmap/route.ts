export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import TrackingLog from '@/models/TrackingLog';
import UserSession from '@/models/UserSession';
import { requireAdminAccess } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Primary: TrackingLog (populated by trackingWorker — accurate page-level counts)
    const logResults = await TrackingLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$page', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]);

    if (logResults.length > 0) {
      const total = logResults.reduce((sum: number, r: any) => sum + r.visits, 0);
      return NextResponse.json({
        pages: logResults.map((r: any) => ({
          page: r._id || '/',
          visits: r.visits,
          percentage: total > 0 ? Math.round((r.visits / total) * 100) : 0,
        })),
        totalVisits: total,
        period: '7d',
        source: 'tracking_log',
      });
    }

    // Fallback: UserSession.currentPage (always up-to-date via direct writes)
    // Groups by the page users are currently on / last visited
    const sessionResults = await UserSession.aggregate([
      { $match: { lastSeen: { $gte: sevenDaysAgo }, currentPage: { $exists: true, $ne: null } } },
      { $group: { _id: '$currentPage', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]);

    const total = sessionResults.reduce((sum: number, r: any) => sum + r.visits, 0);
    return NextResponse.json({
      pages: sessionResults.map((r: any) => ({
        page: r._id || '/',
        visits: r.visits,
        percentage: total > 0 ? Math.round((r.visits / total) * 100) : 0,
      })),
      totalVisits: total,
      period: '7d',
      source: 'user_session_fallback',
    });
  } catch (error) {
    console.error('[Heatmap API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
