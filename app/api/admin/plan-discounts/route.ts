import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';
import { getUserFromRequest } from '@/lib/auth';
import { PLAN_ROLLS, type PlanId } from '@/lib/planLimits';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const now = new Date();
    const docs = await PlanDiscount.find({ endsAt: { $gte: now } })
      .sort({ startsAt: 1 })
      .lean();
    return NextResponse.json({
      success: true,
      discounts: docs.map((d: any) => ({
        id: String(d._id),
        planId: d.planId as PlanId,
        label: d.label || '',
        percentage: d.percentage,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
      })),
    });
  } catch (e: any) {
    console.error('Get plan discounts error:', e);
    return NextResponse.json({ error: 'Failed to load discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { planId, label, percentage, startsAt, endsAt } = body as {
      planId: PlanId;
      label?: string;
      percentage: number;
      startsAt: string;
      endsAt: string;
    };
    if (!planId || !(planId in PLAN_ROLLS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (percentage <= 0 || percentage > 100) {
      return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 });
    }
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }
    await connectDB();
    const doc = await PlanDiscount.create({
      planId,
      label: label?.trim() || undefined,
      percentage,
      startsAt: start,
      endsAt: end,
    });
    return NextResponse.json({
      success: true,
      discount: {
        id: String(doc._id),
        planId: doc.planId as PlanId,
        label: doc.label || '',
        percentage: doc.percentage,
        startsAt: doc.startsAt,
        endsAt: doc.endsAt,
      },
    });
  } catch (e: any) {
    console.error('Create plan discount error:', e);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}

