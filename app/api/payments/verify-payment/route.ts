import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { sendPaymentReceiptEmail } from '@/services/email';
import { getRoleFromPlanAndUser } from '@/lib/auth';
import { z } from 'zod';

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

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

    const body = await request.json();
    const validated = verifyPaymentSchema.parse(body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validated;

    // Find user
    const user = await User.findById(authUser.id);
    if (!user || !user.subscriptionPlan) {
      return NextResponse.json(
        { error: 'User or subscription plan not found' },
        { status: 404 }
      );
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Calculate subscription end date
    const startDate = new Date();
    let endDate = new Date();
    
    if (user.subscriptionPlan.billingPeriod === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // If early bird discount applied and monthly plan, add 1 extra month
    if (user.subscriptionPlan.earlyBirdDiscount && user.subscriptionPlan.billingPeriod === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update user subscription and role by plan (Pro→manager, Enterprise→admin; super-admin preserved)
    user.subscription = user.subscriptionPlan.planId as 'free' | 'pro' | 'enterprise';
    user.subscriptionExpiresAt = endDate;
    user.subscriptionPlan.status = 'active';
    user.subscriptionPlan.startDate = startDate;
    user.subscriptionPlan.endDate = endDate;
    user.subscriptionPlan.paymentId = razorpay_payment_id;
    user.subscriptionPlan.razorpayPaymentId = razorpay_payment_id;
    user.role = getRoleFromPlanAndUser(user) as any;
    await user.save();

    // Send payment receipt email
    const plan = user.subscriptionPlan;
    if (plan && user.email) {
      await sendPaymentReceiptEmail(
        user.email,
        user.name || undefined,
        {
          planName: plan.planName || plan.planId,
          amount: plan.price ?? 0,
          currency: plan.currency || 'INR',
          billingPeriod: plan.billingPeriod || 'month',
          startDate: plan.startDate || startDate,
          endDate: plan.endDate || endDate,
          paymentId: razorpay_payment_id,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription: user.subscriptionPlan,
      uniqueId: user.uniqueId,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
