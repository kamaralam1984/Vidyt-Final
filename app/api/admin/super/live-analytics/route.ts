import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';
import TrackingLog from '@/models/TrackingLog';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d'; // 24h, 7d, 30d
    
    let startDate = new Date();
    if (range === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 7);

    // 1. Live Stats
    const [onlineNow, loggedInNow, totalCountries] = await Promise.all([
      UserSession.countDocuments({ isActive: true }),
      UserSession.countDocuments({ isActive: true, userId: { $exists: true } }),
      UserSession.distinct('country', { isActive: true })
    ]);

    // 2. Traffic Overview (Totals in range)
    const [totalVisits, uniqueVisitors, avgTimeSpent] = await Promise.all([
      TrackingLog.countDocuments({ timestamp: { $gte: startDate } }),
      TrackingLog.distinct('sessionId', { timestamp: { $gte: startDate } }),
      TrackingLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: null, avgTime: { $avg: '$timeSpentSeconds' } } }
      ])
    ]);

    // 3. Geographic Distribution
    const geoDistribution = await TrackingLog.aggregate([
      { $match: { timestamp: { $gte: startDate }, country: { $ne: null } } },
      { $group: { _id: { country: '$country', city: '$city' }, visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 20 }
    ]);

    // 4. Traffic Trend (Hourly or Daily)
    const groupFormat = range === '24h' ? '%Y-%m-%dT%H:00:00.000Z' : '%Y-%m-%d';
    const trafficTrend = await TrackingLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$timestamp' } },
          visits: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 5. Device Breakdown
    const deviceBreakdown = await TrackingLog.aggregate([
      { $match: { timestamp: { $gte: startDate }, userAgent: { $ne: null } } },
      {
        $project: {
          device: {
            $cond: [
              { $regexMatch: { input: '$userAgent', regex: /mobile|iphone|android/i } },
              'Mobile',
              {
                $cond: [
                  { $regexMatch: { input: '$userAgent', regex: /tablet|ipad/i } },
                  'Tablet',
                  'Desktop'
                ]
              }
            ]
          }
        }
      },
      { $group: { _id: '$device', count: { $sum: 1 } } }
    ]);

    // 6. Top Pages
    const topPages = await TrackingLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$page',
          visits: { $sum: 1 },
          avgTime: { $avg: '$timeSpentSeconds' }
        }
      },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ]);

    // 7. Recent Online Users
    const liveUsers = await UserSession.find({ isActive: true })
      .sort({ lastSeen: -1 })
      .limit(10)
      .populate('userId', 'name email');

    return NextResponse.json({
      success: true,
      data: {
        live: {
          onlineNow,
          loggedInNow,
          countriesActive: totalCountries.length,
          users: liveUsers
        },
        overview: {
          totalVisits,
          uniqueVisitors: uniqueVisitors.length,
          avgTimeSpent: avgTimeSpent[0]?.avgTime || 0
        },
        geoDistribution,
        trafficTrend,
        deviceBreakdown,
        topPages
      }
    });
  } catch (error: any) {
    console.error('Live Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
