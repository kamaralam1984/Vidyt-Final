'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Save, 
  Loader2, 
  Check, 
  X, 
  Search, 
  Filter, 
  Zap, 
  Layout, 
  Globe, 
  UserCircle 
} from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface UnifiedFeature {
  id: string;
  label: string;
  group: 'sidebar' | 'dashboard' | 'other' | 'ai_studio' | 'platform';
  enabled: boolean;
  allowedRoles: string[];
  planAccess: Record<string, boolean> | null;
}

interface PlanInfo {
  id: string;
  label: string;
}

export default function UnifiedFeatureMatrix() {
  const [features, setFeatures] = useState<UnifiedFeature[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/unified-feature-matrix', { headers: getAuthHeaders() });
      if (res.data.features) {
        setFeatures(res.data.features);
        setRoles(res.data.roles);
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string, type: 'role' | 'plan' | 'global', target: string, value: boolean) => {
    // Add to pending updates
    setPendingUpdates(prev => {
      const existing = prev.filter(u => !(u.id === id && u.type === type && u.target === target));
      return [...existing, { id, type, target, value }];
    });

    // Update local state for immediate feedback
    setFeatures(prev => 
      prev.map(f => {
        if (f.id !== id) return f;
        
        if (type === 'global') {
          return { ...f, enabled: value };
        } else if (type === 'role') {
          const roles = value 
            ? [...f.allowedRoles, target]
            : f.allowedRoles.filter(r => r !== target);
          return { ...f, allowedRoles: roles };
        } else if (type === 'plan' && f.planAccess) {
          return { 
            ...f, 
            planAccess: { ...f.planAccess, [target]: value }
          };
        }
        return f;
      })
    );
  };

  const handleSave = async () => {
    if (pendingUpdates.length === 0) return;
    try {
      setSaving(true);
      const res = await axios.patch('/api/admin/unified-feature-matrix', { updates: pendingUpdates }, { headers: getAuthHeaders() });
      
      if (res.data.success) {
        console.log('Update results:', res.data.results);
        setPendingUpdates([]);
        alert('Changes saved successfully');
      } else {
        alert('Failed to save some changes: ' + (res.data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error saving:', err);
      alert('Failed to save changes: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const filteredFeatures = features.filter(f => {
    const matchesSearch = f.label.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || f.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const categories = [
    { id: 'all', label: 'All', icon: <Globe className="w-4 h-4" /> },
    { id: 'sidebar', label: 'Navigation', icon: <Layout className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <Layout className="w-4 h-4" rotate={90} /> },
    { id: 'ai_studio', label: 'AI Studio', icon: <Zap className="w-4 h-4" /> },
    { id: 'platform', label: 'Platforms', icon: <Globe className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF0000] mb-4" />
        <p className="text-[#888]">Loading Unified Feature Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#FF0000]" />
            Unified Feature Matrix
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Manage granular access across all Roles and Subscription Plans in one place.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || pendingUpdates.length === 0}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
            pendingUpdates.length > 0
              ? 'bg-[#FF0000] text-white hover:bg-[#CC0000] shadow-red-600/20' 
              : 'bg-[#212121] text-[#555] cursor-not-allowed shadow-none'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : `Save ${pendingUpdates.length} Changes`}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#181818] border border-[#212121] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input 
            type="text" 
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0F0F0F] border border-[#212121] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF0000]"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#212121] rounded-xl p-1 overflow-x-auto max-w-full">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterGroup(c.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${
                filterGroup === c.id 
                  ? 'bg-[#FF0000] text-white' 
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0F0F0F] border-b border-[#212121]">
                <th rowSpan={2} className="p-4 text-left text-[10px] font-bold text-[#555] uppercase tracking-widest min-w-[200px]">Feature</th>
                <th rowSpan={2} className="p-4 text-center text-[10px] font-bold text-[#555] uppercase tracking-widest">Global</th>
                <th colSpan={roles.length} className="p-2 text-center text-[10px] font-bold text-[#FF0000]/60 uppercase tracking-widest border-l border-[#212121]">Roles (UI Sidebar/Widgets)</th>
                <th colSpan={plans.length} className="p-2 text-center text-[10px] font-bold text-blue-500/60 uppercase tracking-widest border-l border-[#212121]">Plans (AI Tools/Logic)</th>
              </tr>
              <tr className="bg-[#0F0F0F] border-b border-[#212121]">
                {roles.map(role => (
                  <th key={role} className="p-2 text-center text-[8px] font-bold text-[#444] uppercase tracking-widest border-l border-[#212121]">{role}</th>
                ))}
                {plans.map(plan => (
                  <th key={plan.id} className="p-2 text-center text-[8px] font-bold text-[#444] uppercase tracking-widest border-l border-[#212121]">{plan.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212121]">
              {filteredFeatures.map((f) => (
                <tr key={f.id} className="hover:bg-[#1C1C1C] transition-colors group">
                  <td className="p-4 border-r border-[#212121]">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white group-hover:text-[#FF0000] transition-colors">{f.label}</span>
                      <span className="text-[9px] text-[#444] font-mono">{f.id}</span>
                      <span className="inline-block mt-1 w-fit px-1.5 py-0.5 bg-[#0F0F0F] text-[#444] text-[7px] font-bold uppercase rounded">
                        {f.group}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggle(f.id, 'global', '', !f.enabled)}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-all focus:outline-none ${
                        f.enabled ? 'bg-[#FF0000]' : 'bg-[#333]'
                      }`}
                    >
                      <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-all ${f.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  
                  {/* Role Columns */}
                  {roles.map(role => (
                    <td key={role} className="p-2 text-center border-l border-[#212121]/50">
                      <button
                        onClick={() => handleToggle(f.id, 'role', role, !f.allowedRoles.includes(role))}
                        disabled={!f.enabled}
                        className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-all ${
                          !f.enabled 
                            ? 'opacity-10 cursor-not-allowed'
                            : f.allowedRoles.includes(role)
                            ? 'bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20'
                            : 'bg-[#0F0F0F] text-[#222] border border-[#212121] hover:border-[#444]'
                        }`}
                      >
                        {f.allowedRoles.includes(role) ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                      </button>
                    </td>
                  ))}

                  {/* Plan Columns */}
                  {plans.map(plan => {
                    const hasPlanAccess = f.planAccess ? f.planAccess[plan.id] : false;
                    const isPlanBased = f.planAccess !== null;
                    
                    return (
                      <td key={plan.id} className="p-2 text-center border-l border-[#212121]/50">
                        {isPlanBased ? (
                          <button
                            onClick={() => handleToggle(f.id, 'plan', plan.id, !hasPlanAccess)}
                            disabled={!f.enabled}
                            className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-all ${
                              !f.enabled 
                                ? 'opacity-10 cursor-not-allowed'
                                : hasPlanAccess
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-[#0F0F0F] text-[#222] border border-[#212121] hover:border-[#444]'
                            }`}
                          >
                            {hasPlanAccess ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#222]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={1 + 1 + roles.length + plans.length} className="p-10 text-center text-[#555]">
                    No features found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4">
          <div className="w-1 h-full bg-amber-500 rounded-full" />
          <div>
            <h4 className="text-sm font-bold text-amber-500">How it works: Roles</h4>
            <p className="text-[10px] text-[#888] mt-1 leading-relaxed">
              Role settings control **UI visibility**. If a role is unchecked, users with that role will not see the corresponding sidebar item or dashboard widget.
            </p>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
          <div className="w-1 h-full bg-blue-500 rounded-full" />
          <div>
            <h4 className="text-sm font-bold text-blue-500">How it works: Plans</h4>
            <p className="text-[10px] text-[#888] mt-1 leading-relaxed">
              Plan settings control **functional access** for AI Tools and Platforms. Unchecking a plan prevents those users from using the actual logic/API of the feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
