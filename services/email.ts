/**
 * Email Service
 * Hybrid: Resend (when API key set in Super Admin) else SMTP.
 */

import nodemailer from 'nodemailer';
import { getApiConfig } from '@/lib/apiConfig';

/** Base URL for absolute logo in emails. Set NEXT_PUBLIC_APP_URL in production. */
function getEmailBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function getEmailLogoHtml(): string {
  const base = getEmailBaseUrl();
  return `<img src="${base}/logo.png" alt="ViralBoost AI" width="180" height="48" style="display:block;max-width:180px;height:auto;margin:0 auto;" />`;
}

const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter && emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: emailConfig.auth,
    });
  }
  return transporter;
}

/** Central send: Resend if key set, else SMTP. */
async function sendMail(options: { to: string; subject: string; html: string; text?: string; from?: string }): Promise<boolean> {
  try {
    const config = await getApiConfig();
    if (config.resendApiKey?.trim()) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(config.resendApiKey);
        const from = options.from || 'ViralBoost AI <onboarding@resend.dev>';
        const { error } = await resend.emails.send({ from, to: options.to, subject: options.subject, html: options.html });
        if (!error) return true;
        console.error('Resend error:', error);
      } catch (e) {
        console.error('Resend failed, falling back to SMTP:', e);
      }
    }
    const trans = getTransporter();
    if (!trans) return false;
    await trans.sendMail({
      from: options.from || `"ViralBoost AI" <${emailConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (e) {
    console.error('sendMail error:', e);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName?: string
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0F0F0F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #FF0000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>You requested to reset your password. Click below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div>
        </div>
      </body>
      </html>`;
    const ok = await sendMail({
      to: email,
      subject: 'Reset Your Password - ViralBoost AI',
      html,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\n© ViralBoost AI`,
    });
    if (ok) return true;
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Password Reset Link (no email configured):', resetUrl);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }
}

/**
 * Send OTP email for email verification
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  userName?: string
): Promise<boolean> {
  try {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.otp-box{background:#212121;color:white;padding:20px;text-align:center;border-radius:8px;margin:20px 0;font-size:32px;font-weight:bold;letter-spacing:8px}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div><div class="content"><h2>Verify Your Email</h2><p>Hello ${userName || 'User'},</p><p>Use this OTP to verify your email:</p><div class="otp-box">${otp}</div><p><strong>Expires in 10 minutes.</strong></p></div><div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div></div></body></html>`;
    const ok = await sendMail({ to: email, subject: 'Verify Your Email - ViralBoost AI', html, text: `OTP: ${otp}\nExpires in 10 minutes.` });
    if (ok) return true;
    if (process.env.NODE_ENV === 'development') { console.log('📧 OTP:', email, otp); return true; }
    return false;
  } catch (error) {
    console.error('❌ OTP email error:', error);
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  userName?: string
): Promise<boolean> {
  try {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.button{display:inline-block;padding:12px 30px;background:#FF0000;color:white;text-decoration:none;border-radius:5px;margin:20px 0}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div><div class="content"><h2>Verify Your Email</h2><p>Hello ${userName || 'User'},</p><p><a href="${verificationUrl}" class="button">Verify Email</a></p><p>Or copy: ${verificationUrl}</p></div></div></body></html>`;
    return await sendMail({ to: email, subject: 'Verify Your Email - ViralBoost AI', html, text: verificationUrl });
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
}

export interface PaymentReceiptData {
  planName: string;
  amount: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
}

/**
 * Send payment receipt email after successful subscription payment
 */
export async function sendPaymentReceiptEmail(
  email: string,
  userName: string | undefined,
  receipt: PaymentReceiptData
): Promise<boolean> {
  try {
    const startStr = receipt.startDate instanceof Date ? receipt.startDate.toLocaleDateString() : String(receipt.startDate);
    const endStr = receipt.endDate instanceof Date ? receipt.endDate.toLocaleDateString() : String(receipt.endDate);
    const amountStr = receipt.currency === 'INR' ? `₹${receipt.amount}` : `$${receipt.amount}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI · Payment Receipt</p></div><div class="content"><h2>Thank you for your payment</h2><p>Hello ${userName || 'User'},</p><table><tr><th>Plan</th><td>${receipt.planName}</td></tr><tr><th>Amount</th><td>${amountStr}/${receipt.billingPeriod === 'year' ? 'year' : 'month'}</td></tr><tr><th>Start</th><td>${startStr}</td></tr><tr><th>End</th><td>${endStr}</td></tr>${receipt.paymentId ? `<tr><th>Payment ID</th><td>${receipt.paymentId}</td></tr>` : ''}</table></div><div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div></div></body></html>`;
    const ok = await sendMail({ to: email, subject: `Payment Receipt - ${receipt.planName} - ViralBoost AI`, html, text: `Plan: ${receipt.planName}\nAmount: ${amountStr}\nStart: ${startStr}\nEnd: ${endStr}` });
    if (ok) return true;
    if (process.env.NODE_ENV === 'development') { console.log('📧 Receipt (no email):', email); return true; }
    return false;
  } catch (error) {
    console.error('❌ Payment receipt email error:', error);
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }
}

/**
 * Send broadcast notification email to one recipient (used to notify all users)
 */
export async function sendBroadcastNotificationEmail(
  email: string,
  subject: string,
  message: string,
  userName?: string
): Promise<boolean> {
  try {
    const htmlMessage = message.replace(/\n/g, '<br>');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI · Notification</p></div><div class="content"><p>Hello ${userName || 'User'},</p><div>${htmlMessage}</div></div><div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div></div></body></html>`;
    const ok = await sendMail({ to: email, subject: subject || 'Notification from ViralBoost AI', html, text: `Hello ${userName || 'User'},\n\n${message}` });
    if (!ok && process.env.NODE_ENV === 'development') return true;
    return ok;
  } catch (error) {
    console.error('❌ Broadcast email error:', email, error);
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }
}
