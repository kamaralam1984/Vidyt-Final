import axios from 'axios';

export type ViralAiPredictInput = {
  title?: string;
  description?: string;
  hashtags?: string[];
  duration?: number;
  platform?: string;
  category?: string;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  thumbnail_score?: number;
  hook_score?: number;
  title_score?: number;
  trending_score?: number;
};

export type ViralAiPredictOutput = {
  viral_probability: number;
  confidence: number;
  suggestions: string[];
  model_version: string;
  provider: 'python_ml';
};

const DEFAULT_TIMEOUT_MS = 6000;

function getServiceUrl(): string {
  return (process.env.VIRAL_AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
}

export async function predictWithPythonService(input: ViralAiPredictInput): Promise<ViralAiPredictOutput | null> {
  const url = `${getServiceUrl()}/ai/predict`;
  if (process.env.AI_TEST_MODE === 'true') {
    // In unit/integration tests we don't want long network timeouts.
    // Simulate python being down by returning null (triggers Node fallback).
    const mode = process.env.AI_PYTHON_TEST_MODE || 'down'; // 'down' | 'up'
    if (mode === 'down') return null;
    return {
      viral_probability: 55,
      confidence: 70,
      suggestions: ['Mock suggestion 1', 'Mock suggestion 2'],
      model_version: 'test_v1',
      provider: 'python_ml',
    };
  }

  try {
    const { data } = await axios.post(url, input, { timeout: DEFAULT_TIMEOUT_MS });
    if (typeof data?.viral_probability !== 'number') return null;
    return data as ViralAiPredictOutput;
  } catch (e) {
    console.error('[predictWithPythonService] python call failed', e instanceof Error ? e.message : e);
    return null;
  }
}

export type ViralAiTrainSample = {
  title: string;
  description?: string;
  hashtags?: string[];
  duration?: number;
  platform?: string;
  category?: string;
  views?: number;
  likes?: number;
  comments?: number;
  thumbnail_score?: number;
  hook_score?: number;
  title_score?: number;
  trending_score?: number;
  viral_label?: number;
};

export async function trainPythonModel(samples: ViralAiTrainSample[], minSamples = 100) {
  const url = `${getServiceUrl()}/ai/train`;
  if (process.env.AI_TEST_MODE === 'true') {
    return { ok: true, mockTrain: true, minSamples, samplesCount: samples.length };
  }
  const { data } = await axios.post(
    url,
    { samples, min_samples: minSamples },
    { timeout: 30000 }
  );
  return data;
}
