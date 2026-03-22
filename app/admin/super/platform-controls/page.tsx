"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Youtube, Facebook, Instagram, Shield, Save, Loader2, History, Power, Settings2, Trash2, Headphones } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';

interface PlatformControl {
    platform: string;
    isEnabled: boolean;
    allowedPlans: string[];
    features: Record<string, boolean>;
}

interface ControlLog {
    _id: string;
    action: string;
    platform: string;
    changes: string;
    adminEmail: string;
    adminId?: string;
    createdAt: string;
}

export default function PlatformControlsPage() {
    const [controls, setControls] = useState<PlatformControl[]>([]);
    const [logs, setLogs] = useState<ControlLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingPlatform, setSavingPlatform] = useState('');
    const [savingMaster, setSavingMaster] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const router = useRouter();

    const availablePlans = ['free', 'pro', 'enterprise', 'owner'];
    const defaultFeatures: Record<string, string[]> = {
        youtube: ['upload', 'seo', 'live', 'ai_engine'],
        facebook: ['seo', 'audit'],
        instagram: ['seo', 'audit'],
        support: ['ai_auto_reply', 'human_support', 'priority_support', '24_7_mode']
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [controlsRes, logsRes] = await Promise.all([
                axios.get('/api/admin/super/controls', { headers: getAuthHeaders() }),
                axios.get('/api/admin/super/controls/logs', { headers: getAuthHeaders() })
            ]);

            if (controlsRes.data.controls) {
                // Ensure all core platforms exist in state even if not in DB yet
                const fetchedControls: PlatformControl[] = controlsRes.data.controls;
                const basePlatforms = ['youtube', 'facebook', 'instagram', 'support'];
                
                const mergedControls = basePlatforms.map(p => {
                    const existing = fetchedControls.find(c => c.platform === p);
                    if (existing) {
                        return {
                            ...existing,
                            features: existing.features || {}
                        };
                    }
                    return {
                        platform: p,
                        isEnabled: true,
                        allowedPlans: availablePlans,
                        features: defaultFeatures[p].reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
                    };
                });
                
                setControls(mergedControls);
            }

            if (logsRes.data.logs) {
                setLogs(logsRes.data.logs);
            }
        } catch (error: any) {
            console.error('Error fetching admin data:', error);
            if (error.response?.status === 403) {
                // Not super admin
                router.push('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateControl = (platformIdx: number, updates: Partial<PlatformControl>) => {
        const newControls = [...controls];
        newControls[platformIdx] = { ...newControls[platformIdx], ...updates };
        setControls(newControls);
    };

    const togglePlan = (platformIdx: number, plan: string) => {
        const currentControl = controls[platformIdx];
        const plans = new Set(currentControl.allowedPlans);
        if (plans.has(plan)) plans.delete(plan);
        else plans.add(plan);
        handleUpdateControl(platformIdx, { allowedPlans: Array.from(plans) });
    };

    const toggleFeature = (platformIdx: number, featureKey: string) => {
        const currentControl = controls[platformIdx];
        const newFeatures = { ...currentControl.features };
        newFeatures[featureKey] = !newFeatures[featureKey];
        handleUpdateControl(platformIdx, { features: newFeatures });
    };

    const savePlatformConfig = async (platformIdx: number) => {
        const control = controls[platformIdx];
        setSavingPlatform(control.platform);
        try {
            await axios.post('/api/admin/super/controls', control, { headers: getAuthHeaders() });
            // Refresh logs
            const logsRes = await axios.get('/api/admin/super/controls/logs', { headers: getAuthHeaders() });
            setLogs(logsRes.data.logs || []);
        } catch (error) {
            console.error(`Error saving ${control.platform}:`, error);
            alert(`Failed to save ${control.platform} config`);
        } finally {
            setSavingPlatform('');
        }
    };

    const handleMasterToggle = async (enableAll: boolean) => {
        if (!confirm(`Are you sure you want to ${enableAll ? 'ENABLE' : 'DISABLE'} all platforms globally?`)) return;
        
        setSavingMaster(true);
        try {
            await axios.post('/api/admin/super/controls/master-toggle', { isEnabled: enableAll }, { headers: getAuthHeaders() });
            await fetchData(); // refresh all
        } catch (error) {
            console.error('Master toggle error', error);
            alert('Failed to execute master toggle');
        } finally {
            setSavingMaster(false);
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return <Youtube className="text-red-500" />;
            case 'facebook': return <Facebook className="text-blue-500" />;
            case 'instagram': return <Instagram className="text-pink-500" />;
            case 'support': return <Headphones className="text-emerald-500" />;
            default: return <Settings2 />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-[#0F0F0F] text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Shield className="w-8 h-8 text-emerald-500" />
                        Platform Controls
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Super Admin only. Toggle features, restrict access by tier, and control the global application state.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowLogs(!showLogs)}
                        className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition"
                    >
                        <History className="w-4 h-4" />
                        {showLogs ? 'Hide Logs' : 'View Logs'}
                    </button>
                    {/* Master Switches */}
                    <button 
                        onClick={() => handleMasterToggle(true)}
                        disabled={savingMaster}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        <Power className="w-4 h-4" /> Enable All
                    </button>
                    <button 
                        onClick={() => handleMasterToggle(false)}
                        disabled={savingMaster}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" /> Disable All
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Controls Area */}
                <div className={`space-y-6 ${showLogs ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    {controls.map((control, idx) => (
                        <div key={control.platform} className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                            {/* Card Header */}
                            <div className="bg-gray-50 dark:bg-[#212121] px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-xl font-bold flex items-center gap-2 capitalize">
                                    {getPlatformIcon(control.platform)}
                                    {control.platform}
                                </h2>
                                {/* Global Toggle */}
                                <label className="flex items-center cursor-pointer gap-3">
                                    <span className={`text-sm font-medium ${control.isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {control.isEnabled ? 'Enabled Globally' : 'Disabled'}
                                    </span>
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only" 
                                            checked={control.isEnabled} 
                                            onChange={(e) => handleUpdateControl(idx, { isEnabled: e.target.checked })}
                                        />
                                        <div className={`block w-14 h-8 rounded-full transition-colors ${control.isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${control.isEnabled ? 'translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            <div className={`p-6 ${!control.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Plan Restrictions */}
                                    <div>
                                        <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500 tracking-wider">Plan Access</h3>
                                        <div className="space-y-3">
                                            {availablePlans.map(plan => (
                                                <label key={plan} className="flex items-center gap-3 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={control.allowedPlans.includes(plan)}
                                                        onChange={() => togglePlan(idx, plan)}
                                                        className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:bg-gray-800 dark:border-gray-600"
                                                    />
                                                    <span className="capitalize">{plan} Plan</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Feature Toggles */}
                                    <div>
                                        <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500 tracking-wider">Sub-Features</h3>
                                        <div className="space-y-4">
                                            {Object.keys(control.features).map(featureKey => (
                                                <div key={featureKey} className="flex items-center justify-between">
                                                    <span className="capitalize text-sm font-medium">
                                                        {featureKey.replace('_', ' ')}
                                                    </span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={!!control.features[featureKey]}
                                                            onChange={() => toggleFeature(idx, featureKey)}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            ))}
                                            {Object.keys(control.features).length === 0 && (
                                                <p className="text-xs text-gray-500">No sub-features available.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => savePlatformConfig(idx)}
                                        disabled={savingPlatform === control.platform}
                                        className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                    >
                                        {savingPlatform === control.platform ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Audit Logs Sidebar */}
                {showLogs && (
                    <div className="lg:col-span-1 border-l border-gray-200 dark:border-gray-800 pl-6 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-gray-500" />
                            Activity Log
                        </h3>
                        {logs.length === 0 ? (
                            <p className="text-sm text-gray-500">No recent changes found.</p>
                        ) : (
                            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                                {logs.map(log => (
                                    <div key={log._id} className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-red-500">{log.action}</span>
                                            <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 font-medium capitalize mb-1">Platform: {log.platform}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs truncate">By: {log.adminEmail || log.adminId}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
