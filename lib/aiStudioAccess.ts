import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';

const DEFAULT_AI_STUDIO_ROLES = ['manager', 'admin', 'super-admin'];

export async function requireAIStudioAccess(request: NextRequest): Promise<{ allowed: true; userId: string } | { allowed: false; status: number; error: string }> {
  const authUser = await getUserFromRequest(request);
  if (!authUser) return { allowed: false, status: 401, error: 'Unauthorized' };
  try {
    await connectDB();
    const doc = await FeatureAccess.findOne({ feature: 'ai_studio' }).lean() as { allowedRoles?: string[] } | null;
    const allowedRoles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_AI_STUDIO_ROLES;
    if (!allowedRoles.includes(authUser.role)) {
      return { allowed: false, status: 403, error: 'AI Studio access not granted for your role. Contact admin.' };
    }
    return { allowed: true, userId: authUser.id };
  } catch {
    return { allowed: false, status: 403, error: 'Access check failed' };
  }
}
