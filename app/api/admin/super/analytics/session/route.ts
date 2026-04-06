export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TrackingLog from '@/models/TrackingLog';
import { requireAdminAccess } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const logs = await TrackingLog.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (!logs.length) {
      return NextResponse.json({ error: 'No logs found for this session' }, { status: 404 });
    }

    // Process logs to calculate time spent on each page
    const processedLogs = logs.map((log, index) => {
      const nextLog = logs[index + 1];
      let timeSpent = 0;

      if (nextLog) {
          const start = new Date(log.timestamp).getTime();
          const end = new Date(nextLog.timestamp).getTime();
          timeSpent = Math.max(0, Math.round((end - start) / 1000));
      } else {
          // For the last log, we use the timeSpentSeconds if recorded, 
          // or assume it's the current time if the session is very recent.
          timeSpent = log.timeSpentSeconds || 0;
      }

      return {
        ...log,
        timeSpentSeconds: timeSpent
      };
    });

    return NextResponse.json({
      success: true,
      sessionId,
      logs: processedLogs,
      totalDurationSeconds: processedLogs.reduce((acc, l) => acc + (l.timeSpentSeconds || 0), 0)
    });

  } catch (error) {
    console.error('[Admin Session Details Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
