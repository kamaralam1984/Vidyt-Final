/**
 * API Route: Admin Abuse Logs Dashboard
 * Provides comprehensive abuse monitoring and management
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AbuseLog } from '@/models/AbuseLog';
import { getClientIP } from '@/lib/rateLimiter';
import { withAdminRateLimit } from '@/middleware/rateLimitMiddleware';
import { getUserFromRequest } from '@/lib/auth';

async function handleRequest(req: NextRequest) {
  try {
    await dbConnect();

    // Verify admin access
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required.' },
        { status: 403 }
      );
    }

    // Route by method
    if (req.method === 'GET') {
      return handleGet(req);
    } else if (req.method === 'PUT') {
      return handlePut(req);
    } else if (req.method === 'DELETE') {
      return handleDelete(req);
    } else {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Admin abuse logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve abuse logs with filters
 */
async function handleGet(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const severity = searchParams.get('severity');
  const violationType = searchParams.get('type');
  const ipAddress = searchParams.get('ip');
  const userId = searchParams.get('userId');
  const reviewed = searchParams.get('reviewed');
  const timeRange = searchParams.get('timeRange') || '24'; // hours
  const action = searchParams.get('action');

  // Build query
  const query: any = {};

  // Time range filter
  const thresholdTime = new Date(Date.now() - parseInt(timeRange) * 60 * 60 * 1000);
  query.createdAt = { $gt: thresholdTime };

  // Additional filters
  if (severity) query.severity = severity;
  if (violationType) query.violationType = violationType;
  if (ipAddress) query.ipAddress = new RegExp(ipAddress, 'i');
  if (userId) query.userId = userId;
  if (reviewed !== null && reviewed !== undefined) {
    query.reviewed = reviewed === 'true';
  }
  if (action && action !== 'none') query.actionTaken = action;

  try {
    // Get total count
    const total = await AbuseLog.countDocuments(query);

    // Get paginated results
    const logs = await AbuseLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Get summary stats
    const summary = await AbuseLog.getRecentSummary(parseInt(timeRange));

    // Get top offenders
    const topOffenders = await AbuseLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastSeen: { $max: '$createdAt' },
          severity: { $max: '$severity' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        summary,
        topOffenders,
      },
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve abuse logs' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update abuse log (mark as reviewed, add notes, take action)
 */
async function handlePut(req: NextRequest) {
  try {
    const body = await req.json();
    const { logIds, reviewed, adminNotes, actionTaken, userId } = body;

    if (!Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        { error: 'logIds array is required' },
        { status: 400 }
      );
    }

    // Update abuse logs
    const updateData: any = {};
    if (reviewed !== undefined) {
      updateData.reviewed = reviewed;
      if (reviewed) {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = userId;
      }
    }
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (actionTaken) updateData.actionTaken = actionTaken;

    const result = await AbuseLog.updateMany(
      { _id: { $in: logIds } },
      updateData
    );

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
      message: `${result.modifiedCount} logs updated`,
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update abuse logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove abuse logs (older than specified period)
 */
async function handleDelete(req: NextRequest) {
  try {
    const body = await req.json();
    const { logIds, olderThanDays } = body;

    if (!logIds && !olderThanDays) {
      return NextResponse.json(
        { error: 'Either logIds or olderThanDays is required' },
        { status: 400 }
      );
    }

    let result;

    if (logIds && Array.isArray(logIds)) {
      // Delete specific logs
      result = await AbuseLog.deleteMany({ _id: { $in: logIds } });
    } else if (olderThanDays) {
      // Delete old logs
      const threshold = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      result = await AbuseLog.deleteMany({ createdAt: { $lt: threshold } });
    }

    return NextResponse.json({
      success: true,
      deleted: result?.deletedCount || 0,
      message: `${result?.deletedCount || 0} logs deleted`,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete abuse logs' },
      { status: 500 }
    );
  }
}

/**
 * Export handler with rate limiting
 */
export const GET = withAdminRateLimit(
  (req) => handleRequest(req),
  { endpoint: '/api/admin/compliance/abuse-logs' }
);

export const PUT = withAdminRateLimit(
  (req) => handleRequest(req),
  { endpoint: '/api/admin/compliance/abuse-logs' }
);

export const DELETE = withAdminRateLimit(
  (req) => handleRequest(req),
  { endpoint: '/api/admin/compliance/abuse-logs' }
);
