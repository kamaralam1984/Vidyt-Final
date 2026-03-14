import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const createOrderSchema = z.object({
  planId: z.enum(['free', 'pro', 'enterprise']),
  billingPeriod: z.enum(['month', 'year']),
});

// Plan pricing (in INR) — Pro $2.5, Enterprise $5 (approx 250 & 500 INR)
const PLAN_PRICES: Record<string, { month: number; year: number }> = {
  free: { month: 0, year: 0 },
  pro: { month: 250, year: 2500 }, // ~$2.5/month
  enterprise: { month: 500, year: 5000 }, // ~$5/month
};

// Early bird discount: 1 month free (applied to first payment)
const EARLY_BIRD_DISCOUNT = true; // Enable early bird offer

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get authenticated user
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if email is verified
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before making a payment' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    const { planId, billingPeriod } = validated;

    // Get plan price
    const planPrice = PLAN_PRICES[planId];
    if (!planPrice) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Calculate amount
    let amount = billingPeriod === 'month' ? planPrice.month : planPrice.year;

    // Apply early bird discount (1 month free)
    let discountApplied = false;
    if (EARLY_BIRD_DISCOUNT && planId !== 'free' && billingPeriod === 'year') {
      // For yearly plans, subtract 1 month price
      amount = amount - planPrice.month;
      discountApplied = true;
    } else if (EARLY_BIRD_DISCOUNT && planId !== 'free' && billingPeriod === 'month') {
      // For monthly plans, first month is free (amount stays same, but mark as discount)
      discountApplied = true;
    }

    // Convert to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // For free plan, don't create Razorpay order
    if (planId === 'free' || amountInPaise === 0) {
      // Activate free plan directly
      user.subscription = 'free';
      user.subscriptionPlan = {
        planId: 'free',
        planName: 'Free',
        billingPeriod: 'month',
        price: 0,
        currency: 'INR',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        earlyBirdDiscount: false,
      };
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Free plan activated',
        plan: user.subscriptionPlan,
      });
    }

    // Create Razorpay order
    const orderOptions: any = {
      amount: amountInPaise,
      currency: 'INR',
      // Razorpay receipt must be <= 40 chars
      receipt: `order_${user._id.toString()}`,
      notes: {
        userId: user._id.toString(),
        planId,
        billingPeriod,
        earlyBirdDiscount: discountApplied,
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Save order details to user (temporary, will be finalized after payment)
    user.subscriptionPlan = {
      planId,
      planName: planId.charAt(0).toUpperCase() + planId.slice(1),
      billingPeriod,
      price: amount,
      currency: 'INR',
      status: 'trial',
      razorpayOrderId: razorpayOrder.id,
      earlyBirdDiscount: discountApplied,
    };
    await user.save();

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      plan: user.subscriptionPlan,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
