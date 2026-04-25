export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AuditAlert from '@/models/AuditAlert';

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 30;
  const acknowledged = url.searchParams.get('acknowledged');
  const severity = url.searchParams.get('severity');

  const filter: any = {};
  if (acknowledged === 'true') filter.acknowledged = true;
  if (acknowledged === 'false') filter.acknowledged = false;
  if (severity) filter.severity = severity;

  const [alerts, total, unreadCount] = await Promise.all([
    AuditAlert.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditAlert.countDocuments(filter),
    AuditAlert.countDocuments({ acknowledged: false }),
  ]);

  return NextResponse.json({ alerts, total, page, totalPages: Math.ceil(total / limit), unreadCount });
}
