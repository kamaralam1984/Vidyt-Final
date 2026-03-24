export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PendingUser from '@/models/PendingUser';
import { generateOTP, getOTPExpiry } from '@/services/otp';
import { sendOTPEmail } from '@/services/email';
import { hashPassword, normalizePlan, VALID_PLANS } from '@/lib/auth';
import { z } from 'zod';

// Basic rate limiting to prevent OTP and sign up abuse
const globalAny: any = global;
if (!globalAny.otpRateLimitMap) globalAny.otpRateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const rateLimitMap = globalAny.otpRateLimitMap;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(email);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(email, { count: 1, expiresAt: now + 5 * 60 * 1000 }); // 5 minutes window
    return true;
  }
  if (record.count >= 5) { // Max 5 requests per 5 mins per email
    return false;
  }
  record.count += 1;
  return true;
}

const prepareSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  companyName: z.string().min(2).max(100).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  loginPin: z.string().min(4).max(6).optional().or(z.literal('')),
  planId: z.string().optional(),
  billingPeriod: z.enum(['month', 'year']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = prepareSignupSchema.parse(body);
    const { email, password, name, companyName, phone, loginPin, billingPeriod } = validated;

    const selectedPlan = normalizePlan(body.planId);

    console.log("Selected Plan:", selectedPlan);

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    if (!VALID_PLANS.includes(selectedPlan as any)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    if (selectedPlan === "custom") {
      if (!companyName) {
        return NextResponse.json({ error: 'Please provide company details for custom plan' }, { status: 400 });
      }
    }

    const planId = selectedPlan;

    // Rate Limiting
    if (!checkRateLimit(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again after 5 minutes.' },
        { status: 429 }
      );
    }

    // Check if the actual user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    // If the existing user has a password, it's a fully registered account
    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Strict 5 minutes expiry
    const hashedPassword = await hashPassword(password);

    // Save or update PendingUser
    const pendingData = {
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      companyName: companyName || undefined,
      phone: phone || undefined,
      loginPin: loginPin || undefined,
      planId,
      billingPeriod,
      otp,
      otpExpires,
      isEmailVerified: false,
      createdAt: new Date(),
    };

    const pendingUser = await PendingUser.findOneAndUpdate(
      { email: email.toLowerCase() },
      pendingData,
      { upsert: true, new: true }
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, name);

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.errors.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: errorMsg || 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Prepare signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to prepare signup' },
      { status: 500 }
    );
  }
}
