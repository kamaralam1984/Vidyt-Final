"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, Headphones, Search, Filter, AlertCircle, Clock, CheckCircle2, Activity } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface Ticket {
    _id: string;
    userId: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
}

export default function SuperAdminSupportQueue() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const router = useRouter();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            // Re-using the same endpoint, it returns all tickets if user is super-admin
            const res = await axios.get('/api/support/tickets', { headers: getAuthHeaders() });
            setTickets(res.data.tickets || []);
        } catch (error: any) {
            console.error('Failed to load admin tickets', error);
            if (error.response?.status === 403 || error.response?.status === 401) {
                router.push('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const openTickets = tickets.filter(t => t.status === 'open');
    const highPriority = tickets.filter(t => t.priority === 'high' && t.status === 'open');
    const resolvedToday = tickets.filter(t => t.status === 'resolved' && new Date(t.createdAt).toDateString() === new Date().toDateString());

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t._id.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F0F0F]">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF0000]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-[#0F0F0F] text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Headphones className="w-8 h-8 text-[#FF0000]" />
                        Support Queue
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage global support tickets and handle priority escalations.
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                    { label: 'Total Open', value: openTickets.length, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'High Priority', value: highPriority.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Resolved Today', value: resolvedToday.length, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#212121] rounded-2xl p-6 flex items-center gap-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-[#333]">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-8">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search tickets by subject or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-[#FF0000]"
                    />
                </div>
                <div className="relative">
                    <Filter className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#333] rounded-lg focus:ring-2 focus:ring-[#FF0000] appearance-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#212121] rounded-xl overflow-hidden shadow-sm">
                {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No tickets match your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-[#212121] border-b border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Ticket ID</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#212121]">
                                {filteredTickets.map(ticket => (
                                    <tr 
                                        key={ticket._id} 
                                        onClick={() => router.push(`/support/${ticket._id}`)}
                                        className="hover:bg-gray-50 dark:hover:bg-[#202020] cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                                            {ticket._id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                            {ticket.subject}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                ticket.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500' :
                                                ticket.priority === 'normal' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-500'
                                            }`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                ticket.status === 'open' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-500/20' :
                                                ticket.status === 'resolved' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-500/20' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-500 border border-gray-500/20'
                                            }`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
