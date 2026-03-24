'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ExternalLink, Download } from 'lucide-react';

interface UserRevenue {
  daily: number;
  weekly: number;
  monthly: number;
  currency: string;
}

interface User {
  id: string;
  uniqueId?: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  expiresAt?: string;
  city?: string;
  country?: string;
  distanceFromAdmin?: number;
  revenue: UserRevenue;
}

interface UserTableProps {
  users: User[];
  onSearch: (q: string) => void;
  onPlanFilter: (plan: string) => void;
  onRowClick?: (id: string) => void;
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/60',
  starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-violet-500/20 text-violet-400',
  enterprise: 'bg-amber-500/20 text-amber-400',
  custom: 'bg-emerald-500/20 text-emerald-400',
  owner: 'bg-red-500/20 text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400',
  trial: 'text-blue-400',
  expired: 'text-red-400',
  cancelled: 'text-white/30',
};

export default function UserTable({
  users, onSearch, onPlanFilter, onRowClick, page, pages, total, onPageChange, loading
}: UserTableProps) {
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fmt = (n: number, c = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Plan', 'Status', 'Daily Revenue', 'Weekly Revenue', 'Monthly Revenue', 'Joined'];
    const rows = users.map(u => [
      u.name,
      u.email,
      u.plan,
      u.status,
      u.revenue.daily,
      u.revenue.weekly,
      u.revenue.monthly,
      u.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `viralboost_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Users</h2>
          <p className="text-xs text-white/40">{total} total users</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search users..."
              onChange={e => onSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>
          <select
            onChange={e => onPlanFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-red-500/50"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {[
                { label: 'User', field: 'name' },
                { label: 'Plan', field: 'plan' },
                { label: 'Status', field: 'status' },
                { label: 'Daily Rev', field: 'daily' },
                { label: 'Weekly Rev', field: 'weekly' },
                { label: 'Monthly Rev', field: 'monthly' },
                { label: 'Location', field: 'location' },
                { label: 'Expires', field: 'expiresAt' },
                { label: 'Joined', field: 'createdAt' },
                { label: 'Last Login', field: 'lastLogin' },
              ].map(col => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase cursor-pointer hover:text-white/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.field} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/3">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-white/30 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onRowClick?.(user.id)}
                    className={`border-b border-white/3 hover:bg-white/3 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-white/40 text-xs">{user.email}</p>
                        {user.uniqueId && <p className="text-white/20 text-[10px] font-mono">{user.uniqueId}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${PLAN_COLORS[user.plan] || 'bg-white/5 text-white/50'}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${STATUS_COLORS[user.status] || 'text-white/40'}`}>
                        ● {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70 text-xs font-mono">{fmt(user.revenue.daily, user.revenue.currency)}</td>
                    <td className="px-4 py-3 text-white/70 text-xs font-mono">{fmt(user.revenue.weekly, user.revenue.currency)}</td>
                    <td className="px-4 py-3 text-emerald-400 text-xs font-mono font-semibold">{fmt(user.revenue.monthly, user.revenue.currency)}</td>
                    <td className="px-4 py-3">
                      {user.city ? (
                        <>
                          <span className="text-[10px] text-white/40 block">{user.city}{user.country ? `, ${user.country}` : ''}</span>
                          <span className="text-[9px] text-white/20">{user.distanceFromAdmin !== undefined ? `${user.distanceFromAdmin.toLocaleString()} km` : 'Unknown dist'}</span>
                        </>
                      ) : (
                        <span className="text-white/20 text-[10px]">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                       <span className={`text-[10px] font-bold ${user.expiresAt && new Date(user.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 ? 'text-red-400' : 'text-white/40'}`}>
                         {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Never'}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-white/40">Page {page} of {pages}</p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/10 text-white/70 transition"
            >
              Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/10 text-white/70 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
