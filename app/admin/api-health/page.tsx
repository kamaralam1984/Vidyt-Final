"use client";

import { useEffect, useState } from 'react';

export default function ApiHealthDashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchHealth() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/api-health', {
        headers: {
          'x-admin-secret': 'admin-secret-2024' // Usually passed differently in prod, but fine for prototype
        }
      });
      if (!res.ok) throw new Error('Failed to load API health');
      const json = await res.json();
      setData(json);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  async function handleAction(action: string, provider: string) {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/api-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': 'admin-secret-2024' },
        body: JSON.stringify({ action, provider })
      });
      if (!res.ok) alert('Action failed');
      await fetchHealth();
    } catch (err) {
      alert('Error: ' + err);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading AI Health System...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Universal AI Failover Console
          </h1>
          <button 
            onClick={fetchHealth} 
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">AI APIs Healthy</div>
            <div className="text-2xl font-bold text-green-400">{data?.summary?.aiHealthy} / {data?.summary?.aiTotal}</div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">YT APIs Healthy</div>
            <div className="text-2xl font-bold text-green-400">{data?.summary?.ytHealthy} / {data?.summary?.ytTotal}</div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Last Update</div>
            <div className="text-xl font-bold text-gray-200">{new Date(data?.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="p-4 font-semibold text-gray-300">Provider Module</th>
                <th className="p-4 font-semibold text-gray-300">Target Type</th>
                <th className="p-4 font-semibold text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-300">Circuit Breaker</th>
                <th className="p-4 font-semibold text-gray-300">Usage Stats</th>
                <th className="p-4 font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.providers?.map((p: any) => {
                const health = p.aiHealth || p.ytHealth || {};
                const isDown = health.status === 'fail' || p.circuit?.state === 'OPEN';
                return (
                  <tr key={p.name} className="border-b border-gray-800/50 hover:bg-gray-900/50 transition">
                    <td className="p-4">
                      <div className="font-medium text-gray-200 capitalize">{p.name.replace('-', ' ')}</div>
                      {!p.enabled && <span className="text-xs text-red-500 mt-1 block">MANUALLY DISABLED</span>}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded ${p.aiHealth ? 'bg-purple-900/50 text-purple-300' : 'bg-red-900/50 text-red-300'}`}>
                        {p.aiHealth ? 'Text Generation' : 'Video Data'}
                      </span>
                    </td>
                    <td className="p-4">
                      {health.status === 'no-key' ? (
                        <div className="flex items-center text-gray-500">
                          <div className="w-2 h-2 rounded-full bg-gray-600 mr-2"></div> Unconfigured
                        </div>
                      ) : health.status === 'ok' ? (
                        <div className="flex items-center text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div> Healthy ({health.latencyMs}ms)
                        </div>
                      ) : (
                        <div className="flex items-center text-red-400">
                          <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Failed ({health.latencyMs}ms)
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {p.circuit ? (
                        <div className="flex flex-col text-sm">
                          <span className={`font-mono ${p.circuit.state === 'CLOSED' ? 'text-green-400' : p.circuit.state === 'HALF_OPEN' ? 'text-yellow-400' : 'text-red-400'}`}>
                            [{p.circuit.state}]
                          </span>
                          <span className="text-gray-500 text-xs mt-1">{p.circuit.failures} recent fails</span>
                        </div>
                      ) : <span className="text-gray-600">-</span>}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="text-gray-300">Calls: {p.usage.calls}</div>
                        <div className="text-gray-500 text-xs">Failures: {p.usage.failures}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {p.enabled ? (
                          <button onClick={() => handleAction('disable', p.name)} className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700">Disable</button>
                        ) : (
                          <button onClick={() => handleAction('enable', p.name)} className="text-xs px-3 py-1 bg-green-900/30 hover:bg-green-800/50 text-green-400 rounded border border-green-800/50">Enable</button>
                        )}
                        {p.circuit && p.circuit.state !== 'CLOSED' && (
                          <button onClick={() => handleAction('reset-circuit', p.name)} className="text-xs px-3 py-1 bg-yellow-900/30 hover:bg-yellow-800/50 text-yellow-400 rounded border border-yellow-800/50">Reset Circuit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
