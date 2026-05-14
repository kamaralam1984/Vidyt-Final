export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken, suppress } from '@/lib/unsubscribe';

// Renders a confirmation page on GET, and unsubscribes on POST (RFC 8058
// one-click). Both verify the HMAC token tied to the email address — no DB
// lookup needed, no auth required.

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – Vid YT</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0F0F0F;color:#fff;margin:0;padding:40px 20px;display:flex;justify-content:center;align-items:center;min-height:100vh;}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:40px;max-width:480px;text-align:center;}
h1{margin:0 0 12px;font-size:22px}
p{color:#aaa;line-height:1.55;margin:0 0 16px;font-size:15px}
a.btn{display:inline-block;padding:12px 24px;background:#FF0000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:8px;}
form{display:inline}
button{padding:12px 24px;background:#FF0000;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;}
.muted{color:#666;font-size:12px;margin-top:24px;}
</style></head><body><div class="card">${body}<p class="muted">Vid YT · vidyt.com</p></div></body></html>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get('email') || '').trim().toLowerCase();
  const token = searchParams.get('token') || '';
  const done = searchParams.get('done');

  if (!email || !verifyUnsubscribeToken(email, token)) {
    return new NextResponse(
      htmlPage('Invalid Link', `<h1>Invalid unsubscribe link</h1><p>This link has expired or was tampered with. Please contact support@vidyt.com if you keep receiving emails you didn't sign up for.</p>`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (done === '1') {
    return new NextResponse(
      htmlPage('Unsubscribed', `<h1>You're unsubscribed</h1><p><strong>${email}</strong> will no longer receive marketing or drip emails from Vid YT.</p><p>Account-related emails (password reset, payment receipts, security alerts) will still be delivered as required.</p><a class="btn" href="https://www.vidyt.com">Back to Vid YT</a>`),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Show confirmation form. POST will perform the actual unsubscribe.
  const body = `
    <h1>Unsubscribe from marketing emails?</h1>
    <p>You'll stop receiving promotional and drip emails sent to <strong>${email}</strong>. You'll still get transactional emails (receipts, password resets).</p>
    <form method="POST">
      <input type="hidden" name="email" value="${email}" />
      <input type="hidden" name="token" value="${token}" />
      <button type="submit">Confirm Unsubscribe</button>
    </form>`;
  return new NextResponse(htmlPage('Unsubscribe', body), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  // RFC 8058 one-click clients POST with no body, query string only.
  // Browser form posts will arrive as form-urlencoded.
  const url = new URL(req.url);
  let email = url.searchParams.get('email') || '';
  let token = url.searchParams.get('token') || '';

  const ct = req.headers.get('content-type') || '';
  if (!email && (ct.includes('form-urlencoded') || ct.includes('multipart/form-data'))) {
    const form = await req.formData().catch(() => null);
    if (form) {
      email = String(form.get('email') || '');
      token = String(form.get('token') || '');
    }
  }

  email = email.trim().toLowerCase();

  if (!email || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }

  await suppress(email, 'one-click');

  // For one-click POST (no Accept header preference for HTML), return 200.
  // For browser form POST, redirect to GET ?done=1 confirmation page.
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    const back = new URL(req.url);
    back.searchParams.set('done', '1');
    return NextResponse.redirect(back, { status: 303 });
  }
  return NextResponse.json({ success: true, email });
}
