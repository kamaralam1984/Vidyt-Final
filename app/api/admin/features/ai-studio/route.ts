export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';
import { emitPlanUpdate } from '@/lib/socket-server';

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
    const valid = ['user', 'manager', 'admin', 'enterprise', 'custom', 'super-admin'];
    const roles = allowedRoles.filter((r: string) => valid.includes(r));
    const finalRoles = roles.length ? roles : DEFAULT_ROLES;
    await connectDB();
    // `label` is required by the FeatureAccess schema, so it MUST be provided on
    // insert. Use $setOnInsert so updates don't overwrite an existing label.
    await FeatureAccess.findOneAndUpdate(
      { feature: 'ai_studio' },
      {
        $set: { allowedRoles: finalRoles, enabled: true },
        $setOnInsert: { feature: 'ai_studio', label: 'AI Studio', group: 'ai' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    emitPlanUpdate({ scope: 'plan-config', planId: 'ai_studio_access', action: 'updated' });
    return NextResponse.json({ success: true, allowedRoles: finalRoles });
  } catch (e: any) {
    console.error('[ai-studio access] save error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
