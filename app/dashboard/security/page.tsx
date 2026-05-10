'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  Loader2,
  Smartphone,
  AlertCircle,
  Check,
  Copy,
  Download,
  X,
} from 'lucide-react';

type Status = { enabled: boolean; pendingEnrollment: boolean };

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

export default function SecurityPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollment, setEnrollment] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/2fa/status', { headers: authHeaders(), cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load status');
      setStatus({ enabled: !!d.enabled, pendingEnrollment: !!d.pendingEnrollment });
    } catch (e: any) {
      setError(e?.message || 'Failed to load 2FA status');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const startEnroll = async () => {
    setError('');
    setInfo('');
    setEnrollLoading(true);
    try {
      const r = await fetch('/api/auth/2fa/enroll', { method: 'POST', headers: authHeaders() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Enrollment failed');
      setEnrollment({ qr: d.qr, secret: d.secret });
    } catch (e: any) {
      setError(e?.message || 'Enrollment failed');
    } finally {
      setEnrollLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifyLoading(true);
    try {
      const r = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Verification failed');
      if (Array.isArray(d.backupCodes)) setBackupCodes(d.backupCodes);
      setEnrollment(null);
      setCode('');
      setInfo('Two-factor authentication is now active.');
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!disablePassword) {
      setError('Password is required to disable 2FA.');
      return;
    }
    setDisableLoading(true);
    try {
      const payload: Record<string, string> = { password: disablePassword };
      if (/^\d{6}$/.test(disableCode)) payload.code = disableCode;
      const r = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Disable failed');
      setDisablePassword('');
      setDisableCode('');
      setShowDisable(false);
      setBackupCodes(null);
      setInfo('Two-factor authentication has been disabled.');
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || 'Disable failed');
    } finally {
      setDisableLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob(
      [
        'VidYT — Two-Factor Backup Codes\n',
        `Generated: ${new Date().toISOString()}\n\n`,
        'Each code can be used once. Store them somewhere safe.\n\n',
        backupCodes.join('\n'),
        '\n',
      ],
      { type: 'text/plain;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vidyt-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setInfo('Copied to clipboard.');
      setTimeout(() => setInfo(''), 1500);
    } catch {
      /* ignore */
    }
  };

  const enabled = !!status?.enabled;
  const pending = !!status?.pendingEnrollment;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#181818] border border-[#212121] rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Account Security</h1>
          </div>
          <p className="text-sm text-[#AAAAAA] mb-6">
            Your account is protected by encrypted password storage, short-lived JWTs with rotating refresh
            tokens, and brute-force lockouts. Manage extra factors below.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          {info && !error && (
            <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-emerald-200 text-sm">{info}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="flex items-center justify-between p-4 bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] rounded-xl transition group"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-[#AAAAAA]" />
                <div>
                  <p className="font-medium">Change password</p>
                  <p className="text-xs text-[#AAAAAA]">Send a reset OTP to your registered email.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#AAAAAA] group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center justify-between p-4 bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] rounded-xl transition group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#AAAAAA]" />
                <div>
                  <p className="font-medium">Active sessions</p>
                  <p className="text-xs text-[#AAAAAA]">Sign out from other devices via your dashboard.</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#AAAAAA] group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#181818] border border-[#212121] rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">Two-factor authentication</h2>
                <p className="text-xs text-[#AAAAAA]">Time-based one-time codes (TOTP).</p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                enabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : pending
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-[#212121] border-[#333] text-[#AAAAAA]'
              }`}
            >
              {statusLoading ? '…' : enabled ? 'Enabled' : pending ? 'Pending' : 'Off'}
            </span>
          </div>

          {statusLoading ? (
            <div className="flex items-center gap-2 text-[#AAAAAA] text-sm py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading status…
            </div>
          ) : enabled ? (
            <div className="mt-4">
              <p className="text-sm text-[#AAAAAA] mb-4">
                2FA is on. You will be prompted for a 6-digit code on every login.
              </p>
              {!showDisable ? (
                <button
                  onClick={() => setShowDisable(true)}
                  className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Disable 2FA
                </button>
              ) : (
                <form onSubmit={disable} className="space-y-3 mt-2">
                  <div>
                    <label className="block text-xs text-[#AAAAAA] mb-1">Current password</label>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full px-3 py-2 bg-[#212121] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#AAAAAA] mb-1">
                      6-digit code <span className="text-[#666]">(optional, for extra safety)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 bg-[#212121] border border-[#333] rounded-lg text-white text-sm tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={disableLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
                    >
                      {disableLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm disable
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisable(false);
                        setDisablePassword('');
                        setDisableCode('');
                      }}
                      className="px-4 py-2 text-sm text-[#AAAAAA] hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : !enrollment ? (
            <div className="mt-4">
              <p className="text-sm text-[#AAAAAA] mb-4">
                Add an authenticator app (Google Authenticator, 1Password, Authy) for an extra layer on every login.
              </p>
              <button
                onClick={startEnroll}
                disabled={enrollLoading}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-60 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
              >
                {enrollLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? 'Resume enrollment' : 'Enable 2FA'}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-start">
                <div className="bg-white p-2 rounded-lg w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={enrollment.qr} alt="2FA QR code" width={192} height={192} />
                </div>
                <div className="text-sm">
                  <p className="text-[#AAAAAA] mb-2">
                    Scan the QR with your authenticator app, or paste this secret manually:
                  </p>
                  <div className="flex items-center gap-2 bg-[#212121] border border-[#333] rounded-lg px-3 py-2 font-mono text-xs break-all">
                    <span className="flex-1">{enrollment.secret}</span>
                    <button
                      type="button"
                      onClick={() => copy(enrollment.secret)}
                      className="text-[#AAAAAA] hover:text-white"
                      aria-label="Copy secret"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={verify} className="space-y-3">
                <label className="block text-xs text-[#AAAAAA]">
                  Enter the 6-digit code from your app to finish enrollment
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-[#212121] border border-[#333] rounded-lg text-white text-2xl tracking-[0.5em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                  placeholder="000000"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-60 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
                  >
                    {verifyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verify and turn on
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollment(null);
                      setCode('');
                    }}
                    className="px-4 py-2 text-sm text-[#AAAAAA] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {backupCodes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#181818] border border-amber-500/40 rounded-2xl p-6 md:p-8"
          >
            <h3 className="text-lg font-bold mb-1">Save your backup codes</h3>
            <p className="text-sm text-[#AAAAAA] mb-4">
              Each code works once. Use them if you lose your authenticator. They will not be shown again.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {backupCodes.map((c) => (
                <code
                  key={c}
                  className="bg-[#0F0F0F] border border-[#333] rounded px-2 py-1 text-xs font-mono text-center"
                >
                  {c}
                </code>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadBackupCodes}
                className="px-3 py-2 bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] text-white rounded-lg text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download .txt
              </button>
              <button
                onClick={() => copy(backupCodes.join('\n'))}
                className="px-3 py-2 bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] text-white rounded-lg text-sm inline-flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy all
              </button>
              <button
                onClick={() => setBackupCodes(null)}
                className="px-3 py-2 text-sm text-[#AAAAAA] hover:text-white ml-auto"
              >
                I&apos;ve saved them
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
