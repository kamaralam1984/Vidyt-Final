export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import Plan from '@/models/Plan';
import PlatformControl from '@/models/PlatformControl';
import { ALL_FEATURES } from '@/utils/features';
import { navPlanAllowsFeature } from '@/lib/computeUserFeatureAccess';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Fetch all relevant data
    const [existingFeatures, plans, platforms] = await Promise.all([
      FeatureAccess.find({}),
      Plan.find({}).sort({ priceMonthly: 1 }),
      PlatformControl.find({})
    ]);

    // Roles and Plans lists
    const roles = ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'];
    const planIds = plans.map(p => p.planId);

    const platformRows = platforms.map((p: { platform?: string; isEnabled?: boolean; allowedPlans?: string[] }) => ({
      platform: String(p.platform || ''),
      isEnabled: !!p.isEnabled,
      allowedPlans: Array.isArray(p.allowedPlans) ? p.allowedPlans : [],
    }));

    // Merge everything into a unified structure
    const unifiedFeatures = ALL_FEATURES.map(f => {
      const dbFeature = existingFeatures.find(dbf => dbf.feature === f.id);

      // Determine what type of feature this is and get its current state
      let planAccess: Record<string, boolean> = {};

      // Check if this feature is plan-specific (either in group 'ai_studio' or 'platform')
      if (f.group === 'ai_studio') {
        plans.forEach(p => {
          // Check in Plan.featureFlags (mongoose object)
          planAccess[p.planId] = !!(p.featureFlags as any)[f.id];
        });
      } else if (f.group === 'platform') {
        const platformId = f.id.replace('platform_', '');
        const pc = platforms.find(p => p.platform === platformId);
        planIds.forEach(pid => {
          // If no specific PlatformControl entry exists, assume all have access by default OR follow defaultPlatforms rules
          planAccess[pid] = pc ? pc.allowedPlans.includes(pid) : true;
        });
      } else if (['sidebar', 'dashboard', 'other', 'yt_seo_sections'].includes(f.group)) {
        plans.forEach(p => {
          const planLean = {
            planId: p.planId,
            featureFlags: (p.featureFlags || {}) as Record<string, boolean>,
            navFeatureAccess: ((p as { navFeatureAccess?: Record<string, boolean> }).navFeatureAccess || {}) as Record<string, boolean>,
          };
          planAccess[p.planId] = navPlanAllowsFeature(f, planLean, p.planId, platformRows);
        });
      }

      return {
        id: f.id,
        label: f.label,
        group: f.group,
        enabled: dbFeature ? dbFeature.enabled : true,
        allowedRoles: dbFeature ? dbFeature.allowedRoles : f.defaultRoles,
        planAccess: Object.keys(planAccess).length > 0 ? planAccess : null,
      };
    });

    return NextResponse.json({
      success: true,
      features: unifiedFeatures,
      roles,
      plans: plans.map(p => ({ id: p.planId, label: p.label || p.name }))
    });
  } catch (error: any) {
    console.error('Unified Matrix GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || !['super-admin', 'superadmin', 'admin'].includes(authUser.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { updates } = await request.json();
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    await connectDB();

    const results = [];

    for (const update of updates) {
      const { id, type, target, value } = update;
      // type: 'role' | 'plan' | 'global'
      // target: roleId | planId
      // value: boolean

      const featureDef = ALL_FEATURES.find(f => f.id === id);
      if (!featureDef) {
        results.push({ id, status: 'error', message: 'Feature definition not found' });
        continue;
      }

      try {
        if (type === 'global' || type === 'role') {
          // Update FeatureAccess (Role-based UI control)
          const dbFeature = await FeatureAccess.findOne({ feature: id });
          let allowedRoles = dbFeature ? [...dbFeature.allowedRoles] : [...featureDef.defaultRoles];
          let enabled = dbFeature ? dbFeature.enabled : true;

          if (type === 'global') {
            enabled = value;
          } else if (type === 'role') {
            if (value) {
              if (!allowedRoles.includes(target)) allowedRoles.push(target);
            } else {
              allowedRoles = allowedRoles.filter(r => r !== target);
            }
          }

          await FeatureAccess.findOneAndUpdate(
            { feature: id },
            {
              feature: id,
              enabled,
              allowedRoles,
              label: featureDef.label,
              group: featureDef.group
            },
            { upsert: true }
          );
          results.push({ id, type, target, status: 'success' });
        } else if (type === 'plan') {
          // Plan-based Functional Access
          if (featureDef.group === 'ai_studio') {
            // Update Plan.featureFlags
            const updatedPlan = await Plan.findOneAndUpdate(
              { planId: target },
              { $set: { [`featureFlags.${id}`]: value } },
              { new: true }
            );
            if (!updatedPlan) {
              results.push({ id, type, target, status: 'error', message: `Plan ${target} not found` });
            } else {
              results.push({ id, type, target, status: 'success' });
            }
          } else if (featureDef.group === 'platform') {
            // Update PlatformControl.allowedPlans
            const platformId = id.replace('platform_', '');
            const pc = await PlatformControl.findOne({ platform: platformId });
            let allowedPlans = pc ? [...pc.allowedPlans] : ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'];

            if (value) {
              if (!allowedPlans.includes(target)) allowedPlans.push(target);
            } else {
              allowedPlans = allowedPlans.filter(p => p !== target);
            }

            await PlatformControl.findOneAndUpdate(
              { platform: platformId },
              {
                platform: platformId,
                allowedPlans,
                isEnabled: pc ? pc.isEnabled : true // preserve overall status or default to enabled
              },
              { upsert: true }
            );
            results.push({ id, type, target, status: 'success' });
          } else if (['sidebar', 'dashboard', 'other', 'yt_seo_sections'].includes(featureDef.group)) {
            const updatedPlan = await Plan.findOneAndUpdate(
              { planId: target },
              { $set: { [`navFeatureAccess.${id}`]: value } },
              { new: true }
            );
            if (!updatedPlan) {
              results.push({ id, type, target, status: 'error', message: `Plan ${target} not found` });
            } else {
              results.push({ id, type, target, status: 'success' });
            }
          } else {
            results.push({ id, type, target, status: 'error', message: 'Plan toggle not supported for this feature group' });
          }
        }
      } catch (err: any) {
        console.error(`Error updating feature ${id}:`, err);
        results.push({ id, type, target, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Unified Matrix PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
