"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Plus, MessageSquare, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface Ticket {
    _id: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
}

export default function SupportHub() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await axios.get('/api/support/tickets');
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
            const res = await axios.post('/api/support/tickets', { subject, message });
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
        }
    };

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
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-[#FF0000]" />
                            Support Hub
                        </h1>
                        <p className="text-[#AAAAAA] mt-2">Create new tickets and manage your active issues.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-medium shadow-lg shadow-red-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        New Ticket
                    </button>
                </div>

                {tickets.length === 0 ? (
                    <div className="bg-[#181818] border border-[#212121] rounded-2xl p-12 text-center shadow-sm">
                        <MessageSquare className="w-12 h-12 text-[#444] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No active tickets</h3>
                        <p className="text-[#888] mb-6">You don&apos;t have any support tickets open right now.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#333] transition-colors font-medium"
                        >
                            Create your first ticket
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tickets.map(ticket => (
                            <div 
                                key={ticket._id}
                                onClick={() => router.push(`/support/${ticket._id}`)}
                                className="bg-[#181818] border border-[#212121] hover:border-[#333] rounded-xl p-5 cursor-pointer transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-[#FF0000] transition-colors">
                                        {ticket.subject}
                                    </h3>
                                    <p className="text-sm text-[#888] mt-1">
                                        Ticket ID: {ticket._id} • {new Date(ticket.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
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
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[#181818] border border-[#212121] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">New Support Ticket</h2>
                                <button onClick={() => setShowModal(false)} className="text-[#888] hover:text-white">✕</button>
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
                                
                                <div className="bg-[#FF0000]/10 border border-[#FF0000]/20 p-3 rounded-lg flex items-start gap-3 mt-2">
                                    <AlertCircle className="w-5 h-5 text-[#FF0000] shrink-0 mt-0.5" />
                                    <p className="text-xs text-[#ffaaaa]">
                                        If you are on an eligible plan, our AI Assistant may reply instantly right after submission to help resolve your inquiry immediately.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-[#888] hover:text-white font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] font-medium disabled:opacity-50 flex items-center gap-2"
                                    >
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