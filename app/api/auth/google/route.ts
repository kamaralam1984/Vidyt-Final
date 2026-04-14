export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { OAuth2Client } from 'google-auth-library';
import { generateUniqueNumericId, getRoleFromPlanAndUser, normalizePlan } from '@/lib/auth';
import { generateToken, type AuthUser } from '@/lib/auth-jwt';
import { getClientIP, trackFailure } from '@/lib/rateLimiter';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json({ error: 'Google credential missing' }, { status: 400 });
    }

    // Verify token with google-auth-library
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: [
          process.env.GOOGLE_CLIENT_ID || '', 
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
        ],
      });
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      const ip = getClientIP(request);
      trackFailure(`google_auth_fail:${ip}`);
      return NextResponse.json({ error: 'Invalid Google credential' }, { status: 401 });
    }

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Failed to retrieve email from Google payload' }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (dbError: any) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    const User = (await import('@/models/User')).default;

    // Look for existing user by googleId or email
    let user = await User.findOne({ 
      $or: [
        { googleId: payload.sub },
        { email: payload.email }
      ]
    });

    if (user) {
      // Update googleId and photo if they were missing (i.e. user signed up via email previously)
      let needsUpdate = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        needsUpdate = true;
      }
      if (!user.profilePicture && payload.picture) {
        user.profilePicture = payload.picture;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await user.save();
      }
    } else {
      // Create new user
      const uniqueId = await generateUniqueNumericId();
      user = new User({
        uniqueId,
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        profilePicture: payload.picture,
        role: 'user',
        subscription: 'free',
        emailVerified: payload.email_verified || true
      });
      await user.save();
    }

    const role = getRoleFromPlanAndUser(user);
    const normalizedPlan = normalizePlan(user.subscription);
    
    // Update last login
    user.lastLogin = new Date();
    user.role = role;
    user.subscription = normalizedPlan;
    await user.save();

    const authUser: AuthUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      subscription: user.subscription as any,
    };

    const token = await generateToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        uniqueId: user.uniqueId,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
        subscriptionPlan: user.subscriptionPlan,
      },
      token,
    });

    // Set cookie for direct API access
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Google Auth error:', error);
    return NextResponse.json(
      { error: 'Google Sign-in failed. Please try again.' },
      { status: 500 }
    );
  }
}
