import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
    });
    try {
        await connectDB();
        const { planId, userId } = await req.json();

        // 1. Validate User
        if (!userId) {
            return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Fetch Pricing Logic (Mock mapped)
        const priceMap: Record<string, string> = {
            'pro_monthly': process.env.STRIPE_PRO_PRICE_ID || 'price_1xxx',
            'pro_yearly': process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_2xxx',
        };

        const stripePriceId = priceMap[planId];
        if (!stripePriceId) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            client_reference_id: userId,
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        });

        // Return Checkout URL
        return NextResponse.json({ checkoutUrl: session.url });

    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: 'Internal Server Error processing checkout' }, { status: 500 });
    }
}
