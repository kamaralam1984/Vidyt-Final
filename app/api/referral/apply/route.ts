export const dynamic = 'force-dynamic';

/**
 * POST /api/referral/apply
 * Body: { code: "REF-XXXXXXXX" }
 *
 * Called right after signup when a ref= query param is present.
 * - Resolves referrerId from code
 * - Creates Referral record
 * - Adds 5 bonus analyses to both referrer and referred user
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rateLimiter';

const BONUS_CREDITS = 5;

export async function POST(request: NextRequest) {
  // Rate limit: 3 applies per hour per IP (prevent abuse)
  const ip = getClientIP(request);
  const rl = rateLimit(`referral:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const currentUser = await getUserFromRequest(request);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json();
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
  }

  await connectDB();

  // Prevent self-referral
  const selfCode = `REF-${currentUser.id.slice(-8).toUpperCase()}`;
  if (code.toUpperCase() === selfCode) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
  }

  // Check if already applied
  const existing = await Referral.findOne({ referredId: currentUser.id });
  if (existing) {
    return NextResponse.json({ error: 'Referral already applied' }, { status: 409 });
  }

  // Resolve referrer from code (code = "REF-" + last 8 chars of userId uppercased)
  const codeSuffix = code.toUpperCase().replace('REF-', '');
  const allUsers = await User.find({}, '_id').lean();
  const referrer = allUsers.find(
    (u: any) => String(u._id).slice(-8).toUpperCase() === codeSuffix
  );

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  // Create referral record
  await Referral.create({
    referrerId: referrer._id,
    referredId: currentUser.id,
    code: code.toUpperCase(),
    status: 'credited',
    bonusCredits: BONUS_CREDITS,
    creditedAt: new Date(),
  });

  // Add bonus analyses to both users via usageStats
  const bonusUpdate = {
    $inc: { 'usageStats.bonusAnalyses': BONUS_CREDITS },
  };
  await Promise.all([
    User.findByIdAndUpdate(referrer._id, bonusUpdate),
    User.findByIdAndUpdate(currentUser.id, bonusUpdate),
  ]);

  return NextResponse.json({
    success: true,
    message: `Referral applied! Both you and your referrer earned ${BONUS_CREDITS} bonus analyses.`,
    bonusCredits: BONUS_CREDITS,
  });
}
