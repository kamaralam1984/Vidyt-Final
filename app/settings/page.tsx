'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DeleteAccountSection from '@/components/DeleteAccountSection';
import axios from 'axios';
import { Settings, Key, Webhook, Building2, User, Loader2, Download, AlertCircle } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

export default function SettingsPage() {
  const [profile, setProfile] = useState<{
    accountManagerEmail?: string;
    whiteLabelCompanyName?: string;
    whiteLabelLogoUrl?: string;
    webhookUrl?: string;
  } | null>(null);
  const [apiKeys, setApiKeys] = useState<{ _id: string; name: string; keyPrefix: string; createdAt: string }[]>([]);
  const [webhook, setWebhook] = useState<{ url: string; events: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whiteLabelName, setWhiteLabelName] = useState('');
  const [whiteLabelLogo, setWhiteLabelLogo] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const [exportingData, setExportingData] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, keysRes, webhookRes] = await Promise.all([
          axios.get('/api/user/profile', { headers: getAuthHeaders() }),
          axios.get('/api/settings/api-keys', { headers: getAuthHeaders() }).catch(() => ({ data: { keys: [] } })),
          axios.get('/api/settings/webhook', { headers: getAuthHeaders() }).catch(() => ({ data: { webhook: null } })),
        ]);
        const p = profileRes.data?.profile;
        setProfile(p || null);
        setWhiteLabelName(p?.whiteLabelCompanyName || '');
        setWhiteLabelLogo(p?.whiteLabelLogoUrl || '');
        setApiKeys(keysRes.data?.keys || []);
        const wh = webhookRes.data?.webhook;
        setWebhook(wh || null);
        setWebhookUrl(wh?.url || '');
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const saveWhiteLabel = async () => {
    setSaving(true);
    try {
      await axios.put('/api/user/profile', {
        whiteLabelCompanyName: whiteLabelName || undefined,
        whiteLabelLogoUrl: whiteLabelLogo || undefined,
      }, { headers: getAuthHeaders() });
      setProfile((prev) => ({ ...prev, whiteLabelCompanyName: whiteLabelName, whiteLabelLogoUrl: whiteLabelLogo }));
    } catch (_) {}
    setSaving(false);
  };

  const saveWebhook = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings/webhook', { url: webhookUrl }, { headers: getAuthHeaders() });
    } catch (_) {}
    setSaving(false);
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setSaving(true);
    setCreatedKey('');
    try {
      const res = await axios.post('/api/settings/api-keys', { name: newKeyName.trim() }, { headers: getAuthHeaders() });
      setCreatedKey(res.data.key || '');
      setNewKeyName('');
      const keysRes = await axios.get('/api/settings/api-keys', { headers: getAuthHeaders() });
      setApiKeys(keysRes.data?.keys || []);
    } catch (_) {}
    setSaving(false);
  };

  const handleExportData = async () => {
    setExportingData(true);
    setExportError('');
    try {
      const response = await axios.get('/api/user/export-data', {
        headers: getAuthHeaders(),
      });
      // Create blob and download
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vidyt-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      setExportError(error.response?.data?.error || 'Failed to export data. Please try again.');
      console.error('Data export error:', error);
    } finally {
      setExportingData(false);
    }
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-8 h-8 text-[#FF0000]" />
            Settings
          </h1>

          {profile?.accountManagerEmail && (
            <section className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><User className="w-5 h-5" /> Dedicated account manager</h2>
              <p className="text-[#AAAAAA]">Contact: <a href={`mailto:${profile.accountManagerEmail}`} className="text-[#FF0000] hover:underline">{profile.accountManagerEmail}</a></p>
            </section>
          )}

          <section className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> White-label reports</h2>
            <input value={whiteLabelName} onChange={(e) => setWhiteLabelName(e.target.value)} placeholder="Company name" className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white mb-3" />
            <input value={whiteLabelLogo} onChange={(e) => setWhiteLabelLogo(e.target.value)} placeholder="Logo URL" className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white mb-3" />
            <button onClick={saveWhiteLabel} disabled={saving} className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">Save</button>
          </section>

          <section className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Key className="w-5 h-5" /> API access</h2>
            <p className="text-[#AAAAAA] text-sm mb-3">Use your API key with header <code className="bg-[#333333] px-1 rounded">X-API-Key</code>. Example: <code className="bg-[#333333] px-1 rounded">GET /api/public/v1/usage</code></p>
            <div className="flex gap-2 mb-4">
              <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name" className="flex-1 px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" />
              <button onClick={createApiKey} disabled={saving} className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">Create key</button>
            </div>
            {createdKey && <p className="text-green-400 text-sm mb-2">Save this key (shown once): <code className="bg-[#333333] px-1 break-all">{createdKey}</code></p>}
            <ul className="space-y-2">
              {apiKeys.map((k) => (
                <li key={k._id} className="flex justify-between items-center text-[#AAAAAA] text-sm"><span>{k.name} — {k.keyPrefix}</span></li>
              ))}
            </ul>
          </section>

          <section className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Webhook className="w-5 h-5" /> Custom integrations (webhook)</h2>
            <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white mb-3" />
            <button onClick={saveWebhook} disabled={saving} className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">Save webhook</button>
            <p className="text-[#666] text-xs mt-2">We POST event &quot;analysis_complete&quot; when a video analysis finishes.</p>
          </section>

          <section className="bg-[#181818] border border-[#212121] rounded-xl p-6 sm:p-8 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Download My Data (GDPR)</h2>
                <p className="text-sm text-[#AAAAAA]">
                  Export a complete copy of your account data including videos, analytics, and settings in JSON format.
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                <strong>📦 Your export includes:</strong>
              </p>
              <ul className="text-blue-300 text-sm mt-2 space-y-1">
                <li>✓ Account profile & settings</li>
                <li>✓ All video analysis results</li>
                <li>✓ Viral predictions & scores</li>
                <li>✓ Engagement metrics</li>
                <li>✓ Connected channels</li>
              </ul>
            </div>

            {exportError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {exportError}
              </div>
            )}

            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2 transition"
            >
              {exportingData ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download My Data
                </>
              )}
            </button>
          </section>

          <DeleteAccountSection />
        </div>
      </div>
    </DashboardLayout>
  );
}