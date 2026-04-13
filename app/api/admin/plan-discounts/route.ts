export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PlanDiscount from '@/models/PlanDiscount';
import { getUserFromRequest } from '@/lib/auth';

const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'];

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !['super-admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    const query = showAll ? {} : { endsAt: { $gte: new Date() } };
    const docs = await PlanDiscount.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      discounts: docs.map((d: any) => ({
        id: String(d._id),
        planId: d.planId,
        label: d.label || '',
        couponCode: d.couponCode || '',
        percentage: d.percentage,
        billingPeriod: d.billingPeriod || 'both',
        isActive: d.isActive ?? true,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        maxUses: d.maxUses || 0,
        usageCount: d.usageCount || 0,
        createdAt: d.createdAt,
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
    if (!user || !['super-admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { planIds, label, couponCode, percentage, billingPeriod, startsAt, endsAt, maxUses } = body;

    // Support bulk: planIds (array) or single planId
    const plans: string[] = Array.isArray(planIds) ? planIds : body.planId ? [body.planId] : [];
    if (plans.length === 0 || plans.some((p: string) => !VALID_PLANS.includes(p))) {
      return NextResponse.json({ error: 'Invalid plan(s). Valid: ' + VALID_PLANS.join(', ') }, { status: 400 });
    }
    if (!percentage || percentage < 1 || percentage > 100) {
      return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 });
    }

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    await connectDB();

    // Check coupon code uniqueness
    if (couponCode?.trim()) {
      const existing = await PlanDiscount.findOne({ couponCode: couponCode.trim().toUpperCase() });
      if (existing) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }
    }

    const created = [];
    for (const planId of plans) {
      const doc = await PlanDiscount.create({
        planId,
        label: label?.trim() || undefined,
        couponCode: couponCode?.trim() ? couponCode.trim().toUpperCase() : undefined,
        percentage,
        billingPeriod: billingPeriod || 'both',
        isActive: true,
        startsAt: start,
        endsAt: end,
        maxUses: maxUses || 0,
        usageCount: 0,
      });
      created.push({
        id: String(doc._id),
        planId: doc.planId,
        label: doc.label || '',
        couponCode: doc.couponCode || '',
        percentage: doc.percentage,
        billingPeriod: doc.billingPeriod,
        isActive: doc.isActive,
        startsAt: doc.startsAt,
        endsAt: doc.endsAt,
        maxUses: doc.maxUses || 0,
        usageCount: 0,
      });
      // Only first plan gets the coupon code (codes must be unique)
      if (couponCode?.trim()) break;
    }

    return NextResponse.json({ success: true, discounts: created });
  } catch (e: any) {
    console.error('Create plan discount error:', e);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !['super-admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, label, couponCode, percentage, billingPeriod, startsAt, endsAt, maxUses, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Discount ID is required' }, { status: 400 });
    }
    if (percentage !== undefined && (percentage < 1 || percentage > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 });
    }

    await connectDB();

    const currentDiscount = await PlanDiscount.findById(id);
    if (!currentDiscount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (label !== undefined) updateData.label = label?.trim() || undefined;
    if (couponCode !== undefined) updateData.couponCode = couponCode?.trim() ? couponCode.trim().toUpperCase() : undefined;
    if (percentage !== undefined) updateData.percentage = percentage;
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (startsAt || endsAt) {
      const start = startsAt ? new Date(startsAt) : currentDiscount.startsAt;
      const end = endsAt ? new Date(endsAt) : currentDiscount.endsAt;
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
      }
      if (end <= start) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
      }
      updateData.startsAt = start;
      updateData.endsAt = end;
    }

    // Check coupon uniqueness if changed
    if (couponCode?.trim() && couponCode.trim().toUpperCase() !== currentDiscount.couponCode) {
      const existing = await PlanDiscount.findOne({
        couponCode: couponCode.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }
    }

    const doc = await PlanDiscount.findByIdAndUpdate(id, updateData, { new: true });
    if (!doc) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      discount: {
        id: String(doc._id),
        planId: doc.planId,
        label: doc.label || '',
        couponCode: doc.couponCode || '',
        percentage: doc.percentage,
        billingPeriod: doc.billingPeriod,
        isActive: doc.isActive,
        startsAt: doc.startsAt,
        endsAt: doc.endsAt,
        maxUses: doc.maxUses || 0,
        usageCount: doc.usageCount || 0,
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
    if (!user || !['super-admin', 'superadmin'].includes(user.role)) {
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

    return NextResponse.json({ success: true, message: 'Discount deleted' });
  } catch (e: any) {
    console.error('Delete plan discount error:', e);
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
  }
}
