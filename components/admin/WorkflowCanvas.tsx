'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Clock, Database, Mail, Server, Shield, Bot, CreditCard,
  Youtube, Globe, Users, Activity, Cpu, Eye, Send, FileText,
  CheckCircle, XCircle, ArrowRight, GitBranch, Play, Settings,
  Search, Webhook, BarChart3, Radio, Layers, Hash, Code,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Move,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface WFNode {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;      // icon key
  x: number;
  y: number;
  type: 'trigger' | 'action' | 'condition' | 'output' | 'loop';
  color: string;     // tailwind color key
}

interface WFEdge {
  from: string;
  to: string;
  label?: string;
  type?: 'default' | 'true' | 'false' | 'done' | 'loop';
}

interface WFGraph {
  id: string;
  name: string;
  description: string;
  nodes: WFNode[];
  edges: WFEdge[];
}

// ── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  zap: Zap, clock: Clock, database: Database, mail: Mail, server: Server,
  shield: Shield, bot: Bot, creditcard: CreditCard, youtube: Youtube,
  globe: Globe, users: Users, activity: Activity, cpu: Cpu, eye: Eye,
  send: Send, filetext: FileText, check: CheckCircle, x: XCircle,
  gitbranch: GitBranch, play: Play, settings: Settings, search: Search,
  webhook: Webhook, barchart: BarChart3, radio: Radio, layers: Layers,
  hash: Hash, code: Code,
};

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
  red:     { bg: 'bg-red-500/15',    border: 'border-red-500/30',    icon: 'text-red-400',    glow: 'shadow-red-500/20' },
  blue:    { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   icon: 'text-blue-400',   glow: 'shadow-blue-500/20' },
  green:   { bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',icon: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  amber:   { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  icon: 'text-amber-400',  glow: 'shadow-amber-500/20' },
  violet:  { bg: 'bg-violet-500/15', border: 'border-violet-500/30', icon: 'text-violet-400', glow: 'shadow-violet-500/20' },
  cyan:    { bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',   icon: 'text-cyan-400',   glow: 'shadow-cyan-500/20' },
  pink:    { bg: 'bg-pink-500/15',   border: 'border-pink-500/30',   icon: 'text-pink-400',   glow: 'shadow-pink-500/20' },
  orange:  { bg: 'bg-orange-500/15', border: 'border-orange-500/30', icon: 'text-orange-400', glow: 'shadow-orange-500/20' },
  teal:    { bg: 'bg-teal-500/15',   border: 'border-teal-500/30',   icon: 'text-teal-400',   glow: 'shadow-teal-500/20' },
  white:   { bg: 'bg-white/10',      border: 'border-white/20',      icon: 'text-white/60',   glow: 'shadow-white/10' },
};

// ── Workflow Definitions ─────────────────────────────────────────────────────

const WORKFLOW_GRAPHS: WFGraph[] = [
  {
    id: 'wf-user-registration',
    name: 'User Registration & Welcome Flow',
    description: 'Complete flow from signup to drip email campaign',
    nodes: [
      { id: 'n1', label: 'User Visits', sublabel: 'Landing Page', icon: 'globe', x: 60, y: 140, type: 'trigger', color: 'green' },
      { id: 'n2', label: 'Register Page', sublabel: 'signup form', icon: 'users', x: 240, y: 140, type: 'action', color: 'blue' },
      { id: 'n3', label: 'Create User', sublabel: 'POST /api/auth/register', icon: 'server', x: 420, y: 140, type: 'action', color: 'violet' },
      { id: 'n4', label: 'Send OTP', sublabel: 'Email Service', icon: 'mail', x: 600, y: 140, type: 'action', color: 'amber' },
      { id: 'n5', label: 'Verify Email?', sublabel: 'check OTP', icon: 'gitbranch', x: 780, y: 140, type: 'condition', color: 'orange' },
      { id: 'n6', label: 'Email Verified', sublabel: 'User.emailVerified=true', icon: 'check', x: 960, y: 80, type: 'action', color: 'green' },
      { id: 'n7', label: 'Retry OTP', sublabel: 'resend email', icon: 'mail', x: 960, y: 220, type: 'action', color: 'red' },
      { id: 'n8', label: 'Welcome Email', sublabel: 'Cron: within 24h', icon: 'send', x: 1140, y: 80, type: 'action', color: 'cyan' },
      { id: 'n9', label: 'Start Drip', sublabel: 'every 2 days', icon: 'clock', x: 1320, y: 80, type: 'action', color: 'pink' },
      { id: 'n10', label: 'Is Free User?', sublabel: 'check plan', icon: 'gitbranch', x: 1500, y: 80, type: 'condition', color: 'orange' },
      { id: 'n11', label: 'Send Feature Email', sublabel: '5 drip emails', icon: 'mail', x: 1680, y: 20, type: 'output', color: 'violet' },
      { id: 'n12', label: 'Stop Drip', sublabel: 'paid user', icon: 'check', x: 1680, y: 160, type: 'output', color: 'green' },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
      { from: 'n5', to: 'n6', label: 'valid', type: 'true' },
      { from: 'n5', to: 'n7', label: 'invalid', type: 'false' },
      { from: 'n7', to: 'n4', label: 'retry', type: 'loop' },
      { from: 'n6', to: 'n8' },
      { from: 'n8', to: 'n9' },
      { from: 'n9', to: 'n10' },
      { from: 'n10', to: 'n11', label: 'yes', type: 'true' },
      { from: 'n10', to: 'n12', label: 'no', type: 'false' },
    ],
  },
  {
    id: 'wf-payment-processing',
    name: 'Payment & Subscription Flow',
    description: 'From pricing page to plan activation and receipt',
    nodes: [
      { id: 'p1', label: 'Pricing Page', sublabel: 'select plan', icon: 'globe', x: 60, y: 140, type: 'trigger', color: 'green' },
      { id: 'p2', label: 'Select Plan', sublabel: 'plan + billing period', icon: 'layers', x: 240, y: 140, type: 'action', color: 'blue' },
      { id: 'p3', label: 'Create Order', sublabel: 'POST /api/payments/create-order', icon: 'server', x: 420, y: 140, type: 'action', color: 'violet' },
      { id: 'p4', label: 'Razorpay/PayPal', sublabel: 'payment gateway', icon: 'creditcard', x: 600, y: 140, type: 'action', color: 'green' },
      { id: 'p5', label: 'Payment OK?', sublabel: 'verify signature', icon: 'gitbranch', x: 780, y: 140, type: 'condition', color: 'orange' },
      { id: 'p6', label: 'Save Payment', sublabel: 'Payment model', icon: 'database', x: 960, y: 60, type: 'action', color: 'cyan' },
      { id: 'p7', label: 'Payment Failed', sublabel: 'show error', icon: 'x', x: 960, y: 240, type: 'output', color: 'red' },
      { id: 'p8', label: 'Upgrade User', sublabel: 'User.subscription', icon: 'users', x: 1140, y: 60, type: 'action', color: 'blue' },
      { id: 'p9', label: 'Send Receipt', sublabel: 'Email Service', icon: 'mail', x: 1320, y: 60, type: 'action', color: 'amber' },
      { id: 'p10', label: 'Log Funnel', sublabel: 'payment_success', icon: 'barchart', x: 1320, y: 180, type: 'action', color: 'teal' },
      { id: 'p11', label: 'Dashboard', sublabel: 'premium access', icon: 'check', x: 1500, y: 60, type: 'output', color: 'green' },
    ],
    edges: [
      { from: 'p1', to: 'p2' },
      { from: 'p2', to: 'p3' },
      { from: 'p3', to: 'p4' },
      { from: 'p4', to: 'p5' },
      { from: 'p5', to: 'p6', label: 'success', type: 'true' },
      { from: 'p5', to: 'p7', label: 'failed', type: 'false' },
      { from: 'p6', to: 'p8' },
      { from: 'p8', to: 'p9' },
      { from: 'p8', to: 'p10' },
      { from: 'p9', to: 'p11' },
    ],
  },
  {
    id: 'wf-ai-generation',
    name: 'AI Content Generation Pipeline',
    description: 'Multi-provider AI with fallback and caching',
    nodes: [
      { id: 'a1', label: 'User Request', sublabel: 'AI tool page', icon: 'play', x: 60, y: 140, type: 'trigger', color: 'green' },
      { id: 'a2', label: 'Check Limits', sublabel: 'Feature Guard', icon: 'shield', x: 240, y: 140, type: 'action', color: 'amber' },
      { id: 'a3', label: 'Has Quota?', sublabel: 'plan limits check', icon: 'gitbranch', x: 420, y: 140, type: 'condition', color: 'orange' },
      { id: 'a4', label: 'AI Router', sublabel: 'select best provider', icon: 'cpu', x: 600, y: 80, type: 'action', color: 'violet' },
      { id: 'a5', label: 'Show Upgrade', sublabel: 'limit reached', icon: 'x', x: 600, y: 240, type: 'output', color: 'red' },
      { id: 'a6', label: 'OpenAI', sublabel: 'GPT-4 / DALL-E', icon: 'bot', x: 800, y: 20, type: 'action', color: 'green' },
      { id: 'a7', label: 'Gemini', sublabel: 'Google AI', icon: 'bot', x: 800, y: 100, type: 'action', color: 'blue' },
      { id: 'a8', label: 'Groq', sublabel: 'fast inference', icon: 'bot', x: 800, y: 180, type: 'action', color: 'cyan' },
      { id: 'a9', label: 'AI Success?', sublabel: 'check response', icon: 'gitbranch', x: 1000, y: 100, type: 'condition', color: 'orange' },
      { id: 'a10', label: 'Save Result', sublabel: 'AI model in DB', icon: 'database', x: 1200, y: 40, type: 'action', color: 'cyan' },
      { id: 'a11', label: 'Try Next', sublabel: 'fallback provider', icon: 'activity', x: 1200, y: 180, type: 'action', color: 'red' },
      { id: 'a12', label: 'Update Usage', sublabel: 'User.usageStats', icon: 'users', x: 1380, y: 40, type: 'action', color: 'blue' },
      { id: 'a13', label: 'Return Result', sublabel: 'JSON response', icon: 'check', x: 1560, y: 40, type: 'output', color: 'green' },
    ],
    edges: [
      { from: 'a1', to: 'a2' },
      { from: 'a2', to: 'a3' },
      { from: 'a3', to: 'a4', label: 'yes', type: 'true' },
      { from: 'a3', to: 'a5', label: 'no', type: 'false' },
      { from: 'a4', to: 'a6' },
      { from: 'a4', to: 'a7' },
      { from: 'a4', to: 'a8' },
      { from: 'a6', to: 'a9' },
      { from: 'a7', to: 'a9' },
      { from: 'a8', to: 'a9' },
      { from: 'a9', to: 'a10', label: 'ok', type: 'true' },
      { from: 'a9', to: 'a11', label: 'fail', type: 'false' },
      { from: 'a11', to: 'a4', label: 'retry', type: 'loop' },
      { from: 'a10', to: 'a12' },
      { from: 'a12', to: 'a13' },
    ],
  },
  {
    id: 'wf-tracking-pipeline',
    name: 'Real-time Tracking & Analytics Pipeline',
    description: 'From user page view to live dashboard update',
    nodes: [
      { id: 't1', label: 'User Navigates', sublabel: 'page view / click', icon: 'globe', x: 60, y: 120, type: 'trigger', color: 'green' },
      { id: 't2', label: 'Track Event', sublabel: 'POST /api/analytics/track', icon: 'server', x: 260, y: 120, type: 'action', color: 'violet' },
      { id: 't3', label: 'Get Location', sublabel: 'IP → Geo (ipapi.co)', icon: 'search', x: 460, y: 120, type: 'action', color: 'blue' },
      { id: 't4', label: 'BullMQ Queue', sublabel: 'tracking-events', icon: 'zap', x: 660, y: 120, type: 'action', color: 'amber' },
      { id: 't5', label: 'Tracking Worker', sublabel: 'batch: 1s / 200 max', icon: 'cpu', x: 860, y: 120, type: 'action', color: 'cyan' },
      { id: 't6', label: 'TrackingLog', sublabel: 'insert event', icon: 'database', x: 1080, y: 40, type: 'action', color: 'violet' },
      { id: 't7', label: 'UserSession', sublabel: 'update heartbeat', icon: 'database', x: 1080, y: 120, type: 'action', color: 'blue' },
      { id: 't8', label: 'PageStatsDaily', sublabel: 'aggregate counts', icon: 'database', x: 1080, y: 200, type: 'action', color: 'teal' },
      { id: 't9', label: 'Socket.IO', sublabel: 'emit live_update', icon: 'radio', x: 1300, y: 120, type: 'action', color: 'pink' },
      { id: 't10', label: 'Live Dashboard', sublabel: 'super admin', icon: 'barchart', x: 1500, y: 120, type: 'output', color: 'green' },
    ],
    edges: [
      { from: 't1', to: 't2' },
      { from: 't2', to: 't3' },
      { from: 't3', to: 't4' },
      { from: 't4', to: 't5' },
      { from: 't5', to: 't6' },
      { from: 't5', to: 't7' },
      { from: 't5', to: 't8' },
      { from: 't7', to: 't9' },
      { from: 't9', to: 't10' },
    ],
  },
  {
    id: 'wf-scheduled-post',
    name: 'Schedule & Auto-Publish Flow',
    description: 'Content scheduling with auto SEO and YouTube upload',
    nodes: [
      { id: 's1', label: 'Calendar Page', sublabel: 'pick date & time', icon: 'clock', x: 60, y: 120, type: 'trigger', color: 'green' },
      { id: 's2', label: 'Schedule Post', sublabel: 'POST /api/schedule', icon: 'server', x: 260, y: 120, type: 'action', color: 'violet' },
      { id: 's3', label: 'Save to DB', sublabel: 'ScheduledPost model', icon: 'database', x: 460, y: 120, type: 'action', color: 'cyan' },
      { id: 's4', label: 'Posting Worker', sublabel: 'picks due posts', icon: 'cpu', x: 660, y: 120, type: 'action', color: 'amber' },
      { id: 's5', label: 'Has SEO?', sublabel: 'check metadata', icon: 'gitbranch', x: 860, y: 120, type: 'condition', color: 'orange' },
      { id: 's6', label: 'AI Generate SEO', sublabel: 'tags, title, desc', icon: 'bot', x: 1060, y: 40, type: 'action', color: 'violet' },
      { id: 's7', label: 'Upload to YT', sublabel: 'YouTube API', icon: 'youtube', x: 1060, y: 200, type: 'action', color: 'red' },
      { id: 's8', label: 'Mark Published', sublabel: 'status = published', icon: 'check', x: 1280, y: 120, type: 'action', color: 'green' },
      { id: 's9', label: 'Notify User', sublabel: 'push notification', icon: 'send', x: 1480, y: 120, type: 'output', color: 'blue' },
    ],
    edges: [
      { from: 's1', to: 's2' },
      { from: 's2', to: 's3' },
      { from: 's3', to: 's4' },
      { from: 's4', to: 's5' },
      { from: 's5', to: 's6', label: 'no SEO', type: 'false' },
      { from: 's5', to: 's7', label: 'has SEO', type: 'true' },
      { from: 's6', to: 's7' },
      { from: 's7', to: 's8' },
      { from: 's8', to: 's9' },
    ],
  },
  {
    id: 'wf-marketing-automation',
    name: 'Marketing Email Automation',
    description: 'Automated drip campaigns, upgrade nudges, and engagement emails',
    nodes: [
      { id: 'm1', label: 'Cron Trigger', sublabel: 'every 6 hours', icon: 'clock', x: 60, y: 140, type: 'trigger', color: 'green' },
      { id: 'm2', label: 'Fetch Users', sublabel: 'User model query', icon: 'database', x: 260, y: 140, type: 'action', color: 'cyan' },
      { id: 'm3', label: 'New User?', sublabel: 'created < 24h', icon: 'gitbranch', x: 460, y: 140, type: 'condition', color: 'orange' },
      { id: 'm4', label: 'Welcome Email', sublabel: 'features overview', icon: 'mail', x: 660, y: 60, type: 'action', color: 'amber' },
      { id: 'm5', label: 'Free User?', sublabel: 'subscription=free', icon: 'gitbranch', x: 660, y: 230, type: 'condition', color: 'orange' },
      { id: 'm6', label: 'Next Drip Due?', sublabel: '2-day interval', icon: 'gitbranch', x: 880, y: 160, type: 'condition', color: 'orange' },
      { id: 'm7', label: 'Send Drip Email', sublabel: 'feature showcase', icon: 'send', x: 1100, y: 100, type: 'action', color: 'violet' },
      { id: 'm8', label: 'Skip', sublabel: 'too soon', icon: 'x', x: 1100, y: 240, type: 'output', color: 'white' },
      { id: 'm9', label: 'Paid User?', sublabel: 'starter/pro', icon: 'gitbranch', x: 880, y: 310, type: 'condition', color: 'orange' },
      { id: 'm10', label: 'Upgrade Email', sublabel: 'next tier features', icon: 'mail', x: 1100, y: 310, type: 'action', color: 'pink' },
      { id: 'm11', label: 'Track in DB', sublabel: 'MarketingEmail', icon: 'database', x: 1320, y: 140, type: 'action', color: 'cyan' },
      { id: 'm12', label: 'Done', sublabel: 'log stats', icon: 'check', x: 1500, y: 140, type: 'output', color: 'green' },
    ],
    edges: [
      { from: 'm1', to: 'm2' },
      { from: 'm2', to: 'm3' },
      { from: 'm3', to: 'm4', label: 'yes', type: 'true' },
      { from: 'm3', to: 'm5', label: 'no', type: 'false' },
      { from: 'm4', to: 'm11' },
      { from: 'm5', to: 'm6', label: 'yes', type: 'true' },
      { from: 'm5', to: 'm9', label: 'no', type: 'false' },
      { from: 'm6', to: 'm7', label: 'due', type: 'true' },
      { from: 'm6', to: 'm8', label: 'wait', type: 'false' },
      { from: 'm7', to: 'm11' },
      { from: 'm9', to: 'm10', label: '>14d', type: 'true' },
      { from: 'm10', to: 'm11' },
      { from: 'm11', to: 'm12' },
    ],
  },
  {
    id: 'wf-channel-audit',
    name: 'Channel Intelligence Audit',
    description: 'Deep YouTube channel analysis with AI insights',
    nodes: [
      { id: 'c1', label: 'Enter Channel', sublabel: 'URL or channel ID', icon: 'search', x: 60, y: 120, type: 'trigger', color: 'green' },
      { id: 'c2', label: 'Fetch Channel', sublabel: 'YouTube Data API', icon: 'youtube', x: 280, y: 120, type: 'action', color: 'red' },
      { id: 'c3', label: 'Get Videos', sublabel: 'last 50 uploads', icon: 'youtube', x: 500, y: 60, type: 'action', color: 'red' },
      { id: 'c4', label: 'Get Stats', sublabel: 'subscribers, views', icon: 'barchart', x: 500, y: 180, type: 'action', color: 'blue' },
      { id: 'c5', label: 'AI Analysis', sublabel: 'content strategy', icon: 'bot', x: 720, y: 120, type: 'action', color: 'violet' },
      { id: 'c6', label: 'Growth Predict', sublabel: 'ML ensemble', icon: 'activity', x: 940, y: 60, type: 'action', color: 'cyan' },
      { id: 'c7', label: 'SEO Score', sublabel: 'tag/title analysis', icon: 'hash', x: 940, y: 180, type: 'action', color: 'amber' },
      { id: 'c8', label: 'Save Report', sublabel: 'Channel model', icon: 'database', x: 1160, y: 120, type: 'action', color: 'cyan' },
      { id: 'c9', label: 'Show Report', sublabel: 'interactive UI', icon: 'eye', x: 1380, y: 120, type: 'output', color: 'green' },
    ],
    edges: [
      { from: 'c1', to: 'c2' },
      { from: 'c2', to: 'c3' },
      { from: 'c2', to: 'c4' },
      { from: 'c3', to: 'c5' },
      { from: 'c4', to: 'c5' },
      { from: 'c5', to: 'c6' },
      { from: 'c5', to: 'c7' },
      { from: 'c6', to: 'c8' },
      { from: 'c7', to: 'c8' },
      { from: 'c8', to: 'c9' },
    ],
  },
];

// ── Edge Drawing ─────────────────────────────────────────────────────────────

const NODE_W = 140;
const NODE_H = 70;

function getEdgeColor(type?: string) {
  switch (type) {
    case 'true': return '#22c55e';
    case 'false': return '#ef4444';
    case 'loop': return '#f59e0b';
    case 'done': return '#3b82f6';
    default: return '#ffffff25';
  }
}

function EdgePath({ edge, nodes }: { edge: WFEdge; nodes: WFNode[] }) {
  const from = nodes.find(n => n.id === edge.from);
  const to = nodes.find(n => n.id === edge.to);
  if (!from || !to) return null;

  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y + NODE_H / 2;

  // Calculate path with smooth curves
  const dx = x2 - x1;
  const dy = y2 - y1;
  const isBackward = dx < 0;

  let d: string;
  if (isBackward) {
    // Loop-back: go up/around
    const midY = Math.min(y1, y2) - 50;
    d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  } else if (Math.abs(dy) < 10) {
    // Horizontal: simple bezier
    const cx = dx * 0.4;
    d = `M ${x1} ${y1} C ${x1 + cx} ${y1}, ${x2 - cx} ${y2}, ${x2} ${y2}`;
  } else {
    // Diagonal: S-curve
    const mx = x1 + dx * 0.5;
    d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  }

  const color = getEdgeColor(edge.type);

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={edge.type === 'loop' ? '6 4' : undefined}
        markerEnd={`url(#arrow-${edge.type || 'default'})`}
      />
      {edge.label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          fill={color}
          fontSize={10}
          fontWeight={600}
          textAnchor="middle"
          className="select-none"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

// ── Node Component ───────────────────────────────────────────────────────────

function NodeBox({ node, isSelected, onClick }: { node: WFNode; isSelected: boolean; onClick: () => void }) {
  const Icon = ICON_MAP[node.icon] || Zap;
  const colors = COLOR_MAP[node.color] || COLOR_MAP.white;

  const typeShape = node.type === 'condition'
    ? 'rotate-45'
    : node.type === 'trigger'
      ? 'rounded-full'
      : 'rounded-xl';

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <foreignObject x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
        <div
          onClick={onClick}
          className={`w-full h-full flex items-center gap-2.5 px-3 cursor-pointer transition-all duration-200
            ${isSelected ? `ring-2 ring-white/30 shadow-lg ${colors.glow}` : 'hover:ring-1 hover:ring-white/10'}
            ${node.type === 'trigger' ? 'rounded-full' : 'rounded-xl'}
            ${colors.bg} border ${colors.border} backdrop-blur-sm`}
          style={{ transform: node.type === 'condition' ? 'none' : undefined }}
        >
          {/* Icon circle */}
          <div className={`w-9 h-9 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
          {/* Labels */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-white/90 leading-tight truncate">{node.label}</p>
            {node.sublabel && (
              <p className="text-[9px] text-white/35 leading-tight truncate mt-0.5">{node.sublabel}</p>
            )}
          </div>
          {/* Type indicator */}
          {node.type === 'trigger' && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </foreignObject>
    </motion.g>
  );
}

// ── Canvas Component ─────────────────────────────────────────────────────────

function WorkflowGraph({ graph }: { graph: WFGraph }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate canvas size
  const maxX = Math.max(...graph.nodes.map(n => n.x)) + NODE_W + 80;
  const maxY = Math.max(...graph.nodes.map(n => n.y)) + NODE_H + 80;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div className="relative bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 2))}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5 text-white/40" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5 text-white/40" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-white/40" />
        </button>
        <span className="text-[9px] text-white/20 ml-1 tabular-nums">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`w-full overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: Math.min(maxY * zoom + 40, 420) }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={maxX}
          height={maxY}
          viewBox={`0 0 ${maxX} ${maxY}`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '0 0',
          }}
        >
          {/* Grid dots */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.5" fill="#ffffff08" />
            </pattern>
            {/* Arrow markers */}
            {['default', 'true', 'false', 'loop', 'done'].map(type => (
              <marker
                key={type}
                id={`arrow-${type}`}
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill={getEdgeColor(type === 'default' ? undefined : type)}
                />
              </marker>
            ))}
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges (rendered below nodes) */}
          {graph.edges.map((edge, i) => (
            <EdgePath key={i} edge={edge} nodes={graph.nodes} />
          ))}

          {/* Nodes */}
          {graph.nodes.map(node => (
            <NodeBox
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Exported Component ───────────────────────────────────────────────────────

export default function WorkflowCanvas() {
  const [activeWf, setActiveWf] = useState(WORKFLOW_GRAPHS[0].id);
  const selectedGraph = WORKFLOW_GRAPHS.find(g => g.id === activeWf) || WORKFLOW_GRAPHS[0];

  return (
    <div className="space-y-4">
      {/* Workflow Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {WORKFLOW_GRAPHS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveWf(g.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all border ${
              activeWf === g.id
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-white/3 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {g.name}
          </button>
        ))}
      </div>

      {/* Graph Info */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{selectedGraph.name}</h3>
          <p className="text-xs text-white/40 mt-0.5">{selectedGraph.description}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Trigger</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> Action</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-sm rotate-45" /> Condition</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500" /> True</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500" /> False</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-500" /> Loop</span>
        </div>
      </div>

      {/* Canvas */}
      <WorkflowGraph graph={selectedGraph} />

      {/* Nodes summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {selectedGraph.nodes.map(node => {
          const Icon = ICON_MAP[node.icon] || Zap;
          const colors = COLOR_MAP[node.color] || COLOR_MAP.white;
          return (
            <div key={node.id} className={`flex items-center gap-2 px-3 py-2 ${colors.bg} border ${colors.border} rounded-lg`}>
              <Icon className={`w-3.5 h-3.5 ${colors.icon} flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/70 truncate">{node.label}</p>
                <p className="text-[8px] text-white/30 truncate">{node.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
