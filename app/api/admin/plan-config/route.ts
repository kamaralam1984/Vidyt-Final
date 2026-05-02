export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Plan from '@/models/Plan';
import PlatformControl from '@/models/PlatformControl';
import { getUserFromRequest } from '@/lib/auth';
import { refreshPlanCache } from '@/lib/planSync';
import { emitPlanUpdate } from '@/lib/socket-server';
import { deleteCacheJSON } from '@/lib/cache';
import { memDelete } from '@/lib/in-memory-cache';

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
    if (limits) {
      // `limits.featureLimits` is a registry-driven Mixed map; sanitize so
      // only well-formed entries reach the DB.
      const sanitizedLimits: any = { ...limits };
      if (limits.featureLimits && typeof limits.featureLimits === 'object') {
        const cleaned: Record<string, { value: number; period: string }> = {};
        for (const [k, v] of Object.entries(limits.featureLimits as Record<string, any>)) {
          if (!v || typeof v !== 'object') continue;
          const value = Number(v.value);
          const period = ['day', 'week', 'month', 'lifetime'].includes(v.period) ? v.period : 'month';
          if (!Number.isFinite(value)) continue;
          cleaned[k] = { value, period };
        }
        sanitizedLimits.featureLimits = cleaned;
      }
      updateData.limits = sanitizedLimits;
    }
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

    // Invalidate the public /api/subscriptions/plans cache (mem + redis)
    for (const key of ['api:plans:1', 'api:plans:0']) {
      memDelete(key);
      try { await deleteCacheJSON(key); } catch { /* redis optional */ }
    }

    // Push live update to every connected client
    emitPlanUpdate({ scope: 'plan-config', planId, action: 'updated' });

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
