'use client';

import React, { useState, useEffect } from 'react';
import { Youtube, Save, Loader2, Check, X, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';

const ROLES = [
  { id: 'user', label: 'User', color: '#6B7280' },
  { id: 'manager', label: 'Manager', color: '#3B82F6' },
  { id: 'admin', label: 'Admin', color: '#F59E0B' },
  { id: 'enterprise', label: 'Enterprise Plan', color: '#10B981' }, // Added Enterprise Plan
  { id: 'super-admin', label: 'Super Admin', color: '#EF4444' },
  { id: 'custom', label: 'Custom', color: '#7C3AED' },
];

const SECTION_ICONS: Record<string, string> = {
  yt_seo_video_setup:       '🎬',
  yt_seo_seo_score:         '📊',
  yt_seo_ctr_predictor:     '🎯',
  yt_seo_best_posting_time: '⏰',
  yt_seo_title_score:       '✍️',
  yt_seo_keywords:          '#️⃣',
  yt_seo_thumbnail:         '🖼️',
  yt_seo_descriptions:      '📝',
  yt_seo_hashtags:          '🔖',
  yt_seo_competitors:       '🏆',
  yt_seo_channel_summary:   '📡',
  yt_seo_viral_probability: '🔥',
  yt_seo_chinki:            '🤖',
  yt_seo_video_analyze:     '🎥',
  // Channel Intelligence sections
  ci_channel_input:         '🔍',
  ci_channel_overview:      '📋',
  ci_ranking_panel:         '🏅',
  ci_revenue_calculator:    '💰',
  ci_ai_insights:           '🧠',
  ci_growth_prediction:     '📈',
  ci_competitor_comparison: '⚔️',
};

interface SectionFeature {
  id: string;
  label: string;
  enabled: boolean;
  allowedRoles: string[];
}

export default function YtSeoSectionControl() {
  const [sections, setSections] = useState<SectionFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/features', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.features) {
        const ytSections = data.features.filter((f: any) => f.group === 'yt_seo_sections' || f.group === 'channel_intelligence');
        setSections(ytSections);
      }
    } catch {
      showToast('error', 'Failed to load section settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSections(); }, []);

  const toggleEnabled = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    setHasChanges(true);
  };

  const toggleRole = (sectionId: string, roleId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const roles = s.allowedRoles.includes(roleId)
        ? s.allowedRoles.filter(r => r !== roleId)
        : [...s.allowedRoles, roleId];
      return { ...s, allowedRoles: roles };
    }));
    setHasChanges(true);
  };

  const enableAll = () => {
    setSections(prev => prev.map(s => ({
      ...s,
      enabled: true,
      allowedRoles: ['user', 'manager', 'admin', 'enterprise', 'super-admin', 'custom'],
    })));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ features: sections }),
      });
      if (res.ok) {
        showToast('success', '✅ Section settings saved successfully');
        setHasChanges(false);
        fetchSections();
      } else {
        const d = await res.json();
        showToast('error', d.error || 'Failed to save');
      }
    } catch {
      showToast('error', 'Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        <span className="ml-3 text-[#888]">Loading section settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border
          ${toast.type === 'success' ? 'bg-[#0D2A1A] border-green-700 text-green-400' : 'bg-[#2A0D0D] border-red-700 text-red-400'}`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl">
            <Youtube className="w-7 h-7 text-[#FF0000]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">YouTube SEO & Channel Intelligence — Section Controls</h1>
            <p className="text-xs text-[#666] mt-0.5">Control role-based visibility for each section across YouTube SEO Analyzer and Channel Intelligence pages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={enableAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#181818] border border-[#2A2A2A] text-[#888] hover:text-white hover:border-[#444] transition-colors"
          >
            <Eye className="w-4 h-4" /> Enable All
          </button>
          <button
            onClick={fetchSections}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#181818] border border-[#2A2A2A] text-[#888] hover:text-white hover:border-[#444] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg
              ${hasChanges ? 'bg-[#FF0000] text-white hover:bg-[#CC0000] shadow-red-600/20' : 'bg-[#212121] text-[#555] cursor-not-allowed'}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-4 flex gap-3 text-xs">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-100 font-semibold mb-1">How does it work?</p>
          <p className="text-[#888] leading-relaxed">
            Each row is a section of the YouTube SEO Analyzer page. <strong>Global Toggle</strong> disables the section entirely (hidden for all).
            <strong>Role toggles</strong> control which roles can see each section.
            Super Admin always has full access.
          </p>
        </div>
      </div>

      {/* Sections Table */}
      <div className="bg-[#141414] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0F0F0F] border-b border-[#212121]">
                <th className="p-4 text-left text-[10px] font-bold text-[#555] uppercase tracking-widest min-w-[220px]">Section</th>
                <th className="p-4 text-center text-[10px] font-bold text-[#555] uppercase tracking-widest">Global ON/OFF</th>
                {ROLES.map(role => (
                  <th key={role.id} className="p-3 text-center text-[9px] font-bold uppercase tracking-widest" style={{ color: role.color }}>
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {(() => {
                const groups = [
                  { key: 'yt_seo_', label: 'YouTube SEO Analyzer', items: sections.filter(s => s.id.startsWith('yt_seo_')) },
                  { key: 'ci_', label: 'Channel Intelligence', items: sections.filter(s => s.id.startsWith('ci_')) },
                ];
                return groups.filter(g => g.items.length > 0).map(group => (
                  <React.Fragment key={group.key}>
                    <tr className="bg-[#0A0A0A]">
                      <td colSpan={2 + ROLES.length} className="px-4 py-2.5">
                        <p className="text-[10px] font-bold text-[#FF0000] uppercase tracking-widest">{group.label}</p>
                      </td>
                    </tr>
                    {group.items.map(section => (
                      <tr key={section.id} className="hover:bg-[#1A1A1A] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{SECTION_ICONS[section.id] || '⚙️'}</span>
                            <div>
                              <p className={`text-sm font-semibold transition-colors ${section.enabled ? 'text-white group-hover:text-[#FF0000]' : 'text-[#555] line-through'}`}>
                                {section.label.replace('YT SEO: ', '').replace('Channel Intelligence: ', '')}
                              </p>
                              <p className="text-[9px] text-[#444] font-mono">{section.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleEnabled(section.id)}
                            title={section.enabled ? 'Click to globally disable' : 'Click to globally enable'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none shadow-inner
                              ${section.enabled ? 'bg-[#FF0000]' : 'bg-[#2A2A2A]'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all
                              ${section.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <p className={`text-[9px] mt-1 font-bold ${section.enabled ? 'text-green-500' : 'text-[#555]'}`}>
                            {section.enabled ? 'ON' : 'OFF'}
                          </p>
                        </td>
                        {ROLES.map(role => {
                          const has = section.allowedRoles.includes(role.id);
                          return (
                            <td key={role.id} className="p-3 text-center">
                              <button
                                onClick={() => toggleRole(section.id, role.id)}
                                disabled={!section.enabled}
                                title={`${has ? 'Remove' : 'Grant'} ${role.label} access`}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all border
                                  ${!section.enabled
                                    ? 'opacity-20 cursor-not-allowed bg-[#0F0F0F] border-transparent'
                                    : has
                                    ? 'border-transparent shadow-sm shadow-black/30'
                                    : 'bg-[#0F0F0F] border-[#212121] hover:border-[#444] text-[#333]'
                                  }`}
                                style={has && section.enabled ? { backgroundColor: `${role.color}25`, borderColor: `${role.color}50`, color: role.color } : {}}
                              >
                                {has ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ));
              })()}

              {sections.length === 0 && (
                <tr>
                  <td colSpan={2 + ROLES.length} className="p-12 text-center text-[#555]">
                    No sections found. Features might not be initialized yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Sections', val: sections.length, color: '#888' },
          { label: 'Globally Enabled', val: sections.filter(s => s.enabled).length, color: '#22c55e' },
          { label: 'Globally Disabled', val: sections.filter(s => !s.enabled).length, color: '#EF4444' },
          { label: 'Pending Changes', val: hasChanges ? '●' : '—', color: hasChanges ? '#F59E0B' : '#555' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#141414] border border-[#212121] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.val}</p>
            <p className="text-[10px] text-[#555] uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
