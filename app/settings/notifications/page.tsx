'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, AlertTriangle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { getAuthHeaders } from '@/utils/auth';
import { motion } from 'framer-motion';

type Item = {
  _id: string;
  type: 'warning' | 'limit_reached';
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsSettingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get('/api/notifications', { headers: getAuthHeaders() });
      setItems(res.data.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await axios.post('/api/notifications', { all: true }, { headers: getAuthHeaders() });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent fail
    } finally {
      setMarkingAll(false);
    }
  };

  const icon = (t: Item['type']) =>
    t === 'limit_reached' ? (
      <XCircle className="w-5 h-5 text-red-400" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-yellow-400" />
    );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-7 h-7 text-[#FF0000]" />
              Usage Notifications
            </h1>
            <button
              onClick={markAllRead}
              disabled={markingAll || unread === 0}
              className="px-4 py-2 rounded-lg bg-[#212121] text-white hover:bg-[#2e2e2e] disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </div>

          <p className="text-[#AAAAAA] mb-4">
            Yahan aapko plan usage alerts milenge. 80% par warning aur 100% par limit reached alert aayega.
          </p>

          <div className="text-sm text-[#888] mb-3">Unread alerts: {unread}</div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-[#888]">Loading notifications...</div>
            ) : items.length === 0 ? (
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 text-[#888]">
                Abhi koi usage alert nahi hai.
              </div>
            ) : (
              items.map((n, idx) => (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`rounded-xl border p-4 ${
                    n.read ? 'bg-[#151515] border-[#232323]' : 'bg-[#1a1a1a] border-[#343434]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{icon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white">{n.message}</p>
                      <p className="text-xs text-[#777] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
