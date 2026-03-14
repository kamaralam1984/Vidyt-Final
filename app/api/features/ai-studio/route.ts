import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';

const DEFAULT_AI_STUDIO_ROLES = ['manager', 'admin', 'super-admin'];

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ allowed: false }, { status: 200 });
    await connectDB();
    const doc = await FeatureAccess.findOne({ feature: 'ai_studio' }).lean() as { allowedRoles?: string[] } | null;
    const allowedRoles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_AI_STUDIO_ROLES;
    const allowed = allowedRoles.includes(authUser.role);
    return NextResponse.json({ allowed, allowedRoles });
  } catch {
    return NextResponse.json({ allowed: false }, { status: 200 });
  }
}
