'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, FileDown, Trash2, HelpCircle, Check, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function DataRequestsPage() {
  const [activeTab, setActiveTab] = useState<'export' | 'delete' | 'faq'>('export');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState('export');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleExportData = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // If user is logged in, use the dashboard export endpoint
      const token = localStorage.getItem('token');
      if (token) {
        // Trigger download via API
        const response = await axios.get('/api/user/export-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Data export is returned as JSON
        const dataStr = JSON.stringify(response.data);
        const dataURI = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `vidyt-data-export-${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataURI);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        setSubmitted(true);
        setMessage('Your data export has been downloaded successfully.');
      } else {
        // Create support ticket for manual data export
        const res = await axios.post('/api/support/send-email', {
          to: email,
          subject: 'Data Export Request - Vid YT',
          type: 'data-export',
          message: 'Please send me a copy of all my data in JSON or CSV format.',
        });
        if (res.data.success) {
          setSubmitted(true);
          setMessage('Your request has been submitted. You will receive your data export at ' + email + ' within 24 hours.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/support/send-email', {
        to: email,
        subject: 'Account Deletion Request - Vid YT',
        type: 'account-deletion',
        message: 'I would like to request permanent deletion of my account and all associated data.',
      });
      if (res.data.success) {
        setSubmitted(true);
        setMessage('Your deletion request has been submitted. We will send you a confirmation link at ' + email + '. Please follow the link within 24 hours to complete the deletion process.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestType === 'export') {
      handleExportData();
    } else {
      handleDeleteRequest();
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white px-4 py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Data Rights</h1>
          <p className="text-[#AAAAAA] text-lg">
            Manage your data, export information, or request account deletion
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['export', 'delete', 'faq'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                setSubmitted(false);
                setError('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-[#FF0000] text-white'
                  : 'bg-[#181818] text-[#AAAAAA] border border-[#333333] hover:border-[#FF0000]'
              }`}
            >
              {tab === 'export' && <FileDown className="w-4 h-4 inline mr-2" />}
              {tab === 'delete' && <Trash2 className="w-4 h-4 inline mr-2" />}
              {tab === 'faq' && <HelpCircle className="w-4 h-4 inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Data
            </motion.button>
          ))}
        </div>

        {/* Export Data Tab */}
        {activeTab === 'export' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#181818] border border-[#333333] rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <FileDown className="w-6 h-6 text-[#FF0000]" />
              Download My Data
            </h2>
            <p className="text-[#AAAAAA] mb-8">
              As per GDPR and data privacy regulations, you can download a complete copy of your data including your profile, videos, analytics, and more.
            </p>

            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center"
              >
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Request Submitted</h3>
                <p className="text-green-300 mb-4">{message}</p>
                <p className="text-[#888] text-sm">
                  If you don&apos;t receive your data within 24 hours, please contact us at{' '}
                  <a href="mailto:support@vidyt.ai" className="text-[#FF0000] hover:underline">
                    support@vidyt.ai
                  </a>
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] outline-none"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>📦 Your data export will include:</strong>
                  </p>
                  <ul className="text-blue-300 text-sm mt-3 space-y-1">
                    <li>✓ Account profile and settings</li>
                    <li>✓ All video analysis results</li>
                    <li>✓ Viral predictions and scores</li>
                    <li>✓ Engagement metrics</li>
                    <li>✓ Connected channels</li>
                  </ul>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-[#FF0000] text-white rounded-lg font-semibold hover:bg-[#CC0000] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-5 h-5" />
                      Download My Data
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        )}

        {/* Delete Account Tab */}
        {activeTab === 'delete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#181818] border border-[#333333] rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-red-500" />
              Delete My Account
            </h2>
            <p className="text-[#AAAAAA] mb-8">
              Request permanent deletion of your account and all associated data. This action is irreversible.
            </p>

            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center"
              >
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Deletion Request Submitted</h3>
                <p className="text-green-300 mb-4">{message}</p>
                <p className="text-[#888] text-sm">
                  Check your email for a confirmation link. You must click the link within 24 hours to complete the deletion.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <p className="text-red-300 font-semibold mb-3">⚠️ Important Warning</p>
                  <ul className="text-red-300 text-sm space-y-1">
                    <li>• All your videos, analytics, and settings will be permanently deleted</li>
                    <li>• Connected YouTube channels will be disconnected</li>
                    <li>• This action cannot be undone</li>
                    <li>• You can re-register after 30 days</li>
                  </ul>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Request Account Deletion
                      </>
                    )}
                  </motion.button>

                  <p className="text-[#888] text-sm">
                    Or use the instant method: Go to <strong>Settings → Delete My Account</strong>
                  </p>
                </form>
              </>
            )}
          </motion.div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {[
              {
                q: 'How long does it take to get my data export?',
                a: 'If you are logged in, the export downloads instantly. If you submit via email, we will send it within 24 hours.',
              },
              {
                q: 'What format will my exported data be in?',
                a: 'We provide JSON (full data) and CSV (videos only) formats. JSON includes your complete profile, videos, analytics, and settings.',
              },
              {
                q: 'Can I delete my account instantly?',
                a: 'Yes! Go to Settings → Delete My Account and follow the steps. Your account is anonymized immediately after verification.',
              },
              {
                q: 'Is my data permanently deleted?',
                a: 'Yes. Upon deletion, your personal information is anonymized and removed from our databases. For legal compliance, we may retain anonymized logs for 12 months.',
              },
              {
                q: 'What about my YouTube connection?',
                a: 'When you delete your account, all YouTube OAuth tokens are revoked and disconnected immediately. YouTube will no longer have access from our platform.',
              },
              {
                q: 'Can I recover my data after deletion?',
                a: 'No, deletion is permanent and irreversible. However, you can re-register with the same email after 30 days.',
              },
              {
                q: 'How is my data protected?',
                a: 'We use TLS 1.3 encryption, secure password hashing, and OAuth 2.0 for integrations. We comply with GDPR and industry standards.',
              },
              {
                q: 'Do you sell my data?',
                a: 'No. We never sell, rent, or share your personal data with third parties. We only use it to provide our service.',
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#181818] border border-[#333333] rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-[#AAAAAA]">{faq.a}</p>
              </motion.div>
            ))}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
              <p className="text-blue-300 mb-4">
                Still have questions?
              </p>
              <a
                href="mailto:support@viralboostai.com"
                className="inline-block px-6 py-3 bg-[#FF0000] text-white rounded-lg font-semibold hover:bg-[#CC0000] transition"
              >
                <Send className="w-4 h-4 inline mr-2" />
                Contact Support
              </a>
            </div>
          </motion.div>
        )}

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-[#333333] text-center">
          <p className="text-[#888] mb-4">
            For more information, see our{' '}
            <Link href="/privacy-policy" className="text-[#FF0000] hover:underline">
              Privacy Policy
            </Link>
          </p>
          <p className="text-[#666] text-sm">
            © {new Date().getFullYear()} Vid YT. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
