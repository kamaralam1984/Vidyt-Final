import { normalizePlan } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import Plan from '@/models/Plan';
import PlatformControl from '@/models/PlatformControl';
import { computeUserFeatureAccess } from '@/lib/computeUserFeatureAccess';

export type AuthUserLike = { role: string; subscription?: string };

/** Same visibility map as GET /api/features/all — plan + platform + Feature Matrix + role. */
export async function buildUserFeatureMap(authUser: AuthUserLike): Promise<Record<string, boolean>> {
  await connectDB();
  const planId = normalizePlan(authUser.subscription);

  const [existingFeatures, plan, platforms] = await Promise.all([
    FeatureAccess.find({}).lean(),
    Plan.findOne({ planId }).lean(),
    PlatformControl.find({}).lean(),
  ]);

  const platformRows = (platforms || []).map((p: { platform?: string; isEnabled?: boolean; allowedPlans?: string[] }) => ({
    platform: String(p.platform || ''),
    isEnabled: !!p.isEnabled,
    allowedPlans: Array.isArray(p.allowedPlans) ? p.allowedPlans : [],
  }));

  return computeUserFeatureAccess({
    role: authUser.role,
    subscription: authUser.subscription || 'free',
    featureAccessDocs: existingFeatures as { feature: string; enabled?: boolean; allowedRoles?: string[] }[],
    plan: plan
      ? {
          planId: (plan as { planId: string }).planId,
          featureFlags: (((plan as { featureFlags?: Record<string, boolean> }).featureFlags || {}) as Record<string, boolean>),
        }
      : null,
    platforms: platformRows,
  });
}
