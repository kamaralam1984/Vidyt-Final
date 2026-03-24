'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Save, Loader2, Check, X, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

const ROLES = [
  { id: 'user', label: 'User' },
  { id: 'manager', label: 'Manager' },
  { id: 'admin', label: 'Admin' },
  { id: 'super-admin', label: 'Super Admin' },
];

export default function SystemAccessMatrix() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/features', { headers: getAuthHeaders() });
      if (res.data.features) {
        setFeatures(res.data.features);
      }
    } catch (err) {
      console.error('Error fetching features:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (featureId: string, roleId: string) => {
    setFeatures(prev => 
      prev.map(f => {
        if (f.id !== featureId) return f;
        const roles = f.allowedRoles.includes(roleId)
          ? f.allowedRoles.filter((r: string) => r !== roleId)
          : [...f.allowedRoles, roleId];
        return { ...f, allowedRoles: roles };
      })
    );
    setHasChanges(true);
  };

  const handleToggleEnabled = (featureId: string) => {
    setFeatures(prev => 
      prev.map(f => {
        if (f.id !== featureId) return f;
        return { ...f, enabled: !f.enabled };
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.patch('/api/admin/features', { features }, { headers: getAuthHeaders() });
      setHasChanges(false);
      // Optional: show a toast or success message
    } catch (err) {
      console.error('Error saving features:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const filteredFeatures = features.filter(f => {
    const matchesSearch = f.label.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || f.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const groups = ['all', 'sidebar', 'dashboard', 'other'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF0000] mb-4" />
        <p className="text-[#888] animate-pulse">Loading system feature matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#FF0000]" />
            System Role Access Control
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Manage exactly which system features and dashboard buttons are visible to each role.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
            hasChanges 
              ? 'bg-[#FF0000] text-white hover:bg-[#CC0000] shadow-red-600/20' 
              : 'bg-[#212121] text-[#555] cursor-not-allowed shadow-none'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#181818] border border-[#212121] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input 
            type="text" 
            placeholder="Search features by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F0F0F] border border-[#212121] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF0000] transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#212121] rounded-xl p-1">
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                filterGroup === g 
                  ? 'bg-[#FF0000] text-white' 
                  : 'text-[#555] hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0F0F0F] border-b border-[#212121]">
                <th className="p-4 text-left text-[10px] font-bold text-[#555] uppercase tracking-widest min-w-[250px]">System Feature</th>
                <th className="p-4 text-center text-[10px] font-bold text-[#555] uppercase tracking-widest">Global Status</th>
                {ROLES.map(role => (
                  <th key={role.id} className="p-4 text-center text-[10px] font-bold text-[#555] uppercase tracking-widest">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212121]">
              {filteredFeatures.map((feature) => (
                <tr key={feature.id} className="hover:bg-[#1C1C1C] transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-[#FF0000] transition-colors">{feature.label}</span>
                      <span className="text-[10px] text-[#555] font-mono">{feature.feature || feature.id}</span>
                      <span className="inline-block mt-1 w-fit px-2 py-0.5 bg-[#212121] text-[#888] text-[8px] font-bold uppercase tracking-wider rounded">
                        {feature.group}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleEnabled(feature.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none ${
                        feature.enabled ? 'bg-[#FF0000]' : 'bg-[#333]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${
                          feature.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  {ROLES.map(role => (
                    <td key={role.id} className="p-4 text-center">
                      <button
                        onClick={() => handleToggleRole(feature.id, role.id)}
                        disabled={!feature.enabled}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                          !feature.enabled 
                            ? 'bg-[#0F0F0F] text-[#222] cursor-not-allowed border border-transparent'
                            : feature.allowedRoles.includes(role.id)
                            ? 'bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/30 shadow-lg shadow-red-600/5'
                            : 'bg-[#0F0F0F] text-[#333] border border-[#212121] hover:border-[#444]'
                        }`}
                      >
                        {feature.allowedRoles.includes(role.id) ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <X className="w-4 h-4 text-[#222]" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
              {filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={ROLES.length + 2} className="p-10 text-center text-[#555]">
                    No system features found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4">
        <div className="w-1 h-full bg-amber-500 rounded-full" />
        <div>
          <h4 className="text-sm font-bold text-amber-500">How it works</h4>
          <p className="text-xs text-[#888] mt-1 leading-relaxed">
            The role access settings in this matrix control the **UI visibility** for all users. 
            If a feature is globally disabled, nobody (including super-admins) can see it. 
            If a role is unchecked, users with that role will not see the corresponding sidebar item or button.
          </p>
        </div>
      </div>
    </div>
  );
}
