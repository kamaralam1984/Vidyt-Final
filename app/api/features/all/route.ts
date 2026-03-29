export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { buildUserFeatureMap } from '@/lib/buildUserFeatureMap';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ features: {} });
    }
    const features = await buildUserFeatureMap(authUser);
    return NextResponse.json({ features });
  } catch {
    return NextResponse.json({ features: {} });
  }
}
