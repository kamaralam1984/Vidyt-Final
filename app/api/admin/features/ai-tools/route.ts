export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FeatureAccess from '@/models/FeatureAccess';

const DEFAULT_ROLES = ['manager', 'admin', 'super-admin'];

const FEATURE_KEYS = [
  'daily_ideas',
  'ai_coach',
  'keyword_research',
  'script_writer',
  'title_generator',
  'channel_audit',
  'ai_shorts_clipping',
  'ai_thumbnail_maker',
  'optimize',
] as const;

type FeatureKey = (typeof FEATURE_KEYS)[number];

function serialize(doc: any | null) {
  const roles = doc?.allowedRoles?.length ? (doc.allowedRoles as string[]) : DEFAULT_ROLES;
  return roles;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const docs = await FeatureAccess.find({
      feature: { $in: FEATURE_KEYS },
    }).lean();

    const byFeature: Record<FeatureKey, string[]> = {} as any;
    FEATURE_KEYS.forEach((key) => {
      const doc = docs.find((d: any) => d.feature === key) || null;
      byFeature[key] = serialize(doc);
    });

    return NextResponse.json({ features: byFeature });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser || authUser.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const incoming = body?.features as Record<string, string[]> | undefined;
    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json({ error: 'features object required' }, { status: 400 });
    }

    const validRoles = ['user', 'manager', 'admin', 'super-admin'];

    await connectDB();

    for (const key of FEATURE_KEYS) {
      const rawRoles = Array.isArray(incoming[key]) ? incoming[key] : DEFAULT_ROLES;
      const roles = rawRoles.filter((r) => validRoles.includes(r));
      await FeatureAccess.findOneAndUpdate(
        { feature: key },
        { feature: key, allowedRoles: roles.length ? roles : DEFAULT_ROLES },
        { upsert: true, new: true }
      );
    }

    const docs = await FeatureAccess.find({
      feature: { $in: FEATURE_KEYS },
    }).lean();
    const byFeature: Record<FeatureKey, string[]> = {} as any;
    FEATURE_KEYS.forEach((key) => {
      const doc = docs.find((d: any) => d.feature === key) || null;
      byFeature[key] = serialize(doc);
    });

    return NextResponse.json({ success: true, features: byFeature });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

