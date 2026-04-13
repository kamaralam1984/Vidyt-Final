export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';
import User from '@/models/User';
import TrackingLog from '@/models/TrackingLog';
import { requireAdminAccess } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await connectDB();
    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Run all aggregations in parallel
    const [
      countryDaily,
      countryWeekly,
      countryMonthly,
      countryYearly,
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      newUsersYear,
      topPages,
      avgSessionDuration,
      userGrowthMonthly,
    ] = await Promise.all([
      // Country-wise daily visitors
      UserSession.aggregate([
        { $match: { loginTime: { $gte: todayStart } } },
        { $group: { _id: '$country', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
        { $project: { country: '$_id', sessions: '$count', uniqueUsers: { $size: '$uniqueUsers' }, _id: 0 } },
        { $sort: { sessions: -1 } },
      ]),
      // Country-wise weekly visitors
      UserSession.aggregate([
        { $match: { loginTime: { $gte: weekStart } } },
        { $group: { _id: '$country', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
        { $project: { country: '$_id', sessions: '$count', uniqueUsers: { $size: '$uniqueUsers' }, _id: 0 } },
        { $sort: { sessions: -1 } },
      ]),
      // Country-wise monthly visitors
      UserSession.aggregate([
        { $match: { loginTime: { $gte: monthStart } } },
        { $group: { _id: '$country', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
        { $project: { country: '$_id', sessions: '$count', uniqueUsers: { $size: '$uniqueUsers' }, _id: 0 } },
        { $sort: { sessions: -1 } },
      ]),
      // Country-wise yearly visitors
      UserSession.aggregate([
        { $match: { loginTime: { $gte: yearStart } } },
        { $group: { _id: '$country', count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
        { $project: { country: '$_id', sessions: '$count', uniqueUsers: { $size: '$uniqueUsers' }, _id: 0 } },
        { $sort: { sessions: -1 } },
      ]),
      // Total users
      User.countDocuments({ isDeleted: { $ne: true } }),
      // New users today
      User.countDocuments({ createdAt: { $gte: todayStart }, isDeleted: { $ne: true } }),
      // New users this week
      User.countDocuments({ createdAt: { $gte: weekStart }, isDeleted: { $ne: true } }),
      // New users this month
      User.countDocuments({ createdAt: { $gte: monthStart }, isDeleted: { $ne: true } }),
      // New users this year
      User.countDocuments({ createdAt: { $gte: yearStart }, isDeleted: { $ne: true } }),
      // Top visited pages (last 7 days)
      TrackingLog.aggregate([
        { $match: { timestamp: { $gte: new Date(Date.now() - 7 * 86400000) } } },
        { $group: { _id: '$page', visits: { $sum: 1 }, uniqueVisitors: { $addToSet: '$userId' } } },
        { $project: { page: '$_id', visits: 1, uniqueVisitors: { $size: '$uniqueVisitors' }, _id: 0 } },
        { $sort: { visits: -1 } },
        { $limit: 15 },
      ]),
      // Average session duration (last 30 days)
      UserSession.aggregate([
        { $match: { durationSeconds: { $gt: 0 }, loginTime: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: null, avgDuration: { $avg: '$durationSeconds' }, totalSessions: { $sum: 1 } } },
      ]),
      // User growth month-by-month (last 12 months)
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            label: {
              $concat: [
                { $toString: '$_id.year' }, '-',
                { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] },
              ],
            },
            count: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsers: { today: newUsersToday, week: newUsersWeek, month: newUsersMonth, year: newUsersYear },
        avgSessionSeconds: avgSessionDuration[0]?.avgDuration ? Math.round(avgSessionDuration[0].avgDuration) : 0,
        totalSessionsLast30d: avgSessionDuration[0]?.totalSessions || 0,
      },
      countryStats: {
        daily: countryDaily,
        weekly: countryWeekly,
        monthly: countryMonthly,
        yearly: countryYearly,
      },
      topPages,
      userGrowth: userGrowthMonthly,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Visitor Stats Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
