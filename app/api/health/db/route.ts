import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * Database health check endpoint
 */
export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      status: 'connected',
      message: 'Database connection successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'disconnected',
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 503 }
    );
  }
}
