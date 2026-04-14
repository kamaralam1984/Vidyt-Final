export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import BulkEmailCampaign from '@/models/BulkEmailCampaign';

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
  return user;
}

// GET /api/admin/super/bulk-email/campaigns
export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      BulkEmailCampaign.find({}, { logs: { $slice: -50 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BulkEmailCampaign.countDocuments(),
    ]);

    return NextResponse.json({ campaigns, total, page, limit });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// DELETE /api/admin/super/bulk-email/campaigns?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await connectDB();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await BulkEmailCampaign.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
