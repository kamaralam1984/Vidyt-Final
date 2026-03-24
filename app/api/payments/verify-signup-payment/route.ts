export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PendingUser from '@/models/PendingUser';
import Subscription from '@/models/Subscription';
import { generateUniqueNumericId } from '@/lib/auth';
import { generateToken } from '@/lib/auth-jwt';
import { sendPaymentReceiptEmail } from '@/services/email';
import { PLAN_PRICES_USD, PLAN_ROLE_MAP, isValidPlan } from '@/utils/currency';
import { z } from 'zod';

const verifySignupPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = verifySignupPaymentSchema.parse(body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validated;

    // Find PendingUser
    const pendingUser = await PendingUser.findOne({ razorpayOrderId: razorpay_order_id });
    if (!pendingUser) {
      return NextResponse.json(
        { error: 'Signup session not found or already processed' },
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
        message: 'Account already created. Payment verified successfully.',
        subscription: existingUser.subscriptionPlan,
        uniqueId: existingUser.uniqueId,
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
    }

    const planId = (pendingUser.planId && isValidPlan(pendingUser.planId))
      ? pendingUser.planId
      : 'free';
    const billingPeriod = pendingUser.billingPeriod || 'month';
    const currency = pendingUser.currency || 'USD';

    // Calculate subscription end date
    const startDate = new Date();
    let endDate = new Date();
    
    if (billingPeriod === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Role mapping
    const role = (PLAN_ROLE_MAP[planId] || 'user') as 'user' | 'manager' | 'admin';

    // Pricing (USD base)
    const basePriceUSD = PLAN_PRICES_USD[planId] ?? 0;
    const price = billingPeriod === 'year' ? basePriceUSD * 10 : basePriceUSD;
    
    // Convert to new User account
    const uniqueId = await generateUniqueNumericId();

    const user = new User({
      uniqueId,
      email: pendingUser.email,
      password: pendingUser.password,
      name: pendingUser.name,
      companyName: pendingUser.companyName,
      phone: pendingUser.phone,
      loginPin: pendingUser.loginPin,
      role,
      subscription: planId as any,
      emailVerified: true,
      subscriptionExpiresAt: endDate,
      subscriptionPlan: {
        planId,
        planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        billingPeriod,
        price,
        currency,
        status: 'active',
        startDate,
        endDate,
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        earlyBirdDiscount: false,
      },
      createdAt: new Date(),
    });

    await user.save();

    // Create physical subscription record
    await Subscription.create({
      userId: user._id,
      plan: planId,
      status: 'active',
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      paymentMethod: {
        type: 'razorpay',
        subscriptionId: razorpay_order_id,
        customerId: user.email
      },
      billingHistory: [{
        amount: price,
        currency,
        date: startDate,
        invoiceId: razorpay_payment_id,
        status: 'paid'
      }]
    });

    // Delete PendingUser instance
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Send payment receipt
    if (user.email) {
      // Background email send
      sendPaymentReceiptEmail(
        user.email,
        user.name || undefined,
        {
          planName: planId.charAt(0).toUpperCase() + planId.slice(1),
          amount: price,
          currency: 'INR',
          billingPeriod: billingPeriod as 'month' | 'year',
          startDate: startDate,
          endDate: endDate,
          paymentId: razorpay_payment_id,
        }
      ).catch(err => console.error("Receipt email error:", err));
    }

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
      message: 'Account successfully created and payment verified',
      subscription: user.subscriptionPlan,
      uniqueId: user.uniqueId,
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

    console.error('Verify signup payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify signup payment' },
      { status: 500 }
    );
  }
}
