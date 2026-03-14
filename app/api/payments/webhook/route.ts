import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Razorpay Webhook Handler
 * Handles payment status updates from Razorpay
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle payment success
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find user by order ID
      const user = await User.findOne({
        'subscriptionPlan.razorpayOrderId': orderId,
      });

      if (user && user.subscriptionPlan) {
        // Calculate subscription end date
        const startDate = new Date();
        let endDate = new Date();

        if (user.subscriptionPlan.billingPeriod === 'month') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Apply early bird discount
        if (user.subscriptionPlan.earlyBirdDiscount && user.subscriptionPlan.billingPeriod === 'month') {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update subscription
        user.subscription = user.subscriptionPlan.planId as 'free' | 'pro' | 'enterprise';
        user.subscriptionExpiresAt = endDate;
        user.subscriptionPlan.status = 'active';
        user.subscriptionPlan.startDate = startDate;
        user.subscriptionPlan.endDate = endDate;
        user.subscriptionPlan.paymentId = payment.id;
        user.subscriptionPlan.razorpayPaymentId = payment.id;
        await user.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
