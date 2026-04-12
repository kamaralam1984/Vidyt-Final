export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getBenchmarkComparison } from '@/services/analytics/advanced';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const benchmark = await getBenchmarkComparison(authUser.id);

    return NextResponse.json({
      success: true,
      benchmark,
    });
  } catch (error: any) {
    console.error('Benchmark comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to get benchmark comparison' },
      { status: 500 }
    );
  }
}
