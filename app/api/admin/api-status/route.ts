export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';

type ApiStatus = {
  id: string;
  name: string;
  hasKey: boolean;
  status: 'no-key' | 'ok' | 'error';
  message: string;
  limitInfo: string;
  usedBy: string[];
};

/** Fetch with timeout (default 8s) */
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Check a single API and return its status */
async function checkApi(def: {
  id: string; name: string; key: string | undefined;
  limitInfo: string; usedBy: string[];
  testFn?: (key: string) => Promise<{ ok: boolean; message: string }>;
  noKeyMsg?: string;
}): Promise<ApiStatus> {
  const k = def.key?.trim() || '';
  const item: ApiStatus = {
    id: def.id, name: def.name, hasKey: !!k,
    status: k ? 'ok' : 'no-key',
    message: k ? 'Key present.' : (def.noKeyMsg || 'Key missing.'),
    limitInfo: def.limitInfo, usedBy: def.usedBy,
  };
  if (k && def.testFn) {
    try {
      const result = await def.testFn(k);
      item.status = result.ok ? 'ok' : 'error';
      item.message = result.message.slice(0, 160);
    } catch (e: any) {
      item.status = 'error';
      item.message = (e?.name === 'AbortError' ? 'Connection timed out (8s).' : (e.message || 'Check failed')).slice(0, 160);
    }
  }
  return item;
}

/** Simple bearer-auth test against a URL */
function bearerTest(url: string, label: string) {
  return async (key: string) => {
    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${key}` } });
    return res.ok
      ? { ok: true, message: `Live auth OK.` }
      : { ok: false, message: `HTTP ${res.status} from ${label}` };
  };
}

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await getApiConfig();

  // Define all API checks
  const apiDefs = [
    {
      id: 'youtube', name: 'YouTube Data API v3', key: config.youtubeDataApiKey,
      limitInfo: 'Default ~10,000 quota units/day per project (YouTube console).',
      usedBy: ['YouTube Live SEO Analyzer', 'Best Posting Time', 'Daily Ideas (trending)'],
      testFn: async (key: string) => {
        const url = `https://www.googleapis.com/youtube/v3/videos?key=${encodeURIComponent(key)}&part=id&chart=mostPopular&maxResults=1&regionCode=IN`;
        const res = await fetchWithTimeout(url);
        if (res.ok) return { ok: true, message: 'Live test OK (mostPopular fetch succeeded).' };
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data?.error?.message || `HTTP ${res.status} from YouTube` };
      },
    },
    {
      id: 'openai', name: 'OpenAI API', key: config.openaiApiKey,
      limitInfo: 'Usage-based pricing; rate limits depend on your OpenAI plan.',
      usedBy: ['AI Studio tools', 'Video Analyze (Whisper)', 'Daily Ideas'],
      testFn: async (key: string) => {
        const res = await fetchWithTimeout('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) return { ok: true, message: 'Live test OK (models.list succeeded).' };
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data?.error?.message || `HTTP ${res.status} from OpenAI` };
      },
    },
    {
      id: 'gemini', name: 'Google Gemini API', key: config.googleGeminiApiKey,
      limitInfo: 'Free tier and paid limits vary. See Google AI Studio quotas.',
      usedBy: ['Chinki chat assistant', 'Video Analyze (fallback)', 'Daily Ideas'],
      testFn: async (key: string) => {
        const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
        if (res.ok) return { ok: true, message: 'Live test OK (models list succeeded).' };
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data?.error?.message || `HTTP ${res.status} from Gemini` };
      },
    },
    {
      id: 'resend', name: 'Resend Email API', key: config.resendApiKey,
      limitInfo: 'Per-day and per-minute limits depending on plan; see Resend dashboard.',
      usedBy: ['Auth emails (OTP, password reset)', 'Payment receipts', 'Admin notifications'],
      testFn: async (key: string) => {
        const res = await fetchWithTimeout('https://api.resend.com/emails?limit=1', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) return { ok: true, message: 'Live test OK (emails list endpoint).' };
        const data = await res.json().catch(() => ({}));
        const msg = data?.message || `HTTP ${res.status} from Resend`;
        if (res.status === 403 && msg.toLowerCase().includes('restricted to only send emails')) {
          return { ok: true, message: 'Key verified (Restricted to sending only).' };
        }
        return { ok: false, message: msg };
      },
    },
    {
      id: 'assemblyai', name: 'AssemblyAI', key: config.assemblyaiApiKey,
      limitInfo: 'Minutes of audio per month based on your AssemblyAI plan.',
      usedBy: ['Shorts Creator (alternative transcription)'],
      testFn: async (key: string) => {
        const res = await fetchWithTimeout('https://api.assemblyai.com/v2/transcript?limit=1', {
          headers: { Authorization: key },
        });
        if (res.ok) return { ok: true, message: 'Live test OK (transcript list).' };
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data?.error || `HTTP ${res.status} from AssemblyAI` };
      },
    },
    {
      id: 'sentry_client', name: 'Sentry DSN (client)', key: config.sentryDsn,
      limitInfo: 'Sentry pricing & event limits depend on your Sentry plan.',
      usedBy: ['Next.js frontend (React) error tracking'],
      noKeyMsg: 'Not set – frontend errors will not be tracked in Sentry.',
    },
    {
      id: 'sentry_server', name: 'Sentry Server DSN', key: config.sentryServerDsn,
      limitInfo: 'Sentry pricing & event limits depend on your Sentry plan.',
      usedBy: ['Next.js API routes and server-side error tracking'],
      noKeyMsg: 'Not set – backend errors will not be tracked in Sentry.',
    },
    {
      id: 'paypal', name: 'PayPal API',
      key: config.paypalClientId || config.paypalClientSecret,
      limitInfo: 'PayPal rate limits depend on merchant account status.',
      usedBy: ['Checkout API', 'Webhook endpoint for subscriptions'],
      noKeyMsg: 'Not set – PayPal payments are disabled.',
      testFn: config.paypalClientId && config.paypalClientSecret ? async () => {
        const basicAuth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
        const res = await fetchWithTimeout('https://api-m.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
        });
        if (res.ok) return { ok: true, message: 'Live auth OK. Valid Client ID and Secret.' };
        const data = await res.json().catch(() => ({}));
        return { ok: false, message: data.error_description || `HTTP ${res.status} from PayPal` };
      } : undefined,
    },
    {
      id: 'groq', name: 'Groq API', key: config.groqApiKey,
      limitInfo: 'High speed inference. RPM limits based on tiers.',
      usedBy: ['Language inference fallback for fast models (e.g. LLaMA 3)'],
      testFn: bearerTest('https://api.groq.com/openai/v1/models', 'Groq'),
    },
    {
      id: 'openrouter', name: 'OpenRouter API', key: config.openrouterApiKey,
      limitInfo: 'Extensive model routing. Limits vary by provider.',
      usedBy: ['Fallback and aggregated LLM access'],
      testFn: bearerTest('https://openrouter.ai/api/v1/auth/key', 'OpenRouter'),
    },
    {
      id: 'mistral', name: 'Mistral API', key: config.mistralApiKey,
      limitInfo: 'Refer to Mistral developer console.', usedBy: ['Mistral LLM Backup'],
      testFn: bearerTest('https://api.mistral.ai/v1/models', 'Mistral'),
    },
    {
      id: 'cohere', name: 'Cohere API', key: config.cohereApiKey,
      limitInfo: 'Refer to Cohere developer console.', usedBy: ['Cohere Command models backup'],
      testFn: bearerTest('https://api.cohere.com/v1/models', 'Cohere'),
    },
    {
      id: 'deepseek', name: 'DeepSeek API', key: config.deepseekApiKey,
      limitInfo: 'Refer to DeepSeek developer console.', usedBy: ['DeepSeek Chat fallback'],
      testFn: bearerTest('https://api.deepseek.com/models', 'DeepSeek'),
    },
    {
      id: 'together', name: 'Together AI API', key: config.togetherApiKey,
      limitInfo: 'Refer to Together developer console.', usedBy: ['Together inference backup'],
      testFn: bearerTest('https://api.together.xyz/v1/models', 'Together'),
    },
    {
      id: 'huggingface', name: 'HuggingFace API', key: config.huggingfaceApiKey,
      limitInfo: 'Refer to HuggingFace developer console.', usedBy: ['HF Inference fallback'],
    },
    {
      id: 'serpapi', name: 'SerpApi', key: config.serpapiKey,
      limitInfo: 'Refer to SerpApi developer console.', usedBy: ['Google/YouTube Search Fallback'],
    },
    {
      id: 'rapidapi', name: 'RapidAPI', key: config.rapidapiKey,
      limitInfo: 'Refer to RapidAPI developer console.', usedBy: ['YouTube 138 API endpoints'],
    },
  ];

  // Run ALL checks in parallel with 8s timeout each
  const out = await Promise.all(apiDefs.map(def => checkApi(def)));

  // Custom APIs (no live check needed)
  if (config.customApis) {
    for (const [k, v] of Object.entries(config.customApis)) {
      const keyVal = (v as string)?.trim();
      out.push({
        id: `custom_${k}`, name: `Custom API: ${k}`, hasKey: !!keyVal,
        status: keyVal ? 'ok' : 'no-key',
        message: keyVal ? 'Custom API key present.' : 'Empty value.',
        limitInfo: 'Custom defined limit', usedBy: ['Custom extension features'],
      });
    }
  }

  return NextResponse.json({ apis: out });
}

