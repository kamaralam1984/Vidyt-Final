'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  /** Hide component once verified */
  alreadyVerified?: boolean;
  className?: string;
}

export default function EmailVerificationResend({ alreadyVerified, className = '' }: Props) {
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  if (alreadyVerified) return null;

  const COOLDOWN_MS = 60_000;
  const cooldownLeft = sentAt ? Math.max(0, COOLDOWN_MS - (Date.now() - sentAt)) : 0;

  const resend = async () => {
    if (cooldownLeft > 0 || sending) return;
    setError('');
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: token
          ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          : { 'Content-Type': 'application/json' },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not send');
      setSentAt(Date.now());
    } catch (e: any) {
      setError(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => void resend()}
        disabled={sending || cooldownLeft > 0}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#212121] hover:bg-[#2a2a2a] disabled:opacity-50 rounded-lg"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {cooldownLeft > 0 ? `Resend in ${Math.ceil(cooldownLeft / 1000)}s` : 'Resend verification email'}
      </button>
      {sentAt && !error && (
        <span className="text-xs text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Sent
        </span>
      )}
      {error && (
        <span className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </span>
      )}
    </div>
  );
}
