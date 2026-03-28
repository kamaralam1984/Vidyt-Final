export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdminRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const plans = await Plan.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      plans: plans.map((p: any) => ({
        id: String(p._id),
        planId: p.planId,
        name: p.name,
        description: p.description || '',
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        currency: p.currency,
        features: p.features || [],
        isCustom: p.isCustom,
        billingPeriod: p.billingPeriod,
        isActive: p.isActive,
        role: p.role || 'user', // Add role information
        limits: p.limits || {}, // Add limits
        featureFlags: p.featureFlags || {}, // Add feature flags
      })),
      roleMapping: {
        'free': 'user',
        'starter': 'user',
        'pro': 'manager',
        'enterprise': 'admin',
        'custom': 'admin',
        'owner': 'super-admin'
      }
    });
  } catch (e: any) {
    console.error('Get plans error:', e);
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdminRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      planId,
      name,
      description,
      priceMonthly,
      priceYearly,
      currency = 'USD',
      features,
      billingPeriod = 'both',
      role = 'user', // NEW: Role assignment with plan
      limits = {}, // NEW: Custom limits per role
      featureFlags = {}, // NEW: Feature flags per plan
    } = body;

    // Validations
    if (!planId || !name || priceMonthly === undefined) {
      return NextResponse.json(
        { error: 'planId, name, and priceMonthly are required' },
        { status: 400 }
      );
    }

    // NEW: Validate role
    if (!['user', 'manager', 'admin', 'super-admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be: user, manager, admin, or super-admin' 
      }, { status: 400 });
    }

    if (typeof priceMonthly !== 'number' || priceMonthly < 0) {
      return NextResponse.json({ error: 'priceMonthly must be a non-negative number' }, { status: 400 });
    }

    if (priceYearly !== undefined && (typeof priceYearly !== 'number' || priceYearly < 0)) {
      return NextResponse.json({ error: 'priceYearly must be a non-negative number' }, { status: 400 });
    }

    await connectDB();

    // Check if planId already exists
    const existing = await Plan.findOne({ planId });
    if (existing) {
      return NextResponse.json({ error: 'Plan ID already exists' }, { status: 400 });
    }

    const plan = await Plan.create({
      planId,
      name,
      description: description || undefined,
      priceMonthly,
      priceYearly: priceYearly || undefined,
      currency,
      features: features || [],
      isCustom: true,
      billingPeriod,
      isActive: true,
      role, // NEW: Assign role
      limits, // NEW: Set limits
      featureFlags, // NEW: Set feature flags
    });

    return NextResponse.json({
      success: true,
      plan: {
        id: String(plan._id),
        planId: plan.planId,
        name: plan.name,
        description: plan.description || '',
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        features: plan.features,
        isCustom: plan.isCustom,
        billingPeriod: plan.billingPeriod,
        isActive: plan.isActive,
        role: plan.role, // NEW: Include role in response
        limits: plan.limits, // NEW: Include limits
        featureFlags: plan.featureFlags, // NEW: Include feature flags
      },
    });
  } catch (e: any) {
    console.error('Create plan error:', e);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdminRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      name,
      description,
      priceMonthly,
      priceYearly,
      currency,
      features,
      billingPeriod,
      isActive,
      role, // NEW: Allow changing role
      limits, // NEW: Allow changing limits
      featureFlags, // NEW: Allow changing feature flags
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Validate price fields
    if (priceMonthly !== undefined) {
      if (typeof priceMonthly !== 'number' || priceMonthly < 0) {
        return NextResponse.json(
          { error: 'priceMonthly must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    if (priceYearly !== undefined) {
      if (typeof priceYearly !== 'number' || priceYearly < 0) {
        return NextResponse.json(
          { error: 'priceYearly must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || undefined;
    if (priceMonthly !== undefined) updateData.priceMonthly = priceMonthly;
    if (priceYearly !== undefined) updateData.priceYearly = priceYearly || undefined;
    if (currency !== undefined) updateData.currency = currency;
    if (features !== undefined) updateData.features = features;
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) {
      // NEW: Validate role
      if (!['user', 'manager', 'admin', 'super-admin'].includes(role)) {
        return NextResponse.json({ 
          error: 'Invalid role. Must be: user, manager, admin, or super-admin' 
        }, { status: 400 });
      }
      updateData.role = role;
    }
    if (limits !== undefined) updateData.limits = limits;
    if (featureFlags !== undefined) updateData.featureFlags = featureFlags;

    await connectDB();
    const plan = await Plan.findByIdAndUpdate(id, updateData, { new: true });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: String(plan._id),
        planId: plan.planId,
        name: plan.name,
        description: plan.description || '',
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        features: plan.features,
        isCustom: plan.isCustom,
        billingPeriod: plan.billingPeriod,
        isActive: plan.isActive,
        role: plan.role, // NEW: Include role
        limits: plan.limits, // NEW: Include limits
        featureFlags: plan.featureFlags, // NEW: Include feature flags
      },
    });
  } catch (e: any) {
    console.error('Update plan error:', e);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isSuperAdminRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    await connectDB();

    // Soft delete - set isActive to false
    const plan = await Plan.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Plan deactivated successfully',
    });
  } catch (e: any) {
    console.error('Delete plan error:', e);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
