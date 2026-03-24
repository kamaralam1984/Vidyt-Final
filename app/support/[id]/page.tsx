"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, ArrowLeft, Send, Sparkles, User, ShieldCheck, Shield, Clock, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function TicketConversations({ params }: { params: { id: string } }) {
    const id = params.id;
    const router = useRouter();

    const [ticket, setTicket] = useState<any>(null);
    const [replies, setReplies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyMsg, setReplyMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchTicketThread();
        fetchUserRole();
    }, [id]);

    const fetchUserRole = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            setUserRole(res.data?.user?.role || 'user');
        } catch (error) {
            console.error('Error fetching user role', error);
        }
    };

    const fetchTicketThread = async () => {
        try {
            const res = await axios.get(`/api/support/tickets/${id}`);
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
            await axios.post(`/api/support/tickets/${id}/reply`, { message: replyMsg });
            setReplyMsg('');
            // Optimistically update or re-fetch
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
            await axios.post(`/api/support/tickets/${id}/reply`, updates);
            await fetchTicketThread();
        } catch (error) {
            alert('Failed to update ticket');
        } finally {
            setUpdatingStatus(false);
        }
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

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-6 md:p-8">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <button 
                        onClick={() => router.push(isAdmin ? '/admin/super/support' : '/support')}
                        className="flex items-center gap-2 text-[#888] hover:text-white font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {isAdmin ? 'Support Queue' : 'Tickets'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chat Area */}
                    <div className="lg:col-span-2 space-y-6">

                <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden shadow-lg">
                    {/* Header */}
                    <div className="p-6 border-b border-[#212121] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-white mb-2">{ticket.subject}</h1>
                            <p className="text-xs text-[#888]">
                                Ticket ID: <span className="font-mono text-[#AAA]">{ticket._id}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                ticket.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                                ticket.priority === 'normal' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-gray-500/20 text-gray-500'
                            }`}>
                                {ticket.priority} priority
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                ticket.status === 'open' ? 'bg-emerald-500/20 text-emerald-500' :
                                ticket.status === 'resolved' ? 'bg-amber-500/20 text-amber-500' :
                                'bg-gray-500/20 text-gray-500'
                            }`}>
                                {ticket.status}
                            </span>
                        </div>
                    </div>

                    {/* Chat Thread */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-[#0F0F0F]/50">
                        {replies.map((reply) => {
                            const isUser = reply.sender === 'user';
                            const isAI = reply.sender === 'ai';

                            return (
                                <div key={reply._id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    <div className="shrink-0 mt-1">
                                        {isUser ? (
                                            <div className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                        ) : isAI ? (
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                                <Sparkles className="w-5 h-5 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                                        isUser 
                                        ? 'bg-[#FF0000]/10 border border-[#FF0000]/20 text-white rounded-tr-sm' 
                                        : isAI
                                        ? 'bg-[#181818] border border-blue-500/30 text-gray-200 rounded-tl-sm'
                                        : 'bg-[#181818] border border-emerald-500/30 text-gray-200 rounded-tl-sm'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-[#888]">
                                                {isUser ? 'You' : isAI ? 'AI Support Bot' : 'Admin'}
                                            </span>
                                            <span className="text-[10px] text-[#666]">
                                                {new Date(reply.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                            {reply.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Reply Input */}
                    {ticket.status !== 'closed' ? (
                        <div className="p-4 border-t border-[#212121] bg-[#181818]">
                            <form onSubmit={handleReply} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <textarea
                                        value={replyMsg}
                                        onChange={(e) => setReplyMsg(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="w-full bg-[#0F0F0F] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#FF0000] resize-none"
                                        rows={2}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending || !replyMsg.trim()}
                                    className="px-6 py-3 bg-[#FF0000] text-white rounded-xl hover:bg-[#CC0000] font-medium disabled:opacity-50 flex items-center gap-2 h-full"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Send
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-4 border-t border-[#212121] bg-[#181818] text-center">
                            <p className="text-[#888]">This ticket is closed and cannot receive new replies.</p>
                        </div>
                    )}
                    </div>
                    </div>

                    {/* Sidebar / Admin Controls */}
                    <div className="space-y-6">
                        {/* Admin Controls Card */}
                        {isAdmin && (
                            <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden shadow-lg p-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-[#888] mb-6 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-red-500" />
                                    Admin Controls
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#666] uppercase mb-2">Update Status</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['open', 'resolved', 'closed'].map((s) => (
                                                <button
                                                    key={s}
                                                    disabled={updatingStatus}
                                                    onClick={() => handleUpdateTicket({ status: s })}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                                                        ticket.status === s
                                                            ? 'bg-red-600/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                                                            : 'bg-[#0f0f0f] border-[#333] text-[#888] hover:bg-[#222]'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#666] uppercase mb-2">Change Priority</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['low', 'normal', 'high'].map((p) => (
                                                <button
                                                    key={p}
                                                    disabled={updatingStatus}
                                                    onClick={() => handleUpdateTicket({ priority: p })}
                                                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                                        ticket.priority === p
                                                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                                            : 'bg-[#0f0f0f] border-[#333] text-[#888] hover:bg-[#222]'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-[#212121]">
                                        <button 
                                            onClick={() => window.print()}
                                            className="w-full py-2 bg-[#212121] text-[#AAA] rounded-lg text-xs font-medium hover:bg-[#333] transition-colors"
                                        >
                                            Export Ticket Log
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ticket Stats Card */}
                        <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 shadow-lg">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[#888] mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Details
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#666]">Created</span>
                                    <span className="text-white">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#666]">Last Activity</span>
                                    <span className="text-white">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#666]">Replies</span>
                                    <span className="text-white">{replies.length}</span>
                                </div>
                            </div>
                        </div>

                        {!isAdmin && ticket.status === 'open' && (
                            <div className="bg-red-600/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-200/60 leading-relaxed">
                                    Our support team is reviewing your ticket. High priority tickets typically receive a response within 4-6 hours.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
