export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail = process.env.SMTP_USER, otp = '123456', action = 'test' } = body;

    const results: any = {
      timestamp: new Date().toISOString(),
      action,
      configuration: {
        smtpHost: process.env.SMTP_HOST || 'Not set',
        smtpPort: process.env.SMTP_PORT || 'Not set',
        smtpUser: process.env.SMTP_USER || 'Not set',
        emailFrom: process.env.EMAIL_FROM || 'Not set',
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasResendKey: !!process.env.RESEND_API_KEY,
      },
    };

    // Verify SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        {
          error: 'SMTP configuration incomplete',
          details: results.configuration,
          required: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
        },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Test SMTP connection
    try {
      const verified = await transporter.verify();
      results.smtpVerification = {
        status: verified ? 'success' : 'failed',
        message: verified ? 'SMTP connection verified' : 'SMTP connection failed',
      };
    } catch (error: any) {
      results.smtpVerification = {
        status: 'error',
        message: error.message,
      };
    }

    // Send test email
    if (action === 'send' || action === 'test') {
      try {
        const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.otp-box{background:#212121;color:white;padding:20px;text-align:center;border-radius:8px;margin:20px 0;font-size:32px;font-weight:bold;letter-spacing:8px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:20px;">Vid YT</h1></div><div class="content"><h2>Verify Your Email</h2><p>Your OTP code:</p><div class="otp-box">${otp}</div><p><strong>Expires in 10 minutes.</strong></p></div></div></body></html>`;

        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"Vid YT" <${process.env.SMTP_USER}>`,
          to: testEmail,
          subject: `[TEST] OTP Verification - ${new Date().toLocaleString()}`,
          html: HTML,
          text: `OTP: ${otp}\n\nExpires in 10 minutes.`,
        });

        results.emailSent = {
          status: 'success',
          message: 'Test email sent successfully',
          messageId: info.messageId,
          response: info.response,
          sentTo: testEmail,
        };
      } catch (error: any) {
        results.emailSent = {
          status: 'error',
          message: error.message,
          code: error.code,
          command: error.command,
        };
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Email test failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email diagnostics endpoint',
    instructions: 'POST to this endpoint with { testEmail, otp, action }',
    example: {
      url: '/api/test/email',
      method: 'POST',
      body: {
        testEmail: 'your@email.com',
        otp: '123456',
        action: 'send', // or 'test'
      },
    },
  });
}
