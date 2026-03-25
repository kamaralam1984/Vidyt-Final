export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { PLAN_ROLE_MAP } from '@/lib/limitChecker';
import { fromRazorpaySmallestUnit } from '@/lib/paymentCurrencyShared';

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
      const paymentId = payment.id;

      // Find user by order ID
      const user = await User.findOne({
        'subscriptionPlan.razorpayOrderId': orderId,
      });

      // Idempotency: duplicate webhooks must not extend subscription again.
      if (user?.subscriptionPlan?.razorpayPaymentId === paymentId) {
        const already = await Payment.findOne({ paymentId, status: 'success', gateway: 'razorpay' });
        if (already) return NextResponse.json({ success: true });
      }

      const alreadyVerified = paymentId
        ? await Payment.findOne({ paymentId, status: 'success', gateway: 'razorpay' })
        : null;
      if (alreadyVerified) {
        return NextResponse.json({ success: true });
      }

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

        // Update subscription and role by plan
        user.subscription = user.subscriptionPlan.planId as any;
        user.subscriptionExpiresAt = endDate;
        user.subscriptionPlan.status = 'active';
        user.subscriptionPlan.startDate = startDate;
        user.subscriptionPlan.endDate = endDate;
        user.subscriptionPlan.paymentId = payment.id;
        user.subscriptionPlan.razorpayPaymentId = payment.id;
        user.role = (PLAN_ROLE_MAP[user.subscription] || 'user') as any;

        // Reset usage stats for new period
        user.usageStats = {
          videosAnalyzed: 0,
          analysesThisMonth: 0,
          competitorsTracked: 0,
          hashtagsGenerated: 0
        };

        await user.save();
      }

      if (user?.subscriptionPlan?.planId) {
        await Payment.findOneAndUpdate(
          { orderId },
          {
            $set: {
              userId: user._id,
              orderId,
              paymentId: paymentId,
              plan: user.subscriptionPlan.planId,
              billingPeriod: user.subscriptionPlan.billingPeriod === 'year' ? 'year' : 'month',
              amount: fromRazorpaySmallestUnit(Number(payment.amount || 0), String(payment.currency || 'INR').toUpperCase()),
              currency: String(payment.currency || 'INR').toUpperCase(),
              status: 'success',
              gateway: 'razorpay',
              metadata: {
                source: 'webhook',
                webhookEvent: event.event,
              },
            },
          },
          { upsert: true, new: true }
        );
      }
    } else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        await Payment.findOneAndUpdate(
          { orderId },
          {
            $set: {
              orderId,
              paymentId: payment?.id,
              amount: fromRazorpaySmallestUnit(Number(payment.amount || 0), String(payment.currency || 'INR').toUpperCase()),
              currency: String(payment.currency || 'INR').toUpperCase(),
              status: 'failed',
              gateway: 'razorpay',
              metadata: {
                source: 'webhook',
                webhookEvent: event.event,
              },
            },
          },
          { upsert: true, new: true }
        );
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
