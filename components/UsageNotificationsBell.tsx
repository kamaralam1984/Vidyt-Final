'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

type AppNotification = {
  _id: string;
  type: 'warning' | 'limit_reached';
  message: string;
  read: boolean;
  createdAt: string;
};

export default function UsageNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try {
      const res = await axios.get('/api/notifications', { headers: getAuthHeaders() });
      setItems(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 45000);
    return () => clearInterval(interval);
  }, []);

  const unreadItems = useMemo(() => items.filter((n) => !n.read), [items]);

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications', { all: true }, { headers: getAuthHeaders() });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  };

  const iconFor = (type: AppNotification['type']) => {
    if (type === 'limit_reached') return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-lg p-2 text-[#AAAAAA] hover:bg-[#212121] hover:text-white transition-colors"
        aria-label="Usage notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF0000] text-white text-[10px] font-bold leading-[18px] text-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#FF0000] animate-ping opacity-50" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 mt-2 w-[360px] max-w-[90vw] rounded-xl border border-[#212121] bg-[#111] shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[#212121] flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Usage Alerts</p>
              {unreadItems.length > 0 ? (
                <button onClick={markAllRead} className="text-xs text-[#00E5FF] hover:text-white">
                  Mark all read
                </button>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-[#888]">No alerts yet.</p>
              ) : (
                <ul className="divide-y divide-[#1d1d1d]">
                  {items.map((n) => (
                    <li key={n._id} className={`p-3 ${n.read ? 'opacity-70' : 'opacity-100'}`}>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{iconFor(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{n.message}</p>
                          <p className="text-[11px] text-[#777] mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
