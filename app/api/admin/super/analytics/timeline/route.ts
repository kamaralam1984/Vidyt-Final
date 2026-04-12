export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import ActivityTimeline from '@/models/ActivityTimeline';
import { requireAdminAccess } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    const timeline = await ActivityTimeline.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      timeline: timeline.map((t: any) => ({
        id: t._id,
        action: t.action,
        page: t.page,
        previousPage: t.previousPage,
        timeSpentSeconds: t.timeSpentSeconds,
        timestamp: t.timestamp,
        meta: t.meta,
      })),
    });
  } catch (error) {
    console.error('[Timeline API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
