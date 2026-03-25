export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIModelVersion from '@/models/AIModelVersion';
import { requireAdminAccess } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const access = await requireAdminAccess(req);
    if (access.error) return access.error;

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const version = String(body.version || '');
    if (!version) return NextResponse.json({ error: 'version is required' }, { status: 400 });

    const target = await AIModelVersion.findOne({ version, status: 'ready' });
    if (!target) return NextResponse.json({ error: 'Model version not found or not ready' }, { status: 404 });

    await AIModelVersion.updateMany({}, { $set: { isActive: false } });
    target.isActive = true;
    await target.save();

    return NextResponse.json({ success: true, activeVersion: version });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Rollback failed' }, { status: 500 });
  }
}
