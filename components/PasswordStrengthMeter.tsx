'use client';

import { useEffect, useMemo, useState } from 'react';
import { scorePassword, type StrengthScore } from '@/lib/passwordStrength';
import { hibpBreachCount } from '@/lib/hibp';
import { AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  password: string;
  /** Opt in to HaveIBeenPwned check (sends SHA-1 prefix only). Debounced. */
  checkBreached?: boolean;
  onScoreChange?: (score: StrengthScore) => void;
}

const BAR_COLORS = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

export default function PasswordStrengthMeter({ password, checkBreached = true, onScoreChange }: Props) {
  const result = useMemo(() => scorePassword(password), [password]);
  const [breachCount, setBreachCount] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    onScoreChange?.(result.score);
  }, [result.score, onScoreChange]);

  useEffect(() => {
    if (!checkBreached || password.length < 6) {
      setBreachCount(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const c = await hibpBreachCount(password);
        setBreachCount(c);
      } catch {
        setBreachCount(null);
      } finally {
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [password, checkBreached]);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${i <= result.score ? BAR_COLORS[result.score] : 'bg-[#333]'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1 text-xs">
        <span className={result.score >= 3 ? 'text-green-400' : result.score >= 2 ? 'text-yellow-400' : 'text-red-400'}>
          {result.label}
        </span>
        {checking && <Loader2 className="w-3 h-3 animate-spin text-[#AAAAAA]" />}
        {breachCount !== null && breachCount > 0 && (
          <span className="text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Found in {breachCount.toLocaleString()} breaches
          </span>
        )}
        {breachCount === 0 && !checking && (
          <span className="text-green-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Not in known breaches
          </span>
        )}
      </div>
      {result.suggestions.length > 0 && result.score < 3 && (
        <ul className="mt-1 text-xs text-[#AAAAAA] list-disc pl-4">
          {result.suggestions.slice(0, 2).map((s) => <li key={s}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}
