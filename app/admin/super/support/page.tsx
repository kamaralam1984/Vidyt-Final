"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Loader2, Headphones, Search, Filter, AlertCircle, Clock, CheckCircle2,
  Activity, ChevronLeft, ChevronRight, ArrowUpDown, Bot, UserCog, RefreshCw,
  Mail,
} from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface Ticket {
  _id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  aiAutoReplied?: boolean;
  assignedToAdmin?: boolean;
  aiConfidence?: number;
  createdAt: string;
  updatedAt?: string;
}

type SortField = 'createdAt' | 'priority' | 'status';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { high: 3, normal: 2, low: 1 };
const STATUS_ORDER: Record<string, number> = { open: 3, resolved: 2, closed: 1 };

export default function SuperAdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [handlerFilter, setHandlerFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const perPage = 15;
  const router = useRouter();

  const fetchTickets = useCallback(async () => {
    try {
      const res = await axios.get('/api/support/tickets?limit=500', { headers: getAuthHeaders() });
      const raw = res.data.tickets || [];
      // Enrich with user info if available
      setTickets(raw);
    } catch (error: any) {
      console.error('Failed to load admin tickets', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Stats
  const openTickets = tickets.filter(t => t.status === 'open');
  const highPriority = tickets.filter(t => t.priority === 'high' && t.status === 'open');
  const resolvedToday = tickets.filter(t => t.status === 'resolved' && new Date(t.createdAt).toDateString() === new Date().toDateString());
  const needsAdmin = tickets.filter(t => t.assignedToAdmin && t.status === 'open');
  const aiHandled = tickets.filter(t => t.aiAutoReplied);

  // Filter
  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t._id.includes(searchTerm) || (t.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesHandler = handlerFilter === 'all' ||
      (handlerFilter === 'ai' && t.aiAutoReplied) ||
      (handlerFilter === 'admin' && t.assignedToAdmin && !t.aiAutoReplied) ||
      (handlerFilter === 'pending' && !t.aiAutoReplied && !t.assignedToAdmin);
    return matchesSearch && matchesStatus && matchesPriority && matchesHandler;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'createdAt') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'priority') {
      cmp = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0);
    } else if (sortField === 'status') {
      cmp = (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(t => t._id)));
    }
  };

  const handleBulkUpdate = async (updates: { status?: string; priority?: string }) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          axios.post(`/api/support/tickets/${id}/reply`, updates, { headers: getAuthHeaders() })
        )
      );
      await fetchTickets();
      setSelectedIds(new Set());
    } catch {
      alert('Some updates failed');
    } finally {
      setBulkUpdating(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF0000]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Headphones className="w-8 h-8 text-[#FF0000]" />
            Support Tickets
          </h1>
          <p className="text-[#888] mt-2">
            AI handles normal issues automatically. Escalated tickets need manual admin response.
          </p>
        </div>
        <button onClick={() => { setLoading(true); fetchTickets(); }} className="flex items-center gap-2 px-4 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm hover:border-[#FF0000] transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Open', value: openTickets.length, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'High Priority', value: highPriority.length, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Needs Admin', value: needsAdmin.length, icon: UserCog, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'AI Handled', value: aiHandled.length, icon: Bot, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Resolved Today', value: resolvedToday.length, icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#181818] border border-[#212121] rounded-xl p-4 flex items-center gap-4 hover:border-[#333] transition-colors">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#666] uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#666]" />
          <input
            type="text"
            placeholder="Search by subject, ID, or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm focus:ring-2 focus:ring-[#FF0000] text-white placeholder-[#555]"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm text-white">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm text-white">
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select value={handlerFilter} onChange={(e) => { setHandlerFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm text-white">
          <option value="all">All Handlers</option>
          <option value="ai">AI Handled</option>
          <option value="admin">Admin Assigned</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-xl">
          <span className="text-sm font-medium text-white">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button disabled={bulkUpdating} onClick={() => handleBulkUpdate({ status: 'resolved' })} className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-600/30 disabled:opacity-50">
              Mark Resolved
            </button>
            <button disabled={bulkUpdating} onClick={() => handleBulkUpdate({ status: 'closed' })} className="px-3 py-1.5 bg-gray-600/20 border border-gray-500/30 text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-600/30 disabled:opacity-50">
              Close
            </button>
            <button disabled={bulkUpdating} onClick={() => handleBulkUpdate({ priority: 'high' })} className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-600/30 disabled:opacity-50">
              Escalate
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-[#888] text-xs hover:text-white">Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden shadow-lg">
        {sorted.length === 0 ? (
          <div className="p-16 text-center text-[#555]">
            <Headphones className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tickets match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0F0F0F] border-b border-[#212121] text-[#666] uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="rounded border-[#333] accent-[#FF0000]" />
                  </th>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Handler</th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-white" onClick={() => toggleSort('priority')}>
                    <span className="flex items-center gap-1">Priority <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-white" onClick={() => toggleSort('status')}>
                    <span className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="px-4 py-3">AI Score</th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-white text-right" onClick={() => toggleSort('createdAt')}>
                    <span className="flex items-center gap-1 justify-end">Age <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {paginated.map(ticket => (
                  <tr
                    key={ticket._id}
                    className={`hover:bg-[#1A1A1A] cursor-pointer transition-colors ${selectedIds.has(ticket._id) ? 'bg-[#FF0000]/5' : ''}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(ticket._id)} onChange={() => toggleSelect(ticket._id)} className="rounded border-[#333] accent-[#FF0000]" />
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/support/${ticket._id}`)}>
                      <p className="font-medium text-white truncate max-w-[280px]">{ticket.subject}</p>
                      <p className="text-[10px] text-[#555] mt-0.5 font-mono">{ticket._id.substring(0, 10)}...</p>
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/support/${ticket._id}`)}>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400">
                        {(ticket.category || 'other').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/support/${ticket._id}`)}>
                      {ticket.aiAutoReplied ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400"><Bot className="w-3 h-3" /> AI</span>
                      ) : ticket.assignedToAdmin ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400"><UserCog className="w-3 h-3" /> Admin</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#555]">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/support/${ticket._id}`)}>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        ticket.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                        ticket.priority === 'normal' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/support/${ticket._id}`)}>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        ticket.status === 'resolved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/support/${ticket._id}`)}>
                      {ticket.aiConfidence != null ? (
                        <span className={`text-[10px] font-bold ${ticket.aiConfidence >= 0.8 ? 'text-emerald-400' : ticket.aiConfidence >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(ticket.aiConfidence * 100)}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#444]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[10px] text-[#888]" onClick={() => router.push(`/support/${ticket._id}`)}>
                      {timeAgo(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[#666] text-xs">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, sorted.length)} of <strong className="text-white">{sorted.length}</strong> tickets
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-[#212121] border border-[#333] text-[#CCC] disabled:opacity-30 hover:bg-[#333] text-xs">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-white font-bold">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-[#212121] border border-[#333] text-[#CCC] disabled:opacity-30 hover:bg-[#333] text-xs">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
