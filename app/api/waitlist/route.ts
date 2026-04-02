import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Waitlist from '@/models/Waitlist';

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    await connectDB();

    // Check if duplicate
    const existing = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ 
        message: 'You are already on the waitlist! We will notify you soon.',
        alreadyExists: true 
      });
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    await Waitlist.create({
      email,
      source: source || 'browser_extension',
      userAgent,
      ip,
    });

    return NextResponse.json({ 
      message: 'Successfully joined the waitlist!',
      success: true 
    });

  } catch (error: any) {
    console.error('[waitlist_api] error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist. Please try again later.' }, { status: 500 });
  }
}
