import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';

const DEFAULT_AI_STUDIO_ROLES = ['manager', 'admin', 'super-admin'];
const DEFAULT_TOOL_ROLES = ['manager', 'admin', 'super-admin'];

export async function requireAIStudioAccess(
  request: NextRequest
): Promise<{ allowed: true; userId: string; role: string } | { allowed: false; status: number; error: string }> {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return { allowed: false, status: 401, error: 'Unauthorized' };
  try {
    await connectDB();
    const doc = (await FeatureAccess.findOne({ feature: 'ai_studio' }).lean()) as { allowedRoles?: string[] } | null;
    const allowedRoles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_AI_STUDIO_ROLES;
    if (!allowedRoles.includes(authUser.role)) {
      return { allowed: false, status: 403, error: 'AI Studio access not granted for your role. Contact admin.' };
    }
    return { allowed: true, userId: authUser.id, role: authUser.role };
  } catch {
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
    const doc = (await FeatureAccess.findOne({ feature: featureKey }).lean()) as { allowedRoles?: string[] } | null;
    const allowedRoles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_TOOL_ROLES;
    if (!allowedRoles.includes(studio.role)) {
      return {
        allowed: false,
        status: 403,
        error: 'Is AI tool ka access aapke role ke liye enabled nahi hai. Super Admin se baat karein.',
      };
    }
    return studio;
  } catch {
    return { allowed: false, status: 403, error: 'Tool access check failed' } as any;
  }
}

