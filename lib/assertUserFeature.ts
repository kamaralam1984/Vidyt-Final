import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { buildUserFeatureMap } from '@/lib/buildUserFeatureMap';

const DEFAULT_MSG = 'This feature is not available for your plan or role.';

export async function denyIfNoFeature(
  request: NextRequest,
  featureId: string,
  message = DEFAULT_MSG
): Promise<NextResponse | null> {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const map = await buildUserFeatureMap(user);
  if (!map[featureId]) return NextResponse.json({ error: message }, { status: 403 });
  return null;
}

export async function denyIfNoAnyFeature(
  request: NextRequest,
  featureIds: string[],
  message = DEFAULT_MSG
): Promise<NextResponse | null> {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const map = await buildUserFeatureMap(user);
  if (!featureIds.some((id) => map[id])) return NextResponse.json({ error: message }, { status: 403 });
  return null;
}
