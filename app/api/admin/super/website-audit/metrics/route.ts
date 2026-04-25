export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getServerMetrics } from '@/services/auditEngine';

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metrics = await getServerMetrics();
  return NextResponse.json({ metrics });
}
