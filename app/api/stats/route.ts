import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SiteStats from '@/models/SiteStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const [userCount, stats] = await Promise.all([
      User.countDocuments({}),
      SiteStats.findOneAndUpdate(
        { key: 'global' },
        { $inc: { pageViews: 1 }, updatedAt: new Date() },
        { upsert: true, new: true }
      ),
    ]);

    return NextResponse.json({
      users: userCount,
      downloads: stats.downloads,
      pageViews: stats.pageViews,
    });
  } catch {
    return NextResponse.json({ users: 0, downloads: 0, pageViews: 0 }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    if (action !== 'download') return NextResponse.json({ ok: false }, { status: 400 });

    await connectDB();
    await SiteStats.findOneAndUpdate(
      { key: 'global' },
      { $inc: { downloads: 1 }, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
