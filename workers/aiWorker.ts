import { Worker, Job } from 'bullmq';
import connectDB from '@/lib/mongodb';
import AIJobLog from '@/models/AIJobLog';
import Ticket from '@/models/Ticket';
import TicketReply from '@/models/TicketReply';
import { analyzeAndDraftSupportReply } from '@/services/ai/supportAI';
import { getApiConfig } from '@/lib/apiConfig';
import { trainPythonModel } from '@/services/ai/viralPredictionService';
import ViralDataset from '@/models/ViralDataset';
import { getLabeledPredictionTrainingSamples } from '@/services/ml/trainingData';
import { AI_QUEUE } from '@/lib/queue';
import ViralPrediction from '@/models/ViralPrediction';

function getBullConnection() {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

async function markLog(job: Job, status: 'processing' | 'completed' | 'failed', output?: Record<string, any>, error?: string) {
  try {
    await connectDB();
    await AIJobLog.findOneAndUpdate(
      { queueJobId: String(job.id) },
      {
        $set: {
          status,
          output: output || {},
          error: error || undefined,
          attempts: job.attemptsMade,
        },
      }
    );
  } catch {
    console.error('[aiWorker] markLog failed', {
      jobId: String(job?.id),
      status,
      error,
    });
  }
}

async function handleSupportAi(job: Job) {
  const { ticketId } = job.data || {};
  if (!ticketId) return { ok: false, reason: 'missing ticketId' };

  await connectDB();
  const ticket: any = await Ticket.findById(ticketId);
  if (!ticket) return { ok: false, reason: 'ticket not found' };

  const cfg = await getApiConfig();
  if (!cfg.openaiApiKey) return { ok: false, reason: 'OpenAI key missing' };

  const ai = await analyzeAndDraftSupportReply({
    apiKey: cfg.openaiApiKey,
    subject: ticket.subject,
    message: ticket.message,
    userPlan: 'free',
    confidenceThreshold: Number(job.data?.confidenceThreshold ?? 0.75),
  });

  ticket.category = ai.category;
  ticket.aiConfidence = ai.confidence;
  ticket.aiAutoReplied = ai.shouldAutoReply;
  ticket.assignedToAdmin = !ai.shouldAutoReply;
  if (ai.shouldAutoReply && ai.aiReply) {
    await TicketReply.create({
      ticketId: ticket._id,
      sender: 'ai',
      message: ai.aiReply,
    });
    ticket.aiLastReplyAt = new Date();
  }
  await ticket.save();

  return { ok: true, ...ai };
}

async function handleTraining(job: Job) {
  if (process.env.AI_TEST_MODE === 'true') {
    // Test mode: avoid heavy python calls; still validate queue/worker wiring.
    return { ok: true, mockTrain: true, minSamples: job.data?.minSamples ?? 100 };
  }

  await connectDB();
  const labeled = await getLabeledPredictionTrainingSamples(2500);
  const ds = await ViralDataset.find({})
    .select('title description hashtags duration platform metadata views likes comments hookScore thumbnailScore titleScore trendingScore isViral')
    .sort({ collectedAt: -1 })
    .limit(5000)
    .lean();

  const fromDs = ds.map((d: any) => ({
    title: String(d.title || ''),
    description: String(d.description || ''),
    hashtags: Array.isArray(d.hashtags) ? d.hashtags : [],
    duration: Number(d.duration || 0),
    platform: String(d.platform || 'youtube'),
    category: String(d?.metadata?.category || 'general'),
    views: Number(d.views || 0),
    likes: Number(d.likes || 0),
    comments: Number(d.comments || 0),
    thumbnail_score: Number(d.thumbnailScore || 50),
    hook_score: Number(d.hookScore || 50),
    title_score: Number(d.titleScore || 50),
    trending_score: Number(d.trendingScore || 50),
    viral_label: d.isViral ? 1 : 0,
  }));

  const samples = [...labeled, ...fromDs].slice(0, 5000);

  const result = await trainPythonModel(samples, Number(job.data?.minSamples || 100));
  return { ok: true, result };
}

async function handlePrediction(job: Job) {
  await connectDB();
  const {
    predictionId,
    provider,
    modelVersion,
    viralProbability,
    confidence,
  } = job.data || {};

  if (!predictionId) return { ok: false, reason: 'missing predictionId' };

  const updated = await ViralPrediction.findByIdAndUpdate(
    predictionId,
    {
      $set: {
        sourceProvider: provider ?? 'internal_ensemble',
        modelVersion: modelVersion ?? 'v0',
        viralProbability: typeof viralProbability === 'number' ? viralProbability : undefined,
        confidence: typeof confidence === 'number' ? confidence : undefined,
      },
    },
    { new: true }
  );

  if (!updated) return { ok: false, reason: 'prediction not found' };
  return { ok: true };
}

export async function processJob(job: Job) {
  await markLog(job, 'processing');
  try {
    let result: any = { ok: true };
    if (job.name === 'prediction') result = await handlePrediction(job);
    if (job.name === 'support_ai') result = await handleSupportAi(job);
    if (job.name === 'training') result = await handleTraining(job);
    await markLog(job, 'completed', result);
    return result;
  } catch (e: any) {
    await markLog(job, 'failed', {}, e?.message || 'Job failed');
    throw e;
  }
}

export async function startAiWorker() {
  const worker = new Worker(AI_QUEUE, processJob, {
    connection: getBullConnection(),
    concurrency: 5,
  });

  worker.on('ready', () => console.log('[aiWorker] ready'));
  worker.on('failed', (job, err) => console.error('[aiWorker] failed', job?.id, err?.message));
  worker.on('stalled', (jobId: string) => {
    console.warn('[aiWorker] job stalled', jobId);
    // BullMQ will retry/requeue stalled jobs automatically; we just persist observability.
    markLog({ id: jobId, attemptsMade: 0 } as unknown as Job, 'failed', {}, 'stalled').catch(() => {});
  });

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });

  return worker;
}

if (process.env.AI_WORKER_START !== 'false') {
  startAiWorker().catch((e) => console.error('[aiWorker] start failed', e));
}
