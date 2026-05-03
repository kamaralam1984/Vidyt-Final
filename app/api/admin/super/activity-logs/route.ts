// Unified activity-log feed for the super-admin Activity Log page.
// Aggregates from every collection that records something interesting and
// normalizes them into a single shape with severity (critical / warning /
// info) so the UI can highlight the rows that need attention.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAccess } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import AbuseLog from '@/models/AbuseLog';
import AuditAlert from '@/models/AuditAlert';
import ControlLog from '@/models/ControlLog';
import DeletionLog from '@/models/DeletionLog';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import AIJobLog from '@/models/AIJobLog';
import SlowQuery from '@/models/SlowQuery';
import { ErrorLog } from '@/lib/errorLogger';

type Severity = 'critical' | 'warning' | 'info';
type Source =
  | 'abuse'
  | 'audit'
  | 'control'
  | 'deletion'
  | 'payment'
  | 'notification'
  | 'error'
  | 'ai_job'
  | 'slow_query';

interface ActivityEvent {
  id: string;
  source: Source;
  severity: Severity;
  type: string;
  title: string;
  message: string;
  actor?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

const RANGE_MS: Record<string, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

function severityFromAbuse(s: string): Severity {
  if (s === 'critical' || s === 'high') return 'critical';
  if (s === 'medium') return 'warning';
  return 'info';
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const access = await requireSuperAdminAccess(request);
    if (access.error) return access.error;

    const url = new URL(request.url);
    const range = url.searchParams.get('range') || 'week';
    const since = new Date(Date.now() - (RANGE_MS[range] ?? RANGE_MS.week));
    const limitParam = parseInt(url.searchParams.get('limit') || '500', 10);
    const limit = Math.min(Number.isFinite(limitParam) ? limitParam : 500, 2000);

    const [
      abuses,
      audits,
      controls,
      deletions,
      failedPayments,
      notifications,
      errors,
      aiJobs,
      slowQueries,
    ] = await Promise.all([
      AbuseLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      AuditAlert.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      ControlLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      DeletionLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      Payment.find({ status: 'failed', createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.find({ type: 'limit_reached', createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      ErrorLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      AIJobLog.find({ status: 'failed', createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      SlowQuery.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    // Hydrate user emails for the rows that only carry a userId.
    const userIds = new Set<string>();
    failedPayments.forEach((p: any) => p.userId && userIds.add(String(p.userId)));
    notifications.forEach((n: any) => n.userId && userIds.add(String(n.userId)));
    const users = userIds.size
      ? await User.find({ _id: { $in: Array.from(userIds) } })
          .select('email name')
          .lean()
      : [];
    const userMap = new Map<string, any>(users.map((u: any) => [String(u._id), u]));

    const events: ActivityEvent[] = [];

    for (const a of abuses as any[]) {
      events.push({
        id: 'abuse:' + String(a._id),
        source: 'abuse',
        severity: severityFromAbuse(a.severity),
        type: a.violationType,
        title: String(a.violationType || 'abuse').replace(/_/g, ' ').toUpperCase(),
        message: a.description || '',
        actor: a.userEmail || a.ipAddress,
        timestamp: a.createdAt,
        details: {
          attemptCount: a.attemptCount,
          failureCount: a.failureCount,
          suspiciousPatterns: a.suspiciousPatterns,
          ipAddress: a.ipAddress,
        },
      });
    }

    for (const al of audits as any[]) {
      events.push({
        id: 'audit:' + String(al._id),
        source: 'audit',
        severity:
          al.severity === 'critical' ? 'critical' : al.severity === 'warning' ? 'warning' : 'info',
        type: String(al.type || 'audit'),
        title: al.title || String(al.type || 'audit alert'),
        message: al.message || '',
        actor: al.siteUrl,
        timestamp: al.createdAt,
        details: al.details,
      });
    }

    for (const c of controls as any[]) {
      let parsed: any = null;
      try { parsed = JSON.parse(c.changes || '{}'); } catch { /* keep null */ }
      const action = String(c.action || '');
      const isDisabling =
        action.toUpperCase().includes('DISABLE') ||
        parsed?.isEnabled === false ||
        parsed?.globalState === 'DISABLED';
      events.push({
        id: 'control:' + String(c._id),
        source: 'control',
        severity: isDisabling ? 'warning' : 'info',
        type: action,
        title: `${action} · ${c.platform}`,
        message: c.changes || '',
        actor: c.adminEmail,
        timestamp: c.createdAt,
        details: parsed ?? undefined,
      });
    }

    for (const d of deletions as any[]) {
      events.push({
        id: 'deletion:' + String(d._id),
        source: 'deletion',
        severity: 'warning',
        type: 'account_deletion',
        title: 'Account Deletion',
        message: `${d.userEmail || d.userId} · videos:${d.videosDeleted || 0} · analytics:${d.analyticsDeleted || 0}`,
        actor: d.userEmail || (d.userId ? String(d.userId) : undefined),
        timestamp: d.createdAt || d.deletionCompletedAt,
        details: {
          tokensRevoked: d.tokensRevoked,
          subscriptionAnonymized: d.subscriptionAnonymized,
          settingsCleared: d.settingsCleared,
        },
      });
    }

    for (const p of failedPayments as any[]) {
      const u = userMap.get(String(p.userId));
      events.push({
        id: 'payment:' + String(p._id),
        source: 'payment',
        severity: 'critical',
        type: 'payment_failed',
        title: `Payment Failed · ${p.plan || 'unknown'}`,
        message: `${u?.email || p.userId || 'user'} · ${p.amount} ${p.currency}`,
        actor: u?.email || (p.userId ? String(p.userId) : undefined),
        timestamp: p.createdAt,
        details: { gateway: p.gateway, orderId: p.orderId, paymentId: p.paymentId },
      });
    }

    for (const n of notifications as any[]) {
      const u = userMap.get(String(n.userId));
      events.push({
        id: 'notif:' + String(n._id),
        source: 'notification',
        severity: 'warning',
        type: 'limit_reached',
        title: `Limit Reached · ${n.feature || ''}`.trim(),
        message: n.message || '',
        actor: u?.email || (n.userId ? String(n.userId) : undefined),
        timestamp: n.createdAt,
      });
    }

    for (const er of errors as any[]) {
      // 5xx → critical, 4xx → warning, otherwise treat by type:
      // 'server' / 'database' / 'payment' / 'ai' = critical;
      // 'api' = warning; 'client' = info.
      const code = Number(er.statusCode || 0);
      let severity: Severity = 'info';
      if (code >= 500 || ['server', 'database', 'payment', 'ai'].includes(String(er.type))) {
        severity = 'critical';
      } else if (code >= 400 || er.type === 'api') {
        severity = 'warning';
      }
      events.push({
        id: 'error:' + String(er._id),
        source: 'error',
        severity,
        type: String(er.type || 'error'),
        title: `${String(er.type || 'error').toUpperCase()} · ${er.route || 'unknown route'}${code ? ` · ${code}` : ''}`,
        message: er.message || '',
        actor: er.userId ? String(er.userId) : undefined,
        timestamp: er.createdAt,
        details: {
          stack: er.stack,
          statusCode: er.statusCode,
          userAgent: er.userAgent,
          metadata: er.metadata,
          resolved: er.resolved,
        },
      });
    }

    for (const j of aiJobs as any[]) {
      events.push({
        id: 'ai:' + String(j._id),
        source: 'ai_job',
        severity: 'critical',
        type: `ai_job_failed:${j.jobType || 'unknown'}`,
        title: `AI Job Failed · ${j.jobType || 'unknown'}`,
        message: j.error || 'Job failed without an error message',
        actor: j.userId ? String(j.userId) : undefined,
        timestamp: j.createdAt,
        details: {
          attempts: j.attempts,
          queueJobId: j.queueJobId,
          input: j.input,
        },
      });
    }

    for (const sq of slowQueries as any[]) {
      // > 5s = critical, 1.5–5s = warning, otherwise info.
      const d = Number(sq.durationMs || 0);
      const severity: Severity = d >= 5000 ? 'critical' : d >= 1500 ? 'warning' : 'info';
      events.push({
        id: 'slow:' + String(sq._id),
        source: 'slow_query',
        severity,
        type: `slow_${sq.kind || 'op'}`,
        title: `Slow ${sq.kind || 'operation'} · ${sq.label || sq.route || sq.collection || 'unknown'} · ${d}ms`,
        message: `Took ${d}ms${sq.thresholdMs ? ` (threshold ${sq.thresholdMs}ms)` : ''}`,
        actor: sq.route || sq.collection,
        timestamp: sq.createdAt,
        details: {
          durationMs: sq.durationMs,
          thresholdMs: sq.thresholdMs,
          route: sq.route,
          collection: sq.collection,
          query: sq.query,
          metadata: sq.metadata,
        },
      });
    }

    events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const counts = {
      total: events.length,
      critical: events.filter((e) => e.severity === 'critical').length,
      warning: events.filter((e) => e.severity === 'warning').length,
      info: events.filter((e) => e.severity === 'info').length,
      bySource: events.reduce((acc: Record<string, number>, e) => {
        acc[e.source] = (acc[e.source] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      range,
      since: since.toISOString(),
      counts,
      events: events.slice(0, limit),
    });
  } catch (e: any) {
    console.error('[ActivityLog API]', e);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
