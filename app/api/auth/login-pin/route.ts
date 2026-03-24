export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { loginUserWithPin } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { z } from 'zod';

const loginPinSchema = z.object({
  uniqueId: z
    .string()
    .regex(/^\d{6}$/, 'Unique ID must be a 6-digit number'),
  loginPin: z
    .string()
    .min(4, 'PIN must be at least 4 digits')
    .max(6, 'PIN must be at most 6 digits'),
});

export async function POST(request: NextRequest) {
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
    const validated = loginPinSchema.parse(body);
    const { uniqueId, loginPin } = validated;

    // Login user with unique ID + PIN
    const { user, token } = await loginUserWithPin(uniqueId, loginPin);

    // Get user from database to get full details (already connected above)
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(user.id);
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uniqueId: userDoc?.uniqueId || uniqueId,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
        subscriptionPlan: userDoc?.subscriptionPlan,
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

    return response;
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
