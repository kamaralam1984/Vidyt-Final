'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';
import {
  Network, Globe, Server, Database, Cpu, Mail, Zap, ChevronRight,
  Search, Filter, Workflow, ArrowRight, ArrowDown, Box, Layers,
  Activity, Eye, EyeOff, BarChart3, Code, Settings, Users,
  CreditCard, Bot, Youtube, Shield, Clock, FileText, GitBranch,
} from 'lucide-react';
import WorkflowCanvas from '@/components/admin/WorkflowCanvas';

// ── Types ────────────────────────────────────────────────────────────────────
interface PageNode { id: string; path: string; label: string; group: string }
interface ApiNode { id: string; path: string; method: string; label: string; group: string; model: string | null; service: string | null }
interface ModelNode { id: string; name: string; category: string; fields: string[] }
interface ServiceNode { id: string; name: string; label: string; desc: string; category: string }
interface WorkerNode { id: string; name: string; label: string; desc: string; queue: string }
interface Connection { from: string; to: string; label: string; dataFlow: string }
interface WorkflowStep { order: number; action: string; target: string }
interface WorkflowDef { id: string; name: string; trigger: string; steps: WorkflowStep[]; status: string }

interface SystemData {
  pages: PageNode[];
  apis: ApiNode[];
  models: ModelNode[];
  services: ServiceNode[];
  workers: WorkerNode[];
  connections: Connection[];
  workflows: WorkflowDef[];
  stats: Record<string, number>;
}

type ViewTab = 'visual' | 'overview' | 'workflows' | 'apis' | 'models' | 'services' | 'connections';

// ── Colors ───────────────────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  public: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  auth: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  dashboard: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  ai: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  admin: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  super: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  youtube: { bg: 'bg-red-600/10', text: 'text-red-500', border: 'border-red-600/20' },
  channels: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  analytics: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  payments: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  users: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  notifications: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  chat: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  predictions: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  trends: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  scheduler: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
  cron: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  compliance: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

const GROUP_ICONS: Record<string, any> = {
  public: Globe, auth: Shield, dashboard: BarChart3, ai: Bot, admin: Settings,
  super: Zap, youtube: Youtube, channels: Youtube, analytics: Activity,
  payments: CreditCard, users: Users, notifications: Mail, chat: Bot,
  predictions: Cpu, trends: Activity, scheduler: Clock, cron: Clock,
  compliance: Shield, core: Server, content: FileText, billing: CreditCard,
  system: Settings, ml: Cpu, marketing: Mail, automation: Zap, data: Database,
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-500/10',
  POST: 'text-blue-400 bg-blue-500/10',
  PUT: 'text-amber-400 bg-amber-500/10',
  DELETE: 'text-red-400 bg-red-500/10',
  'GET|POST': 'text-violet-400 bg-violet-500/10',
};

const getColor = (group: string) => GROUP_COLORS[group] || GROUP_COLORS.public;
const getIcon = (group: string) => GROUP_ICONS[group] || Box;

// ── Main Component ───────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('visual');
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/admin/super/workflows', { headers: getAuthHeaders() });
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Get all unique groups
  const allGroups = useMemo(() => {
    if (!data) return [];
    const groups = new Set<string>();
    data.pages.forEach(p => groups.add(p.group));
    data.apis.forEach(a => groups.add(a.group));
    return Array.from(groups).sort();
  }, [data]);

  // Get connections for selected node
  const nodeConnections = useMemo(() => {
    if (!data || !selectedNode) return [];
    return data.connections.filter(c => c.from === selectedNode || c.to === selectedNode);
  }, [data, selectedNode]);

  // Filter function
  const matchesFilter = (text: string) => {
    if (!search) return true;
    return text.toLowerCase().includes(search.toLowerCase());
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading system architecture...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load system data</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Network className="w-7 h-7 text-red-500" />
              System Workflows & Architecture
            </h1>
            <p className="text-white/40 text-sm mt-1">Full platform map — APIs, functions, data flows & automation</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search APIs, pages, models..."
                className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-red-500/50 w-64"
              />
            </div>
            {/* Group Filter */}
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              <select
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white/60 appearance-none focus:outline-none focus:ring-1 focus:ring-red-500/50"
              >
                <option value="all">All Groups</option>
                {allGroups.map(g => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[
          { label: 'Pages', value: data.stats.totalPages, icon: Globe },
          { label: 'APIs', value: data.stats.totalApis, icon: Server },
          { label: 'Models', value: data.stats.totalModels, icon: Database },
          { label: 'Services', value: data.stats.totalServices, icon: Cpu },
          { label: 'Workers', value: data.stats.totalWorkers, icon: Zap },
          { label: 'Connections', value: data.stats.totalConnections, icon: Network },
          { label: 'Workflows', value: data.stats.totalWorkflows, icon: Workflow },
        ].map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-[#141414] border border-white/5 rounded-xl p-3 text-center"
          >
            <Icon className="w-4 h-4 text-white/20 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#0a0a0a] p-1 rounded-xl border border-white/5 overflow-x-auto">
        {([
          { id: 'visual', label: 'Visual Flows', icon: GitBranch },
          { id: 'overview', label: 'Overview Map', icon: Layers },
          { id: 'workflows', label: 'Workflows', icon: Workflow },
          { id: 'apis', label: 'API Routes', icon: Server },
          { id: 'models', label: 'Data Models', icon: Database },
          { id: 'services', label: 'Services', icon: Cpu },
          { id: 'connections', label: 'Data Flows', icon: Network },
        ] as { id: ViewTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-white/40 hover:text-white/60 border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: VISUAL FLOWS (n8n-style node graphs)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'visual' && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <WorkflowCanvas />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW MAP
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Page Groups */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Frontend Pages
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(
                data.pages
                  .filter(p => selectedGroup === 'all' || p.group === selectedGroup)
                  .filter(p => matchesFilter(p.label + p.path))
                  .reduce((acc: Record<string, PageNode[]>, p) => {
                    (acc[p.group] = acc[p.group] || []).push(p);
                    return acc;
                  }, {})
              ).map(([group, pages]) => {
                const color = getColor(group);
                const Icon = getIcon(group);
                return (
                  <div key={group} className={`${color.bg} border ${color.border} rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-4 h-4 ${color.text}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${color.text}`}>{group}</span>
                      <span className="text-[9px] text-white/20 ml-auto">{pages.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {pages.map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedNode(selectedNode === p.id ? null : p.id)}
                          className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all text-[11px] ${
                            selectedNode === p.id
                              ? 'bg-white/10 text-white'
                              : 'hover:bg-white/5 text-white/50'
                          }`}
                        >
                          <span className="font-mono text-white/30 truncate max-w-[100px]">{p.path}</span>
                          <span className="text-white/60 truncate">{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Groups */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" /> API Endpoints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(
                data.apis
                  .filter(a => selectedGroup === 'all' || a.group === selectedGroup)
                  .filter(a => matchesFilter(a.label + a.path))
                  .reduce((acc: Record<string, ApiNode[]>, a) => {
                    (acc[a.group] = acc[a.group] || []).push(a);
                    return acc;
                  }, {})
              ).map(([group, apis]) => {
                const color = getColor(group);
                const Icon = getIcon(group);
                return (
                  <div key={group} className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-4 h-4 ${color.text}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${color.text}`}>{group}</span>
                      <span className="text-[9px] text-white/20 ml-auto">{apis.length} endpoints</span>
                    </div>
                    <div className="space-y-1.5">
                      {apis.map(a => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedNode(selectedNode === a.id ? null : a.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                            selectedNode === a.id ? 'bg-white/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[a.method] || 'text-white/40 bg-white/5'}`}>
                            {a.method}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-white/70 truncate">{a.label}</p>
                            <p className="text-[9px] text-white/25 font-mono truncate">{a.path}</p>
                          </div>
                          {a.model && (
                            <span className="text-[8px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded flex-shrink-0">{a.model}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Models & Services Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Models */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-400" /> Data Models ({data.models.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(
                  data.models
                    .filter(m => matchesFilter(m.name + m.category))
                    .reduce((acc: Record<string, ModelNode[]>, m) => {
                      (acc[m.category] = acc[m.category] || []).push(m);
                      return acc;
                    }, {})
                ).map(([cat, models]) => {
                  const Icon = getIcon(cat);
                  return (
                    <div key={cat} className="border border-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{cat}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {models.map(m => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedNode(selectedNode === m.id ? null : m.id)}
                            className={`group px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                              selectedNode === m.id
                                ? 'bg-violet-500/20 border border-violet-500/30'
                                : 'bg-white/3 border border-white/5 hover:border-white/10'
                            }`}
                          >
                            <p className="text-[11px] font-medium text-white/70">{m.name}</p>
                            <p className="text-[8px] text-white/25 mt-0.5">{m.fields.join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Services & Workers */}
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" /> Services ({data.services.length})
                </h3>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2">
                  {data.services
                    .filter(s => matchesFilter(s.label + s.name + s.desc))
                    .map(s => {
                      const Icon = getIcon(s.category);
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedNode(selectedNode === s.id ? null : s.id)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                            selectedNode === s.id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/3 border border-transparent'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-white/20 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white/70">{s.label}</p>
                            <p className="text-[10px] text-white/30 truncate">{s.desc}</p>
                          </div>
                          <span className="text-[8px] text-white/20 bg-white/5 px-2 py-0.5 rounded flex-shrink-0">{s.category}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Workers */}
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Background Workers ({data.workers.length})
                </h3>
                <div className="space-y-2">
                  {data.workers.map(w => (
                    <div key={w.id} className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-sm font-medium text-white/80">{w.label}</span>
                      </div>
                      <p className="text-[11px] text-white/40 mb-2">{w.desc}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">Queue: {w.queue}</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-emerald-400">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: WORKFLOWS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {data.workflows
            .filter(wf => matchesFilter(wf.name + wf.trigger))
            .map((wf, i) => {
              const isExpanded = expandedWorkflow === wf.id;
              return (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden"
                >
                  {/* Workflow Header */}
                  <div
                    onClick={() => setExpandedWorkflow(isExpanded ? null : wf.id)}
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <Workflow className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{wf.name}</h4>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          Trigger: <span className="text-white/60">{wf.trigger}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-medium uppercase tracking-wider">
                        {wf.status}
                      </span>
                      <span className="text-[10px] text-white/30">{wf.steps.length} steps</span>
                      <ChevronRight className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5"
                      >
                        <div className="px-6 py-4">
                          <div className="relative">
                            {wf.steps.map((step, si) => (
                              <div key={si} className="flex gap-4 mb-0">
                                {/* Timeline */}
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    si === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    si === wf.steps.length - 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    'bg-white/5 text-white/40 border border-white/10'
                                  }`}>
                                    {step.order}
                                  </div>
                                  {si < wf.steps.length - 1 && (
                                    <div className="w-px h-10 bg-gradient-to-b from-white/10 to-white/5 my-1" />
                                  )}
                                </div>
                                {/* Step Content */}
                                <div className="flex-1 pb-4">
                                  <p className="text-sm text-white/80">{step.action}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <ArrowRight className="w-3 h-3 text-white/20" />
                                    <span className="text-[11px] text-red-400/70 bg-red-500/5 px-2 py-0.5 rounded">{step.target}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: API ROUTES
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'apis' && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-white/5 bg-white/3">
            <div className="grid grid-cols-12 gap-4 text-[9px] text-white/30 uppercase tracking-wider font-bold">
              <div className="col-span-1">Method</div>
              <div className="col-span-3">Path</div>
              <div className="col-span-2">Label</div>
              <div className="col-span-1">Group</div>
              <div className="col-span-2">Model</div>
              <div className="col-span-2">Service</div>
              <div className="col-span-1">Flows</div>
            </div>
          </div>
          <div className="divide-y divide-white/3 max-h-[600px] overflow-y-auto">
            {data.apis
              .filter(a => (selectedGroup === 'all' || a.group === selectedGroup) && matchesFilter(a.label + a.path + (a.model || '') + (a.service || '')))
              .map((a) => {
                const color = getColor(a.group);
                const connCount = data.connections.filter(c => c.from === a.id || c.to === a.id).length;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedNode(selectedNode === a.id ? null : a.id)}
                    className={`grid grid-cols-12 gap-4 px-6 py-3 cursor-pointer transition-all ${
                      selectedNode === a.id ? 'bg-red-500/5' : 'hover:bg-white/3'
                    }`}
                  >
                    <div className="col-span-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[a.method] || 'text-white/40 bg-white/5'}`}>
                        {a.method}
                      </span>
                    </div>
                    <div className="col-span-3 text-[11px] font-mono text-white/50 truncate">{a.path}</div>
                    <div className="col-span-2 text-xs text-white/70">{a.label}</div>
                    <div className="col-span-1">
                      <span className={`text-[9px] ${color.text} ${color.bg} px-1.5 py-0.5 rounded`}>{a.group}</span>
                    </div>
                    <div className="col-span-2 text-[11px] text-violet-400/70">{a.model || '—'}</div>
                    <div className="col-span-2 text-[11px] text-cyan-400/70">{a.service || '—'}</div>
                    <div className="col-span-1 text-[11px] text-white/30">{connCount > 0 ? `${connCount} flows` : '—'}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: DATA MODELS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.models
            .filter(m => matchesFilter(m.name + m.category + m.fields.join(' ')))
            .map((m, i) => {
              const Icon = getIcon(m.category);
              const apiCount = data.apis.filter(a => a.model === m.name).length;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-[#141414] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-violet-500/10 rounded-lg">
                        <Database className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-sm font-semibold text-white">{m.name}</span>
                    </div>
                    <span className="text-[8px] text-white/20 bg-white/5 px-2 py-0.5 rounded uppercase">{m.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.fields.map(f => (
                      <span key={f} className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                  {apiCount > 0 && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <Server className="w-3 h-3 text-white/20" />
                      <span className="text-[10px] text-white/30">Used by {apiCount} API{apiCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: SERVICES
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.services
            .filter(s => matchesFilter(s.label + s.name + s.desc + s.category))
            .map((s, i) => {
              const Icon = getIcon(s.category);
              const apiCount = data.apis.filter(a => a.service === s.name).length;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[#141414] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">{s.label}</h4>
                        <span className="text-[8px] text-white/20 bg-white/5 px-2 py-0.5 rounded uppercase">{s.category}</span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">{s.desc}</p>
                      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                        <span className="text-[10px] font-mono text-white/25">{s.name}</span>
                        {apiCount > 0 && (
                          <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{apiCount} API{apiCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: DATA FLOWS / CONNECTIONS
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-white/5 bg-white/3">
              <div className="grid grid-cols-12 gap-4 text-[9px] text-white/30 uppercase tracking-wider font-bold">
                <div className="col-span-2">From</div>
                <div className="col-span-1 text-center">→</div>
                <div className="col-span-2">To</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-4">Data Flow</div>
              </div>
            </div>
            <div className="divide-y divide-white/3 max-h-[600px] overflow-y-auto">
              {data.connections
                .filter(c => matchesFilter(c.from + c.to + c.label + c.dataFlow))
                .map((c, i) => {
                  const fromLabel =
                    data.pages.find(p => p.id === c.from)?.label ||
                    data.apis.find(a => a.id === c.from)?.label ||
                    data.workers.find(w => w.id === c.from)?.label ||
                    c.from;
                  const toLabel =
                    data.apis.find(a => a.id === c.to)?.label ||
                    data.services.find(s => s.id === c.to)?.label ||
                    data.models.find(m => m.id === c.to)?.name ||
                    data.workers.find(w => w.id === c.to)?.label ||
                    c.to;

                  return (
                    <div key={i} className="grid grid-cols-12 gap-4 px-6 py-2.5 hover:bg-white/3 transition-colors">
                      <div className="col-span-2 text-[11px] text-white/60 truncate">{fromLabel}</div>
                      <div className="col-span-1 text-center">
                        <ArrowRight className="w-3 h-3 text-red-400/50 mx-auto" />
                      </div>
                      <div className="col-span-2 text-[11px] text-white/60 truncate">{toLabel}</div>
                      <div className="col-span-3 text-[11px] text-white/40">{c.label}</div>
                      <div className="col-span-4 text-[10px] text-white/30 font-mono">{c.dataFlow}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SELECTED NODE DETAIL PANEL
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedNode && nodeConnections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 w-96 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-5 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-red-400" />
                Connected Flows ({nodeConnections.length})
              </h4>
              <button onClick={() => setSelectedNode(null)} className="text-white/30 hover:text-white/60 text-xs">Close</button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {nodeConnections.map((c, i) => {
                const isFrom = c.from === selectedNode;
                const otherLabel =
                  data.pages.find(p => p.id === (isFrom ? c.to : c.from))?.label ||
                  data.apis.find(a => a.id === (isFrom ? c.to : c.from))?.label ||
                  data.services.find(s => s.id === (isFrom ? c.to : c.from))?.label ||
                  data.models.find(m => m.id === (isFrom ? c.to : c.from))?.name ||
                  data.workers.find(w => w.id === (isFrom ? c.to : c.from))?.label ||
                  (isFrom ? c.to : c.from);

                return (
                  <div key={i} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={`${isFrom ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {isFrom ? 'Sends to →' : '← Receives from'}
                      </span>
                      <span className="text-white/70 font-medium">{otherLabel}</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">{c.label}</p>
                    <p className="text-[9px] text-white/25 font-mono mt-0.5">{c.dataFlow}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
