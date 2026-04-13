"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, ArrowLeft, Send, Sparkles, User, ShieldCheck, Shield, Clock, AlertCircle, Bot, UserCog, Tag, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/utils/auth';

export default function TicketConversations({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);

  useEffect(() => {
    fetchTicketThread();
    fetchUserRole();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const fetchUserRole = async () => {
    try {
      const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
      setUserRole(res.data?.user?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role', error);
    }
  };

  const fetchTicketThread = async () => {
    try {
      const res = await axios.get(`/api/support/tickets/${id}`, { headers: getAuthHeaders() });
      setTicket(res.data.ticket);
      setReplies(res.data.replies);
    } catch (error) {
      console.error('Error fetching ticket', error);
      router.push('/support');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim()) return;
    setSending(true);
    try {
      await axios.post(`/api/support/tickets/${id}/reply`, { message: replyMsg }, { headers: getAuthHeaders() });
      setReplyMsg('');
      await fetchTicketThread();
    } catch (error) {
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async (updates: { status?: string; priority?: string }) => {
    setUpdatingStatus(true);
    try {
      await axios.post(`/api/support/tickets/${id}/reply`, updates, { headers: getAuthHeaders() });
      await fetchTicketThread();
    } catch (error) {
      alert('Failed to update ticket');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateAIReply = async () => {
    setGeneratingAI(true);
    try {
      const res = await axios.post('/api/support/ai-reply', { ticketId: id, autoReply: true }, { headers: getAuthHeaders() });
      if (res.data.success) {
        await fetchTicketThread();
      } else {
        alert(res.data.error || 'AI reply failed');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate AI reply');
    } finally {
      setGeneratingAI(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = ['admin', 'super-admin', 'superadmin'].includes(userRole);
  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(isAdmin ? '/admin/super/support' : '/support')}
            className="flex items-center gap-2 text-[#888] hover:text-white font-medium transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Support Tickets
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden shadow-lg">
              {/* Header */}
              <div className="p-5 border-b border-[#212121]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white mb-1 truncate">{ticket.subject}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[#555] font-mono">ID: {ticket._id}</span>
                      {ticket.category && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[9px] font-bold uppercase">
                          <Tag className="w-3 h-3" /> {ticket.category.replace('_', ' ')}
                        </span>
                      )}
                      {ticket.aiAutoReplied && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold">
                          <Bot className="w-3 h-3" /> AI Replied
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      ticket.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      ticket.status === 'resolved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="p-5 space-y-5 max-h-[55vh] overflow-y-auto bg-[#0F0F0F]/50">
                {replies.map((reply) => {
                  const isUser = reply.sender === 'user';
                  const isAI = reply.sender === 'ai';

                  return (
                    <div key={reply._id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div className="shrink-0 mt-1">
                        {isUser ? (
                          <div className="w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : isAI ? (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.3)]">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        isUser
                          ? 'bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-tr-sm'
                          : isAI
                          ? 'bg-[#181818] border border-blue-500/20 rounded-tl-sm'
                          : 'bg-[#181818] border border-emerald-500/20 rounded-tl-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888]">
                            {isUser ? 'You' : isAI ? 'AI Support Bot' : 'Super Admin'}
                          </span>
                          <span className="text-[9px] text-[#555]">
                            {timeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#CCC]">
                          {reply.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Reply Input */}
              {ticket.status !== 'closed' ? (
                <div className="p-4 border-t border-[#212121] bg-[#181818]">
                  <form onSubmit={handleReply} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <textarea
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                        placeholder={isAdmin ? "Type admin reply..." : "Type your reply..."}
                        className="w-full bg-[#0F0F0F] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#FF0000] resize-none"
                        rows={2}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || !replyMsg.trim()}
                      className="px-5 py-3 bg-[#FF0000] text-white rounded-xl hover:bg-[#CC0000] font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-[#212121] bg-[#181818] text-center">
                  <p className="text-[#666] text-sm flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> This ticket is closed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Admin Controls */}
            {isAdmin && (
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-5 shadow-lg">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  Admin Controls
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#555] uppercase mb-2">Status</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['open', 'resolved', 'closed'].map((s) => (
                        <button
                          key={s}
                          disabled={updatingStatus}
                          onClick={() => handleUpdateTicket({ status: s })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            ticket.status === s
                              ? 'bg-red-600/20 border-red-500/50 text-red-400'
                              : 'bg-[#0f0f0f] border-[#333] text-[#666] hover:bg-[#222]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#555] uppercase mb-2">Priority</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['low', 'normal', 'high'].map((p) => (
                        <button
                          key={p}
                          disabled={updatingStatus}
                          onClick={() => handleUpdateTicket({ priority: p })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            ticket.priority === p
                              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                              : 'bg-[#0f0f0f] border-[#333] text-[#666] hover:bg-[#222]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Reply Button */}
                  <div className="pt-3 border-t border-[#212121]">
                    <label className="block text-[10px] font-bold text-[#555] uppercase mb-2">Response Mode</label>
                    <button
                      onClick={handleGenerateAIReply}
                      disabled={generatingAI || ticket.status === 'closed'}
                      className="w-full py-2.5 bg-blue-600/15 border border-blue-500/25 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                      {generatingAI ? 'Generating...' : 'Generate AI Reply'}
                    </button>
                    <p className="text-[8px] text-[#444] text-center mt-1.5">AI auto-replies for normal issues. Use manual reply for complex ones.</p>
                  </div>

                  <div className="pt-3 border-t border-[#212121]">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-2 bg-[#212121] text-[#888] rounded-lg text-xs font-medium hover:bg-[#333] transition-colors"
                    >
                      Export Ticket Log
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User — Close Ticket */}
            {!isAdmin && ticket.status === 'open' && (
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                <button
                  onClick={() => handleUpdateTicket({ status: 'closed' })}
                  disabled={updatingStatus}
                  className="w-full py-2.5 bg-[#212121] text-[#AAA] rounded-lg text-xs font-bold hover:bg-[#333] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Close Ticket (Issue Resolved)
                </button>
              </div>
            )}

            {/* Ticket Details */}
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#666] mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#555]">Created</span>
                  <span className="text-white">{new Date(ticket.createdAt).toLocaleDateString()} <span className="text-[#666]">({timeAgo(ticket.createdAt)})</span></span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#555]">Last Activity</span>
                  <span className="text-white">{ticket.updatedAt ? timeAgo(ticket.updatedAt) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#555]">Replies</span>
                  <span className="text-white">{replies.length}</span>
                </div>
                {ticket.category && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#555]">Category</span>
                    <span className="text-purple-400 font-bold uppercase text-[10px]">{ticket.category.replace('_', ' ')}</span>
                  </div>
                )}
                {ticket.aiConfidence != null && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#555]">AI Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#212121] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ticket.aiConfidence >= 0.8 ? 'bg-emerald-500' : ticket.aiConfidence >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.round(ticket.aiConfidence * 100)}%` }}
                        />
                      </div>
                      <span className={`font-bold text-[10px] ${ticket.aiConfidence >= 0.8 ? 'text-emerald-400' : ticket.aiConfidence >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                        {Math.round(ticket.aiConfidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#555]">Handler</span>
                  <span className="text-white flex items-center gap-1">
                    {ticket.aiAutoReplied ? <><Bot className="w-3 h-3 text-blue-400" /> AI</> : ticket.assignedToAdmin ? <><UserCog className="w-3 h-3 text-amber-400" /> Admin</> : 'Pending'}
                  </span>
                </div>
                {lastReply && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#555]">Last Reply By</span>
                    <span className="text-white capitalize">{lastReply.sender === 'ai' ? 'AI Bot' : lastReply.sender === 'admin' ? 'Super Admin' : 'You'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info for non-admin */}
            {!isAdmin && ticket.status === 'open' && (
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 flex gap-3">
                <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-200/60 leading-relaxed">
                  {ticket.aiAutoReplied
                    ? 'AI has provided an initial response. If your issue is not resolved, please reply and our Super Admin team will assist you.'
                    : 'Our team is reviewing your ticket. High priority tickets typically receive a response within 4-6 hours.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
