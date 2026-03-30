export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeletionLog from '@/models/DeletionLog';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user is admin or super-admin
    const user = await User.findById(authUser.id);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'superadmin')) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status'); // pending, confirmed, completed, cancelled
    const userId = url.searchParams.get('userId');

    // Build filter query
    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    // Fetch deletion logs with pagination
    const totalCount = await DeletionLog.countDocuments(filter);
    const logs = await DeletionLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin deletion logs error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch deletion logs',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check admin privileges
    const user = await User.findById(authUser.id);
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin' && user.role !== 'superadmin')) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, logId, notes } = body;

    if (action === 'get-summary') {
      // Get summary statistics
      const totalDeletionRequests = await DeletionLog.countDocuments();
      const pendingRequests = await DeletionLog.countDocuments({ status: 'pending' });
      const confirmedRequests = await DeletionLog.countDocuments({ status: 'confirmed' });
      const completedDeletions = await DeletionLog.countDocuments({ status: 'completed' });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyDeletions = await DeletionLog.countDocuments({
        status: 'completed',
        deletionCompletedAt: { $gte: thisMonth },
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalDeletionRequests,
          pendingRequests,
          confirmedRequests,
          completedDeletions,
          monthlyDeletions,
        },
      });
    }

    if (action === 'update-notes' && logId) {
      const log = await DeletionLog.findByIdAndUpdate(
        logId,
        { notes, updatedAt: new Date() },
        { new: true }
      );

      if (!log) {
        return NextResponse.json(
          { error: 'Deletion log not found' },
          { status: 404 }
        );
      }

      console.log(`✅ Deletion log ${logId} updated by admin ${authUser.id}`);

      return NextResponse.json({
        success: true,
        message: 'Deletion log updated successfully',
        data: log,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Admin deletion logs update error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update deletion logs',
      },
      { status: 500 }
    );
  }
}
