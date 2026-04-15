export const dynamic = 'force-dynamic';

/**
 * GET  /api/referral — get current user's referral code + stats
 * POST /api/referral/apply — apply a referral code after signup
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

const BONUS_CREDITS = 5; // analyses added per successful referral

// GET — return referral link, code, and how many credits earned
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const referrals = await Referral.find({ referrerId: user.id, status: 'credited' }).lean();
  const pending = await Referral.countDocuments({ referrerId: user.id, status: 'pending' });

  const code = `REF-${user.id.toString().slice(-8).toUpperCase()}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vidyt.com';

  return NextResponse.json({
    success: true,
    code,
    link: `${baseUrl}/auth?ref=${code}`,
    credited: referrals.length,
    pending,
    totalBonus: referrals.length * BONUS_CREDITS,
  });
}
