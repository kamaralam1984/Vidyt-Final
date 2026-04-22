/**
 * Check a password against the HaveIBeenPwned k-anonymity API.
 * The full password never leaves the caller — only the first 5 chars of the
 * SHA-1 hash are sent, matching HIBP's recommended flow.
 *
 * Runs in the browser (uses Web Crypto) or server (Node 18+ has subtle).
 * Returns the number of times the password has appeared in breaches, or 0 if clean.
 */
export async function hibpBreachCount(password: string): Promise<number> {
  if (!password) return 0;
  const subtle: SubtleCrypto | undefined =
    typeof crypto !== 'undefined' ? (crypto as any).subtle : undefined;
  if (!subtle) return 0;

  const bytes = new TextEncoder().encode(password);
  const buf = await subtle.digest('SHA-1', bytes);
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!resp.ok) return 0;
  const body = await resp.text();
  for (const line of body.split('\n')) {
    const [s, c] = line.trim().split(':');
    if (s === suffix) return parseInt(c || '0', 10) || 0;
  }
  return 0;
}
