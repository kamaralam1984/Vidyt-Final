export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import BulkEmailCampaign from '@/models/BulkEmailCampaign';
import EmailSuppression from '@/models/EmailSuppression';
import nodemailer from 'nodemailer';
import {
  getUnsubscribeFooterHtml,
  getUnsubscribeHeaders,
} from '@/lib/unsubscribe';

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

// POST /api/admin/super/bulk-email/send
// body: { subject, body, recipients: string (newline/comma separated), rateLimit? (emails/min, default 30) }
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    const { subject, body, recipients, rateLimit = 30 } = await req.json();

    if (!subject?.trim()) return NextResponse.json({ error: 'subject required' }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 });

    const emails = parseEmails(recipients || '');
    if (emails.length === 0) return NextResponse.json({ error: 'No valid recipients' }, { status: 400 });
    if (emails.length > 5000) return NextResponse.json({ error: 'Max 5000 recipients per campaign' }, { status: 400 });

    await connectDB();

    // Drop addresses that have unsubscribed. Skipping at send time keeps us
    // CAN-SPAM and GDPR compliant — once a recipient unsubscribes, no future
    // marketing campaign should reach them.
    const suppressions = await EmailSuppression.find({ email: { $in: emails } })
      .select('email')
      .lean();
    const suppressedSet = new Set(suppressions.map((s: any) => String(s.email).toLowerCase()));
    const recipientsToSend = emails.filter((e) => !suppressedSet.has(e));
    const skippedCount = emails.length - recipientsToSend.length;

    if (recipientsToSend.length === 0) {
      return NextResponse.json(
        { error: 'All recipients are unsubscribed', skipped: skippedCount },
        { status: 400 }
      );
    }

    const safeRate = Math.min(Math.max(Number(rateLimit) || 30, 1), 100);
    const delayMs = Math.floor(60000 / safeRate); // ms between each email

    const campaign = await BulkEmailCampaign.create({
      subject,
      body,
      recipients: recipientsToSend,
      status: 'sending',
    });

    const transporter = createTransport();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    // Fire-and-forget — don't await so the HTTP response returns immediately
    (async () => {
      let sentCount = 0;
      let failedCount = 0;
      const logs: { email: string; status: 'sent' | 'failed'; error?: string; sentAt: Date }[] = [];

      for (const email of recipientsToSend) {
        try {
          // Append per-recipient unsubscribe footer (CAN-SPAM requirement)
          // and One-Click List-Unsubscribe headers (Gmail/Yahoo bulk-sender
          // requirement, RFC 8058).
          const footer = getUnsubscribeFooterHtml(email);
          const htmlWithFooter = /<\/body\s*>/i.test(body)
            ? body.replace(/<\/body\s*>/i, `${footer}</body>`)
            : `${body}${footer}`;
          const headers = getUnsubscribeHeaders(email);

          await transporter.sendMail({ from, to: email, subject, html: htmlWithFooter, headers });
          logs.push({ email, status: 'sent', sentAt: new Date() });
          sentCount++;
        } catch (err: any) {
          logs.push({ email, status: 'failed', error: err.message, sentAt: new Date() });
          failedCount++;
        }
        if (delayMs > 0) await sleep(delayMs);
      }

      await BulkEmailCampaign.findByIdAndUpdate(campaign._id, {
        status: 'done',
        sentCount,
        failedCount,
        $push: { logs: { $each: logs } },
      });
    })();

    return NextResponse.json({
      campaignId: campaign._id,
      total: recipientsToSend.length,
      skipped: skippedCount,
      status: 'sending',
    });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
