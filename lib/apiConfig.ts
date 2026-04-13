/**
 * Server-side API config: DB first, then process.env.
 * Use this in API routes and server code only.
 */

import connectDB from './mongodb';
import ApiConfig from '@/models/ApiConfig';

let cached: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_MS = 60 * 1000; // 1 min

export async function getApiConfig(): Promise<Record<string, any>> {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_MS) return cached;
  try {
    await connectDB();
    const doc = (await ApiConfig.findOne({ id: 'default' }).lean()) as any | null;
    const out: Record<string, any> = {
      youtubeDataApiKey: (doc?.youtubeDataApiKey as string)?.trim() || process.env.YOUTUBE_API_KEY || '',
      resendApiKey: (doc?.resendApiKey as string)?.trim() || process.env.RESEND_API_KEY || '',
      openaiApiKey: (doc?.openaiApiKey as string)?.trim() || process.env.OPENAI_API_KEY || '',
      assemblyaiApiKey: (doc?.assemblyaiApiKey as string)?.trim() || process.env.ASSEMBLYAI_API_KEY || '',
      googleGeminiApiKey: (doc?.googleGeminiApiKey as string)?.trim() || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      sentryDsn: (doc?.sentryDsn as string)?.trim() || process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      sentryServerDsn: (doc?.sentryServerDsn as string)?.trim() || process.env.SENTRY_SERVER_DSN || '',
      paypalClientId: (doc?.paypalClientId as string)?.trim() || process.env.PAYPAL_CLIENT_ID || '',
      paypalClientSecret: (doc?.paypalClientSecret as string)?.trim() || process.env.PAYPAL_CLIENT_SECRET || '',
      paypalWebhookId: (doc?.paypalWebhookId as string)?.trim() || process.env.PAYPAL_WEBHOOK_ID || '',
      groqApiKey: (doc?.groqApiKey as string)?.trim() || process.env.GROQ_API_KEY || '',
      openrouterApiKey: (doc?.openrouterApiKey as string)?.trim() || process.env.OPENROUTER_API_KEY || '',
      mistralApiKey: (doc?.mistralApiKey as string)?.trim() || process.env.MISTRAL_API_KEY || '',
      cohereApiKey: (doc?.cohereApiKey as string)?.trim() || process.env.COHERE_API_KEY || '',
      deepseekApiKey: (doc?.deepseekApiKey as string)?.trim() || process.env.DEEPSEEK_API_KEY || '',
      togetherApiKey: (doc?.togetherApiKey as string)?.trim() || process.env.TOGETHER_API_KEY || '',
      huggingfaceApiKey: (doc?.huggingfaceApiKey as string)?.trim() || process.env.HUGGINGFACE_API_KEY || '',
      serpapiKey: (doc?.serpapiKey as string)?.trim() || process.env.SERPAPI_KEY || '',
      rapidapiKey: (doc?.rapidapiKey as string)?.trim() || process.env.RAPIDAPI_KEY || '',
    };
    out.customApis = doc?.customApis || {};
    cached = out;
    cacheTime = now;
    return out;
  } catch {
    return {
      youtubeDataApiKey: process.env.YOUTUBE_API_KEY || '',
      resendApiKey: process.env.RESEND_API_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY || '',
      googleGeminiApiKey: process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      sentryDsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      sentryServerDsn: process.env.SENTRY_SERVER_DSN || '',
      paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
      paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',
      groqApiKey: process.env.GROQ_API_KEY || '',
      openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
      mistralApiKey: process.env.MISTRAL_API_KEY || '',
      cohereApiKey: process.env.COHERE_API_KEY || '',
      deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
      togetherApiKey: process.env.TOGETHER_API_KEY || '',
      huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
      serpapiKey: process.env.SERPAPI_KEY || '',
      rapidapiKey: process.env.RAPIDAPI_KEY || '',
      customApis: {},
    };
  }
}

export function clearApiConfigCache(): void {
  cached = null;
}
