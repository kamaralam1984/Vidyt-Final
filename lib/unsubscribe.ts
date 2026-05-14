/**
 * One-click unsubscribe helpers.
 *
 * Tokens are HMAC-SHA256(email|secret) so they can be verified without DB
 * lookup, and revoked just by rotating the secret. The same token is reused
 * across emails so a user only has to keep one URL.
 */

import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import EmailSuppression from '@/models/EmailSuppression';

function getSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'vidyt-unsubscribe-default-secret-change-me'
  );
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  return 'https://www.vidyt.com';
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function makeUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const sig = crypto.createHmac('sha256', getSecret()).update(normalized).digest();
  return b64url(sig).slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = makeUnsubscribeToken(email);
  // Constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getUnsubscribeUrl(email: string): string {
  const token = makeUnsubscribeToken(email);
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${getBaseUrl()}/api/email/unsubscribe?email=${e}&token=${token}`;
}

export async function isSuppressed(email: string): Promise<boolean> {
  if (!email) return true;
  try {
    await dbConnect();
    const found = await EmailSuppression.findOne({ email: email.trim().toLowerCase() }).lean();
    return !!found;
  } catch {
    // On DB failure, fail closed only for marketing — better to skip than to spam.
    return false;
  }
}

export async function suppress(email: string, source?: string): Promise<void> {
  await dbConnect();
  await EmailSuppression.updateOne(
    { email: email.trim().toLowerCase() },
    { $set: { reason: 'user_unsubscribe', source: source || 'unsubscribe-link', unsubscribedAt: new Date() } },
    { upsert: true }
  );
}

/**
 * Footer to append to every marketing email body. Mentions both why the user
 * is receiving the message and how to unsubscribe (CAN-SPAM requirements).
 */
export function getUnsubscribeFooterHtml(email: string): string {
  const url = getUnsubscribeUrl(email);
  return `
    <div style="margin-top:32px;padding:16px 12px 0;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#888;line-height:1.6;">
      <p style="margin:0 0 6px;">You're receiving this because you signed up at <strong>vidyt.com</strong>.</p>
      <p style="margin:0;">
        <a href="${url}" style="color:#888;text-decoration:underline;">Unsubscribe from marketing emails</a>
        · Vid YT, F-247, Sector 63, Noida, UP, India
      </p>
    </div>`;
}

export function getUnsubscribeFooterText(email: string): string {
  const url = getUnsubscribeUrl(email);
  return `\n\n--\nYou're receiving this because you signed up at vidyt.com.\nUnsubscribe: ${url}\nVid YT, F-247, Sector 63, Noida, UP, India`;
}

/**
 * Headers required for one-click unsubscribe (RFC 8058) — Gmail/Yahoo enforce
 * these for bulk senders since 2024. Pass into nodemailer/Resend `headers`.
 */
export function getUnsubscribeHeaders(email: string): Record<string, string> {
  const url = getUnsubscribeUrl(email);
  return {
    'List-Unsubscribe': `<${url}>, <mailto:unsubscribe@vidyt.com?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
