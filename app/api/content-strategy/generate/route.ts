export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { generateContentStrategy } from '@/services/contentStrategy/generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, niche, platforms, days } = body;

    if (!userId || !niche) {
      return NextResponse.json(
        { error: 'userId and niche are required' },
        { status: 400 }
      );
    }

    const strategy = await generateContentStrategy(
      userId,
      niche,
      platforms || ['youtube'],
      days || 7
    );

    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error: any) {
    console.error('Content strategy generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate content strategy',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
