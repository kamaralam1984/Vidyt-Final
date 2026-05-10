export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  generateToken,
  generateRefreshToken,
  verifyPre2FAToken,
  type AuthUser,
} from '@/lib/auth-jwt';
import { getRoleFromPlanAndUser, normalizePlan } from '@/lib/auth';
import { getClientIP, trackFailure, isIPBlocked } from '@/lib/rateLimiter';

const schema = z.object({
  preToken: z.string().min(1, 'Challenge token is required'),
  backupCode: z.string().min(6, 'Backup code is required'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  if (isIPBlocked(ip)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const userId = await verifyPre2FAToken(parsed.data.preToken);
  if (!userId) {
    return NextResponse.json(
      { error: 'Challenge expired or invalid. Please log in again.' },
      { status: 401 },
    );
  }

  // Normalize: backup codes were issued uppercase with dash separators
  const candidate = parsed.data.backupCode.trim().toUpperCase().replace(/\s+/g, '');

  await connectDB();
  const user = await User.findById(userId).select('+twoFactorBackupCodes');
  const codes: string[] = ((user as any)?.twoFactorBackupCodes as string[]) || [];
  if (!user || !user.twoFactorEnabled || codes.length === 0) {
    trackFailure(ip);
    return NextResponse.json(
      { error: 'No backup codes are configured for this account.' },
      { status: 400 },
    );
  }

  let matchedIndex = -1;
  for (let i = 0; i < codes.length; i++) {
    // bcrypt.compare is timing-safe; iterate sequentially to avoid burning CPU on parallel hashes
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(candidate, codes[i])) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex < 0) {
    trackFailure(ip);
    return NextResponse.json({ error: 'Invalid backup code.' }, { status: 400 });
  }

  // Consume the matched code so it cannot be reused
  codes.splice(matchedIndex, 1);
  (user as any).twoFactorBackupCodes = codes;

  const role = getRoleFromPlanAndUser(user as any);
  const authUser: AuthUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: role as any,
    subscription: user.subscription as any,
  };
  const token = await generateToken(authUser);

  user.lastLogin = new Date();
  user.role = role as any;
  user.subscription = normalizePlan(user.subscription) as any;
  await user.save();

  const response = NextResponse.json({
    success: true,
    user: {
      id: authUser.id,
      uniqueId: user.uniqueId,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
      subscription: authUser.subscription,
      subscriptionPlan: user.subscriptionPlan,
    },
    token,
    remainingBackupCodes: codes.length,
  });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  const refreshToken = await generateRefreshToken(authUser.id);
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/api/auth/refresh',
  });

  return response;
}
