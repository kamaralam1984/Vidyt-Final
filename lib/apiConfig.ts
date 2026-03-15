/**
 * Server-side API config: DB first, then process.env.
 * Use this in API routes and server code only.
 */

import connectDB from './mongodb';
import ApiConfig from '@/models/ApiConfig';

let cached: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_MS = 60 * 1000; // 1 min

export async function getApiConfig(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_MS) return cached;
  try {
    await connectDB();
    const doc = (await ApiConfig.findOne({ id: 'default' }).lean()) as Record<string, string | undefined> | null;
    const out: Record<string, string> = {
      youtubeDataApiKey: (doc?.youtubeDataApiKey as string)?.trim() || process.env.YOUTUBE_API_KEY || '',
      resendApiKey: (doc?.resendApiKey as string)?.trim() || process.env.RESEND_API_KEY || '',
      openaiApiKey: (doc?.openaiApiKey as string)?.trim() || process.env.OPENAI_API_KEY || '',
      assemblyaiApiKey: (doc?.assemblyaiApiKey as string)?.trim() || process.env.ASSEMBLYAI_API_KEY || '',
      googleGeminiApiKey: (doc?.googleGeminiApiKey as string)?.trim() || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      sentryDsn: (doc?.sentryDsn as string)?.trim() || process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      sentryServerDsn: (doc?.sentryServerDsn as string)?.trim() || process.env.SENTRY_SERVER_DSN || '',
      stripeSecretKey: (doc?.stripeSecretKey as string)?.trim() || process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: (doc?.stripeWebhookSecret as string)?.trim() || process.env.STRIPE_WEBHOOK_SECRET || '',
      stripePublishableKey: (doc?.stripePublishableKey as string)?.trim() || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    };
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
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    };
  }
}

export function clearApiConfigCache(): void {
  cached = null;
}
