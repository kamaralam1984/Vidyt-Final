/**
 * Heuristic password strength scorer (0–4).
 * Works without any external dependency. If `zxcvbn` is installed the
 * PasswordStrengthMeter component will prefer it; this is the fallback
 * and is also safe to reuse server-side.
 */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface StrengthResult {
  score: StrengthScore;
  label: string;
  suggestions: string[];
}

const COMMON = new Set([
  'password', '123456', '12345678', 'qwerty', 'letmein', 'welcome',
  'admin', 'iloveyou', 'abc123', 'monkey', 'football', 'password1',
]);

export function scorePassword(pw: string): StrengthResult {
  const suggestions: string[] = [];
  if (!pw) return { score: 0, label: 'Too short', suggestions: ['Enter a password.'] };

  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(pw)) {
    return { score: 0, label: 'Very weak', suggestions: ['Avoid common or repeated passwords.'] };
  }

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;

  if (pw.length < 8) suggestions.push('Use at least 8 characters (12+ is much stronger).');
  if (!/[A-Z]/.test(pw)) suggestions.push('Add uppercase letters.');
  if (!/\d/.test(pw)) suggestions.push('Add a number.');
  if (!/[^A-Za-z0-9]/.test(pw)) suggestions.push('Add a symbol.');

  const label = (['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const)[score as StrengthScore];
  return { score: score as StrengthScore, label, suggestions };
}
