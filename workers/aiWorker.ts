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

import { trainModel as trainNodeModel, TrainingSample } from '@/services/ml/viralModel';

async function handleTraining(job: Job) {
  await connectDB();
  
  // 1. Fetch data from ViralDataset
  const ds = await ViralDataset.find({})
    .sort({ collectedAt: -1 })
    .limit(2000)
    .lean();

  if (ds.length < 50) {
    return { ok: false, reason: 'Insufficient data for training (50+ samples required)' };
  }

  // 2. Transform to TrainingSamples
  const samples: TrainingSample[] = ds.map((d: any) => ({
    features: {
        hookScore: d.hookScore || 50,
        thumbnailScore: d.thumbnailScore || 50,
        titleScore: d.titleScore || 50,
        trendingScore: d.trendingScore || 50,
        videoDuration: d.duration || 60,
        engagementRate: d.engagementRate || 5,
        growthVelocity: d.growthVelocity || 100,
        commentVelocity: 10,
        likeRatio: (d.likes / (d.views || 1)) || 0.05,
        uploadTimingScore: 12,
    },
    isViral: !!d.isViral
  }));

  // 3. Trigger Node-based training
  console.log(`[aiWorker] Starting TensorFlow training on ${samples.length} samples...`);
  
  const version = `model_v${Date.now()}`;
  const result = await trainNodeModel(samples, {
      epochs: job.data?.epochs || 50,
      version
  });

  // 4. Update accuracy history (could be stored in a separate Monitoring model)
  console.log(`[aiWorker] Training complete. Accuracy: ${result.accuracy.toFixed(4)}, Loss: ${result.loss.toFixed(4)}`);
  
  return { 
    ok: true, 
    version,
    metrics: {
        accuracy: result.accuracy,
        loss: result.loss,
        valAccuracy: result.valAccuracy,
        valLoss: result.valLoss,
        mae: result.loss // BinaryCrossentropy is used, using loss as proxy for MAE in result
    }
  };
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
    concurrency: 2,
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
