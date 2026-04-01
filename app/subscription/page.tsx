'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Download,
  Loader2,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { formatAmount } from '@/utils/currency';

interface Subscription {
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  videosAnalyzed: number;
  videosLimit: number;
  videosLimitLabel?: string;
  period?: 'day' | 'month';
  storageUsed: number;
  storageLimit: number | string | null;
  analysesThisMonth: number;
}

interface Invoice {
  id: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  currency?: string;
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadInvoicePdf = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const planName = getPlanName(invoice.plan);
      const dateStr = new Date(invoice.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc.setFontSize(22);
      doc.setTextColor(255, 0, 0);
      doc.text('Vid YT', 20, 25);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Payment Receipt', 20, 35);

      const currency = (invoice.currency || 'INR').toUpperCase();
      doc.setFontSize(10);
      doc.text(`Invoice: ${invoice.id}`, 20, 48);
      doc.text(`Plan: ${planName}`, 20, 56);
      doc.text(`Amount: ${formatAmount(invoice.amount, currency)}`, 20, 64);
      doc.text(`Date: ${dateStr}`, 20, 72);
      doc.setTextColor(0, 128, 0);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 80);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 88, 190, 88);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 95);
      doc.text('© Vid YT. All rights reserved.', 20, 102);

      const safeDate = new Date(invoice.date).toISOString().slice(0, 10);
      doc.save(`Vid-YT-Receipt-${planName}-${safeDate}.pdf`);
    } catch (e) {
      console.error('PDF download failed:', e);
      alert('Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to view subscription');
        window.location.href = '/login';
        return;
      }

      const [subRes, usageRes, invoicesRes] = await Promise.all([
        axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/subscriptions/usage', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: null })),
        axios.get('/api/subscriptions/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { invoices: [] } })),
      ]);

      const u = subRes.data.user;
      const planId = (u?.subscriptionPlan?.planId || u?.subscription || 'free').toLowerCase();
      const plan = ['pro', 'enterprise', 'owner'].includes(planId) ? planId : 'free';
      const subPlan = u?.subscriptionPlan;
      setSubscription({
        plan,
        status: plan === 'owner' ? 'active' : ((subPlan?.status as Subscription['status']) || 'active'),
        currentPeriodStart: subPlan?.startDate || new Date().toISOString(),
        currentPeriodEnd: subPlan?.endDate || u?.subscriptionExpiresAt || new Date().toISOString(),
        cancelAtPeriodEnd: false,
      });

      const usageData = usageRes.data || {
        videosAnalyzed: 0,
        videosLimit: '5',
        storageUsed: 0,
        storageLimit: '100 MB',
        analysesThisMonth: 0,
      };

      if (plan === 'owner') {
        usageData.videosLimitLabel = 'Unlimited';
        usageData.videosLimit = Infinity;
        usageData.storageLimit = 'Unlimited';
      }

      setUsage(usageData);

      setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }

    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/subscriptions/cancel',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Subscription cancelled. You will retain access until the end of your billing period.');
      fetchSubscriptionData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/subscriptions/resume',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Subscription resumed successfully!');
      fetchSubscriptionData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to resume subscription');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return '#FF0000';
      case 'enterprise':
        return '#FFD700';
      case 'owner':
        return '#8B5CF6';
      default:
        return '#AAAAAA';
    }
  };

  const getPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Crown className="w-10 h-10 text-[#FF0000]" />
              Subscription Management
            </h1>
            <p className="text-[#AAAAAA]">Manage your plan, usage, and billing</p>
          </div>

          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#181818] border border-[#212121] rounded-xl p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${getPlanColor(subscription?.plan || 'free')}20` }}
                  >
                    <Crown
                      className="w-6 h-6"
                      style={{ color: getPlanColor(subscription?.plan || 'free') }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {getPlanName(subscription?.plan || 'free')} Plan
                    </h2>
                    <p className="text-[#AAAAAA] text-sm">
                      Status: <span className={`font-semibold ${
                        subscription?.status === 'active' ? 'text-[#10b981]' :
                        subscription?.status === 'trial' ? 'text-[#f59e0b]' :
                        'text-[#ef4444]'
                      }`}>
                        {subscription?.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <motion.a
                href="/pricing"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors font-semibold"
              >
                {subscription?.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </motion.a>
            </div>

            {subscription?.status === 'active' && subscription?.currentPeriodEnd && (
              <div className="border-t border-[#212121] pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[#AAAAAA] text-sm mb-1">Current Period</p>
                    <p className="text-white font-semibold">
                      {subscription.plan === 'owner' ? (
                        'Lifetime Access'
                      ) : (
                        <>{new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#AAAAAA] text-sm mb-1">Next Billing Date</p>
                    <p className="text-white font-semibold">
                      {subscription.plan === 'owner' ? 'Never' : new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-[#f59e0b]/20 border border-[#f59e0b] rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
                      <p className="text-[#f59e0b]">
                        Your subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={handleResumeSubscription}
                      className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm font-semibold"
                    >
                      Resume Subscription
                    </button>
                  </motion.div>
                )}

                {!subscription.cancelAtPeriodEnd && subscription.plan !== 'free' && subscription.plan !== 'owner' && (
                  <div className="mt-6">
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="px-4 py-2 bg-[#212121] text-[#AAAAAA] rounded-lg hover:bg-[#333333] transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Usage Statistics */}
          {usage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#FF0000]" />
                    Video Analyses
                  </h3>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#AAAAAA] text-sm">
                      {usage.period === 'day' ? 'Today' : 'This month'}
                    </span>
                    <span className="text-white font-semibold">
                      {usage.analysesThisMonth} / {usage.videosLimitLabel ?? usage.videosLimit}
                    </span>
                  </div>
                  <div className="w-full bg-[#212121] rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: usage.videosLimit === -1 || usage.videosLimit === Infinity
                          ? '100%'
                          : `${Math.min(100, (usage.analysesThisMonth / Number(usage.videosLimit)) * 100)}%`,
                      }}
                      className="bg-[#FF0000] h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#FF0000]" />
                    Storage
                  </h3>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#AAAAAA] text-sm">Used</span>
                    <span className="text-white font-semibold">
                      {usage.storageUsed} MB {usage.storageLimit != null ? `/ ${usage.storageLimit}` : '(—)'}
                    </span>
                  </div>
                  <div className="w-full bg-[#212121] rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: usage.storageLimit != null && typeof usage.storageLimit === 'number'
                          ? `${Math.min(100, (usage.storageUsed / usage.storageLimit) * 100)}%`
                          : '0%',
                      }}
                      className="bg-[#10b981] h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment History */}
          {invoices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#181818] border border-[#212121] rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#FF0000]" />
                Payment History
              </h2>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-[#212121] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        invoice.status === 'paid' ? 'bg-[#10b981]/20' :
                        invoice.status === 'pending' ? 'bg-[#f59e0b]/20' :
                        'bg-[#ef4444]/20'
                      }`}>
                        {invoice.status === 'paid' ? (
                          <Check className="w-5 h-5 text-[#10b981]" />
                        ) : invoice.status === 'pending' ? (
                          <Loader2 className="w-5 h-5 text-[#f59e0b] animate-spin" />
                        ) : (
                          <X className="w-5 h-5 text-[#ef4444]" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {getPlanName(invoice.plan)} Plan - {formatAmount(invoice.amount, invoice.currency || 'INR')}
                        </p>
                        <p className="text-[#AAAAAA] text-sm">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === 'paid' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        invoice.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                        'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                      {invoice.status === 'paid' && (
                        <button
                          onClick={() => handleDownloadInvoicePdf(invoice)}
                          disabled={downloadingId === invoice.id}
                          className="p-2 hover:bg-[#333333] rounded-lg transition-colors disabled:opacity-50"
                          title="Download receipt as PDF"
                        >
                          {downloadingId === invoice.id ? (
                            <Loader2 className="w-4 h-4 text-[#AAAAAA] animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-[#AAAAAA]" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
