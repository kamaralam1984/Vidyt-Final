import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  loginPin: z.string().min(4).max(6).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = registerSchema.parse(body);
    const { email, password, name, companyName, phone, loginPin } = validated;

    // Register user
    const { user, token, uniqueId } = await registerUser(email, password, name, companyName, phone, loginPin);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uniqueId: uniqueId,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
      },
      token,
      uniqueId,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 400 }
    );
  }
}
