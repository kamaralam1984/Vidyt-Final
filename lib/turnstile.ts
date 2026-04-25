import 'server-only';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  ok: boolean;
  error?: string;
}

/**
 * Server-side Turnstile verification.
 * Skipped when TURNSTILE_SECRET_KEY is unset (dev/test convenience) — log a warning
 * instead of failing so local flows keep working without Cloudflare.
 */
export async function verifyTurnstile(token: string | undefined | null, remoteIp?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY is unset — skipping verification. Set it in production.');
    }
    return { ok: true };
  }
  if (!token) return { ok: false, error: 'CAPTCHA token missing' };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    const resp = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    const data = (await resp.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success) return { ok: true };
    return { ok: false, error: (data['error-codes'] || []).join(', ') || 'CAPTCHA failed' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'CAPTCHA verification error' };
  }
}
