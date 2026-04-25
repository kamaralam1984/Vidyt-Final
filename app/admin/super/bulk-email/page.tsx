'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Mail, Send, Calendar, BarChart2, Sparkles, Upload, Trash2,
  CheckCircle2, XCircle, Clock, RefreshCw, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Play, Ban, Search, Youtube, Facebook,
  Instagram, MapPin, Copy, PlusCircle, ExternalLink, Phone, Globe,
  Star, Users, Filter, Database, Download, FileText, FileSpreadsheet,
  FileDown, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Campaign {
  _id: string;
  subject: string;
  status: 'draft' | 'sending' | 'done' | 'scheduled';
  sentCount: number;
  failedCount: number;
  recipients: string[];
  scheduledAt?: string;
  createdAt: string;
  logs?: { email: string; status: 'sent' | 'failed'; error?: string; sentAt: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: '/api/admin/super/bulk-email' });
const authCfg = () => ({ headers: getAuthHeaders() });

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-white/10 text-white/50',
  sending: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  scheduled: 'bg-amber-500/20 text-amber-400',
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[status] || 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  );
}

function parseEmails(raw: string): string[] {
  return raw.split(/[\n,;]+/).map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'finder', label: 'Email Finder', icon: Search },
  { id: 'saved', label: 'Saved Emails', icon: Database },
  { id: 'compose', label: 'Compose', icon: Send },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'campaigns', label: 'Campaigns', icon: BarChart2 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BulkEmailPage() {
  const [tab, setTab] = useState<'finder' | 'saved' | 'compose' | 'schedule' | 'campaigns'>('finder');
  // Global found-emails state shared between finder → compose
  const [foundEmails, setFoundEmails] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6 text-red-400" /> Bulk Email Marketing
        </h1>
        <p className="text-white/40 text-sm mt-1">Send campaigns, schedule emails, and track results</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-red-600 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'finder' && (
            <EmailFinderTab
              onAddToCompose={(emails) => {
                setFoundEmails(emails);
                setTab('compose');
              }}
            />
          )}
          {tab === 'saved' && <SavedEmailsTab onAddToCompose={(emails) => { setFoundEmails(emails); setTab('compose'); }} />}
          {tab === 'compose' && <ComposeTab prefillRecipients={foundEmails} onClearPrefill={() => setFoundEmails([])} />}
          {tab === 'schedule' && <ScheduleTab />}
          {tab === 'campaigns' && <CampaignsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Compose Tab ──────────────────────────────────────────────────────────────
function ComposeTab({ prefillRecipients = [], onClearPrefill }: { prefillRecipients?: string[]; onClearPrefill?: () => void }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');

  // Merge prefill into recipients once
  useEffect(() => {
    if (prefillRecipients.length > 0) {
      setRecipients(prev => {
        const existing = new Set(parseEmails(prev));
        prefillRecipients.forEach(e => existing.add(e));
        return Array.from(existing).join('\n');
      });
      onClearPrefill?.();
    }
  }, [prefillRecipients]);
  const [rateLimit, setRateLimit] = useState(30);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emailCount = parseEmails(recipients).length;

  async function handleAIGenerate() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai-generate', { topic: aiTopic }, authCfg());
      setSubject(data.subject || '');
      setBody(data.body || '');
    } catch (e: any) {
      setResult({ type: 'error', msg: e.response?.data?.error || 'AI generation failed' });
    } finally {
      setAiLoading(false);
    }
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const emails = text.split(/[\n,;]+/).map(r => r.trim()).filter(r => r.includes('@'));
      setRecipients(prev => {
        const existing = new Set(parseEmails(prev));
        emails.forEach(em => existing.add(em.toLowerCase()));
        return Array.from(existing).join('\n');
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSend() {
    setResult(null);
    if (!subject || !body || emailCount === 0) {
      return setResult({ type: 'error', msg: 'Subject, body, and at least one recipient are required' });
    }
    setSending(true);
    try {
      const { data } = await api.post('/send', { subject, body, recipients, rateLimit }, authCfg());
      setResult({ type: 'success', msg: `Campaign started! Sending to ${data.total} recipients.` });
      setSubject(''); setBody(''); setRecipients('');
    } catch (e: any) {
      setResult({ type: 'error', msg: e.response?.data?.error || 'Send failed' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: Compose form */}
      <div className="xl:col-span-2 space-y-5">
        {/* AI Generator */}
        <Card title="AI Email Generator" icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
          <div className="flex gap-2">
            <input
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
              placeholder="e.g. Summer sale discount for Pro users"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500/50 placeholder-white/30"
            />
            <button
              onClick={handleAIGenerate}
              disabled={aiLoading || !aiTopic.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </Card>

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500/50 placeholder-white/30"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Message (HTML supported)</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={12}
            placeholder="<p>Hello,</p><p>Your email body here...</p>"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-red-500/50 placeholder-white/30 font-mono resize-y"
          />
        </div>
      </div>

      {/* Right: Recipients + settings */}
      <div className="space-y-5">
        <Card title="Recipients" icon={<Mail className="w-4 h-4 text-red-400" />}>
          <div className="space-y-3">
            <textarea
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              rows={8}
              placeholder="Enter emails (one per line, or comma-separated)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-red-500/50 placeholder-white/30 resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">{emailCount} valid email{emailCount !== 1 ? 's' : ''}</span>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload CSV
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
          </div>
        </Card>

        <Card title="Rate Limit" icon={<Clock className="w-4 h-4 text-white/40" />}>
          <div className="flex items-center gap-3">
            <input
              type="range" min={1} max={100} value={rateLimit}
              onChange={e => setRateLimit(Number(e.target.value))}
              className="flex-1 accent-red-500"
            />
            <span className="text-sm font-mono w-24 text-right text-white/70">{rateLimit}/min</span>
          </div>
          <p className="text-xs text-white/30 mt-1">
            ~{emailCount > 0 ? Math.ceil(emailCount / rateLimit) : 0} min total send time
          </p>
        </Card>

        {result && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            result.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            {result.msg}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : `Send to ${emailCount} recipient${emailCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function ScheduleTab() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [rateLimit, setRateLimit] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [scheduled, setScheduled] = useState<Campaign[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const emailCount = parseEmails(recipients).length;

  const fetchScheduled = useCallback(async () => {
    try {
      const { data } = await api.get('/schedule', authCfg());
      setScheduled(data.campaigns || []);
    } catch {}
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchScheduled(); }, [fetchScheduled]);

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const emails = text.split(/[\n,;]+/).map(r => r.trim()).filter(r => r.includes('@'));
      setRecipients(prev => {
        const existing = new Set(parseEmails(prev));
        emails.forEach(em => existing.add(em.toLowerCase()));
        return Array.from(existing).join('\n');
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSchedule() {
    setResult(null);
    if (!subject || !body || emailCount === 0 || !scheduledAt) {
      return setResult({ type: 'error', msg: 'All fields are required' });
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/schedule', { subject, body, recipients, scheduledAt, rateLimit }, authCfg());
      setResult({ type: 'success', msg: `Scheduled for ${new Date(data.scheduledAt).toLocaleString()} — ${data.total} recipients` });
      setSubject(''); setBody(''); setRecipients(''); setScheduledAt('');
      fetchScheduled();
    } catch (e: any) {
      setResult({ type: 'error', msg: e.response?.data?.error || 'Schedule failed' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this scheduled campaign?')) return;
    try {
      await api.delete(`/schedule?id=${id}`, authCfg());
      setScheduled(s => s.filter(c => c._id !== id));
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to cancel');
    }
  }

  // Compute min datetime for input (1 min from now)
  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Form */}
      <div className="xl:col-span-2 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500/50 placeholder-white/30" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Message (HTML supported)</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
            placeholder="<p>Your email body here...</p>"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-red-500/50 placeholder-white/30 font-mono resize-y" />
        </div>

        {/* Scheduled campaigns list */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-white/70 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Scheduled Campaigns
          </h3>
          {loadingList ? (
            <div className="flex items-center gap-2 text-white/30 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
          ) : scheduled.length === 0 ? (
            <p className="text-white/30 text-sm py-4">No scheduled campaigns</p>
          ) : (
            <div className="space-y-2">
              {scheduled.map(c => (
                <div key={c._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">{c.subject}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {c.recipients.length} recipients · {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <button onClick={() => handleCancel(c._id)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors ml-4">
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="space-y-5">
        <Card title="Recipients" icon={<Mail className="w-4 h-4 text-red-400" />}>
          <textarea value={recipients} onChange={e => setRecipients(e.target.value)} rows={6}
            placeholder="Enter emails (one per line)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-red-500/50 placeholder-white/30 resize-y" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40">{emailCount} valid</span>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              <Upload className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
        </Card>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Schedule Date & Time</label>
          <input type="datetime-local" value={scheduledAt} min={minDatetime} onChange={e => setScheduledAt(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500/50 text-white [color-scheme:dark]" />
        </div>

        <Card title="Rate Limit" icon={<Clock className="w-4 h-4 text-white/40" />}>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={100} value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} className="flex-1 accent-red-500" />
            <span className="text-sm font-mono w-24 text-right text-white/70">{rateLimit}/min</span>
          </div>
        </Card>

        {result && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            result.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            {result.msg}
          </div>
        )}

        <button onClick={handleSchedule} disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          {submitting ? 'Scheduling...' : 'Schedule Campaign'}
        </button>
      </div>
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────
function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/campaigns?page=${p}&limit=20`, authCfg());
      setCampaigns(data.campaigns || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await api.delete(`/campaigns?id=${id}`, authCfg());
      setCampaigns(c => c.filter(x => x._id !== id));
      setTotal(t => t - 1);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  }

  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">{total} campaign{total !== 1 ? 's' : ''} total</p>
        <button onClick={() => fetchCampaigns(page)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: total, color: 'text-white' },
          { label: 'Sending', value: campaigns.filter(c => c.status === 'sending').length, color: 'text-blue-400' },
          { label: 'Done', value: campaigns.filter(c => c.status === 'done').length, color: 'text-green-400' },
          { label: 'Scheduled', value: campaigns.filter(c => c.status === 'scheduled').length, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/30">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>No campaigns yet. Send your first campaign.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c._id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge status={c.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.subject}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {c.recipients.length} recipients ·{' '}
                      {c.status === 'done'
                        ? <><span className="text-green-400">{c.sentCount} sent</span> · <span className="text-red-400">{c.failedCount} failed</span></>
                        : c.status === 'scheduled' && c.scheduledAt
                          ? `Scheduled ${new Date(c.scheduledAt).toLocaleString()}`
                          : c.status === 'sending' ? 'Sending now...' : '—'}
                      {' · '}{new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {c.logs && c.logs.length > 0 && (
                    <button
                      onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      {expanded === c._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Logs
                    </button>
                  )}
                  <button onClick={() => handleDelete(c._id)}
                    className="p-1.5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar for done campaigns */}
              {c.status === 'done' && c.recipients.length > 0 && (
                <div className="px-5 pb-3">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.round((c.sentCount / c.recipients.length) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    {Math.round((c.sentCount / c.recipients.length) * 100)}% delivery rate
                  </p>
                </div>
              )}

              {/* Expanded logs */}
              <AnimatePresence>
                {expanded === c._id && c.logs && c.logs.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 overflow-hidden"
                  >
                    <div className="p-4 max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/30 text-left border-b border-white/5">
                            <th className="pb-2 pr-4">Email</th>
                            <th className="pb-2 pr-4">Status</th>
                            <th className="pb-2 pr-4">Time</th>
                            <th className="pb-2">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.logs.map((log, i) => (
                            <tr key={i} className="border-b border-white/5 last:border-0">
                              <td className="py-1.5 pr-4 font-mono">{log.email}</td>
                              <td className="py-1.5 pr-4">
                                {log.status === 'sent'
                                  ? <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" /> sent</span>
                                  : <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" /> failed</span>}
                              </td>
                              <td className="py-1.5 pr-4 text-white/30">{new Date(log.sentAt).toLocaleTimeString()}</td>
                              <td className="py-1.5 text-red-400/70 truncate max-w-xs">{log.error || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => fetchCampaigns(page - 1)} disabled={page === 1}
            className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors">
            Prev
          </button>
          <span className="text-sm text-white/40">{page} / {pages}</span>
          <button onClick={() => fetchCampaigns(page + 1)} disabled={page === pages}
            className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Email Finder Tab ─────────────────────────────────────────────────────────
interface FinderResult {
  email: string | null;
  name: string;
  platform: string;
  profileUrl?: string;
  followers?: number | null;
  website?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | null;
  category?: string | null;
  country?: string | null;
}

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { id: 'google', label: 'Google Business', icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-600/10', border: 'border-blue-600/20' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
];

function EmailFinderTab({ onAddToCompose }: { onAddToCompose: (emails: string[]) => void }) {
  const [platform, setPlatform] = useState('youtube');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(100);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FinderResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterOnlyEmail, setFilterOnlyEmail] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const emailResults = filterOnlyEmail ? results.filter(r => r.email) : results;
  const emailsOnly = emailResults.map(r => r.email).filter(Boolean) as string[];

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(new Set());
    try {
      const { data } = await api.post('/find-emails', {
        platform, keyword, location, maxResults,
      }, authCfg());
      if (data.error) setError(data.error);
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(email: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === emailsOnly.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(emailsOnly));
    }
  }

  async function handleCopyAll() {
    await navigator.clipboard.writeText(emailsOnly.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleAddToCompose() {
    const toAdd = selected.size > 0 ? Array.from(selected) : emailsOnly;
    onAddToCompose(toAdd);
  }

  async function handleSaveToDb() {
    const toSave = selected.size > 0
      ? results.filter(r => r.email && selected.has(r.email))
      : results.filter(r => r.email);
    if (toSave.length === 0) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const { data } = await api.post('/found-emails', { emails: toSave, keyword }, authCfg());
      setSaveMsg({ type: 'success', msg: `${data.saved} emails saved to database! (${data.skipped} skipped/duplicate)` });
    } catch (e: any) {
      setSaveMsg({ type: 'error', msg: e.response?.data?.error || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  const activePlatform = PLATFORMS.find(p => p.id === platform)!;

  return (
    <div className="space-y-6">
      {/* Platform selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLATFORMS.map(p => {
          const Icon = p.icon;
          const isActive = platform === p.id;
          return (
            <button key={p.id} onClick={() => { setPlatform(p.id); setResults([]); setError(null); }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                isActive ? `${p.bg} ${p.border} border` : 'bg-white/5 border-white/5 hover:bg-white/8'
              }`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? p.color : 'text-white/40'}`} />
              <div className="text-left min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>{p.label}</p>
                <p className="text-xs text-white/30 truncate">
                  {p.id === 'youtube' && 'Channel emails'}
                  {p.id === 'google' && 'Business listings'}
                  {p.id === 'facebook' && 'Page contacts'}
                  {p.id === 'instagram' && 'Business accounts'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className={`rounded-xl border p-5 space-y-4 ${activePlatform.bg} ${activePlatform.border}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {platform === 'youtube' && 'Niche / Channel Keyword'}
              {platform === 'google' && 'Business Type / Keyword'}
              {platform === 'facebook' && 'Page Keyword / Category'}
              {platform === 'instagram' && 'Business Keyword'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={
                  platform === 'youtube' ? 'e.g. fitness india, cooking channel, tech review' :
                  platform === 'google' ? 'e.g. restaurant, gym, digital marketing agency' :
                  platform === 'facebook' ? 'e.g. clothing brand, coaching, real estate' :
                  'e.g. fashion, food blogger, startup'
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-white/30 placeholder-white/20"
              />
            </div>
          </div>

          {platform === 'google' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Delhi, India"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-white/30 placeholder-white/20" />
              </div>
            </div>
          )}

          <div className={platform !== 'google' ? 'space-y-1' : 'hidden md:block space-y-1'}>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Max Results</label>
            <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-white/30 text-white">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading || !keyword.trim()}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors ${
            platform === 'youtube' ? 'bg-red-600 hover:bg-red-500' :
            platform === 'google' ? 'bg-blue-600 hover:bg-blue-500' :
            platform === 'facebook' ? 'bg-blue-700 hover:bg-blue-600' :
            'bg-pink-600 hover:bg-pink-500'
          }`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching...' : `Find Emails on ${activePlatform.label}`}
        </button>
      </div>

      {/* Save feedback */}
      {saveMsg && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${
          saveMsg.type === 'success' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
        }`}>
          {saveMsg.type === 'success' ? <Database className="w-4 h-4 text-blue-400 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />}
          <p className={`text-sm ${saveMsg.type === 'success' ? 'text-blue-400' : 'text-red-400'}`}>{saveMsg.msg}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-400 font-medium">Error</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
            {error.includes('not configured') && (
              <p className="text-xs text-white/40 mt-2">
                Add the required credentials to <code className="bg-white/10 px-1 rounded">.env.local</code> and restart the server.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-white/50">
                <span className="text-white font-semibold">{emailResults.length}</span> result{emailResults.length !== 1 ? 's' : ''}
                {results.filter(r => r.email).length !== results.length && (
                  <span className="ml-1 text-white/30">({results.filter(r => r.email).length} with email)</span>
                )}
              </p>
              <label className="flex items-center gap-1.5 text-xs text-white/40 cursor-pointer select-none">
                <input type="checkbox" checked={filterOnlyEmail} onChange={e => setFilterOnlyEmail(e.target.checked)}
                  className="accent-red-500 w-3.5 h-3.5" />
                Email only
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleAll} className="text-xs text-white/40 hover:text-white transition-colors px-2 py-1 bg-white/5 rounded">
                {selected.size === emailsOnly.length && emailsOnly.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={handleCopyAll} disabled={emailsOnly.length === 0}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30">
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy All'}
              </button>
              <button onClick={handleSaveToDb} disabled={saving || emailsOnly.length === 0}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-30 px-3 py-1.5 rounded-lg transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : selected.size > 0 ? `Save ${selected.size} to DB` : `Save All to DB`}
              </button>
              <button onClick={handleAddToCompose} disabled={emailsOnly.length === 0}
                className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-30 px-3 py-1.5 rounded-lg transition-colors">
                <PlusCircle className="w-3.5 h-3.5" />
                {selected.size > 0 ? `Add ${selected.size} to Compose` : `Add All ${emailsOnly.length} to Compose`}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="pl-4 pr-2 py-3 w-8">
                      <input type="checkbox"
                        checked={selected.size === emailsOnly.length && emailsOnly.length > 0}
                        onChange={toggleAll}
                        className="accent-red-500" />
                    </th>
                    <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                    <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Info</th>
                    <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {emailResults.map((r, i) => (
                    <tr key={i} className={`border-b border-white/5 last:border-0 transition-colors ${
                      r.email && selected.has(r.email) ? 'bg-green-500/5' : 'hover:bg-white/[0.02]'
                    }`}>
                      <td className="pl-4 pr-2 py-3">
                        {r.email ? (
                          <input type="checkbox" checked={selected.has(r.email)} onChange={() => r.email && toggleSelect(r.email)}
                            className="accent-red-500" />
                        ) : <span className="text-white/10">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={r.platform} />
                          <span className="font-medium truncate max-w-[180px]">{r.name}</span>
                        </div>
                        {r.category && <p className="text-xs text-white/30 mt-0.5 truncate max-w-[180px]">{r.category}</p>}
                        {r.country && <p className="text-xs text-white/30 mt-0.5">{r.country}</p>}
                      </td>
                      <td className="px-3 py-3">
                        {r.email ? (
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{r.email}</code>
                            <button onClick={() => navigator.clipboard.writeText(r.email!)}
                              className="text-white/20 hover:text-white/60 transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Not found</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          {r.followers != null && (
                            <div className="flex items-center gap-1 text-xs text-white/40">
                              <Users className="w-3 h-3" />
                              {r.followers >= 1000000
                                ? `${(r.followers / 1000000).toFixed(1)}M`
                                : r.followers >= 1000
                                  ? `${(r.followers / 1000).toFixed(1)}K`
                                  : r.followers}
                            </div>
                          )}
                          {r.phone && (
                            <div className="flex items-center gap-1 text-xs text-white/40">
                              <Phone className="w-3 h-3" />{r.phone}
                            </div>
                          )}
                          {r.website && (
                            <div className="flex items-center gap-1 text-xs text-white/40 truncate max-w-[160px]">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{r.website.replace(/^https?:\/\//, '')}</span>
                            </div>
                          )}
                          {r.rating != null && (
                            <div className="flex items-center gap-1 text-xs text-amber-400/70">
                              <Star className="w-3 h-3" />{r.rating}
                            </div>
                          )}
                          {r.address && (
                            <div className="flex items-center gap-1 text-xs text-white/30 truncate max-w-[160px]">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{r.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {r.profileUrl && (
                          <a href={r.profileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-white/30 hover:text-white transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom action */}
          {emailsOnly.length > 0 && (
            <div className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-xl px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-green-400">
                  {selected.size > 0 ? `${selected.size} emails selected` : `${emailsOnly.length} emails found`}
                </p>
                <p className="text-xs text-white/30 mt-0.5">Save to database or use in a campaign</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSaveToDb} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save to DB'}
                </button>
                <button onClick={handleAddToCompose}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Add to Compose
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && !error && results.length === 0 && keyword && (
        <div className="text-center py-16 text-white/20">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>No results yet. Click &quot;Find Emails&quot; to search.</p>
        </div>
      )}
    </div>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'youtube') return <Youtube className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  if (platform === 'facebook') return <Facebook className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  if (platform === 'instagram') return <Instagram className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />;
  return <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
}

// ─── Saved Emails Tab ─────────────────────────────────────────────────────────
interface SavedEmail {
  _id: string;
  email: string;
  name: string;
  platform: string;
  followers?: number | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  rating?: number | null;
  category?: string | null;
  country?: string | null;
  profileUrl?: string | null;
  keyword: string;
  savedAt: string;
}

function SavedEmailsTab({ onAddToCompose }: { onAddToCompose: (emails: string[]) => void }) {
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchEmails = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (search) params.set('search', search);
      if (platformFilter) params.set('platform', platformFilter);
      const { data } = await api.get(`/found-emails?${params}`, authCfg());
      setEmails(data.emails || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  }, [search, platformFilter]);

  useEffect(() => { fetchEmails(1); }, [fetchEmails]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === emails.length) setSelected(new Set());
    else setSelected(new Set(emails.map(e => e._id)));
  }

  async function handleDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} email(s)?`)) return;
    setDeleting(true);
    try {
      await api.delete('/found-emails', { ...authCfg(), data: { ids } });
      setEmails(prev => prev.filter(e => !ids.includes(e._id)));
      setTotal(t => t - ids.length);
      setSelected(new Set());
    } catch (e: any) {
      alert(e.response?.data?.error || 'Delete failed');
    } finally { setDeleting(false); }
  }

  async function handleDeleteAll() {
    if (!confirm('Delete ALL saved emails? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete('/found-emails?all=true', authCfg());
      setEmails([]); setTotal(0); setSelected(new Set());
    } catch (e: any) {
      alert(e.response?.data?.error || 'Delete failed');
    } finally { setDeleting(false); }
  }

  async function handleExport(format: 'csv' | 'excel' | 'pdf') {
    if (format === 'pdf') {
      setPdfLoading(true);
      try {
        const params = new URLSearchParams({ format: 'pdf' });
        if (search) params.set('search', search);
        if (platformFilter) params.set('platform', platformFilter);
        const { data } = await api.get(`/found-emails/export?${params}`, authCfg());
        const rows: any[] = data.rows || [];
        if (rows.length === 0) { alert('No data to export'); return; }

        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const cols = ['Email', 'Name', 'Platform', 'Followers', 'Phone', 'Website', 'Country', 'Keyword'];
        const colW = [160, 120, 70, 60, 80, 120, 60, 80];
        const startX = 20;
        let y = 40;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Found Emails Export', startX, y);
        y += 20;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${rows.length} emails  |  Exported: ${new Date().toLocaleString()}`, startX, y);
        y += 20;

        // Header
        doc.setFillColor(30, 30, 30);
        doc.rect(startX, y - 12, colW.reduce((a, b) => a + b, 0), 16, 'F');
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        let cx = startX;
        cols.forEach((col, i) => { doc.text(col, cx + 3, y); cx += colW[i]; });
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        for (const row of rows) {
          if (y > 560) {
            doc.addPage();
            y = 40;
          }
          doc.setFillColor(y % 20 < 10 ? 245 : 255, y % 20 < 10 ? 245 : 255, y % 20 < 10 ? 245 : 255);
          doc.rect(startX, y - 10, colW.reduce((a, b) => a + b, 0), 14, 'F');
          doc.setTextColor(30, 30, 30);
          cx = startX;
          const vals = [
            row.Email, row.Name, row.Platform,
            String(row.Followers || ''), row.Phone || '', row.Website || '',
            row.Country || '', row.Keyword || '',
          ];
          vals.forEach((val, i) => {
            const txt = String(val || '').substring(0, 28);
            doc.text(txt, cx + 3, y);
            cx += colW[i];
          });
          y += 14;
        }

        doc.save(`found-emails-${data.timestamp}.pdf`);
      } catch (e: any) {
        alert('PDF export failed: ' + e.message);
      } finally { setPdfLoading(false); }
      return;
    }

    setExporting(format);
    try {
      const params = new URLSearchParams({ format });
      if (search) params.set('search', search);
      if (platformFilter) params.set('platform', platformFilter);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const resp = await fetch(`/api/admin/super/bulk-email/found-emails/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) { alert('Export failed'); return; }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `found-emails-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    } finally { setExporting(null); }
  }

  const selectedEmails = emails.filter(e => selected.has(e._id)).map(e => e.email);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" /> Saved Emails
          </h2>
          <p className="text-xs text-white/40 mt-0.5">{total} emails in database</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export buttons */}
          <button onClick={() => handleExport('csv')} disabled={!!exporting}
            className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {exporting === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-green-400" />}
            CSV
          </button>
          <button onClick={() => handleExport('excel')} disabled={!!exporting}
            className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
            Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={pdfLoading}
            className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-red-400" />}
            PDF
          </button>
          {selected.size > 0 && (
            <>
              <button onClick={() => onAddToCompose(selectedEmails)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> Add {selected.size} to Compose
              </button>
              <button onClick={() => handleDelete(Array.from(selected))} disabled={deleting}
                className="flex items-center gap-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete {selected.size}
              </button>
            </>
          )}
          {total > 0 && selected.size === 0 && (
            <button onClick={handleDeleteAll} disabled={deleting}
              className="flex items-center gap-1.5 text-xs bg-red-600/10 hover:bg-red-600/30 text-red-400/70 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchEmails(1)}
            placeholder="Search email or name..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-blue-500/50 placeholder-white/20"
          />
        </div>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50">
          <option value="">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="google_business">Google Business</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </select>
        <button onClick={() => fetchEmails(1)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors">
          <Search className="w-3.5 h-3.5" /> Search
        </button>
        <button onClick={() => fetchEmails(page)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/30">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <Database className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>No saved emails yet.</p>
          <p className="text-xs mt-1">Use Email Finder and click &quot;Save to DB&quot;</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left bg-white/[0.03]">
                  <th className="pl-4 pr-2 py-3 w-8">
                    <input type="checkbox"
                      checked={selected.size === emails.length && emails.length > 0}
                      onChange={toggleAll}
                      className="accent-blue-500" />
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Platform</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Info</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Keyword</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Saved</th>
                  <th className="px-3 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => (
                  <tr key={e._id} className={`border-b border-white/5 last:border-0 transition-colors ${
                    selected.has(e._id) ? 'bg-blue-500/5' : 'hover:bg-white/[0.02]'
                  }`}>
                    <td className="pl-4 pr-2 py-2.5">
                      <input type="checkbox" checked={selected.has(e._id)} onChange={() => toggleSelect(e._id)}
                        className="accent-blue-500" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{e.email}</code>
                        <button onClick={() => navigator.clipboard.writeText(e.email)}
                          className="text-white/20 hover:text-white/60 transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={e.platform} />
                        <span className="truncate max-w-[150px] text-xs font-medium">{e.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        e.platform === 'youtube' ? 'bg-red-500/10 text-red-400' :
                        e.platform === 'facebook' ? 'bg-blue-500/10 text-blue-400' :
                        e.platform === 'instagram' ? 'bg-pink-500/10 text-pink-400' :
                        'bg-blue-600/10 text-blue-300'
                      }`}>
                        {e.platform.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="space-y-0.5">
                        {e.followers != null && (
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <Users className="w-3 h-3" />
                            {e.followers >= 1000000 ? `${(e.followers / 1000000).toFixed(1)}M` :
                              e.followers >= 1000 ? `${(e.followers / 1000).toFixed(1)}K` : e.followers}
                          </div>
                        )}
                        {e.phone && <div className="flex items-center gap-1 text-xs text-white/40"><Phone className="w-3 h-3" />{e.phone}</div>}
                        {e.country && <div className="text-xs text-white/30">{e.country}</div>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{e.keyword || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-white/30">
                      {new Date(e.savedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {e.profileUrl && (
                          <a href={e.profileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-white/20 hover:text-white/60 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => handleDelete([e._id])} disabled={deleting}
                          className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-30">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchEmails(page - 1)} disabled={page === 1 || loading}
            className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors">
            Prev
          </button>
          <span className="text-sm text-white/40">{page} / {pages} ({total} total)</span>
          <button onClick={() => fetchEmails(page + 1)} disabled={page === pages || loading}
            className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card component ───────────────────────────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
