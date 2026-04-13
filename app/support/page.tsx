"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Plus, MessageSquare, AlertCircle, Search, Bot, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/utils/auth';

interface Ticket {
  _id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  aiAutoReplied?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const router = useRouter();

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/support/tickets', { headers: getAuthHeaders() });
      setTickets(res.data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axios.post('/api/support/tickets', { subject, message, category }, { headers: getAuthHeaders() });
      if (res.data.ticket) {
        router.push(`/support/${res.data.ticket._id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setCreating(false);
      setShowModal(false);
      setSubject('');
      setMessage('');
      setCategory('other');
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

  // Filter & paginate
  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t._id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#FF0000]" />
              Support Tickets
            </h1>
            <p className="text-[#888] mt-2 text-sm">AI handles normal issues instantly. Complex issues are escalated to our team.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-medium shadow-lg shadow-red-500/20"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-emerald-400">{tickets.filter(t => t.status === 'open').length}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1">Open</p>
          </div>
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-amber-400">{tickets.filter(t => t.status === 'resolved').length}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1">Resolved</p>
          </div>
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-blue-400">{tickets.filter(t => t.aiAutoReplied).length}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider mt-1">AI Replied</p>
          </div>
        </div>

        {/* Search & Filter */}
        {tickets.length > 0 && (
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#555]" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm text-white placeholder-[#555] focus:ring-2 focus:ring-[#FF0000]"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-[#181818] border border-[#333] rounded-lg text-sm text-white">
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}

        {/* Ticket List */}
        {filtered.length === 0 && tickets.length === 0 ? (
          <div className="bg-[#181818] border border-[#212121] rounded-2xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
            <p className="text-[#888] mb-6">Create your first support ticket to get started.</p>
            <button onClick={() => setShowModal(true)} className="px-6 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#333] transition-colors font-medium">
              Create your first ticket
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-8 text-center text-[#666]">
            No tickets match your search.
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map(ticket => (
              <div
                key={ticket._id}
                onClick={() => router.push(`/support/${ticket._id}`)}
                className="bg-[#181818] border border-[#212121] hover:border-[#333] rounded-xl p-5 cursor-pointer transition-all group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white group-hover:text-[#FF0000] transition-colors truncate">
                        {ticket.subject}
                      </h3>
                      {ticket.aiAutoReplied && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold shrink-0">
                          <Bot className="w-3 h-3" /> AI Replied
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#666]">
                      <span className="font-mono">{ticket._id.substring(0, 10)}...</span>
                      {ticket.category && <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded font-bold uppercase">{ticket.category.replace('_', ' ')}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      ticket.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      ticket.status === 'resolved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-[#666] text-xs">
              {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-[#212121] border border-[#333] text-[#CCC] disabled:opacity-30 hover:bg-[#333] text-xs">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white font-bold">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-[#212121] border border-[#333] text-[#CCC] disabled:opacity-30 hover:bg-[#333] text-xs">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#181818] border border-[#212121] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">New Support Ticket</h2>
                <button onClick={() => setShowModal(false)} className="text-[#888] hover:text-white text-xl">&times;</button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#AAAAAA] mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief summary of issue"
                    className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white focus:ring-2 focus:ring-[#FF0000]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#AAAAAA] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white focus:ring-2 focus:ring-[#FF0000]"
                  >
                    <option value="billing">Billing &amp; Payment</option>
                    <option value="technical_issue">Technical Issue / Bug</option>
                    <option value="account">Account &amp; Login</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#AAAAAA] mb-1">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Please provide steps to reproduce, or any context required to assist you."
                    className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white focus:ring-2 focus:ring-[#FF0000] resize-none"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-3">
                  <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-200/70">
                    <p className="font-semibold text-blue-300 mb-1">AI + Manual Support</p>
                    <p>Normal issues (billing, login, etc.) get instant AI replies. Complex issues are escalated to our Super Admin team for manual response.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[#888] hover:text-white font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] font-medium disabled:opacity-50 flex items-center gap-2">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
