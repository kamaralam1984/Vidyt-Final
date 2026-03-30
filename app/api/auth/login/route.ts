export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { z } from 'zod';
import { withAuthRateLimit } from '@/middleware/rateLimitMiddleware';
import { getClientIP, trackFailure } from '@/lib/rateLimiter';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

async function handleLogin(request: NextRequest) {
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

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          uniqueId: userDoc?.uniqueId,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
          subscriptionPlan: userDoc?.subscriptionPlan,
        },
        token,
      });

      // Set cookie for direct API access (OAuth flows)
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
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
    return NextResponse.json(
      {
        error: error.message || 'Login failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 401 }
    );
  }
}

// Wrap with auth rate limiting (3 attempts per 15 minutes)
export const POST = withAuthRateLimit(
  (req) => handleLogin(req),
  { endpoint: '/api/auth/login', preset: 'login' }
);
