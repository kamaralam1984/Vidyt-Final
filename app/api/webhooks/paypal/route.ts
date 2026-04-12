import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '@/lib/apiConfig';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { PLAN_ROLE_MAP } from '@/utils/currency';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Basic verification for PayPal Webhooks should go here. 
  // In production, we should verify the webhook signature. Next.js App router handles this with specific paypal SDK or manual verification.
  // For simplicity, we assume the webhook comes from PayPal.

  await connectDB();

  try {
    const eventType = body.event_type;

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const order = body.resource;
      const orderId = order.id;

      let customData: any = {};
      try {
        const customId = order.purchase_units[0]?.custom_id;
        if (customId) {
          customData = JSON.parse(customId);
        }
      } catch (e) {
        console.error('Failed to parse custom_id from paypal order');
      }

      const { userId, planId, billingPeriod } = customData;

      if (userId && planId) {
        
        const now = new Date();
        const endDate = new Date(now);
        if (billingPeriod === 'year') {
           endDate.setFullYear(now.getFullYear() + 1);
        } else {
           endDate.setMonth(now.getMonth() + 1);
        }

        await User.findByIdAndUpdate(userId, {
          subscription: planId,
          paypalOrderId: orderId,
          role: PLAN_ROLE_MAP[planId] || 'user',
          'subscriptionPlan.status': 'active',
          'subscriptionPlan.startDate': now,
          'subscriptionPlan.endDate': endDate,
          'subscriptionPlan.paymentId': orderId
        });

        const amount = order.purchase_units[0]?.amount?.value || 0;
        const currency = order.purchase_units[0]?.amount?.currency_code || 'USD';

        await Payment.create({
          userId,
          amount: parseFloat(amount),
          currency,
          status: 'success',
          gateway: 'paypal',
          orderId: orderId,
          plan: planId,
          metadata: { paypalOrderId: orderId }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook handler failed: ${error.message}`);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
