export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import FunnelEvent from '@/models/FunnelEvent';
import { verifyToken } from '@/lib/auth-jwt';
import { requireAdminAccess } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

const FUNNEL_STEPS = [
  'pricing_visit',
  'plan_selected',
  'payment_initiated',
  'payment_success',
  'payment_failed',
] as const;

const STEP_LABELS: Record<string, string> = {
  pricing_visit: 'Viewed Pricing',
  plan_selected: 'Selected Plan',
  payment_initiated: 'Initiated Payment',
  payment_success: 'Payment Success',
  payment_failed: 'Payment Failed',
};

export async function GET(request: Request) {
  try {
    await connectDB();

    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    // Aggregate counts per step for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const results = await FunnelEvent.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$step', count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    results.forEach((r: any) => { countMap[r._id] = r.count; });

    const topCount = countMap['pricing_visit'] || 1;
    const steps = FUNNEL_STEPS.map((step) => ({
      step,
      label: STEP_LABELS[step],
      count: countMap[step] || 0,
      conversionRate: step === 'pricing_visit'
        ? 100
        : Math.round(((countMap[step] || 0) / topCount) * 100),
    }));

    const overallConversion = Math.round(
      ((countMap['payment_success'] || 0) / topCount) * 100
    );

    return NextResponse.json({ steps, overallConversion, period: '30d' });
  } catch (error) {
    console.error('[Funnel API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: record a funnel event (called from user-facing pages)
export async function POST(request: Request) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const decoded: any = authHeader ? await verifyToken(authHeader.replace('Bearer ', '')).catch(() => null) : null;

    const body = await request.json();
    const { step, plan, amount, sessionId, meta } = body;

    if (!step) return NextResponse.json({ error: 'step required' }, { status: 400 });

    await FunnelEvent.create({
      userId: decoded?.id || undefined,
      sessionId,
      step,
      plan,
      amount,
      meta,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Funnel POST Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
