import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { ALL_FEATURES } from '@/utils/features';

const DEFAULT_AI_STUDIO_ROLES = ['manager', 'admin', 'super-admin'];
const DEFAULT_TOOL_ROLES = ['manager', 'admin', 'super-admin'];

export async function requireAIStudioAccess(
  request: NextRequest
): Promise<{ allowed: true; userId: string; role: string; user: any } | { allowed: false; status: number; error: string }> {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return { allowed: false, status: 401, error: 'Unauthorized' };
  try {
    await connectDB();
    const [doc, user] = await Promise.all([
      FeatureAccess.findOne({ feature: 'ai_studio' }).lean() as Promise<{ allowedRoles?: string[] } | null>,
      User.findById(authUser.id).lean()
    ]);

    if (!user) return { allowed: false, status: 404, error: 'User not found' };

    const allowedRoles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_AI_STUDIO_ROLES;
    if (!allowedRoles.includes(authUser.role)) {
      return { allowed: false, status: 403, error: 'AI Studio access not granted for your role. Contact admin.' };
    }
    return { allowed: true, userId: authUser.id, role: authUser.role, user };
  } catch (err) {
    console.error('Access check error:', err);
    return { allowed: false, status: 403, error: 'Access check failed' };
  }
}

export async function requireAIToolAccess(
  request: NextRequest,
  featureKey: string
): Promise<{ allowed: true; userId: string; role: string } | { allowed: false; status: number; error: string }> {
  const studio = await requireAIStudioAccess(request);
  if (!('allowed' in studio) || !studio.allowed) return studio as any;
  
  try {
    await connectDB();
    
    // 1. Check Global/Role-based access via FeatureAccess
    const doc = (await FeatureAccess.findOne({ feature: featureKey }).lean()) as { enabled: boolean; allowedRoles?: string[] } | null;
    
    // If feature is explicitly disabled globally
    if (doc && doc.enabled === false) {
      return {
        allowed: false,
        status: 403,
        error: `Feature '${featureKey}' is currently disabled by administrator.`,
      };
    }

    // Super-admin always has full access to all AI tools
    const isSuperAdmin = studio.role === 'super-admin' || studio.role === 'superadmin';

    const allowedRoles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_TOOL_ROLES;
    if (!isSuperAdmin && !allowedRoles.includes(studio.role)) {
      return {
        allowed: false,
        status: 403,
        error: 'This AI tool is not enabled for your role. Contact Super Admin.',
      };
    }

    // 2. Check Plan-based functional access via Plan.featureFlags
    // Super-admin bypasses plan checks entirely
    if (!isSuperAdmin) {
      const planId = studio.user.subscription || 'free';
      const plan = (await Plan.findOne({ planId }).lean()) as any;

      if (plan) {
        const featureDef = ALL_FEATURES.find(f => f.id === featureKey);
        const isAiStudioFeature = featureDef?.group === 'ai_studio';
        const flagValue = plan.featureFlags ? (plan.featureFlags as any)[featureKey] : undefined;

        if (isAiStudioFeature) {
          if (flagValue !== true) {
            return {
              allowed: false,
              status: 403,
              error: `Your current plan (${plan.label || planId}) does not support this AI feature (${featureDef?.label || featureKey}). Please upgrade.`,
            };
          }
        } else {
          if (flagValue === false) {
            return {
              allowed: false,
              status: 403,
              error: `Feature '${featureDef?.label || featureKey}' is disabled for your plan.`,
            };
          }
        }
      }
    }


    return studio;
  } catch (err) {
    console.error('Tool access check error:', err);
    return { allowed: false, status: 403, error: 'Tool access check failed' } as any;
  }
}


