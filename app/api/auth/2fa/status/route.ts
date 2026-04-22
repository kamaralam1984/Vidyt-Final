export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(authUser.id).select('twoFactorEnabled twoFactorSecret').lean<any>();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    enabled: Boolean(user.twoFactorEnabled),
    pendingEnrollment: Boolean(!user.twoFactorEnabled && user.twoFactorSecret),
  });
}
