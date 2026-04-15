export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { z } from 'zod';
import { getClientIP, trackFailure, rateLimit, isIPBlocked, RATE_LIMITS } from '@/lib/rateLimiter';
import { generateRefreshToken } from '@/lib/auth-jwt';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

async function handleLogin(request: NextRequest) {
  const ip = getClientIP(request);

  // Block immediately if IP is flagged
  if (isIPBlocked(ip)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  // Strict rate limit: 5 attempts per 15 minutes per IP
  const rl = rateLimit(`login:${ip}`, RATE_LIMITS.login);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter ?? 900),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      }
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
    const { email, password } = validated;

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
        maxAge: 60 * 15, // 15 minutes
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
      // Track login failure for rate limiting
      const ip = getClientIP(request);
      const failureKey = `auth_fail:${ip}:${email}`;
      trackFailure(failureKey);
      
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
