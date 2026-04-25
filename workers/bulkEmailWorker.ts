/**
 * Bulk Email Scheduler Worker
 * Run: ts-node --project tsconfig.server.json workers/bulkEmailWorker.ts
 * Polls every 60s for campaigns with status='scheduled' whose scheduledAt <= now,
 * then sends them with rate limiting.
 */
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import BulkEmailCampaign from '../models/BulkEmailCampaign';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/viralboost';
const RATE_LIMIT = Number(process.env.BULK_EMAIL_RATE || 30); // emails per minute
const DELAY_MS = Math.floor(60000 / RATE_LIMIT);
const POLL_INTERVAL = 60_000;

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processCampaign(campaign: any) {
  const transporter = createTransport();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await BulkEmailCampaign.findByIdAndUpdate(campaign._id, { status: 'sending' });

  let sentCount = 0;
  let failedCount = 0;
  const logs: { email: string; status: 'sent' | 'failed'; error?: string; sentAt: Date }[] = [];

  for (const email of campaign.recipients as string[]) {
    try {
      await transporter.sendMail({ from, to: email, subject: campaign.subject, html: campaign.body });
      logs.push({ email, status: 'sent', sentAt: new Date() });
      sentCount++;
    } catch (err: any) {
      logs.push({ email, status: 'failed', error: err.message, sentAt: new Date() });
      failedCount++;
    }
    await sleep(DELAY_MS);
  }

  await BulkEmailCampaign.findByIdAndUpdate(campaign._id, {
    status: 'done',
    sentCount,
    failedCount,
    $push: { logs: { $each: logs } },
  });

  console.log(`[BulkEmail] Campaign ${campaign._id} done — sent: ${sentCount}, failed: ${failedCount}`);
}

async function poll() {
  try {
    const due = await BulkEmailCampaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    }).limit(5);

    for (const c of due) {
      console.log(`[BulkEmail] Processing scheduled campaign ${c._id}`);
      await processCampaign(c);
    }
  } catch (err) {
    console.error('[BulkEmail] Poll error:', err);
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('[BulkEmail] Worker started, polling every 60s');
  await poll();
  setInterval(poll, POLL_INTERVAL);
}

main().catch(console.error);
