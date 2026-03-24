export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AIModelVersion from '@/models/AIModelVersion';
import TrainingMetrics from '@/models/TrainingMetrics';
import { trainModel as trainViralModel } from '@/services/ml/viralModel';
import { getTrainingDataFromViralDataset } from '@/services/ml/trainingData';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const latest = await AIModelVersion.findOne()
      .sort({ createdAt: -1 })
      .lean() as { metricsId?: unknown; status: string; version: string; path?: string; trainedAt?: Date; epochs?: number; batchSize?: number; learningRate?: number; validationSplit?: number } | null;
    if (!latest) {
      return NextResponse.json({
        success: true,
        status: 'no_model',
        version: null,
        metrics: null,
        message: 'No model trained yet.',
      });
    }

    type MetricsLean = { accuracy?: number; precision?: number; recall?: number; f1Score?: number; loss?: number; valAccuracy?: number; valLoss?: number; epochsRun?: number; samplesUsed?: number } | null;
    let metrics: MetricsLean = null;
    if (latest.metricsId) {
      metrics = (await TrainingMetrics.findById(latest.metricsId).lean()) as MetricsLean;
    }

    return NextResponse.json({
      success: true,
      status: latest.status,
      version: latest.version,
      path: latest.path,
      trainedAt: latest.trainedAt,
      epochs: latest.epochs,
      batchSize: latest.batchSize,
      learningRate: latest.learningRate,
      validationSplit: latest.validationSplit,
      metrics: metrics
        ? {
            accuracy: metrics.accuracy,
            precision: metrics.precision,
            recall: metrics.recall,
            f1Score: metrics.f1Score,
            loss: metrics.loss,
            valAccuracy: metrics.valAccuracy,
            valLoss: metrics.valLoss,
            epochsRun: metrics.epochsRun,
            samplesUsed: metrics.samplesUsed,
          }
        : null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get model status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findById(authUser.id).select('subscription').lean();
    if (user?.subscription !== 'enterprise') {
      return NextResponse.json(
        { error: 'Model training is available for Enterprise plan only' },
        { status: 403 }
      );
    }

    const samples = await getTrainingDataFromViralDataset(5000);
    if (samples.length < 50) {
      return NextResponse.json(
        { error: 'Insufficient viral dataset. Need at least 50 samples.' },
        { status: 400 }
      );
    }

    const versions = (await AIModelVersion.find().select('version').lean()) as unknown as { version: string }[];
    const versionNumbers = versions.map((v) => parseInt((v.version || 'v0').replace(/\D/g, ''), 10) || 0);
    const nextNum = versions.length === 0 ? 1 : Math.max(...versionNumbers) + 1;
    const version = `model_v${nextNum}`;

    const result = await trainViralModel(samples, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      version,
    });

    const metricsDoc = await TrainingMetrics.create({
      modelVersion: result.version,
      accuracy: result.accuracy,
      precision: result.precision,
      recall: result.recall,
      f1Score: result.f1Score,
      loss: result.loss,
      valAccuracy: result.valAccuracy,
      valLoss: result.valLoss,
      epochsRun: result.epochsRun,
      samplesUsed: result.samplesUsed,
    });

    const modelDir = (await import('@/services/ml/viralModel')).getModelDir();
    await AIModelVersion.create({
      version: result.version,
      path: `${modelDir}/${result.version}`,
      status: 'ready',
      epochs: 50,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2,
      trainedAt: new Date(),
      metricsId: metricsDoc._id,
    });

    return NextResponse.json({
      success: true,
      message: 'Model training completed.',
      version: result.version,
      metrics: {
        accuracy: result.accuracy,
        precision: result.precision,
        recall: result.recall,
        f1Score: result.f1Score,
        loss: result.loss,
        valAccuracy: result.valAccuracy,
        valLoss: result.valLoss,
        epochsRun: result.epochsRun,
        samplesUsed: result.samplesUsed,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Training failed. Ensure sufficient viral dataset (50+ samples).';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
