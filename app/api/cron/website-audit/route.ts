export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MonitoredSite from '@/models/MonitoredSite';
import WebsiteAudit from '@/models/WebsiteAudit';
import { runAudit, getServerMetrics } from '@/services/auditEngine';
import { generateAlertsFromAudit, sendAuditAlertEmail } from '@/services/auditAlertService';
import AuditAlert from '@/models/AuditAlert';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const results = { audited: 0, failed: 0, alertsCreated: 0, emailsSent: 0 };

  // Get all active sites due for daily check
  const sites = await MonitoredSite.find({
    isActive: true,
    checkInterval: { $in: ['daily', 'manual'] },
  }).lean() as any[];

  // Auto-add vidyt.com if no sites configured yet
  if (sites.length === 0) {
    const vidytSite = await MonitoredSite.findOneAndUpdate(
      { url: 'https://www.vidyt.com' },
      {
        url: 'https://www.vidyt.com',
        name: 'VidYT (Main Site)',
        isOwned: true,
        isActive: true,
        checkInterval: 'daily',
        alertThreshold: 60,
        addedBy: 'system',
      },
      { upsert: true, new: true },
    ).lean() as any;
    if (vidytSite) sites.push(vidytSite);
  }

  // Collect current server metrics once
  const serverMetrics = await getServerMetrics();

  for (const site of sites) {
    const startTime = Date.now();
    const prevAudit = await WebsiteAudit.findOne({ url: site.url, status: 'completed' })
      .sort({ createdAt: -1 })
      .select('overallScore')
      .lean() as any;

    const auditDoc = await WebsiteAudit.create({
      url: site.url,
      type: 'cron',
      status: 'running',
      triggeredBy: 'cron',
      previousScore: prevAudit?.overallScore,
    });

    try {
      const result = await runAudit(site.url, site.isOwned);

      // Inject real server metrics for owned sites
      if (site.isOwned) {
        result.server = serverMetrics;
      }

      const scoreDelta = prevAudit?.overallScore !== undefined
        ? result.overallScore - prevAudit.overallScore
        : undefined;

      await WebsiteAudit.findByIdAndUpdate(auditDoc._id, {
        status: 'completed',
        overallScore: result.overallScore,
        performance: result.performance,
        seo: result.seo,
        security: result.security,
        server: result.server,
        issues: result.issues,
        scoreDelta,
        duration: Date.now() - startTime,
      });

      // Update 7-day rolling average
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000);
      const recentScores = await WebsiteAudit.find({
        url: site.url,
        status: 'completed',
        createdAt: { $gte: sevenDaysAgo },
      }).select('overallScore').lean() as any[];

      const avg7d = recentScores.length
        ? Math.round(recentScores.reduce((s, a) => s + a.overallScore, 0) / recentScores.length)
        : result.overallScore;

      await MonitoredSite.findByIdAndUpdate(site._id, {
        lastAuditAt: new Date(),
        lastAuditId: auditDoc._id,
        lastScore: result.overallScore,
        avgScore7d: avg7d,
      });

      await generateAlertsFromAudit(site.url, String(auditDoc._id), result, prevAudit?.overallScore);
      results.audited++;

    } catch (err: any) {
      await WebsiteAudit.findByIdAndUpdate(auditDoc._id, {
        status: 'failed',
        errorMessage: err.message,
        duration: Date.now() - startTime,
      });

      // Downtime alert
      await AuditAlert.create({
        siteUrl: site.url,
        auditId: auditDoc._id,
        type: 'downtime',
        severity: 'critical',
        title: 'Site may be down or unreachable',
        message: `Audit failed: ${err.message}. Site "${site.name}" could not be reached.`,
        details: { error: err.message },
      });

      results.failed++;
    }
  }

  // Send email for unacknowledged critical alerts from today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const criticalAlerts = await AuditAlert.find({
    severity: 'critical',
    acknowledged: false,
    emailSent: false,
    createdAt: { $gte: todayStart },
  }).lean() as any[];

  for (const alert of criticalAlerts) {
    const sent = await sendAuditAlertEmail(alert);
    if (sent) {
      await AuditAlert.findByIdAndUpdate(alert._id, { emailSent: true, emailSentAt: new Date() });
      results.emailsSent++;
    }
  }

  results.alertsCreated = criticalAlerts.length;
  return NextResponse.json({ success: true, results });
}
