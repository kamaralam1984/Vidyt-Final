'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PlanDiscountsManager from '@/components/admin/PlanDiscountsManager';
import PlanManager from '@/components/admin/PlanManager';
import UserPlanManager from '@/components/admin/UserPlanManager';
import PlanConfigEditor from '@/components/admin/PlanConfigEditor';
import SystemAccessMatrix from '@/components/admin/SystemAccessMatrix';
import UnifiedFeatureMatrix from '@/components/admin/UnifiedFeatureMatrix';
import YtSeoSectionControl from '@/components/admin/YtSeoSectionControl';
import PlatformAnalytics from '@/components/admin/PlatformAnalytics';
import {
  Activity,
  Loader2,
  Shield,
  RefreshCw,
  KeyRound,
  Hash,
  Users,
  UserPlus,
  UserCog,
  Trash2,
  X,
  Mail,
  Bell,
  Database,
  LayoutDashboard,
  Video,
  Wand2,
  MonitorPlay,
  Facebook,
  Flame,
  Hash as HashIcon,
  Clock4,
  BarChart3,
  CalendarDays,
  LogOut,
  Settings,
  Key,
  ChevronDown,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Lock,
  Youtube,
} from 'lucide-react';
import { removeToken } from '@/utils/auth';

interface AdminUser {
  id: string;
  uniqueId?: string;
  email: string;
  name?: string;
  role: string;
  subscription: string;
  lastLogin?: string;
  createdAt: string;
  hasPin: boolean;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string>('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', role: 'user' as string, loginPin: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modifyUser, setModifyUser] = useState<AdminUser | null>(null);
  const [modifyForm, setModifyForm] = useState({ name: '', role: 'user' as string, newPin: '' });
  const [modifySubmitting, setModifySubmitting] = useState(false);
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('users');
  const [systems, setSystems] = useState<{ id: string; label: string; group: string; enabled: boolean; allowedRoles: string[] }[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(false);
  const [systemsSaving, setSystemsSaving] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansSaving, setPlansSaving] = useState(false);
  const [aiStudioRoles, setAiStudioRoles] = useState<string[]>(['manager', 'admin', 'enterprise', 'super-admin']);
  const [aiStudioSaving, setAiStudioSaving] = useState(false);
  const [aiToolsAccess, setAiToolsAccess] = useState<Record<string, string[]>>({});
  const [aiToolsSaving, setAiToolsSaving] = useState(false);
  const [apiConfigStatus, setApiConfigStatus] = useState<Record<string, boolean>>({});
  const [apiConfigForm, setApiConfigForm] = useState<Record<string, string>>({});
  const [apiConfigLoading, setApiConfigLoading] = useState(false);
  const [apiConfigSaving, setApiConfigSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    { id: string; name: string; hasKey: boolean; status: 'no-key' | 'ok' | 'error'; message: string; limitInfo: string; usedBy?: string[] }[]
  >([]);
  const [collections, setCollections] = useState<{ id: string; label: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [sendingReceipts, setSendingReceipts] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [openUserManagement, setOpenUserManagement] = useState(true);
  const [openAiStudio, setOpenAiStudio] = useState(true);
  const [openSaaS, setOpenSaaS] = useState(true);
  const [openBilling, setOpenBilling] = useState(true);
  const tableLimit = 20;
  const [discounts, setDiscounts] = useState<
    { id: string; planId: string; label: string; percentage: number; startsAt: string; endsAt: string }[]
  >([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountsError, setDiscountsError] = useState<string | null>(null);
  const [discountForm, setDiscountForm] = useState<{
    planId: string;
    label: string;
    percentage: string;
    startsAt: string;
    endsAt: string;
  }>({
    planId: 'pro',
    label: '',
    percentage: '20',
    startsAt: '',
    endsAt: '',
  });
  const [discountSaving, setDiscountSaving] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyMessage.trim()) {
      alert('Message is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setNotifySending(true);
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: notifySubject.trim() || 'Notification from Vid YT',
          message: notifyMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Notification sent to ${data.sent} user(s).${data.failed ? ` Failed: ${data.failed}` : ''}`);
        setShowNotifyModal(false);
        setNotifySubject('');
        setNotifyMessage('');
      } else {
        alert(data.error || 'Failed to send notification');
      }
    } catch (_) {
      alert('Failed to send notification');
    } finally {
      setNotifySending(false);
    }
  };

  const handleSendPlanReceipts = async () => {
    if (!confirm('Send payment receipt email to all users with Pro/Enterprise plan?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setSendingReceipts(true);
    try {
      const res = await fetch('/api/admin/send-plan-receipts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Receipts sent: ${data.sent} user(s).${data.failed ? ` Failed: ${data.failed}` : ''}`);
      } else {
        alert(data.error || 'Failed to send receipts');
      }
    } catch (_) {
      alert('Failed to send receipts');
    } finally {
      setSendingReceipts(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        router.push('/login');
        return;
      }
      setRefreshing(true);
      setAccessDenied(false);
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 403) {
        setAccessDenied(true);
        setError('');
        setUsers([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load users');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setUsers(data.data || []);
      setError('');
    } catch (e: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCollections = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/data/collections', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setCollections(json.data || []);
        if (json.data?.length && !selectedTable) setSelectedTable(json.data[0].id);
      }
    } catch (_) {
      setCollections([]);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setTableLoading(true);
    try {
      const q = new URLSearchParams({ page: String(tablePage), limit: String(tableLimit) });
      if (tableSearch.trim()) q.set('search', tableSearch.trim());
      
      let endpoint = `/api/admin/data/collections/${selectedTable}?${q}`;
      if (selectedTable === 'subscriptions') {
          endpoint = `/api/admin/subscriptions?${q}`;
      }

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (selectedTable === 'subscriptions') {
            console.log("Fetched subscriptions:", json);
        }
        setTableData(json.data || []);
        setTableTotal(json.pagination?.total ?? 0);
      } else {
        setTableData([]);
        setTableTotal(0);
      }
    } catch (_) {
      setTableData([]);
      setTableTotal(0);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDiscountsLoading(true);
    setDiscountsError(null);
    try {
      const res = await fetch('/api/admin/plan-discounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setDiscountsError(json.error || 'Failed to load discounts');
        setDiscounts([]);
        return;
      }
      setDiscounts(json.discounts || []);
    } catch (e: any) {
      setDiscountsError('Failed to load discounts');
      setDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'tables') fetchCollections();
    if (viewMode === 'aiStudio') {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/admin/features/ai-studio', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => d.allowedRoles && setAiStudioRoles(d.allowedRoles))
          .catch(() => {});
        fetch('/api/admin/features/ai-tools', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => {
            if (d.features) setAiToolsAccess(d.features);
          })
          .catch(() => {});
      }
    }
    if (viewMode === 'apiConfig') {
      const token = localStorage.getItem('token');
      if (token) {
        setApiConfigLoading(true);
        fetch('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => {
            if (d.status) setApiConfigStatus(d.status);
            setApiConfigForm({});
          })
          .catch(() => {})
          .finally(() => setApiConfigLoading(false));
        fetch('/api/admin/api-status', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d.apis)) setApiStatus(d.apis);
          })
          .catch(() => {});
      }
    }
    if (viewMode === 'discounts') {
      fetchDiscounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (viewMode === 'systemControl') {
      const token = localStorage.getItem('token');
      if (token) {
        setSystemsLoading(true);
        fetch('/api/admin/features', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => {
            if (d.features) setSystems(d.features);
          })
          .catch(() => {})
          .finally(() => setSystemsLoading(false));

        // Also fetch plans for role mapping
        setPlansLoading(true);
        fetch('/api/admin/plan-config', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((d) => {
            if (d.plans) setPlans(d.plans);
          })
          .catch(() => {})
          .finally(() => setPlansLoading(false));
      }
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'tables' && selectedTable) fetchTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedTable, tablePage]);

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password (min 6 characters). User will login with this password.');
    if (newPassword === null) return; // User cancelled
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'reset-password', newPassword: trimmed }),
    });
    if (res.ok) {
      alert('Password has been updated successfully.');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to update password.');
    }
  };

  const handleSetPin = async (userId: string) => {
    const newPin = prompt('Enter new PIN (4-6 digits):') || '';
    if (!newPin) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'set-pin', newPin }),
    });
    fetchUsers();
  };

  const handleClearPin = async (userId: string) => {
    if (!confirm('Clear this user PIN?')) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'clear-pin' }),
    });
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMessage(null);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!createForm.email.trim() || !createForm.password) {
      setCreateMessage({ type: 'error', text: 'Email and password are required.' });
      return;
    }
    if (createForm.password.length < 6) {
      setCreateMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: createForm.email.trim(),
          password: createForm.password,
          name: createForm.name.trim() || undefined,
          role: createForm.role,
          loginPin: createForm.loginPin.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMessage({ type: 'error', text: data.error || 'Failed to create user' });
        return;
      }
      setCreateMessage({ type: 'success', text: `User created: ${data.data?.email}. Unique ID: ${data.data?.uniqueId}` });
      setCreateForm({ email: '', password: '', name: '', role: 'user', loginPin: '' });
      fetchUsers();
      setShowCreateModal(false);
    } catch (_) {
      setCreateMessage({ type: 'error', text: 'Failed to create user' });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setRoleChangingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'set-role', role }),
      });
      if (res.ok) fetchUsers();
    } finally {
      setRoleChangingId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
        if (modifyUser?.id === user.id) setModifyUser(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const openModifyModal = (u: AdminUser) => {
    setModifyUser(u);
    setModifyForm({ name: u.name || '', role: u.role, newPin: '' });
  };

  const handleSaveModify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyUser) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setModifySubmitting(true);
    try {
      await fetch(`/api/admin/users/${modifyUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update', name: modifyForm.name.trim() || undefined, role: modifyForm.role }),
      });
      if (modifyForm.newPin.trim()) {
        await fetch(`/api/admin/users/${modifyUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'set-pin', newPin: modifyForm.newPin.trim() }),
        });
      }
      fetchUsers();
      setModifyUser(null);
    } finally {
      setModifySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Navbar />
      <div className="flex pt-14">
      {/* Left sidebar */}
      <aside className="w-64 bg-[#181818] border-r border-[#212121] hidden md:flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-[#212121] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#FF0000]" />
          <div>
            <p className="text-sm font-semibold">Super Admin</p>
            <p className="text-xs text-[#888]">SaaS Control Center</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0 text-sm overflow-y-auto">
          {/* User Management — sliding section */}
          <div className="mb-1">
            <button
              type="button"
              onClick={() => setOpenUserManagement((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] text-left"
            >
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">User management</span>
              {openUserManagement ? <ChevronDown className="w-4 h-4 text-[#666]" /> : <ChevronRight className="w-4 h-4 text-[#666]" />}
            </button>
            <AnimatePresence initial={false}>
              {openUserManagement && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pl-1 pb-2">
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'users' ? 'bg-[#212121] text-white' : ''}`}
                      onClick={() => {
                        setViewMode('users');
                        setLoading(true);
                        setAccessDenied(false);
                        document.getElementById('users-main')?.scrollIntoView({ behavior: 'smooth' });
                        fetchUsers();
                      }}
                    >
                      <Users className="w-4 h-4" />
                      <span>Users</span>
                    </button>
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'platformAnalytics' ? 'bg-[#212121] text-white' : ''}`}
                      onClick={() => setViewMode('platformAnalytics')}
                    >
                      <Activity className="w-4 h-4 text-[#FF0000]" />
                      <span>Platform Analytics</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]"
                      onClick={() => router.push('/admin/analytics')}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Growth Analytics</span>
                    </button>
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'tables' ? 'bg-[#212121] text-white' : ''}`}
                      onClick={() => {
                        setViewMode('tables');
                        fetchCollections();
                      }}
                    >
                      <Database className="w-4 h-4" />
                      <span>Database Tables</span>
                    </button>
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'aiStudio' ? 'bg-[#212121] text-white' : ''}`}
                      onClick={() => setViewMode('aiStudio')}
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>AI Studio Access</span>
                    </button>
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'apiConfig' ? 'bg-[#212121] text-white' : ''}`}
                      onClick={() => setViewMode('apiConfig')}
                    >
                      <Key className="w-4 h-4" />
                      <span>API Config</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Studio — sliding section */}
          <div className="mb-1">
            <button
              type="button"
              onClick={() => setOpenAiStudio((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] text-left"
            >
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">AI Studio</span>
              {openAiStudio ? <ChevronDown className="w-4 h-4 text-[#666]" /> : <ChevronRight className="w-4 h-4 text-[#666]" />}
            </button>
            <AnimatePresence initial={false}>
              {openAiStudio && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pl-1 pb-2">
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/ai/script-generator')}>
                      <span className="text-[#FF0000]">•</span>
                      <span>Script Generator</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/ai/thumbnail-generator')}>
                      <span className="text-[#FF0000]">•</span>
                      <span>Thumbnail Generator</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/ai/hook-generator')}>
                      <span className="text-[#FF0000]">•</span>
                      <span>Hook Generator</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/ai/shorts-creator')}>
                      <span className="text-[#FF0000]">•</span>
                      <span>Shorts Creator</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/tools/youtube-growth')}>
                      <span className="text-[#FF0000]">•</span>
                      <span>YouTube Growth</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/dashboard/youtube-seo')}>
                      <span className="text-[#FF0000]">•</span>
                      <span>YouTube Live SEO Analyzer</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SaaS — sliding section */}
          <div className="mb-1">
            <button
              type="button"
              onClick={() => setOpenSaaS((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] text-left"
            >
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">SaaS</span>
              {openSaaS ? <ChevronDown className="w-4 h-4 text-[#666]" /> : <ChevronRight className="w-4 h-4 text-[#666]" />}
            </button>
            <AnimatePresence initial={false}>
              {openSaaS && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pl-1 pb-2">
                    <button type="button" className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'systemControl' ? 'bg-[#212121] text-white' : ''}`} onClick={() => setViewMode('systemControl')}>
                      <Settings className="w-4 h-4" />
                      <span>System Control</span>
                    </button>
                    <button type="button" className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'ytSeoSections' ? 'bg-[#212121] text-white' : ''}`} onClick={() => setViewMode('ytSeoSections')}>
                      <Youtube className="w-4 h-4" />
                      <span>YT SEO Sections</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/admin/super/dashboard')}>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Super Admin</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/admin/super/support')}>
                      <Headphones className="w-4 h-4" />
                      <span>Support Queue</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/videos')}>
                      <Video className="w-4 h-4" />
                      <span>My Videos</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/dashboard/viral-optimizer')}>
                      <Wand2 className="w-4 h-4" />
                      <span>AI Viral Optimization Engine</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/channel-audit')}>
                      <MonitorPlay className="w-4 h-4" />
                      <span>Channel Audit</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/facebook-audit')}>
                      <Facebook className="w-4 h-4" />
                      <span>Facebook Audit</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/trending')}>
                      <Flame className="w-4 h-4" />
                      <span>Trending</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/hashtags')}>
                      <HashIcon className="w-4 h-4" />
                      <span>Hashtags</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/posting-time')}>
                      <Clock4 className="w-4 h-4" />
                      <span>Posting Time</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/analytics')}>
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </button>
                    <button type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]" onClick={() => router.push('/calendar')}>
                      <CalendarDays className="w-4 h-4" />
                      <span>Content Calendar</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Billing / Plans — sliding section */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setOpenBilling((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] text-left"
            >
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                Billing & Config
              </span>
              {openBilling ? (
                <ChevronDown className="w-4 h-4 text-[#666]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#666]" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {openBilling && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 pl-1 pb-2">
                    <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#666]">
                      Global Control
                    </p>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121]"
                      onClick={() => router.push('/admin/super/dashboard')}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#FF0000]" />
                      <span>New Super Dashboard</span>
                    </button>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${
                        viewMode === 'systemControl' ? 'bg-[#212121] text-white' : ''
                      }`}
                      onClick={() => setViewMode('systemControl')}
                    >
                      <Settings className="w-4 h-4 text-[#FF0000]" />
                      <span>System Control</span>
                    </button>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${
                        viewMode === 'discounts' ? 'bg-[#212121] text-white' : ''
                      }`}
                      onClick={() => { setViewMode('discounts'); setLoading(false); }}
                    >
                      <Flame className="w-4 h-4 text-[#FF0000]" />
                      <span>Plan Discounts</span>
                    </button>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${
                        viewMode === 'plans' ? 'bg-[#212121] text-white' : ''
                      }`}
                      onClick={() => { setViewMode('plans'); setLoading(false); }}
                    >
                      <Hash className="w-4 h-4 text-[#FF0000]" />
                      <span>Manage Plans</span>
                    </button>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${
                        viewMode === 'userPlans' ? 'bg-[#212121] text-white' : ''
                      }`}
                      onClick={() => { setViewMode('userPlans'); setLoading(false); }}
                    >
                      <UserCog className="w-4 h-4 text-[#FF0000]" />
                      <span>User Plans</span>
                    </button>
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'accessControl' ? 'bg-[#212121] text-white' : ''}`}
                      onClick={() => setViewMode('accessControl')}
                    >
                      <Lock className="w-4 h-4" />
                      <span>System Access Matrix</span>
                    </button>
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] ${viewMode === 'unifiedAccess' ? 'bg-[#212121] text-white font-bold' : ''}`}
                      onClick={() => setViewMode('unifiedAccess')}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#FF0000]" />
                      <span>Unified Access Matrix</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New subscription control section */}
          <div className="mb-4">
            <div className="px-3 py-2 mb-1">
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                Subscription Control
              </span>
            </div>
            <div className="space-y-0.5 px-1">
              {[
                { id: 'free', label: 'Free Plan Control', icon: '🆓' },
                { id: 'starter', label: 'Starter Plan Control', icon: '🌱' },
                { id: 'pro', label: 'Pro Plan Control', icon: '🚀' },
                { id: 'enterprise', label: 'Enterprise Plan Control', icon: '🏢' },
                { id: 'custom', label: 'Custom Plan Control', icon: '🛠️' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#212121] text-sm transition-all ${
                    viewMode === `plan-control-${p.id}` ? 'bg-[#FF0000]/20 text-[#FF0000] font-bold border border-[#FF0000]/20' : 'text-[#BBB]'
                  }`}
                  onClick={() => setViewMode(`plan-control-${p.id}`)}
                >
                  <span className="grayscale-0">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#212121] mt-2 border-t border-[#212121] pt-3"
            onClick={() => {
              removeToken();
              if (typeof window !== 'undefined') localStorage.removeItem('uniqueId');
              router.push('/login');
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#FF0000] mx-auto mb-4" />
              <p className="text-[#AAAAAA]">Loading Super Admin Panel...</p>
            </div>
          </div>
        ) : accessDenied ? (
          <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Shield className="w-16 h-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access denied</h2>
            <p className="text-[#AAAAAA] text-sm mb-2">
              User details tab sirf super admin users ke liye hai. Apna role <code className="bg-[#212121] px-1 rounded">super-admin</code> set karein, phir niche &quot;Refresh&quot; dabayein.
            </p>
            <p className="text-[#888] text-xs mb-4 text-left w-full max-w-md">
              <strong>Option 1 (bina mongosh):</strong> Terminal me project folder me jao, phir: <code className="block mt-1 p-2 bg-[#212121] rounded text-left break-all">node scripts/set-super-admin.js your@email.com</code>
              <strong className="block mt-2">Option 2 (mongosh):</strong> <code className="block mt-1 p-2 bg-[#212121] rounded text-left text-xs break-all">db.users.updateOne(&#123;email: &quot;your@email.com&quot;&#125;, &#123;$set: &#123;role: &quot;super-admin&quot;&#125;&#125;)</code>
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => { setLoading(true); setAccessDenied(false); fetchUsers(); }}
                className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] font-medium"
              >
                Refresh (try again)
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#333333] font-medium border border-[#333333]"
              >
                Log in again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-[#212121] text-white rounded-lg hover:bg-[#333333] font-medium border border-[#333333]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : viewMode === 'aiStudio' ? (
          <div id="ai-studio-main" className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Wand2 className="w-8 h-8 text-[#FF0000]" />
              <div>
                <h1 className="text-2xl font-bold">AI Studio Access</h1>
                <p className="text-sm text-[#AAAAAA]">Jin roles ko AI Studio (Script Generator, Thumbnail, Hooks, Shorts, YouTube Growth) dikhana hai, unhe select karein. Save karne par sidebar me AI Studio in users ko dikhega.</p>
              </div>
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
              <p className="text-sm font-medium text-white mb-3">Allow AI Studio for these roles:</p>
              <div className="space-y-2">
                {['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'].map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiStudioRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) setAiStudioRoles((r) => [...r, role]);
                        else setAiStudioRoles((r) => r.filter((x) => x !== role));
                      }}
                      className="rounded border-[#333333] bg-[#0F0F0F] text-[#FF0000] focus:ring-[#FF0000]"
                    />
                    <span className="text-[#CCCCCC] capitalize">{role}</span>
                  </label>
                ))}
              </div>
              <button
                disabled={aiStudioSaving}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  setAiStudioSaving(true);
                  try {
                    const res = await fetch('/api/admin/features/ai-studio', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ allowedRoles: aiStudioRoles }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setAiStudioRoles(data.allowedRoles || aiStudioRoles);
                      alert('AI Studio access saved.');
                    } else alert(data.error || 'Failed to save');
                  } catch (_) {
                    alert('Failed to save');
                  } finally {
                    setAiStudioSaving(false);
                  }
                }}
                className="mt-4 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 font-medium"
              >
                {aiStudioSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
              <p className="text-sm font-medium text-white mb-3">Individual AI tools ke liye roles select karein:</p>
              <p className="text-xs text-[#888] mb-4">Har tool ke aage jin roles ko tick karenge, sirf wahi users us tool ko use kar sakenge. Agar kuch nahi select kiya to default: manager, admin, super-admin.</p>
              <div className="space-y-4">
                {[
                  { key: 'daily_ideas', label: 'Daily Ideas' },
                  { key: 'ai_coach', label: 'AI Coach' },
                  { key: 'keyword_research', label: 'Keyword Research' },
                  { key: 'script_writer', label: 'Script Writer' },
                  { key: 'title_generator', label: 'Title Generator' },
                  { key: 'channel_audit', label: 'Channel Audit' },
                  { key: 'ai_shorts_clipping', label: 'AI Shorts Clipping' },
                  { key: 'ai_thumbnail_maker', label: 'AI Thumbnail Maker' },
                  { key: 'optimize', label: 'Optimize' },
                ].map((tool) => (
                  <div key={tool.key} className="border border-[#262626] rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-white mb-2">{tool.label}</p>
                    <div className="flex flex-wrap gap-3">
                      {['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'].map((role) => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            className="rounded border-[#333333] bg-[#0F0F0F] text-[#FF0000] focus:ring-[#FF0000]"
                            checked={aiToolsAccess[tool.key]?.includes(role) || false}
                            onChange={(e) => {
                              setAiToolsAccess((prev) => {
                                const current = prev[tool.key] || [];
                                if (e.target.checked) {
                                  return { ...prev, [tool.key]: [...current, role] };
                                }
                                return { ...prev, [tool.key]: current.filter((r) => r !== role) };
                              });
                            }}
                          />
                          <span className="text-[#CCCCCC] capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                disabled={aiToolsSaving}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  setAiToolsSaving(true);
                  try {
                    const res = await fetch('/api/admin/features/ai-tools', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ features: aiToolsAccess }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      if (data.features) setAiToolsAccess(data.features);
                      alert('AI tools access saved.');
                    } else alert(data.error || 'Failed to save');
                  } catch (_) {
                    alert('Failed to save');
                  } finally {
                    setAiToolsSaving(false);
                  }
                }}
                className="mt-4 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 font-medium"
              >
                {aiToolsSaving ? 'Saving...' : 'Save tools access'}
              </button>
            </div>
          </div>
        ) : viewMode === 'apiConfig' ? (
          <div id="api-config-main" className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-8 h-8 text-[#FF0000]" />
              <div>
                <h1 className="text-2xl font-bold">API Config</h1>
                <p className="text-sm text-[#AAAAAA]">API keys yahan set karein — DB me save honge aur .env se override karenge. Agar yahan set nahi kiye to .env (e.g. YOUTUBE_API_KEY, RESEND_API_KEY, GEMINI_API_KEY) use hoga.</p>
              </div>
            </div>
            {apiStatus.length > 0 && (
              <div className="mb-6 bg-[#181818] border border-[#212121] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">API Health &amp; Limits</p>
                </div>
                <div className="space-y-3 text-xs">
                  {apiStatus.map((api) => (
                    <div
                      key={api.id}
                      className="flex flex-col gap-1 rounded-lg border border-[#262626] bg-[#101010] px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">{api.name}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            api.status === 'ok'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : api.status === 'error'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-[#333]/40 text-[#AAA]'
                          }`}
                        >
                          {api.status === 'ok'
                            ? 'LIVE'
                            : api.status === 'error'
                            ? 'ERROR'
                            : 'NO KEY'}
                        </span>
                      </div>
                      <p className="text-[#BBBBBB]">
                        <span className="text-[#777]">Status:</span> {api.message}
                      </p>
                      <p className="text-[#888]">
                        <span className="text-[#666]">Limit:</span> {api.limitInfo}
                      </p>
                      {api.usedBy?.length ? (
                        <p className="text-[#777]">
                          <span className="text-[#555]">Used in:</span>{' '}
                          {api.usedBy.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  <p className="text-[11px] text-[#666]">
                    Note: &quot;Use hua kitna&quot; (exact quota consumption) providers ke dashboard se hi milta hai. Yahan hum live health check aur official limit info dikhate hain.
                  </p>
                </div>
              </div>
            )}
            {apiConfigLoading ? (
              <div className="flex items-center gap-2 text-[#AAAAAA] py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
              </div>
            ) : (
              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  setApiConfigSaving(true);
                  try {
                    const body: Record<string, string> = {};
                    Object.entries(apiConfigForm).forEach(([k, v]) => { body[k] = typeof v === 'string' ? v : ''; });
                    const res = await fetch('/api/admin/config', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(body),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('API config saved.');
                      setApiConfigForm({});
                      const r2 = await fetch('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } });
                      const d2 = await r2.json();
                      if (d2.status) setApiConfigStatus(d2.status);
                    } else alert(data.error || 'Failed to save');
                  } catch (_) {
                    alert('Failed to save');
                  } finally {
                    setApiConfigSaving(false);
                  }
                }}
              >
                {[
                  { key: 'youtubeDataApiKey', label: 'YouTube Data API v3', hint: 'Channel summary, competitors, videos — jo user puchenge Chinki turant bata payegi. Google Cloud Console se key.', statusKey: 'youtube' },
                  { key: 'resendApiKey', label: 'Resend API Key', hint: 'Reliable emails (OTP, receipts, broadcast).', statusKey: 'resend' },
                  { key: 'openaiApiKey', label: 'OpenAI API Key', hint: 'AI Studio + Whisper captions.', statusKey: 'openai' },
                  { key: 'assemblyaiApiKey', label: 'AssemblyAI API Key', hint: 'Auto captions (Shorts) – OpenAI alternative.', statusKey: 'assemblyai' },
                  { key: 'googleGeminiApiKey', label: 'Google Gemini API Key', hint: 'Chinki isi se baat karti hai (AI reply). OpenAI optional; Gemini set karein to Chinki turant jawab degi.', statusKey: 'gemini' },
                  { key: 'sentryDsn', label: 'Sentry DSN (client)', hint: 'Frontend error tracking.', statusKey: 'sentry' },
                  { key: 'sentryServerDsn', label: 'Sentry Server DSN', hint: 'Backend error tracking.', statusKey: 'sentry' },
                  { key: 'stripeSecretKey', label: 'Stripe Secret Key', hint: 'International payments.', statusKey: 'stripe' },
                  { key: 'stripeWebhookSecret', label: 'Stripe Webhook Secret', hint: 'Webhook signature verify.', statusKey: 'stripe' },
                  { key: 'stripePublishableKey', label: 'Stripe Publishable Key', hint: 'Frontend (NEXT_PUBLIC_ optional).', statusKey: 'stripe' },
                ].map(({ key, label, hint, statusKey }) => (
                  <div key={key} className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                    <label className="block text-sm font-medium text-white mb-1">{label}</label>
                    <p className="text-xs text-[#888] mb-2">{hint}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="password"
                        value={apiConfigForm[key] ?? ''}
                        onChange={(e) => setApiConfigForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={apiConfigStatus[statusKey] ? '•••• (set – enter new to change)' : 'Not set – enter key'}
                        className="flex-1 min-w-[200px] px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] focus:border-[#FF0000]"
                        autoComplete="off"
                      />
                      {apiConfigStatus[statusKey] && (
                        <button
                          type="button"
                          onClick={() => setApiConfigForm((f) => ({ ...f, [key]: '' }))}
                          className="text-xs text-[#FF0000] hover:underline"
                        >
                          Clear
                        </button>
                      )}
                      {apiConfigStatus[statusKey] && (
                        <span className="text-xs text-green-500 whitespace-nowrap">Set</span>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={apiConfigSaving}
                  className="w-full px-4 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 font-medium"
                >
                  {apiConfigSaving ? 'Saving...' : 'Save API Config'}
                </button>
              </form>
            )}
          </div>
        ) : viewMode === 'systemControl' ? (
          <div id="system-control-main" className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-[#FF0000]" />
                <div>
                  <h1 className="text-2xl font-bold">System Control</h1>
                  <p className="text-sm text-[#AAAAAA]">Enable/Disable features globally and manage role-based access.</p>
                </div>
              </div>
              <button
                disabled={systemsSaving || systemsLoading}
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  setSystemsSaving(true);
                  try {
                    const res = await fetch('/api/admin/features', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ features: systems }),
                    });
                    if (res.ok) alert('System configuration saved successfully.');
                    else {
                      const d = await res.json();
                      alert(d.error || 'Failed to save');
                    }
                  } catch (_) {
                    alert('Failed to save');
                  } finally {
                    setSystemsSaving(false);
                  }
                }}
                className="px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 font-medium shadow-lg shadow-red-600/20 transition-all"
              >
                {systemsSaving ? (
                  <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</div>
                ) : 'Save Configuration'}
              </button>
            </div>


            {systemsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF0000] mb-4" />
                <p className="text-[#888]">Loading systems...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {['sidebar', 'dashboard'].map((group) => (
                  <div key={group} className="space-y-4">
                    <h2 className="text-sm font-semibold text-[#FF0000] uppercase tracking-widest border-b border-[#212121] pb-2">
                      {group === 'sidebar' ? 'Sidebar Features' : 'Dashboard Widgets'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {systems.filter(s => s.group === group).map((sys) => (
                        <div key={sys.id} className="bg-[#181818] border border-[#212121] rounded-xl p-4 hover:border-[#333] transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-white">{sys.label}</h3>
                              <p className="text-xs text-[#666] mt-1">ID: {sys.id}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={sys.enabled}
                                onChange={(e) => {
                                  setSystems(prev => prev.map(p => p.id === sys.id ? { ...p, enabled: e.target.checked } : p));
                                }}
                              />
                              <div className="w-11 h-6 bg-[#212121] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF0000]"></div>
                            </label>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-medium text-[#888] uppercase tracking-wider">Allowed Roles</p>
                            <div className="flex flex-wrap gap-2">
                              {['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'].map((role) => {
                                const linkedPlans = plans.filter(p => p.role === role).map(p => p.label || p.planId);
                                return (
                                  <div key={role} className="flex flex-col gap-1">
                                    <button
                                      onClick={() => {
                                        setSystems(prev => prev.map(p => {
                                          if (p.id !== sys.id) return p;
                                          const roles = p.allowedRoles.includes(role)
                                            ? p.allowedRoles.filter(r => r !== role)
                                            : [...p.allowedRoles, role];
                                          return { ...p, allowedRoles: roles };
                                        }));
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 min-w-[64px] ${
                                        sys.allowedRoles.includes(role)
                                          ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/20'
                                          : 'bg-[#0F0F0F] text-[#555] border border-[#212121] hover:border-[#444]'
                                      }`}
                                    >
                                      <span>{role.toUpperCase()}</span>
                                    </button>
                                    {linkedPlans.length > 0 && (
                                      <p className="text-[8px] text-[#666] text-center truncate px-1" title={linkedPlans.join(', ')}>
                                        {linkedPlans.slice(0, 2).join(', ')}{linkedPlans.length > 2 ? '...' : ''}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : viewMode === 'tables' ? (
          <div id="tables-main" className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-[#FF0000]" />
                <div>
                  <h1 className="text-2xl font-bold">Database Tables</h1>
                  <p className="text-sm text-[#AAAAAA]">Sabhi tables grid view me. Partial search se data dhoondo.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={(e) => { setSelectedTable(e.target.value); setTablePage(1); setTableSearch(''); }}
                  className="px-3 py-2 bg-[#181818] border border-[#333333] rounded-lg text-sm focus:ring-2 focus:ring-[#FF0000]"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => fetchTableData()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#333333] hover:border-[#FF0000] text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${tableLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setTablePage(1); fetchTableData(); } }}
                placeholder="Partial search — type then press Enter to filter"
                className="flex-1 px-4 py-2 bg-[#181818] border border-[#333333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
              />
            </div>
            <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-x-auto">
              {tableLoading ? (
                <div className="p-8 text-center text-[#AAAAAA]">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : tableData.length === 0 ? (
                <div className="p-8 text-center text-[#AAAAAA]">No records found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-[#AAAAAA] border-b border-[#212121]">
                      {Object.keys(tableData[0]).map((key) => (
                        <th key={key} className="px-4 py-3 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={row._id as string || idx} className="border-b border-[#212121] hover:bg-[#202020]">
                        {Object.entries(row).map(([k, v]) => (
                          <td key={k} className="px-4 py-3 whitespace-nowrap max-w-xs truncate" title={String(v)}>
                            {v != null ? String(v) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {tableTotal > tableLimit && (
              <div className="mt-4 flex items-center justify-between text-sm text-[#AAAAAA]">
                <span>Total: {tableTotal} records</span>
                <div className="flex gap-2">
                  <button
                    disabled={tablePage <= 1}
                    onClick={() => setTablePage((p) => p - 1)}
                    className="px-3 py-1 rounded bg-[#333333] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>Page {tablePage}</span>
                  <button
                    disabled={tablePage * tableLimit >= tableTotal}
                    onClick={() => setTablePage((p) => p + 1)}
                    className="px-3 py-1 rounded bg-[#333333] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'planConfig' || viewMode.startsWith('plan-control-') ? (
          <div className="max-w-4xl mx-auto">
            <PlanConfigEditor propPlanId={viewMode.startsWith('plan-control-') ? viewMode.replace('plan-control-', '') : undefined} />
          </div>
        ) : viewMode === 'accessControl' ? (
          <div className="max-w-6xl mx-auto">
            <SystemAccessMatrix />
          </div>
        ) : viewMode === 'unifiedAccess' ? (
          <div className="max-w-full mx-auto">
            <UnifiedFeatureMatrix />
          </div>
        ) : viewMode === 'ytSeoSections' ? (
          <div className="max-w-6xl mx-auto">
            <YtSeoSectionControl />
          </div>
        ) : viewMode === 'discounts' ? (
          <PlanDiscountsManager />
        ) : viewMode === 'plans' ? (
          <PlanManager />
        ) : viewMode === 'userPlans' ? (
          <UserPlanManager />
        ) : viewMode === 'platformAnalytics' ? (
          <PlatformAnalytics />
        ) : (
          <div id="users-main" className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-[#FF0000]" />
                <div>
                  <h1 className="text-2xl font-bold">Users</h1>
                  <p className="text-sm text-[#AAAAAA]">Database me jo user hai woh yahan dikhega. Create User, Modify User, Role Set aur Delete.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowCreateModal(true); setCreateMessage(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#333333] hover:border-[#FF0000] text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleSendPlanReceipts}
                  disabled={sendingReceipts}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#333333] hover:border-[#10b981] text-sm disabled:opacity-50"
                  title="Send payment receipt email to all Pro/Enterprise users"
                >
                  {sendingReceipts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send plan receipts
                </button>
                <button
                  onClick={() => setShowNotifyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#181818] border border-[#333333] hover:border-[#FF0000] text-sm"
                  title="Send notification email to all users"
                >
                  <Bell className="w-4 h-4" />
                  Notify all users
                </button>
              </div>
            </div>

            {/* Notify all users modal */}
            {showNotifyModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !notifySending && setShowNotifyModal(false)}>
                <div className="bg-[#181818] border border-[#212121] rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5" /> Send notification to all users</h2>
                    <button onClick={() => !notifySending && setShowNotifyModal(false)} className="p-1 rounded hover:bg-[#333333]"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Subject</label>
                      <input
                        type="text"
                        value={notifySubject}
                        onChange={(e) => setNotifySubject(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]"
                        placeholder="e.g. New feature announcement"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Message *</label>
                      <textarea
                        value={notifyMessage}
                        onChange={(e) => setNotifyMessage(e.target.value)}
                        rows={5}
                        required
                        className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000] resize-y"
                        placeholder="Type your notification message. It will be sent by email to all users."
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={notifySending || !notifyMessage.trim()} className="flex-1 py-2 rounded-lg bg-[#FF0000] text-white font-medium hover:bg-[#CC0000] disabled:opacity-50 flex items-center justify-center gap-2">
                        {notifySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                        Send to all
                      </button>
                      <button type="button" onClick={() => setShowNotifyModal(false)} disabled={notifySending} className="px-4 py-2 rounded-lg bg-[#333333] hover:bg-[#444444]">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  placeholder="Search by email, name or Unique ID"
                  className="w-full px-4 py-2 bg-[#181818] border border-[#333333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-[#AAAAAA] border-b border-[#212121]">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Unique ID</th>
                    <th className="px-4 py-3">Role Set</th>
                    <th className="px-4 py-3">Subscription</th>
                    <th className="px-4 py-3">PIN</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[#212121] hover:bg-[#202020] cursor-pointer"
                      onClick={() => openModifyModal(u)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.email}</div>
                        <div className="text-[#888] text-xs">{u.name || '-'}</div>
                      </td>
                      <td className="px-4 py-3">{u.uniqueId || '-'}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={u.role}
                          onChange={(e) => handleSetRole(u.id, e.target.value)}
                          disabled={roleChangingId === u.id}
                          className="bg-[#0F0F0F] border border-[#333333] rounded px-2 py-1 text-xs capitalize"
                        >
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="super-admin">Super Admin</option>
                          <option value="custom">Custom</option>
                        </select>
                        {roleChangingId === u.id && <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />}
                      </td>
                      <td className="px-4 py-3 capitalize">{u.role === 'super-admin' ? 'Owner' : u.subscription}</td>
                      <td className="px-4 py-3">{u.hasPin ? 'Set' : '—'}</td>
                      <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModifyModal(u); }}
                            className="p-1.5 rounded bg-[#333333] hover:bg-[#444444]"
                            title="Modify User"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResetPassword(u.id); }}
                            className="p-1.5 rounded bg-[#333333] hover:bg-[#444444]"
                            title="Reset password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetPin(u.id); }}
                            className="p-1.5 rounded bg-[#333333] hover:bg-[#444444]"
                            title="Set PIN"
                          >
                            <Hash className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClearPin(u.id); }}
                            className="p-1.5 rounded bg-[#333333] hover:bg-[#444444] px-2"
                            title="Clear PIN"
                          >
                            ×
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                            disabled={deletingId === u.id}
                            className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400"
                            title="Delete"
                          >
                            {deletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[#AAAAAA]">
                  No users found.
                </div>
              )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                <div className="bg-[#181818] border border-[#212121] rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2"><UserPlus className="w-5 h-5" /> Create User</h2>
                    <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-[#333333]"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    {createMessage && (
                      <div className={`p-3 rounded-lg text-sm ${createMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-200' : 'bg-red-500/10 border border-red-500/50 text-red-200'}`}>
                        {createMessage.text}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Email *</label>
                      <input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]" placeholder="user@example.com" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Password * (min 6)</label>
                      <input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]" placeholder="••••••••" minLength={6} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Name</label>
                      <input type="text" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]" placeholder="Display name" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Role</label>
                      <select value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]">
                        <option value="user">User</option><option value="manager">Manager</option><option value="admin">Admin</option><option value="enterprise">Enterprise Plan</option><option value="super-admin">Super Admin</option><option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Login PIN (optional)</label>
                      <input type="text" inputMode="numeric" maxLength={6} value={createForm.loginPin} onChange={(e) => setCreateForm((f) => ({ ...f, loginPin: e.target.value.replace(/\D/g, '') }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]" placeholder="e.g. 1234" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={createSubmitting} className="flex-1 py-2 rounded-lg bg-[#FF0000] text-white font-medium hover:bg-[#CC0000] disabled:opacity-50 flex items-center justify-center gap-2">
                        {createSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                      </button>
                      <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg bg-[#333333] hover:bg-[#444444]">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modify User Modal */}
            {modifyUser && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setModifyUser(null)}>
                <div className="bg-[#181818] border border-[#212121] rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2"><UserCog className="w-5 h-5" /> Modify User</h2>
                    <button onClick={() => setModifyUser(null)} className="p-1 rounded hover:bg-[#333333]"><X className="w-5 h-5" /></button>
                  </div>
                  <p className="text-xs text-[#888] mb-3">{modifyUser.email} · ID: {modifyUser.uniqueId || '-'}</p>
                  <form onSubmit={handleSaveModify} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Name</label>
                      <input type="text" value={modifyForm.name} onChange={(e) => setModifyForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]" placeholder="Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Role</label>
                      <select value={modifyForm.role} onChange={(e) => setModifyForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]">
                        <option value="user">User</option><option value="manager">Manager</option><option value="admin">Admin</option><option value="super-admin">Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#AAAAAA] mb-1">Set / change PIN (leave blank to keep)</label>
                      <input type="text" inputMode="numeric" maxLength={6} value={modifyForm.newPin} onChange={(e) => setModifyForm((f) => ({ ...f, newPin: e.target.value.replace(/\D/g, '') }))} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#FF0000]" placeholder="4-6 digits" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" disabled={modifySubmitting} className="flex-1 py-2 rounded-lg bg-[#FF0000] text-white font-medium hover:bg-[#CC0000] disabled:opacity-50 flex items-center justify-center gap-2">
                        {modifySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </button>
                      <button type="button" onClick={() => setModifyUser(null)} className="px-4 py-2 rounded-lg bg-[#333333] hover:bg-[#444444]">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

