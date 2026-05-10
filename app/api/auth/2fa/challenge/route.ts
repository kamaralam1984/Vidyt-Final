export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { decryptSecret, verifyTotp } from '@/lib/totp';
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
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
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

  await connectDB();
  const user = await User.findById(userId);
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    trackFailure(ip);
    return NextResponse.json({ error: '2FA is not configured for this account.' }, { status: 400 });
  }

  let secret: string;
  try {
    secret = decryptSecret(user.twoFactorSecret);
  } catch {
    return NextResponse.json({ error: 'Could not verify 2FA secret.' }, { status: 500 });
  }

  if (!verifyTotp(secret, parsed.data.code)) {
    trackFailure(ip);
    return NextResponse.json(
      { error: 'Invalid code. Check your authenticator clock.' },
      { status: 400 },
    );
  }

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
  user.save().catch((e: any) => console.warn('[2fa/challenge] lastLogin save skipped:', e.message));

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
