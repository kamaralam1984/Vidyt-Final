export const dynamic = "force-dynamic";

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

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { id, label, percentage, startsAt, endsAt } = body as {
      id: string;
      label?: string;
      percentage?: number;
      startsAt?: string;
      endsAt?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 });
    }

    if (percentage !== undefined && (percentage <= 0 || percentage > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 });
    }

    const updateData: any = {};
    if (label !== undefined) updateData.label = label?.trim() || undefined;
    if (percentage !== undefined) updateData.percentage = percentage;

    if (startsAt || endsAt) {
      const currentDiscount = await PlanDiscount.findById(id);
      if (!currentDiscount) {
        return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      }

      const start = startsAt ? new Date(startsAt) : currentDiscount.startsAt;
      const end = endsAt ? new Date(endsAt) : currentDiscount.endsAt;

      if (
        !(start instanceof Date) ||
        isNaN(start.getTime()) ||
        !(end instanceof Date) ||
        isNaN(end.getTime())
      ) {
        return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
      }
      if (end <= start) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
      }
      updateData.startsAt = start;
      updateData.endsAt = end;
    }

    await connectDB();
    const doc = await PlanDiscount.findByIdAndUpdate(id, updateData, { new: true });

    if (!doc) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

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
    console.error('Update plan discount error:', e);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 });
    }

    await connectDB();
    const result = await PlanDiscount.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (e: any) {
    console.error('Delete plan discount error:', e);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}

