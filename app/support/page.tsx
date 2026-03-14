'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { MessageCircle, Send, Loader2, AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

interface Ticket {
  _id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export default function SupportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/support', { headers: getAuthHeaders() });
      setTickets(res.data.tickets || []);
    } catch (_) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setMessageSuccess('');
    try {
      await axios.post('/api/support', { subject: subject.trim(), message: message.trim() }, { headers: getAuthHeaders() });
      setSubject('');
      setMessage('');
      setMessageSuccess('Ticket submitted. We will respond via email.');
      fetchTickets();
    } catch (_) {
      setMessageSuccess('Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-[#FF0000]" />
            Support
          </h1>
          <p className="text-[#AAAAAA] mb-6">Email support (Pro) / 24/7 priority (Enterprise). Submit a ticket below.</p>

          <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white mb-4"
              required
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              rows={4}
              className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white mb-4 resize-y"
              required
            />
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit ticket
            </button>
            {messageSuccess && <p className="mt-2 text-sm text-[#10b981]">{messageSuccess}</p>}
          </form>

          <h2 className="text-lg font-bold text-white mb-3">Your tickets</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" /></div>
          ) : tickets.length === 0 ? (
            <p className="text-[#AAAAAA]">No tickets yet.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t._id} className="bg-[#181818] border border-[#212121] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-white">{t.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${t.priority === 'priority' ? 'bg-[#FF0000]/20 text-[#FF0000]' : t.priority === 'high' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#333333] text-[#AAAAAA]'}`}>{t.priority}</span>
                  </div>
                  <p className="text-sm text-[#AAAAAA] mt-1">{t.message}</p>
                  {t.reply && (
                    <div className="mt-3 pt-3 border-t border-[#333333]">
                      <p className="text-xs text-[#888]">Reply</p>
                      <p className="text-sm text-white">{t.reply}</p>
                    </div>
                  )}
                  <p className="text-xs text-[#666] mt-2">{new Date(t.createdAt).toLocaleString()} · {t.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}