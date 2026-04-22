'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldOff, Loader2, AlertCircle, CheckCircle, Download, Copy,
  KeyRound, QrCode, Lock,
} from 'lucide-react';

type Status = { enabled: boolean; pendingEnrollment: boolean };

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export default function SecurityPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Enrollment flow state
  const [enroll, setEnroll] = useState<{ qr: string; secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Disable flow state
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/auth/2fa/status', { headers: authHeaders(), cache: 'no-store' });
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load status');
      setStatus({ enabled: !!d.enabled, pendingEnrollment: !!d.pendingEnrollment });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const startEnroll = async () => {
    setError(''); setSuccess(''); setBusy(true);
    try {
      const r = await fetch('/api/auth/2fa/enroll', { method: 'POST', headers: authHeaders() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Enrollment failed');
      setEnroll({ qr: d.qr, secret: d.secret, otpauthUrl: d.otpauthUrl });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyAndEnable = async () => {
    setError(''); setSuccess(''); setBusy(true);
    try {
      const r = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Verification failed');
      if (d.backupCodes) setBackupCodes(d.backupCodes);
      setSuccess('Two-factor authentication is now active.');
      setEnroll(null);
      setCode('');
      await loadStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const disable2fa = async () => {
    setError(''); setSuccess(''); setBusy(true);
    try {
      const r = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          password: disablePassword,
          ...(disableCode ? { code: disableCode } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not disable 2FA');
      setSuccess('Two-factor authentication has been turned off.');
      setDisablePassword('');
      setDisableCode('');
      setBackupCodes(null);
      await loadStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard.');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Clipboard unavailable — copy manually.');
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob(
      [
        'Vidyt — Two-Factor Authentication Backup Codes',
        'Generated: ' + new Date().toISOString(),
        'Use each code ONCE if you lose access to your authenticator.',
        '',
        ...backupCodes,
      ].join('\n'),
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vidyt-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-10 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-[#AAAAAA] hover:text-white">
            &larr; Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-3 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#FF0000]" />
            Account Security
          </h1>
          <p className="text-[#AAAAAA] mt-2">
            Protect your account with time-based one-time passwords (TOTP).
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-500/15 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-green-500/15 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <p className="text-green-200 text-sm">{success}</p>
          </motion.div>
        )}

        <section className="bg-[#181818] border border-[#212121] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-[#AAAAAA] mt-1">
                Status:{' '}
                {loading ? (
                  <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> loading</span>
                ) : status?.enabled ? (
                  <span className="text-green-400 font-medium">Enabled</span>
                ) : status?.pendingEnrollment ? (
                  <span className="text-yellow-400 font-medium">Enrollment pending</span>
                ) : (
                  <span className="text-[#AAAAAA] font-medium">Disabled</span>
                )}
              </p>
            </div>
            {!loading && status && !status.enabled && !enroll && (
              <button
                onClick={() => void startEnroll()}
                disabled={busy}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 rounded-lg font-semibold flex items-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Enable 2FA
              </button>
            )}
          </div>

          {enroll && !status?.enabled && (
            <div className="mt-4 border-t border-[#212121] pt-4">
              <p className="text-sm text-[#AAAAAA] mb-4">
                Scan this QR code with Google Authenticator, 1Password, Authy, or any TOTP app.
                Then enter the 6-digit code it shows.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="bg-white p-3 rounded-lg shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={enroll.qr} alt="2FA QR code" width={200} height={200} />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[#AAAAAA]">Manual secret</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-[#212121] border border-[#333] rounded text-xs break-all">
                        {enroll.secret}
                      </code>
                      <button onClick={() => void copyText(enroll.secret)} className="p-2 hover:bg-[#212121] rounded" aria-label="Copy secret">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[#AAAAAA]">Verification code</label>
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="mt-1 w-full px-4 py-3 bg-[#212121] border border-[#333] rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void verifyAndEnable()}
                      disabled={busy || code.length !== 6}
                      className="flex-1 py-3 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Verify &amp; Enable
                    </button>
                    <button
                      onClick={() => { setEnroll(null); setCode(''); }}
                      className="px-4 py-3 bg-[#212121] hover:bg-[#2a2a2a] rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!enroll && status?.pendingEnrollment && !status.enabled && (
            <div className="mt-4 border-t border-[#212121] pt-4">
              <p className="text-sm text-yellow-300 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                You started enrollment but never verified. Begin again to get a fresh QR code.
              </p>
              <button
                onClick={() => void startEnroll()}
                disabled={busy}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] rounded-lg font-semibold"
              >
                Restart enrollment
              </button>
            </div>
          )}
        </section>

        {backupCodes && (
          <section className="bg-[#181818] border border-yellow-500/40 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-yellow-400" />
              Backup Codes
            </h2>
            <p className="text-sm text-yellow-200/80 mb-4">
              Save these one-time codes somewhere safe. They will <strong>not be shown again</strong>.
              Each code works exactly once if you lose your authenticator.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {backupCodes.map((c) => (
                <code key={c} className="px-2 py-2 bg-[#212121] border border-[#333] rounded text-center text-sm font-mono">
                  {c}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadBackupCodes}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] rounded-lg text-sm font-semibold"
              >
                <Download className="w-4 h-4" /> Download .txt
              </button>
              <button
                onClick={() => void copyText(backupCodes.join('\n'))}
                className="flex items-center gap-2 px-4 py-2 bg-[#212121] hover:bg-[#2a2a2a] rounded-lg text-sm"
              >
                <Copy className="w-4 h-4" /> Copy all
              </button>
              <button
                onClick={() => setBackupCodes(null)}
                className="ml-auto px-4 py-2 text-sm text-[#AAAAAA] hover:text-white"
              >
                I&apos;ve saved them
              </button>
            </div>
          </section>
        )}

        {status?.enabled && (
          <section className="bg-[#181818] border border-[#212121] rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-red-400" />
              Disable 2FA
            </h2>
            <p className="text-sm text-[#AAAAAA] mb-4">
              For security, enter your password. Optionally include a current 6-digit code.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                />
              </div>
              <input
                inputMode="numeric"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Authenticator code (optional)"
                className="w-full px-4 py-3 bg-[#212121] border border-[#333] rounded-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
              />
              <button
                onClick={() => void disable2fa()}
                disabled={busy || !disablePassword}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                Disable 2FA
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
