import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';

const DEFAULT_ROLES = ['manager', 'admin', 'super-admin'];

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await connectDB();
    const doc = await FeatureAccess.findOne({ feature: 'ai_studio' }).lean() as { allowedRoles?: string[] } | null;
    const roles = doc?.allowedRoles?.length ? doc.allowedRoles : DEFAULT_ROLES;
    return NextResponse.json({ allowedRoles: roles });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { allowedRoles } = body;
    if (!Array.isArray(allowedRoles)) return NextResponse.json({ error: 'allowedRoles array required' }, { status: 400 });
    const valid = ['user', 'manager', 'admin', 'super-admin'];
    const roles = allowedRoles.filter((r: string) => valid.includes(r));
    await connectDB();
    await FeatureAccess.findOneAndUpdate(
      { feature: 'ai_studio' },
      { feature: 'ai_studio', allowedRoles: roles.length ? roles : DEFAULT_ROLES },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, allowedRoles: roles.length ? roles : DEFAULT_ROLES });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
