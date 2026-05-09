'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon, Building, Phone, FileText, ShieldCheck, Bell, Mail, Moon,
  Loader2, ArrowRight, ArrowLeft, Check, AlertCircle,
  Target, Compass, Youtube, Calendar, Sparkles,
} from 'lucide-react';

type Profile = { name: string; companyName: string; phone: string; bio: string };
type Prefs = { notifications: boolean; emailUpdates: boolean; darkMode: boolean };
type Notebook = {
  goal: string;
  niche: string;
  channelUrl: string;
  experienceLevel: '' | 'beginner' | 'intermediate' | 'pro';
  postingFrequency: '' | 'daily' | 'weekly' | 'monthly' | 'rarely';
  note: string;
};

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

const STEPS = ['Profile', 'Notebook', 'Security', 'Preferences'] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userUniqueId, setUserUniqueId] = useState('');
  const [profile, setProfile] = useState<Profile>({ name: '', companyName: '', phone: '', bio: '' });
  const [notebook, setNotebook] = useState<Notebook>({
    goal: '', niche: '', channelUrl: '',
    experienceLevel: '', postingFrequency: '', note: '',
  });
  const [prefs, setPrefs] = useState<Prefs>({ notifications: true, emailUpdates: true, darkMode: false });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        // Load onboarding state + user info in parallel
        const [onbRes, meRes] = await Promise.all([
          fetch('/api/user/onboarding', { headers, cache: 'no-store' }),
          fetch('/api/auth/me', { headers, cache: 'no-store' }),
        ]);

        if (onbRes.status === 401) {
          window.location.href = '/login';
          return;
        }

        const d = await onbRes.json();

        let role = 'user';
        let uniqueId = '';
        if (meRes.ok) {
          const me = await meRes.json();
          role = me?.user?.role || 'user';
          uniqueId = me?.user?.uniqueId || '';
          setUserRole(role);
          setUserUniqueId(uniqueId);
        }

        if (d.completed) {
          navigateAfterComplete(role, uniqueId);
          return;
        }

        setStep(Math.min(d.step || 0, STEPS.length - 1));
        if (d.profile) setProfile(d.profile);
        if (d.preferences) setPrefs(d.preferences);
        if (d.notebook) {
          setNotebook({
            goal: d.notebook.goal || '',
            niche: d.notebook.niche || '',
            channelUrl: d.notebook.channelUrl || '',
            experienceLevel: d.notebook.experienceLevel || '',
            postingFrequency: d.notebook.postingFrequency || '',
            note: d.notebook.note || '',
          });
        }
        setTwoFactorEnabled(!!d.twoFactorEnabled);
      } catch (e: any) {
        setError('Failed to load. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Renew the token cookie via refresh endpoint, then navigate to the right page. */
  const goToDashboard = useCallback(async (role?: string, uniqueId?: string) => {
    setNavigating(true);
    try {
      // Step 1: Refresh the token cookie so middleware lets us through.
      // The 15-min token cookie from login may have expired.
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // send refresh_token cookie
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          localStorage.setItem('token', refreshData.token);
        }
        // Prefer role from refresh response (freshest data)
        role = role || refreshData.user?.role || userRole;
        uniqueId = uniqueId || refreshData.user?.uniqueId || userUniqueId;
      }
    } catch {
      // Network error — still attempt navigation with stale cookie
    }

    sessionStorage.setItem('onboardingJustCompleted', '1');
    navigateAfterComplete(role || userRole, uniqueId || userUniqueId);
  }, [userRole, userUniqueId]);

  function navigateAfterComplete(role: string, uniqueId: string) {
    if (role === 'super-admin') {
      window.location.href = '/admin/super';
    } else if (uniqueId) {
      window.location.href = `/user/${uniqueId}`;
    } else {
      window.location.href = '/dashboard';
    }
  }

  const saveProgress = useCallback(async (payload: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    const headers = token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };

    const r = await fetch('/api/user/onboarding', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Failed to save');
    return d;
  }, []);

  const next = async () => {
    if (navigating) return;
    setError('');
    if (step === 0) {
      if (!profile.name || profile.name.trim().length < 2) {
        setError('Please enter your name (at least 2 characters).');
        return;
      }
      setSaving(true);
      try { await saveProgress({ step: 1, profile }); } catch { /* continue */ }
      setSaving(false);
      setStep(1);
    } else if (step === 1) {
      // Notebook — every field optional. Persist only set fields so the
      // owner sees actual user-supplied values, not blanks.
      const payload: Record<string, string> = {};
      (['goal', 'niche', 'channelUrl', 'experienceLevel', 'postingFrequency', 'note'] as const).forEach((k) => {
        const v = (notebook[k] || '').trim();
        if (v) payload[k] = v;
      });
      setSaving(true);
      try { await saveProgress({ step: 2, notebook: payload }); } catch { /* continue */ }
      setSaving(false);
      setStep(2);
    } else if (step === 2) {
      setSaving(true);
      try { await saveProgress({ step: 3 }); } catch { /* continue */ }
      setSaving(false);
      setStep(3);
    } else if (step === 3) {
      setSaving(true);
      try { await saveProgress({ preferences: prefs, completed: true }); } catch { /* continue */ }
      setSaving(false);
      await goToDashboard();
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const skip = async () => {
    if (navigating) return;
    setSaving(true);
    try {
      await saveProgress({ completed: true });
    } catch {
      // Non-blocking
    } finally {
      setSaving(false);
    }
    await goToDashboard();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF0000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome — let&apos;s get set up</h1>
          <p className="text-[#AAAAAA]">Takes under a minute.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-[#FF0000]' : 'bg-[#212121] text-[#AAAAAA]'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-white' : 'text-[#AAAAAA]'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-[#333]" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#181818] border border-[#212121] rounded-2xl p-6"
        >
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2">Tell us about you</h2>
              <div>
                <label className="text-sm text-[#AAAAAA]">Full name</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#AAAAAA]">Company (optional)</label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                  <input
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#AAAAAA]">Phone (optional)</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="Digits only"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#AAAAAA]">Short bio (optional)</label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-[#AAAAAA]" />
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 500) })}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="What do you work on?"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF0000]" />
                Your notebook
              </h2>
              <p className="text-sm text-[#AAAAAA]">
                Help us understand what you&apos;re working on. This is private — only you and the VidYT
                owner can see it. Skip any field you&apos;re not sure about.
              </p>
              <div>
                <label className="text-sm text-[#AAAAAA]">Main goal</label>
                <div className="relative mt-1">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                  <input
                    value={notebook.goal}
                    onChange={(e) => setNotebook({ ...notebook, goal: e.target.value.slice(0, 240) })}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="e.g. Reach 100k subs in 6 months"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#AAAAAA]">Niche / topic</label>
                <div className="relative mt-1">
                  <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                  <input
                    value={notebook.niche}
                    onChange={(e) => setNotebook({ ...notebook, niche: e.target.value.slice(0, 80) })}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="e.g. Tech reviews, gaming, finance"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#AAAAAA]">Primary channel URL</label>
                <div className="relative mt-1">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                  <input
                    value={notebook.channelUrl}
                    onChange={(e) => setNotebook({ ...notebook, channelUrl: e.target.value.slice(0, 240) })}
                    className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#AAAAAA]">Experience level</label>
                  <div className="relative mt-1">
                    <select
                      value={notebook.experienceLevel}
                      onChange={(e) => setNotebook({ ...notebook, experienceLevel: e.target.value as Notebook['experienceLevel'] })}
                      className="w-full px-3 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    >
                      <option value="">Select…</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#AAAAAA]">Posting frequency</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA] pointer-events-none" />
                    <select
                      value={notebook.postingFrequency}
                      onChange={(e) => setNotebook({ ...notebook, postingFrequency: e.target.value as Notebook['postingFrequency'] })}
                      className="w-full pl-10 pr-3 py-3 bg-[#212121] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                    >
                      <option value="">Select…</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="rarely">Rarely</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#AAAAAA]">Note for the team (optional)</label>
                <textarea
                  value={notebook.note}
                  onChange={(e) => setNotebook({ ...notebook, note: e.target.value.slice(0, 2000) })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#212121] border border-[#333] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                  placeholder="Anything we should know — feedback, special requests, questions…"
                />
                <p className="text-[11px] text-[#666] mt-1">{notebook.note.length}/2000</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF0000]" />
                Secure your account
              </h2>
              <p className="text-sm text-[#AAAAAA]">
                We strongly recommend enabling two-factor authentication. You can do this now or later from
                the Security page.
              </p>
              <div className="p-4 bg-[#212121] border border-[#333] rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-[#AAAAAA]">
                    {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                  </p>
                </div>
                {twoFactorEnabled ? (
                  <span className="text-green-400 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" /> Active
                  </span>
                ) : (
                  <a
                    href="/dashboard/security"
                    className="px-3 py-2 bg-[#FF0000] hover:bg-[#CC0000] rounded-lg text-sm font-semibold"
                  >
                    Set up 2FA
                  </a>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold mb-2">Your preferences</h2>
              {[
                { key: 'notifications', label: 'In-app notifications', icon: Bell },
                { key: 'emailUpdates', label: 'Product email updates', icon: Mail },
                { key: 'darkMode', label: 'Dark mode', icon: Moon },
              ].map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-4 bg-[#212121] border border-[#333] rounded-lg cursor-pointer hover:bg-[#2a2a2a]"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#AAAAAA]" />
                    <span>{label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(prefs as any)[key]}
                    onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                    className="w-5 h-5 accent-[#FF0000]"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#212121]">
            {step > 0 ? (
              <button
                onClick={back}
                className="px-4 py-2 text-sm text-[#AAAAAA] hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => void skip()}
                disabled={saving || navigating}
                className="px-4 py-2 text-sm text-[#AAAAAA] hover:text-white disabled:opacity-50 flex items-center gap-1"
              >
                {navigating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Skip for now
              </button>
              <button
                onClick={() => void next()}
                disabled={saving || navigating}
                className="px-5 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 rounded-lg font-semibold flex items-center gap-2"
              >
                {(saving || navigating) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {step === STEPS.length - 1 ? 'Finish' : 'Continue'}
                {!saving && !navigating && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
