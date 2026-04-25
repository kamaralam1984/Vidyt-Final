export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh
 *
 * Reads the httpOnly "refresh_token" cookie, verifies it, fetches the
 * latest user data from DB, and issues a new access token + rotated
 * refresh token (token rotation prevents refresh token theft replay).
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateToken, generateRefreshToken } from '@/lib/auth-jwt';
import connectDB from '@/lib/mongodb';
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = rateLimit(`refresh:${ip}`, { limit: 30, windowMs: 60 * 1000 }); // 30/min
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) {
    // Token invalid or expired — clear the cookie
    const res = NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    res.cookies.delete('refresh_token');
    return res;
  }

  try {
    await connectDB();
    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).lean() as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const authUser = {
      id: String(user._id),
      email: user.email,
      name: user.name || '',
      role: user.role || 'user',
      subscription: user.subscription || 'free',
    };

    // Issue new access token + rotate refresh token
    const [newAccessToken, newRefreshToken] = await Promise.all([
      generateToken(authUser),
      generateRefreshToken(String(user._id)),
    ]);

    const response = NextResponse.json({
      success: true,
      token: newAccessToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
        subscription: authUser.subscription,
        subscriptionPlan: user.subscriptionPlan,
      },
    });

    // Rotate httpOnly refresh token cookie
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/api/auth/refresh',   // narrow path — not sent on every request
    });

    return response;
  } catch (error: any) {
    console.error('[auth/refresh] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
