'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import UserTable from '@/components/admin/UserTable';
import UserDetailModal from '@/components/admin/UserDetailModal';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';

export default function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const debounceRef = useRef<any>(null);

  const load = useCallback(async (p = page, s = search, plan = planFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', ...(s && { search: s }), ...(plan && { plan }) });
      const res = await axios.get(`/api/admin/super/analytics/users?${params}`, { headers: getAuthHeaders() });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load users list.');
    }
    setLoading(false);
  }, [page, search, planFilter]);

  useEffect(() => { load(page, search, planFilter); }, [page, planFilter]);

  const handleSearch = (q: string) => {
    setSearch(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, q, planFilter); }, 400);
  };

  const handlePlanFilter = (p: string) => {
    setPlanFilter(p);
    setPage(1);
  };

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-white/40 text-sm mt-1">Manage and analyze all users and their revenue</p>
      </motion.div>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <UserTable
        users={users}
        onSearch={handleSearch}
        onPlanFilter={handlePlanFilter}
        onRowClick={id => setSelectedUserId(id)}
        page={page}
        pages={pages}
        total={total}
        onPageChange={p => { setPage(p); load(p, search, planFilter); }}
        loading={loading}
      />

      <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
