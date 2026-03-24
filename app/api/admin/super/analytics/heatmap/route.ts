export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import TrackingLog from '@/models/TrackingLog';
import { requireAdminAccess } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await TrackingLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$page', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]);

    const totalVisits = results.reduce((sum: number, r: any) => sum + r.visits, 0);

    const pages = results.map((r: any) => ({
      page: r._id || '/',
      visits: r.visits,
      percentage: totalVisits > 0 ? Math.round((r.visits / totalVisits) * 100) : 0,
    }));

    return NextResponse.json({ pages, totalVisits, period: '7d' });
  } catch (error) {
    console.error('[Heatmap API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
