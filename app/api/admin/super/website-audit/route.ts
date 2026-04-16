export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import WebsiteAudit from '@/models/WebsiteAudit';
import MonitoredSite from '@/models/MonitoredSite';
import AuditAlert from '@/models/AuditAlert';

// ── GET: Dashboard data, history, sites list ──
export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'dashboard';

  if (action === 'dashboard') {
    const [
      sites,
      recentAudits,
      unacknowledgedAlerts,
      criticalAlerts,
      totalAudits,
    ] = await Promise.all([
      MonitoredSite.find({}).sort({ updatedAt: -1 }).lean(),
      WebsiteAudit.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10).lean(),
      AuditAlert.countDocuments({ acknowledged: false }),
      AuditAlert.find({ acknowledged: false, severity: 'critical' }).sort({ createdAt: -1 }).limit(5).lean(),
      WebsiteAudit.countDocuments({}),
    ]);

    // Aggregate avg scores for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000);
    const trendData = await WebsiteAudit.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgScore: { $avg: '$overallScore' },
          avgPerf: { $avg: '$performance.score' },
          avgSeo: { $avg: '$seo.score' },
          avgSecurity: { $avg: '$security.score' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      sites,
      recentAudits,
      unacknowledgedAlerts,
      criticalAlerts,
      totalAudits,
      trendData,
    });
  }

  if (action === 'history') {
    const siteUrl = url.searchParams.get('url');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const filter: any = { status: 'completed' };
    if (siteUrl) filter.url = siteUrl;

    const [audits, total] = await Promise.all([
      WebsiteAudit.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      WebsiteAudit.countDocuments(filter),
    ]);

    return NextResponse.json({ audits, total, page, totalPages: Math.ceil(total / limit) });
  }

  if (action === 'audit-detail') {
    const auditId = url.searchParams.get('id');
    if (!auditId) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const audit = await WebsiteAudit.findById(auditId).lean();
    if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ audit });
  }

  if (action === 'sites') {
    const sites = await MonitoredSite.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ sites });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// ── POST: Add / update / delete monitored sites ──
export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();
  const { action } = body;

  if (action === 'add-site') {
    const { url, name, description, isOwned, checkInterval, alertThreshold } = body;
    if (!url || !name) return NextResponse.json({ error: 'url and name required' }, { status: 400 });

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    const existing = await MonitoredSite.findOne({ url: normalizedUrl });
    if (existing) return NextResponse.json({ error: 'Site already monitored' }, { status: 409 });

    const site = await MonitoredSite.create({
      url: normalizedUrl, name, description,
      isOwned: !!isOwned,
      checkInterval: checkInterval || 'daily',
      alertThreshold: alertThreshold || 60,
      addedBy: authUser.name || authUser.email,
    });
    return NextResponse.json({ success: true, site });
  }

  if (action === 'update-site') {
    const { siteId, ...updates } = body;
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    const site = await MonitoredSite.findByIdAndUpdate(siteId, updates, { new: true });
    return NextResponse.json({ success: true, site });
  }

  if (action === 'delete-site') {
    const { siteId } = body;
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    await MonitoredSite.findByIdAndDelete(siteId);
    return NextResponse.json({ success: true });
  }

  if (action === 'acknowledge-alert') {
    const { alertId } = body;
    await AuditAlert.findByIdAndUpdate(alertId, {
      acknowledged: true,
      acknowledgedBy: authUser.name || authUser.email,
      acknowledgedAt: new Date(),
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'acknowledge-all-alerts') {
    await AuditAlert.updateMany({ acknowledged: false }, {
      $set: {
        acknowledged: true,
        acknowledgedBy: authUser.name || authUser.email,
        acknowledgedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
