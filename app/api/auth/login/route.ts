export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { z } from 'zod';
import { getClientIP, trackFailure, rateLimit, isIPBlocked, RATE_LIMITS } from '@/lib/rateLimiter';
import { generateRefreshToken, generatePre2FAToken } from '@/lib/auth-jwt';
import { verifyTurnstile } from '@/lib/turnstile';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  turnstileToken: z.string().optional(),
});

async function handleLogin(request: NextRequest) {
  const ip = getClientIP(request);

  // Block only if IP has too many FAILED attempts (not all attempts)
  if (isIPBlocked(ip)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  try {
    // Connect to database first
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('Database connection error in login:', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed. Please try again.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate input
    const validated = loginSchema.parse(body);
    const { email, password, turnstileToken } = validated;

    const captcha = await verifyTurnstile(turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Login user
    try {
      const { user, token } = await loginUser(email, password);

      // Fetch full user to include uniqueId
      const User = (await import('@/models/User')).default;
      const userDoc = await User.findById(user.id);

      if (!userDoc) {
        console.error(`[API:Login] User document not found in DB after auth for member: ${email}`);
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      // 2FA gate: password is correct, but a second factor is required.
      // Issue a short-lived challenge token instead of a session.
      if (userDoc.twoFactorEnabled) {
        const preToken = await generatePre2FAToken(user.id);
        console.log(`[API:Login] 2FA required for ${email}`);
        return NextResponse.json({
          success: true,
          requires2FA: true,
          preToken,
          email: user.email,
        });
      }

      console.log(`[API:Login] Success: ${email} (Role: ${user.role}, UniqueId: ${userDoc.uniqueId})`);

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          uniqueId: userDoc.uniqueId,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
          subscriptionPlan: userDoc.subscriptionPlan,
        },
        token,
      });

      // Short-lived access token cookie (15 min) for SSR/OAuth flows
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      // Long-lived refresh token (30 days) — narrow path so it's not sent on every request
      const refreshToken = await generateRefreshToken(user.id);
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/api/auth/refresh',
      });

      return response;
    } catch (authError: any) {
      // Track failure by IP so blockIP mechanism works correctly
      const ip = getClientIP(request);
      trackFailure(ip);
      throw authError;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    // Only expose the auth error message (wrong password/email). All other errors
    // (DB quota, network, internal) must return a generic message so internal
    // details are never leaked to users.
    const isAuthError = /invalid email|invalid password|not found|incorrect/i.test(error.message || '');
    return NextResponse.json(
      {
        error: isAuthError ? (error.message || 'Login failed') : 'Login failed. Please try again.',
      },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
