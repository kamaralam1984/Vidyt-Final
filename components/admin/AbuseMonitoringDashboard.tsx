'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react';

interface AbuseLog {
  _id: string;
  ipAddress: string;
  endpoint: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  botScore?: number;
  botReasons?: string[];
  reviewed?: boolean;
  actionTaken?: string;
  createdAt: string;
  userId?: string;
}

interface AbuseStats {
  total: number;
  critical: number;
  high: number;
  unreviewed: number;
  blocked: number;
}

export default function AbuseMonitoringDashboard() {
  const [logs, setLogs] = useState<AbuseLog[]>([]);
  const [stats, setStats] = useState<AbuseStats>({
    total: 0,
    critical: 0,
    high: 0,
    unreviewed: 0,
    blocked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24');
  const [filters, setFilters] = useState({
    severity: '' as string,
    reviewed: '' as string,
    type: '' as string,
  });

  useEffect(() => {
    fetchAbuseLogs();
  }, [timeRange, filters]);

  async function fetchAbuseLogs() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        limit: '50',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });

      const response = await fetch(`/api/admin/compliance/abuse-logs?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.data?.logs || []);

      // Calculate stats
      const allResponse = await fetch(
        `/api/admin/compliance/abuse-logs?timeRange=${timeRange}&limit=1000`
      );
      const allData = await allResponse.json();
      const allLogs = allData.data?.logs || [];

      setStats({
        total: allLogs.length,
        critical: allLogs.filter((l: AbuseLog) => l.severity === 'critical').length,
        high: allLogs.filter((l: AbuseLog) => l.severity === 'high').length,
        unreviewed: allLogs.filter((l: AbuseLog) => !l.reviewed).length,
        blocked: allLogs.filter((l: AbuseLog) => l.actionTaken === 'ip_blocked').length,
      });
    } catch (error) {
      console.error('Error fetching abuse logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateLog(logId: string, action: 'review' | 'block' | 'unblock') {
    try {
      const updateData: any = { logIds: [logId], userId: 'admin' };

      if (action === 'review') {
        updateData.reviewed = true;
        updateData.actionTaken = 'warning';
      } else if (action === 'block') {
        updateData.actionTaken = 'ip_blocked';
        updateData.reviewed = true;
      } else if (action === 'unblock') {
        updateData.actionTaken = 'none';
      }

      await fetch('/api/admin/compliance/abuse-logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      await fetchAbuseLogs();
    } catch (error) {
      console.error('Error updating log:', error);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getViolationIcon = (type: string) => {
    if (type.includes('bot')) return '🤖';
    if (type.includes('rate')) return '⚡';
    if (type.includes('suspicious')) return '⚠️';
    if (type.includes('blocked')) return '🚫';
    return '❌';
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-red-600" />
          Abuse & Security Monitoring
        </h1>
        <p className="text-slate-600 mt-1">Monitor and manage suspicious activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Events ({timeRange}h)</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Unreviewed</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unreviewed}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">IPs Blocked</p>
                <p className="text-2xl font-bold text-slate-900">{stats.blocked}</p>
              </div>
              <Shield className="w-8 h-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="1">Last 1 hour</option>
              <option value="6">Last 6 hours</option>
              <option value="24">Last 24 hours</option>
              <option value="72">Last 72 hours</option>
              <option value="168">Last 7 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reviewed</label>
            <select
              value={filters.reviewed}
              onChange={(e) => setFilters({ ...filters, reviewed: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="">All</option>
              <option value="true">Reviewed</option>
              <option value="false">Unreviewed</option>
            </select>
          </div>

          <Button onClick={() => fetchAbuseLogs()} className="mt-6">
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Abuse Events</CardTitle>
          <CardDescription>Recent {timeRange}h of suspicious activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-slate-600">No abuse events found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">IP Address</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Endpoint</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Violation</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Severity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">{log.endpoint}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-2">
                          {getViolationIcon(log.violationType)}
                          {log.violationType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={`${getSeverityColor(log.severity)} border-0`}>
                          {log.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.reviewed ? (
                          <Badge variant="outline" className="bg-green-50">
                            ✓ Reviewed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            ⚠ Unreviewed
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {!log.reviewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateLog(log._id, 'review')}
                            className="text-xs"
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {log.actionTaken !== 'ip_blocked' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateLog(log._id, 'block')}
                            className="text-xs"
                          >
                            Block IP
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Regularly review abuse logs for patterns. If you see the same IP repeatedly, consider blocking it permanently. 
            High-severity events should be reviewed and acted upon immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
