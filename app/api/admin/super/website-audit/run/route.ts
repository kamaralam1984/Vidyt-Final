export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 120s timeout for Lighthouse audit

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import WebsiteAudit from '@/models/WebsiteAudit';
import MonitoredSite from '@/models/MonitoredSite';
import { runAudit } from '@/services/auditEngine';
import { generateAlertsFromAudit } from '@/services/auditAlertService';

export async function POST(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();
  const rawUrl = body.url;
  const includeServer = body.includeServer === true;

  if (!rawUrl) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  let url = rawUrl.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  url = url.replace(/\/$/, '');

  // Get previous score for comparison
  const prevAudit = await WebsiteAudit.findOne({ url, status: 'completed' })
    .sort({ createdAt: -1 })
    .select('overallScore')
    .lean() as any;

  // Create audit record in 'running' state
  const auditDoc = await WebsiteAudit.create({
    url,
    type: body.type || 'manual',
    status: 'running',
    triggeredBy: authUser.name || authUser.email || 'Super Admin',
    previousScore: prevAudit?.overallScore,
  });

  const startTime = Date.now();

  try {
    const result = await runAudit(url, includeServer);

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

    // Update monitored site record
    await MonitoredSite.findOneAndUpdate(
      { url },
      {
        lastAuditAt: new Date(),
        lastAuditId: auditDoc._id,
        lastScore: result.overallScore,
      },
      { upsert: false },
    );

    // Generate alerts
    await generateAlertsFromAudit(url, String(auditDoc._id), result, prevAudit?.overallScore);

    const updated = await WebsiteAudit.findById(auditDoc._id).lean();
    return NextResponse.json({ success: true, audit: updated });

  } catch (err: any) {
    await WebsiteAudit.findByIdAndUpdate(auditDoc._id, {
      status: 'failed',
      errorMessage: err.message,
      duration: Date.now() - startTime,
    });
    return NextResponse.json({ error: err.message || 'Audit failed' }, { status: 500 });
  }
}
