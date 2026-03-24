export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PendingUser from '@/models/PendingUser';
import { verifyOTP } from '@/services/otp';
import { generateToken } from '@/lib/auth-jwt';
import { generateUniqueNumericId, VALID_PLANS, normalizePlan } from '@/lib/auth';
import Razorpay from 'razorpay';
import { z } from 'zod';
import Plan from '@/models/Plan';

const verifyAndPaySchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Basic rate limiting to prevent OTP verification abuse
const globalAny: any = global;
if (!globalAny.payRateLimitMap) globalAny.payRateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const rateLimitMap = globalAny.payRateLimitMap;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(email);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(email, { count: 1, expiresAt: now + 5 * 60 * 1000 }); // 5 minutes window
    return true;
  }
  if (record.count >= 10) { // Max 10 verification attempts per 5 mins per email
    return false;
  }
  record.count += 1;
  return true;
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});



const EARLY_BIRD_DISCOUNT = true;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = verifyAndPaySchema.parse(body);
    const { email, otp } = validated;

    // Rate Limiting
    if (!checkRateLimit(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again after 5 minutes.' },
        { status: 429 }
      );
    }

    // Find PendingUser
    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
    if (!pendingUser) {
      return NextResponse.json(
        { error: 'Signup session expired or not found. Please try again.' },
        { status: 404 }
      );
    }

    // Verify OTP
    const isValid = verifyOTP(otp, pendingUser.otp, pendingUser.otpExpires);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    pendingUser.isEmailVerified = true;

    // Check for duplicate account creation (Idempotency)
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      await PendingUser.deleteOne({ _id: pendingUser._id });
      const authUser = {
        id: existingUser._id.toString(),
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role as any,
        subscription: existingUser.subscription as any,
      };
      const token = generateToken(authUser);
      const response = NextResponse.json({
        success: true,
        message: 'Account already created.',
        token,
        uniqueId: existingUser.uniqueId,
        isFree: true, // Send true so the frontend redirects immediately instead of opening Razorpay
      });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    }

    // Check plan details
    const selectedPlan = normalizePlan(pendingUser.planId);

    console.log("Selected Plan:", selectedPlan);

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    if (!VALID_PLANS.includes(selectedPlan as any)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    if (selectedPlan === "custom") {
      if (!pendingUser.companyName) {
        return NextResponse.json({ error: 'Please provide company details for custom plan' }, { status: 400 });
      }
    }

    const planId = selectedPlan;
    const billingPeriod = pendingUser.billingPeriod || 'month';
    
    let planPrice = null;
    if (planId === 'free') {
      planPrice = { month: 0, year: 0 };
    } else {
      // Find plan by dbId or _id based on what frontend sent
      try {
        const dbPlan = await Plan.findOne({ $or: [{ dbId: String(planId) }, { _id: String(planId).match(/^[0-9a-fA-F]{24}$/) ? planId : null }] });
        if (dbPlan) {
          planPrice = { month: dbPlan.price, year: dbPlan.price * 10 };
        }
      } catch (err) {
        console.error('Failed to parse plan lookup:', err);
      }
    }

    if (!planPrice) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    let amount = billingPeriod === 'month' ? planPrice.month : planPrice.year;

    // Early bird logic
    let discountApplied = false;
    if (EARLY_BIRD_DISCOUNT && planId !== 'free' && billingPeriod === 'year') {
      amount = amount - planPrice.month;
      discountApplied = true;
    } else if (EARLY_BIRD_DISCOUNT && planId !== 'free' && billingPeriod === 'month') {
      discountApplied = true;
    }

    const amountInPaise = Math.round(amount * 100);

    // If Free Trial or $0 plan -> activate immediately
    if (planId === 'free' || amountInPaise === 0) {
      const uniqueId = await generateUniqueNumericId();

      const user = new User({
        uniqueId,
        email: pendingUser.email,
        password: pendingUser.password, // already hashed
        name: pendingUser.name,
        companyName: pendingUser.companyName,
        phone: pendingUser.phone,
        loginPin: pendingUser.loginPin,
        role: 'user',
        subscription: 'free',
        emailVerified: true,
        subscriptionPlan: {
          planId: 'free',
          planName: 'Free',
          billingPeriod: 'month',
          price: 0,
          currency: 'INR',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
          earlyBirdDiscount: false,
        },
        createdAt: new Date(),
      });

      await user.save();
      await PendingUser.deleteOne({ _id: pendingUser._id });

      const authUser = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role as any,
        subscription: user.subscription as any,
      };

      const token = generateToken(authUser);

      const response = NextResponse.json({
        success: true,
        message: 'Account created and Free plan activated',
        token,
        uniqueId,
        isFree: true,
      });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    }

    // Otherwise, create Razorpay Order
    const orderOptions: any = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `signup_${pendingUser._id.toString()}`.slice(0, 40),
      notes: {
        pendingUserId: pendingUser._id.toString(),
        planId,
        billingPeriod,
        earlyBirdDiscount: discountApplied,
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Save order details to pendingUser
    pendingUser.razorpayOrderId = razorpayOrder.id;
    await pendingUser.save();

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      isFree: false,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Verify and Pay error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
