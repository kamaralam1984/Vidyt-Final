export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rateLimiter';

// Lazy import to avoid bundling email service unnecessarily
async function sendSupportEmail(
  to: string,
  subject: string,
  type: 'data-export' | 'account-deletion' | string,
  message: string,
): Promise<boolean> {
  const { default: nodemailer } = await import('nodemailer');

  const emailFrom = process.env.EMAIL_FROM || `"Vid YT" <${process.env.SMTP_USER}>`;

  const isExport = type === 'data-export';
  const headerColor = isExport ? '#2563eb' : '#dc2626';
  const headerTitle = isExport ? 'Data Export Request' : 'Account Deletion Request';
  const iconEmoji = isExport ? '📦' : '🗑️';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
    .header { background: #0F0F0F; padding: 24px; text-align: center; }
    .header h1 { color: ${headerColor}; margin: 12px 0 4px; font-size: 22px; }
    .header p { color: #aaa; margin: 0; font-size: 13px; }
    .content { padding: 32px; }
    .badge { display: inline-block; background: ${headerColor}22; color: ${headerColor}; border: 1px solid ${headerColor}44; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .info-box { background: #f8f8f8; border-left: 4px solid ${headerColor}; padding: 16px; border-radius: 0 6px 6px 0; margin: 20px 0; font-size: 14px; }
    .footer { background: #fafafa; border-top: 1px solid #eee; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    a { color: #FF0000; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size:36px">${iconEmoji}</div>
      <h1>${headerTitle}</h1>
      <p>Vid YT Support</p>
    </div>
    <div class="content">
      <div class="badge">${type.replace('-', ' ').toUpperCase()}</div>
      <p>A new <strong>${headerTitle}</strong> has been submitted.</p>
      <div class="info-box">
        <p style="margin:0 0 8px"><strong>From:</strong> ${to}</p>
        <p style="margin:0 0 8px"><strong>Subject:</strong> ${subject}</p>
        <p style="margin:0"><strong>Message:</strong> ${message}</p>
      </div>
      ${isExport
        ? `<p>Please process this data export request and send the exported file to the email address above within <strong>24 hours</strong>.</p>`
        : `<p>Please send the account deletion confirmation link to the email address above. The user must click the link within <strong>24 hours</strong> to confirm deletion.</p>
           <p style="color:#dc2626;font-weight:600;">⚠️ This action is permanent and irreversible — verify the user identity before processing.</p>`
      }
      <p style="font-size:13px;color:#888;">Submitted at: ${new Date().toUTCString()}</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Vid YT — <a href="https://vidyt.com">vidyt.com</a>
    </div>
  </div>
</body>
</html>`;

  try {
    // Try Resend first if key available
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey?.trim()) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from: emailFrom,
          to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER || to,
          replyTo: to,
          subject: `[Support] ${subject}`,
          html,
        });
        if (!error) return true;
        console.error('[send-email] Resend error:', error);
      } catch (e) {
        console.warn('[send-email] Resend failed, trying SMTP:', e);
      }
    }

    // SMTP fallback
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[send-email] No email credentials configured');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: emailFrom,
      to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      replyTo: to,
      subject: `[Support] ${subject}`,
      html,
    });
    return true;
  } catch (e) {
    console.error('[send-email] Error:', e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 requests per hour per IP
    const ip = getClientIP(req);
    const rl = rateLimit(`support-email:${ip}`, 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { to, subject, type, message } = body;

    // Validate
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }
    if (!subject || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!['data-export', 'account-deletion'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request type.' }, { status: 400 });
    }

    const sent = await sendSupportEmail(to, subject, type, message);

    if (sent) {
      return NextResponse.json({ success: true });
    } else {
      // Graceful fallback — don't expose infra errors to users
      console.error('[send-email] Email delivery failed for:', to, type);
      return NextResponse.json(
        { error: 'Unable to send email. Please contact support@vidyt.com directly.' },
        { status: 503 }
      );
    }
  } catch (e: any) {
    console.error('[send-email] Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
