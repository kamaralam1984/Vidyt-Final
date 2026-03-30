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
    
    // Verify SMTP connection in development
    if (process.env.NODE_ENV === 'development') {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP Connection Error:', error);
        } else if (success) {
          console.log('✅ SMTP Server is ready to send emails');
        }
      });
    }
  }
  return transporter;
}

/** Central send: Resend if key set, else SMTP. */
async function sendMail(options: { to: string; subject: string; html: string; text?: string; from?: string }): Promise<boolean> {
  try {
    const config = await getApiConfig();
    const emailFrom = options.from || process.env.EMAIL_FROM || `"ViralBoost AI" <${emailConfig.auth.user}>`;
    
    // Try Resend first if API key is configured
    if (config.resendApiKey?.trim()) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(config.resendApiKey);
        const { error } = await resend.emails.send({
          from: emailFrom,
          to: options.to,
          subject: options.subject,
          html: options.html,
          ...(options.text ? { text: options.text } : {}),
        });
        if (!error) {
          console.log('✅ Email sent via Resend:', options.to);
          return true;
        }
        console.error('❌ Resend API Error:', error);
      } catch (e) {
        console.warn('⚠️ Resend failed, attempting SMTP fallback:', e);
      }
    }
    
    // Fallback to SMTP
    const trans = getTransporter();
    if (!trans) {
      console.error('❌ No email transporter available. Check SMTP_USER and SMTP_PASS in .env.local');
      return false;
    }
    
    await trans.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('✅ Email sent via SMTP:', options.to);
    return true;
  } catch (e) {
    console.error('❌ Email sending error:', e);
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
 * Send OTP for password reset
 */
export async function sendPasswordResetOTP(
  email: string,
  otp: string,
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
          .otp-box { background: #212121; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>Use the OTP below to reset your password:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div>
        </div>
      </body>
      </html>`;
    const ok = await sendMail({
      to: email,
      subject: 'Password Reset OTP - ViralBoost AI',
      html,
      text: `Your password reset OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\n© ViralBoost AI`,
    });
    
    if (ok) return true;
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(40));
      console.log('📧 PASSWORD RESET OTP (DEV MODE)');
      console.log(`To: ${email}`);
      console.log(`Code: ${otp}`);
      console.log('='.repeat(40) + '\n');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Password Reset OTP email error:', error);
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
    if (ok) {
      console.log('✅ OTP email sent successfully to:', email);
      return true;
    }
    console.warn('⚠️ OTP email sending failed for:', email);
    if (process.env.NODE_ENV === 'development') { 
      console.log('\n' + '='.repeat(40));
      console.log('📧 OTP (DEV MODE)');
      console.log(`To: ${email}`);
      console.log(`Code: ${otp}`);
      console.log('='.repeat(40) + '\n');
      return true; 
    }
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PaymentReceiptData {
  planName: string;
  amount: number;
  currency: string;
  billingPeriod: 'month' | 'year';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  /** Account login reference (signup / dashboard) */
  uniqueId?: string;
  razorpayOrderId?: string;
  /** Bill-to email (usually same as recipient) */
  userEmail?: string;
  /** Plan amount in USD for reference line on the bill */
  amountUsd?: number;
}

/**
 * Send payment receipt / bill confirmation after successful subscription payment
 */
export async function sendPaymentReceiptEmail(
  email: string,
  userName: string | undefined,
  receipt: PaymentReceiptData
): Promise<boolean> {
  try {
    // In tests we don't want to depend on SMTP/Resend.
    if (process.env.NODE_ENV === 'test') {
      console.log('📧 (test) Payment receipt would be sent to:', email);
      return true;
    }

    const startStr = receipt.startDate instanceof Date ? receipt.startDate.toLocaleDateString() : String(receipt.startDate);
    const endStr = receipt.endDate instanceof Date ? receipt.endDate.toLocaleDateString() : String(receipt.endDate);
    const paidAtStr = new Date().toLocaleString();
    const amountStr =
      receipt.currency && receipt.currency.length === 3
        ? new Intl.NumberFormat('en', {
            style: 'currency',
            currency: receipt.currency,
            maximumFractionDigits: 2,
          }).format(receipt.amount)
        : `$${receipt.amount}`;
    const usdRef =
      receipt.amountUsd != null && Number.isFinite(receipt.amountUsd)
        ? new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(
            receipt.amountUsd
          )
        : null;
    const periodLabel = receipt.billingPeriod === 'year' ? 'Yearly' : 'Monthly';
    const lineDescription = `${escapeHtml(receipt.planName)} plan (${periodLabel})`;
    const receiptNo = receipt.paymentId ? escapeHtml(receipt.paymentId) : '—';
    const safeName = escapeHtml(userName || 'Customer');
    const safeBillEmail = escapeHtml(receipt.userEmail || email);
    const safeUnique = receipt.uniqueId ? escapeHtml(String(receipt.uniqueId)) : '';
    const safeOrderId = receipt.razorpayOrderId ? escapeHtml(receipt.razorpayOrderId) : '';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f0f0f0;margin:0;padding:24px;color:#111}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hdr{background:#0F0F0F;color:#fff;padding:24px;text-align:center}
.badge{display:inline-block;background:#16a34a;color:#fff;font-size:12px;font-weight:700;letter-spacing:.06em;padding:6px 14px;border-radius:999px;margin-top:12px}
.body{padding:28px}
h1{font-size:20px;margin:0 0 8px}
.sub{color:#555;font-size:14px;margin:0 0 24px}
.box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px}
.box h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin:0 0 10px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px}
.row:last-child{border-bottom:none}
.row .k{color:#6b7280}
.tot{font-size:18px;font-weight:700;padding-top:12px;margin-top:8px;border-top:2px solid #111}
.foot{text-align:center;padding:16px 24px 24px;font-size:12px;color:#888}
</style></head><body>
<div class="wrap">
  <div class="hdr">${getEmailLogoHtml()}
    <p style="margin:12px 0 0;font-size:15px;opacity:.95">ViralBoost AI</p>
    <div class="badge">PAID — Payment confirmed</div>
  </div>
  <div class="body">
    <h1>Bill &amp; payment confirmation</h1>
    <p class="sub">Thank you, ${safeName}. This email is your official receipt for the payment below.</p>
    <div class="box">
      <h2>Receipt details</h2>
      <div class="row"><span class="k">Receipt #</span><span>${receiptNo}</span></div>
      <div class="row"><span class="k">Date &amp; time</span><span>${escapeHtml(paidAtStr)}</span></div>
      <div class="row"><span class="k">Bill to</span><span>${safeBillEmail}</span></div>
      ${safeUnique ? `<div class="row"><span class="k">Your Unique ID</span><span><strong>${safeUnique}</strong> (save for PIN login)</span></div>` : ''}
    </div>
    <div class="box">
      <h2>Charges</h2>
      <div class="row"><span>${lineDescription}</span><span>${amountStr}</span></div>
      ${usdRef ? `<div class="row"><span class="k">Plan reference (USD)</span><span>${usdRef}</span></div>` : ''}
      <div class="row tot"><span>Total paid</span><span>${amountStr}</span></div>
    </div>
    <div class="box">
      <h2>Subscription period</h2>
      <div class="row"><span class="k">Starts</span><span>${escapeHtml(startStr)}</span></div>
      <div class="row"><span class="k">Renews / ends</span><span>${escapeHtml(endStr)}</span></div>
    </div>
    ${
      safeOrderId || receipt.paymentId
        ? `<div class="box"><h2>Payment reference (Razorpay)</h2>
      ${safeOrderId ? `<div class="row"><span class="k">Order ID</span><span style="word-break:break-all">${safeOrderId}</span></div>` : ''}
      ${receipt.paymentId ? `<div class="row"><span class="k">Payment ID</span><span style="word-break:break-all">${escapeHtml(receipt.paymentId)}</span></div>` : ''}
    </div>`
        : ''
    }
    <p style="font-size:13px;color:#6b7280;margin:0">Keep this email for your records. For billing questions, reply to this thread or contact support from your dashboard.</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} ViralBoost AI · Secure payment processed via Razorpay</div>
</div>
</body></html>`;

    const textLines = [
      'ViralBoost AI — Payment confirmed (bill / receipt)',
      '',
      `Receipt #: ${receipt.paymentId || '—'}`,
      `Paid at: ${paidAtStr}`,
      `Bill to: ${receipt.userEmail || email}`,
      ...(receipt.uniqueId ? [`Your Unique ID: ${receipt.uniqueId}`] : []),
      '',
      `Plan: ${receipt.planName} (${periodLabel})`,
      `Amount paid: ${amountStr}`,
      ...(usdRef ? [`Plan reference (USD): ${usdRef}`] : []),
      '',
      `Subscription start: ${startStr}`,
      `Subscription end: ${endStr}`,
      ...(receipt.razorpayOrderId ? [`Razorpay Order: ${receipt.razorpayOrderId}`] : []),
      ...(receipt.paymentId ? [`Razorpay Payment: ${receipt.paymentId}`] : []),
      '',
      '© ViralBoost AI',
    ];
    const text = textLines.join('\n');

    const ok = await sendMail({
      to: email,
      subject: `Payment confirmed — Your ViralBoost AI bill & receipt [${receipt.planName}]`,
      html,
      text,
    });
    if (ok) return true;
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Receipt (no email):', email);
      return true;
    }
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

const EMAIL_STRINGS = {
  en: {
    upgrade: "Upgrade your plan 🚀",
    limitNear: "You're almost out of limit",
    limitNearBody: "You have used 80% of your current plan's limits. Upgrade now to ensure uninterrupted access to viral analysis.",
    limitReached: "Limit reached. Upgrade to continue",
    limitReachedBody: "You have completely exhausted your tier limits. Please upgrade your plan immediately to continue supercharging your content.",
    expiry: "Your plan is expiring soon",
    expiryBody: "Your current subscription plan will expire in less than 3 days. Renew now to keep your premium features.",
    expired: "Your plan has expired",
    expiredBody: "Your subscription has expired and you have been downgraded to the Free tier. Upgrade your plan to regain access to advanced analytics.",
    upsell: "Unlock Pro features 🚀",
    upsellBody: "You're currently using our Free plan! Did you know you can unlock massive growth potential, deeper insights, and bulk tools by upgrading to a premium plan today?",
    btnUpgrade: "Upgrade Now"
  },
  hi: {
    upgrade: "अपना प्लान अपग्रेड करें 🚀",
    limitNear: "आपकी लिमिट खत्म होने वाली है",
    limitNearBody: "आपने अपने वर्तमान प्लान की 80% लिमिट का उपयोग कर लिया है। बिना रुकावट वायरल विश्लेषण के लिए अभी अपग्रेड करें।",
    limitReached: "लिमिट पूरी हो गई। जारी रखने के लिए अपग्रेड करें",
    limitReachedBody: "आपकी टियर लिमिट पूरी तरह से खत्म हो चुकी है। अपने कंटेंट को बेहतर बनाने के लिए कृपया तुरंत अपना प्लान अपग्रेड करें।",
    expiry: "आपका प्लान समाप्त होने वाला है",
    expiryBody: "आपका वर्तमान सब्सक्रिप्शन प्लान 3 दिनों से कम समय में समाप्त हो जाएगा। प्रीमियम सुविधाओं को बनाए रखने के लिए अभी नवीनीकृत करें।",
    expired: "आपका प्लान समाप्त हो गया है",
    expiredBody: "आपका सब्सक्रिप्शन समाप्त हो गया है और आपको मुफ्त टियर में डाउनग्रेड कर दिया गया है। उन्नत एनालिटिक्स तक पहुंच प्राप्त करने के लिए अपना प्लान अपग्रेड करें।",
    upsell: "प्रो सुविधाएं अनलॉक करें 🚀",
    upsellBody: "आप वर्तमान में हमारे मुफ्त प्लान का उपयोग कर रहे हैं! क्या आप जानते हैं कि आज ही प्रीमियम प्लान में अपग्रेड करके आप विकास की व्यापक संभावनाएं, गहरी अंतर्दृष्टि और बल्क टूल अनलॉक कर सकते हैं?",
    btnUpgrade: "अभी अपग्रेड करें"
  }
};

/**
 * Send Usage Alert Email (80% or 100%)
 */
export async function sendUsageAlertEmail(
  email: string,
  userName: string | undefined,
  type: 'near' | 'reached',
  language: 'en' | 'hi' = 'en'
): Promise<boolean> {
  try {
    const lang = EMAIL_STRINGS[language] || EMAIL_STRINGS['en'];
    const subject = type === 'near' ? lang.limitNear : lang.limitReached;
    const bodyText = type === 'near' ? lang.limitNearBody : lang.limitReachedBody;
    const upgradeUrl = `${getEmailBaseUrl()}/pricing`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.button{display:inline-block;padding:12px 30px;background:#FF0000;color:white;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold;}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div><div class="content"><h2>${subject}</h2><p>Hello ${userName || 'User'},</p><p>${bodyText}</p><div style="text-align:center;"><a href="${upgradeUrl}" class="button">${lang.btnUpgrade}</a></div></div><div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div></div></body></html>`;
    
    return await sendMail({ to: email, subject: `${subject} - ViralBoost AI`, html, text: `${subject}\n\n${bodyText}\n\nUpgrade here: ${upgradeUrl}` });
  } catch (error) {
    console.error('❌ Usage email error:', error);
    return false;
  }
}

/**
 * Send Plan Expiry Alert Email (Warning or Expired)
 */
export async function sendExpiryAlertEmail(
  email: string,
  userName: string | undefined,
  type: 'warning' | 'expired',
  language: 'en' | 'hi' = 'en'
): Promise<boolean> {
  try {
    const lang = EMAIL_STRINGS[language] || EMAIL_STRINGS['en'];
    const subject = type === 'warning' ? lang.expiry : lang.expired;
    const bodyText = type === 'warning' ? lang.expiryBody : lang.expiredBody;
    const upgradeUrl = `${getEmailBaseUrl()}/pricing`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.button{display:inline-block;padding:12px 30px;background:#FF0000;color:white;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold;}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div><div class="content"><h2>${subject}</h2><p>Hello ${userName || 'User'},</p><p>${bodyText}</p><div style="text-align:center;"><a href="${upgradeUrl}" class="button">${lang.btnUpgrade}</a></div></div><div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div></div></body></html>`;
    
    return await sendMail({ to: email, subject: `${subject} - ViralBoost AI`, html, text: `${subject}\n\n${bodyText}\n\nRenew/Upgrade here: ${upgradeUrl}` });
  } catch (error) {
    console.error('❌ Expiry email error:', error);
    return false;
  }
}

/**
 * Send Upsell Email for Free Users
 */
export async function sendUpsellEmail(
  email: string,
  userName: string | undefined,
  language: 'en' | 'hi' = 'en'
): Promise<boolean> {
  try {
    const lang = EMAIL_STRINGS[language] || EMAIL_STRINGS['en'];
    const subject = lang.upsell;
    const bodyText = lang.upsellBody;
    const upgradeUrl = `${getEmailBaseUrl()}/pricing`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0F0F0F;color:white;padding:20px;text-align:center}.content{background:#f9f9f9;padding:30px}.button{display:inline-block;padding:12px 30px;background:#FF0000;color:white;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold;}.footer{text-align:center;margin-top:20px;color:#666;font-size:12px}</style></head><body><div class="container"><div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div><div class="content"><h2>${subject}</h2><p>Hello ${userName || 'User'},</p><p>${bodyText}</p><div style="text-align:center;"><a href="${upgradeUrl}" class="button">${lang.btnUpgrade}</a></div></div><div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI</p></div></div></body></html>`;
    
    return await sendMail({ to: email, subject: `${subject} - ViralBoost AI`, html, text: `${subject}\n\n${bodyText}\n\nUpgrade here: ${upgradeUrl}` });
  } catch (error) {
    console.error('❌ Upsell email error:', error);
    return false;
  }
}

/**
 * Send Account Deletion Verification Code
 */
export async function sendAccountDeletionVerificationEmail(
  email: string,
  verificationCode: string,
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
          .code-box { background: #181818; color: #FF0000; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; border: 2px solid #FF0000; }
          .warning { background: #FFF3CD; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FFC107; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">${getEmailLogoHtml()}<p style="margin:8px 0 0;font-size:14px;opacity:0.9;">ViralBoost AI</p></div>
          <div class="content">
            <h2 style="color: #FF0000;">Account Deletion Request</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>You have requested to permanently delete your ViralBoost AI account. To confirm this action, please use the verification code below:</p>
            <div class="code-box">${verificationCode}</div>
            <p><strong>Code expires in 24 hours.</strong></p>
            
            <div class="warning">
              <strong>⚠️ Important Notice:</strong>
              <p style="margin: 10px 0 0;">This action is <strong>permanent and cannot be undone</strong>. Once you confirm deletion:</p>
              <ul style="margin: 5px 0;">
                <li>All your videos, analytics, and account settings will be permanently deleted</li>
                <li>Connected YouTube accounts will be disconnected</li>
                <li>API keys and webhooks will be removed</li>
                <li>Subscription data will be anonymized</li>
              </ul>
            </div>
            
            <p>If you did not request this, please ignore this email. Your account is safe.</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Contact us: <strong>support@viralboostai.com</strong>
            </p>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} ViralBoost AI. All rights reserved.</p></div>
        </div>
      </body>
      </html>`;
    
    const ok = await sendMail({
      to: email,
      subject: '⚠️ Account Deletion Verification - ViralBoost AI',
      html,
      text: `Account Deletion Verification Code: ${verificationCode}\n\nThis code expires in 24 hours.\n\nThis action is permanent and cannot be undone.\n\nIf you did not request this, please ignore this email.\n\nContact us: support@viralboostai.com\n\n© ViralBoost AI`,
    });
    
    if (ok) {
      console.log('✅ Account deletion verification email sent to:', email);
      return true;
    }
    
    console.warn('⚠️ Account deletion verification email sending failed for:', email);
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(50));
      console.log('📧 ACCOUNT DELETION VERIFICATION CODE (DEV MODE)');
      console.log(`To: ${email}`);
      console.log(`Code: ${verificationCode}`);
      console.log('Expires: 24 hours');
      console.log('='.repeat(50) + '\n');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Account deletion email error:', error);
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  }
}
