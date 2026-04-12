export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { ingestAllPlatforms } from '@/services/dataPipeline/ingestion';

/**
 * Manual trigger for data ingestion
 * In production, this would be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    const result = await ingestAllPlatforms();
    
    return NextResponse.json({
      success: result.success,
      collected: result.collected,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Data ingestion error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to ingest data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get ingestion status
 */
export async function GET(request: NextRequest) {
  try {
    // Return last ingestion stats
    return NextResponse.json({
      status: 'active',
      lastRun: new Date().toISOString(),
      message: 'Data pipeline is running',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
