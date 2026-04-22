# Email Setup Guide 📧

## 📋 Email Configuration

The app uses **Nodemailer** to send password reset emails. You need to configure SMTP settings.

## 🔧 Setup Steps

### Option 1: Gmail SMTP (Recommended for Development)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "ViralBoost AI"
   - Copy the generated 16-character password

3. **Update `.env.local`**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Option 2: Other Email Providers

**Outlook/Hotmail:**
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

**Custom SMTP:**
```
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

## 🚀 Development Mode

**If email is not configured**, the app will:
- ✅ Still generate reset tokens
- ✅ Log reset links to console
- ✅ Return reset URL in API response (dev only)
- ⚠️ Show success message (but email won't be sent)

**Check console/terminal** for reset links in development mode!

## ✅ Testing

1. Configure SMTP in `.env.local`
2. Restart Next.js server: `npm run dev`
3. Go to `/forgot-password`
4. Enter email and submit
5. Check email inbox (or console in dev mode)

## 🔐 Security Notes

- **Never commit** `.env.local` to git
- Use **App Passwords** for Gmail (not your main password)
- In production, use professional email services:
  - SendGrid
  - AWS SES
  - Mailgun
  - Resend

## 📧 Email Features

- ✅ Password reset emails
- ✅ Email verification (ready)
- ✅ HTML email templates
- ✅ Plain text fallback
- ✅ Professional design

## 🎯 Current Status

- Email service implemented ✅
- Password reset emails ready ✅
- Development fallback (console logs) ✅
- Need to configure SMTP credentials ⚠️

## 📝 Quick Start

1. Add SMTP credentials to `.env.local`
2. Restart server
3. Test password reset
4. Check email inbox!
