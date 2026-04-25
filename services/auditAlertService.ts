/**
 * Audit Alert Service
 * Generates alerts from audit results and sends email notifications.
 */

import connectDB from '@/lib/mongodb';
import AuditAlert from '@/models/AuditAlert';
import type { AuditResult } from './auditEngine';

// ─────────────────────────────────────────────
// GENERATE ALERTS FROM AUDIT
// ─────────────────────────────────────────────

export async function generateAlertsFromAudit(
  siteUrl: string,
  auditId: string,
  result: AuditResult,
  previousScore?: number,
): Promise<void> {
  await connectDB();
  const alerts: any[] = [];

  // Score drop alert
  if (previousScore !== undefined) {
    const delta = result.overallScore - previousScore;
    if (delta <= -20) {
      alerts.push({
        siteUrl, auditId,
        type: 'performance_drop',
        severity: 'critical',
        title: 'Major performance drop detected',
        message: `Overall score dropped by ${Math.abs(delta)} points (${previousScore} → ${result.overallScore}). Immediate investigation needed.`,
        details: { previousScore, newScore: result.overallScore, delta },
      });
    } else if (delta <= -10) {
      alerts.push({
        siteUrl, auditId,
        type: 'performance_drop',
        severity: 'warning',
        title: 'Performance score dropped',
        message: `Score dropped by ${Math.abs(delta)} points (${previousScore} → ${result.overallScore}).`,
        details: { previousScore, newScore: result.overallScore, delta },
      });
    }
  }

  // Critical score alert
  if (result.overallScore < 40) {
    alerts.push({
      siteUrl, auditId,
      type: 'score_critical',
      severity: 'critical',
      title: 'Overall audit score is critically low',
      message: `Website scored ${result.overallScore}/100. Multiple critical issues need immediate attention.`,
      details: { score: result.overallScore },
    });
  }

  // Security alerts
  if (!result.security.isHttps) {
    alerts.push({
      siteUrl, auditId,
      type: 'security_issue',
      severity: 'critical',
      title: 'Site is running without HTTPS',
      message: 'The website is not using HTTPS. All traffic is unencrypted.',
      details: { issue: 'no_https' },
    });
  }

  if (!result.security.hasCSP) {
    alerts.push({
      siteUrl, auditId,
      type: 'security_issue',
      severity: 'warning',
      title: 'Content Security Policy (CSP) header missing',
      message: 'Site is vulnerable to XSS attacks without a CSP header.',
      details: { issue: 'no_csp' },
    });
  }

  // Server alerts
  if (result.server.cpuUsage > 90) {
    alerts.push({
      siteUrl, auditId,
      type: 'server_high_load',
      severity: 'critical',
      title: 'Server CPU critically high',
      message: `CPU usage at ${result.server.cpuUsage}%. Server crash risk is HIGH.`,
      details: { cpu: result.server.cpuUsage },
    });
  }

  if (result.server.memoryPercent > 90) {
    alerts.push({
      siteUrl, auditId,
      type: 'server_high_load',
      severity: 'critical',
      title: 'Server memory critically low',
      message: `RAM usage at ${result.server.memoryPercent}% (${result.server.memoryUsed}/${result.server.memoryTotal} MB).`,
      details: { memoryPercent: result.server.memoryPercent },
    });
  }

  if (result.server.diskPercent > 90) {
    alerts.push({
      siteUrl, auditId,
      type: 'server_high_load',
      severity: 'critical',
      title: 'Disk space critically low',
      message: `Disk usage at ${result.server.diskPercent}%. Server may stop functioning.`,
      details: { diskPercent: result.server.diskPercent },
    });
  }

  // Insert all alerts (deduplicate: skip if same type+url exists unacknowledged in last 24h)
  const oneDayAgo = new Date(Date.now() - 86400 * 1000);
  for (const alert of alerts) {
    const existing = await AuditAlert.findOne({
      siteUrl: alert.siteUrl,
      type: alert.type,
      acknowledged: false,
      createdAt: { $gte: oneDayAgo },
    });
    if (!existing) {
      await AuditAlert.create(alert);
    }
  }
}

// ─────────────────────────────────────────────
// SEND EMAIL ALERT
// ─────────────────────────────────────────────

export async function sendAuditAlertEmail(alert: {
  type: string;
  severity: string;
  title: string;
  message: string;
  siteUrl: string;
}): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
    if (!adminEmail) return false;

    const severityColor: Record<string, string> = {
      critical: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };
    const color = severityColor[alert.severity] || '#666';
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f0f;color:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:${color};padding:16px 24px;">
          <h2 style="margin:0;font-size:18px;">${alert.severity.toUpperCase()} ALERT</h2>
        </div>
        <div style="padding:24px;">
          <h3 style="margin-top:0;color:#fff;">${alert.title}</h3>
          <p style="color:#aaa;">${alert.message}</p>
          <div style="background:#1a1a1a;border-radius:6px;padding:12px;margin-top:16px;">
            <p style="margin:0;font-size:13px;color:#888;"><strong style="color:#aaa;">Site:</strong> ${alert.siteUrl}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#888;"><strong style="color:#aaa;">Type:</strong> ${alert.type}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidyt.com'}/admin/super/website-audit"
             style="display:inline-block;margin-top:20px;padding:10px 20px;background:#fff;color:#000;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
            View in Dashboard
          </a>
        </div>
      </div>
    `;

    // Use nodemailer directly (same pattern as email.ts)
    const nodemailer = (await import('nodemailer')).default;
    const emailFrom = process.env.EMAIL_FROM || `"Vid YT" <${process.env.SMTP_USER}>`;

    // Try Resend first
    const { getApiConfig } = await import('@/lib/apiConfig');
    const config = await getApiConfig();
    if (config.resendApiKey?.trim()) {
      const { Resend } = await import('resend');
      const resend = new Resend(config.resendApiKey);
      const { error } = await resend.emails.send({
        from: emailFrom,
        to: adminEmail,
        subject: `[VidYT Alert] ${alert.severity.toUpperCase()}: ${alert.title}`,
        html,
      });
      if (!error) return true;
    }

    // Fallback to SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return false;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: emailFrom,
      to: adminEmail,
      subject: `[VidYT Alert] ${alert.severity.toUpperCase()}: ${alert.title}`,
      html,
    });
    return true;
  } catch {
    return false;
  }
}
