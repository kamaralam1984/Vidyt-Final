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
          html: options.html 
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
