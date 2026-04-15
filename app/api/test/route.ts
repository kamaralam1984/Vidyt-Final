export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role') || '';
  if (role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
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

  // Test Email Service
  try {
    const { sendOTPEmail } = await import('@/services/email');
    const testEmail = process.env.SMTP_USER || 'test@example.com';
    const testOtp = '123456';
    const emailSent = await sendOTPEmail(testEmail, testOtp, 'Test User');
    results.tests.email = { 
      status: emailSent ? 'success' : 'failed',
      message: emailSent ? 'Test OTP email sent successfully' : 'Failed to send test email',
      smtpUser: process.env.SMTP_USER || 'Not configured',
      smtpHost: process.env.SMTP_HOST || 'Not configured',
      emailFrom: process.env.EMAIL_FROM || 'Not configured',
      resendAvailable: !!process.env.RESEND_API_KEY,
    };
  } catch (error: any) {
    results.tests.email = { status: 'error', message: error.message, stack: error.stack };
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
