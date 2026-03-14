import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test MongoDB connection
  try {
    await connectDB();
    results.tests.mongodb = { status: 'success', message: 'Connected' };
  } catch (error: any) {
    results.tests.mongodb = { status: 'error', message: error.message };
  }

  // Test YouTube service
  try {
    const { extractYouTubeMetadata } = await import('@/services/youtube');
    results.tests.youtube = { status: 'success', message: 'Service loaded' };
  } catch (error: any) {
    results.tests.youtube = { status: 'error', message: error.message };
  }

  // Test Title Optimizer
  try {
    const { analyzeTitle } = await import('@/services/titleOptimizer');
    const testResult = analyzeTitle('Test Video Title');
    results.tests.titleOptimizer = { status: 'success', result: testResult };
  } catch (error: any) {
    results.tests.titleOptimizer = { status: 'error', message: error.message, stack: error.stack };
  }

  // Test Thumbnail Analyzer
  try {
    const { analyzeThumbnail } = await import('@/services/thumbnailAnalyzer');
    results.tests.thumbnailAnalyzer = { status: 'success', message: 'Service loaded' };
  } catch (error: any) {
    results.tests.thumbnailAnalyzer = { status: 'error', message: error.message };
  }

  return NextResponse.json(results);
}
