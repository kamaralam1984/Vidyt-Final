# OTP Email Sending - Fixed ✅

## Issues Found & Fixed

### 1. **Hardcoded Test Email Address** 
   - **Problem**: The email service was using `onboarding@resend.dev` (Resend test email) instead of your configured EMAIL_FROM
   - **Fix**: Updated `sendMail()` to use `EMAIL_FROM` environment variable or SMTP user email
   - **File**: `services/email.ts`

### 2. **Poor Error Handling & Debugging**
   - **Problem**: No visibility into why OTP emails were failing
   - **Fix**: 
     - Added detailed console logging for successful/failed email sends
     - Added SMTP connection verification
     - Improved Resend fallback mechanism
   - **File**: `services/email.ts`

### 3. **Missing Email Testing Capability**
   - **Problem**: No way to test if email configuration was working
   - **Fix**: 
     - Added email test to `/api/test` endpoint
     - Created dedicated `/api/test/email` diagnostics endpoint
   - **Files**: 
     - `app/api/test/route.ts`
     - `app/api/test/email/route.ts` (NEW)

## How to Use

### Test Email Configuration

```bash
# Test email diagnostics
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "your-email@gmail.com", "otp": "123456", "action": "send"}'
```

### Response Will Show:
✅ SMTP connection status  
✅ Gmail app password validation  
✅ Email delivery confirmation  
✅ Error details if any

## Required Environment Variables

Ensure `.env.local` has:
```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=8rupiya@gmail.com
SMTP_PASS=stgfhdnugawzksjs    # Must be Gmail App Password (not regular password)
EMAIL_FROM="Viral Boost AI <noreply@viralboostal.com>"

# Resend (Optional - will fallback to SMTP if fails)
RESEND_API_KEY=re_FyGdR1eh_LhuXU1NJ1sQ6G3yi2pNhnt2P
```

## Gmail Setup Issues to Check

If OTP emails still aren't sending:

1. **App Password**: Gmail requires app-specific passwords for SMTP
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Use the generated password in `SMTP_PASS`

2. **Less Secure Apps**: Enable if using regular passwords
   - https://myaccount.google.com/lesssecureapps

3. **2FA Enabled**: Confirm 2-factor authentication is active (required for app passwords)

## Test OTP Signup Flow

1. Go to `/auth?mode=signup`
2. Fill in signup form
3. Click "Send OTP"
4. Check browser console for OTP in dev mode
5. Check email inbox for OTP (or test using endpoint above)

## Logs to Check

After fixing, watch server logs for:
```
✅ SMTP Server is ready to send emails
✅ Email sent via SMTP: user@example.com
✅ OTP email sent successfully to: user@example.com
```

If you see errors, the diagnostics endpoint will show exactly what's wrong.
