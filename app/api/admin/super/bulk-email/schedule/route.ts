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
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

// POST /api/admin/super/bulk-email/schedule
// body: { subject, body, recipients, scheduledAt: ISO string, rateLimit? }
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    const { subject, body, recipients, scheduledAt, rateLimit = 30 } = await req.json();

    if (!subject?.trim()) return NextResponse.json({ error: 'subject required' }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 });
    if (!scheduledAt) return NextResponse.json({ error: 'scheduledAt required' }, { status: 400 });

    const sendAt = new Date(scheduledAt);
    if (isNaN(sendAt.getTime()) || sendAt <= new Date()) {
      return NextResponse.json({ error: 'scheduledAt must be a future date' }, { status: 400 });
    }

    const emails = parseEmails(recipients || '');
    if (emails.length === 0) return NextResponse.json({ error: 'No valid recipients' }, { status: 400 });

    await connectDB();
    const campaign = await BulkEmailCampaign.create({
      subject,
      body,
      recipients: emails,
      status: 'scheduled',
      scheduledAt: sendAt,
      sentCount: 0,
      failedCount: 0,
    });

    return NextResponse.json({ campaignId: campaign._id, scheduledAt: sendAt, total: emails.length });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// GET /api/admin/super/bulk-email/schedule — list scheduled campaigns
export async function GET(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await connectDB();
    const campaigns = await BulkEmailCampaign.find({ status: 'scheduled' })
      .sort({ scheduledAt: 1 })
      .select('-logs')
      .lean();
    return NextResponse.json({ campaigns });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// DELETE /api/admin/super/bulk-email/schedule?id=xxx — cancel scheduled
export async function DELETE(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    await connectDB();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const campaign = await BulkEmailCampaign.findOneAndDelete({ _id: id, status: 'scheduled' });
    if (!campaign) return NextResponse.json({ error: 'Not found or already sent' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
