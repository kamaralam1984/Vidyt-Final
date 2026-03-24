'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { getSocket } from '@/hooks/useSocket';

interface AdminAlert {
  id: string;
  type: 'new_subscription' | 'payment_failed' | 'user_spike';
  message: string;
  ts: string;
}

const ALERT_CONFIG = {
  new_subscription: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'New Subscription' },
  payment_failed: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Payment Failed' },
  user_spike: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'User Spike' },
};

export default function AdminAlertPanel() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const addAlert = useCallback((data: Omit<AdminAlert, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setAlerts(prev => [{ id, ...data }, ...prev].slice(0, 20));
    // Auto-dismiss toast after 6 seconds
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
  }, []);

  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const handler = (data: any) => {
      const messages: Record<string, string> = {
        new_subscription: `New ${data.plan || ''} subscription from ${data.userName || 'a user'}`,
        payment_failed: `Payment of ₹${data.amount || '—'} failed for ${data.userName || 'a user'}`,
        user_spike: `User spike detected: ${data.count || '—'} users online`,
      };
      addAlert({
        type: data.type,
        message: messages[data.type] || 'Admin alert received',
        ts: data.ts || new Date().toISOString(),
      });
    };

    sock.on('admin_alert', handler);
    return () => { sock.off('admin_alert', handler); };
  }, [addAlert]);

  const unread = alerts.length;

  return (
    <>
      {/* Bell Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPanelOpen(p => !p)}
          className="relative p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
        >
          <Bell className="w-5 h-5 text-white/60" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </motion.button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Admin Alerts</span>
                <button onClick={() => { setAlerts([]); setPanelOpen(false); }} className="text-[10px] text-white/30 hover:text-white/60">Clear all</button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {alerts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-white/30 text-sm">No alerts</p>
                ) : alerts.map((a) => {
                  const cfg = ALERT_CONFIG[a.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={a.id} className={`px-4 py-3 flex gap-3 items-start border-l-2 ${a.type === 'new_subscription' ? 'border-emerald-500/50' : a.type === 'payment_failed' ? 'border-red-500/50' : 'border-blue-500/50'}`}>
                      <div className={`p-1.5 rounded-lg ${cfg.bg} border mt-0.5 flex-shrink-0`}>
                        <Icon className={`w-3 h-3 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 leading-tight">{a.message}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{new Date(a.ts).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Toast Alerts */}
      <div className="fixed top-6 right-6 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {alerts.slice(0, 3).map((a) => {
            const cfg = ALERT_CONFIG[a.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg} backdrop-blur-sm shadow-xl max-w-xs pointer-events-auto`}
              >
                <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-white/70 mt-0.5 leading-tight">{a.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
