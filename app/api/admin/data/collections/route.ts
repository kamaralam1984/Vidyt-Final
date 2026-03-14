import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';

const COLLECTIONS: { id: string; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'videos', label: 'Videos' },
  { id: 'scheduledposts', label: 'Scheduled Posts' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'viraldatasets', label: 'Viral Datasets' },
  { id: 'trendhistories', label: 'Trend History' },
  { id: 'engagementmetrics', label: 'Engagement Metrics' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'analyses', label: 'Analyses' },
  { id: 'aiscripts', label: 'AI Scripts' },
  { id: 'aihooks', label: 'AI Hooks' },
  { id: 'aithumbnails', label: 'AI Thumbnails' },
  { id: 'aishorts', label: 'AI Shorts' },
  { id: 'youtubegrowths', label: 'YouTube Growth' },
  { id: 'apiconfigs', label: 'API Config' },
  { id: 'viralpredictions', label: 'Viral Predictions' },
  { id: 'aimodelversions', label: 'AI Model Versions' },
  { id: 'trainingmetrics', label: 'Training Metrics' },
];

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: COLLECTIONS });
  } catch (error: any) {
    console.error('Admin collections list error:', error);
    return NextResponse.json({ error: 'Failed to load collections' }, { status: 500 });
  }
}
