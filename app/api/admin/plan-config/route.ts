export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import PlatformControl from '@/models/PlatformControl';
import { getUserFromRequest } from '@/lib/auth';
import { refreshPlanCache } from '@/lib/planLimits';

/**
 * GET /api/admin/plan-config
 * Returns all plans with their full configuration (limits, role, features)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !['super-admin', 'superadmin', 'admin'].includes(user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const [plans, platforms] = await Promise.all([
      Plan.find({}).sort({ priceMonthly: 1 }).lean(),
      PlatformControl.find({}).lean(),
    ]);

    const platformRows = (platforms || []).map((p: { platform?: string; isEnabled?: boolean; allowedPlans?: string[] }) => ({
      platform: String(p.platform || ''),
      isEnabled: !!p.isEnabled,
      allowedPlans: Array.isArray(p.allowedPlans) ? p.allowedPlans : [],
    }));

    return NextResponse.json({
      success: true,
      platformRows,
      plans: plans.map((p: any) => ({
        id: String(p._id),
        planId: p.planId,
        name: p.name,
        label: p.label || p.name,
        role: p.role || 'user',
        limits: p.limits || {},
        featureFlags: p.featureFlags || {},
        limitsDisplay: p.limitsDisplay || {},
        priceMonthly: p.priceMonthly,
        navFeatureAccess: (p.navFeatureAccess && typeof p.navFeatureAccess === 'object' ? p.navFeatureAccess : {}) as Record<string, boolean>,
      })),
    });
  } catch (error: any) {
    console.error('Get plan config error:', error);
    return NextResponse.json({ error: 'Failed to load plan configurations' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/plan-config
 * Updates a plan's configuration by planId
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !['super-admin', 'superadmin', 'admin'].includes(user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { planId, role, limits, featureFlags, limitsDisplay, label, navFeatureAccess } = body;

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {};
    if (role) updateData.role = role;
    if (limits) updateData.limits = limits;
    if (featureFlags) updateData.featureFlags = featureFlags;
    if (limitsDisplay) updateData.limitsDisplay = limitsDisplay;
    if (label !== undefined) updateData.label = label;
    if (navFeatureAccess !== undefined && navFeatureAccess !== null && typeof navFeatureAccess === 'object') {
      updateData.navFeatureAccess = navFeatureAccess;
    }

    const plan = await Plan.findOneAndUpdate(
      { planId },
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Clear the runtime cache so changes apply immediately
    await refreshPlanCache();

    return NextResponse.json({
      success: true,
      message: `Plan ${planId} configuration updated successfully`,
      plan: {
        planId: plan.planId,
        role: plan.role,
        limits: plan.limits,
        featureFlags: plan.featureFlags,
        limitsDisplay: plan.limitsDisplay,
        navFeatureAccess: (plan as any).navFeatureAccess || {},
      },
    });
  } catch (error: any) {
    console.error('Update plan config error:', error);
    return NextResponse.json({ error: 'Failed to update plan configuration' }, { status: 500 });
  }
}
