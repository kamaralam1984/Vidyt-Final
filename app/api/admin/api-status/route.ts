export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';

type ApiId =
  | 'youtube'
  | 'openai'
  | 'gemini'
  | 'resend'
  | 'assemblyai'
  | 'sentry_client'
  | 'sentry_server'
  | 'stripe'
  | 'paypal'
  | 'groq'
  | 'openrouter'
  | 'mistral'
  | 'cohere'
  | 'deepseek'
  | 'together'
  | 'huggingface'
  | 'serpapi'
  | 'rapidapi'
  | string;

type ApiStatus = {
  id: ApiId;
  name: string;
  hasKey: boolean;
  status: 'no-key' | 'ok' | 'error';
  message: string;
  limitInfo: string;
  usedBy: string[];
};

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await getApiConfig();
  const out: ApiStatus[] = [];

  // YouTube Data API
  {
    const apiKey = config.youtubeDataApiKey?.trim();
    const item: ApiStatus = {
      id: 'youtube',
      name: 'YouTube Data API v3',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet.' : 'Key missing (Super Admin → API Config).',
      limitInfo: 'Default ~10,000 quota units/day per project (YouTube console).',
      usedBy: [
        'YouTube Live SEO Analyzer (channel summary, competitors)',
        'Best Posting Time (YouTube channel)',
        'Daily Ideas (YouTube trending titles)',
      ],
    };
    if (apiKey) {
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            key: apiKey,
            part: 'id',
            chart: 'mostPopular',
            maxResults: 1,
            regionCode: 'IN',
          },
          timeout: 8000,
        });
        if (res.status === 200) {
          item.status = 'ok';
          item.message = 'Live test OK (mostPopular fetch succeeded).';
        } else {
          item.status = 'error';
          item.message = `HTTP ${res.status} from YouTube.`;
        }
      } catch (e: any) {
        item.status = 'error';
        const msg: string = e?.response?.data?.error?.message || e.message || 'YouTube request failed';
        item.message = msg.slice(0, 160);
      }
    }
    out.push(item);
  }

  // OpenAI
  {
    const apiKey = config.openaiApiKey?.trim();
    const item: ApiStatus = {
      id: 'openai',
      name: 'OpenAI API',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet.' : 'Key missing (Super Admin → API Config).',
      limitInfo: 'Usage-based pricing; per-minute rate limits depend on your OpenAI account and plan.',
      usedBy: [
        'AI Studio tools (Script, Hooks, Thumbnails, Shorts)',
        'Video Analyze (Whisper transcription)',
        'Channel Audit Q&A (fallback if Gemini off)',
        'Daily Ideas (topic ideas from trending)',
      ],
    };
    if (apiKey) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey, timeout: 8000 });
        await openai.models.list();
        item.status = 'ok';
        item.message = 'Live test OK (models.list succeeded).';
      } catch (e: any) {
        item.status = 'error';
        const msg: string = e?.response?.data?.error?.message || e.message || 'OpenAI request failed';
        item.message = msg.slice(0, 160);
      }
    }
    out.push(item);
  }

  // Gemini
  {
    const apiKey = config.googleGeminiApiKey?.trim();
    const item: ApiStatus = {
      id: 'gemini',
      name: 'Google Gemini API',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet.' : 'Key missing (Super Admin → API Config).',
      limitInfo: 'Free tier and paid limits vary; common default is tens of requests per minute. See Google AI Studio quotas.',
      usedBy: [
        'Chinki chat assistant',
        'Channel Audit Q&A (if OpenAI off)',
        'Video Analyze (metadata suggestions, fallback)',
        'Daily Ideas (topic ideas from trending)',
      ],
    };
    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          { method: 'GET' }
        );
        if (res.ok) {
          item.status = 'ok';
          item.message = 'Live test OK (models list succeeded).';
        } else {
          const data = await res.json().catch(() => ({}));
          item.status = 'error';
          const msg: string = data?.error?.message || `HTTP ${res.status} from Gemini`;
          item.message = msg.slice(0, 160);
        }
      } catch (e: any) {
        item.status = 'error';
        const msg: string = e?.message || 'Gemini request failed';
        item.message = msg.slice(0, 160);
      }
    }
    out.push(item);
  }

  // Resend
  {
    const apiKey = config.resendApiKey?.trim();
    const item: ApiStatus = {
      id: 'resend',
      name: 'Resend Email API',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet.' : 'Key missing (Super Admin → API Config).',
      limitInfo: 'Resend has per-day and per-minute limits depending on plan; see Resend dashboard.',
      usedBy: [
        'Auth emails (OTP, password reset)',
        'Payment receipts & subscription notifications',
        'Super Admin broadcast notifications',
      ],
    };
    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails?limit=1', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        if (res.ok) {
          item.status = 'ok';
          item.message = 'Live test OK (emails list endpoint).';
        } else {
          const data = await res.json().catch(() => ({}));
          const msg: string = data?.message || `HTTP ${res.status} from Resend`;

          // Handle restricted "Sending" keys
          if (res.status === 403 && msg.toLowerCase().includes('restricted to only send emails')) {
            item.status = 'ok';
            item.message = 'Key verified (Restricted to sending only).';
          } else {
            item.status = 'error';
            item.message = msg.slice(0, 160);
          }
        }
      } catch (e: any) {
        item.status = 'error';
        const msg: string = e?.message || 'Resend request failed';
        item.message = msg.slice(0, 160);
      }
    }
    out.push(item);
  }

  // AssemblyAI
  {
    const apiKey = config.assemblyaiApiKey?.trim();
    const item: ApiStatus = {
      id: 'assemblyai',
      name: 'AssemblyAI',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet.' : 'Key missing (Super Admin → API Config).',
      limitInfo: 'Minutes of audio per month based on your AssemblyAI plan.',
      usedBy: ['Shorts Creator (alternative transcription)'],
    };
    if (apiKey) {
      try {
        const res = await fetch('https://api.assemblyai.com/v2/transcript?limit=1', {
          headers: {
            Authorization: apiKey,
          },
        });
        if (res.ok || res.status === 200) {
          item.status = 'ok';
          item.message = 'Live test OK (transcript list).';
        } else {
          const data = await res.json().catch(() => ({}));
          item.status = 'error';
          const msg: string = data?.error || `HTTP ${res.status} from AssemblyAI`;
          item.message = msg.slice(0, 160);
        }
      } catch (e: any) {
        item.status = 'error';
        const msg: string = e?.message || 'AssemblyAI request failed';
        item.message = msg.slice(0, 160);
      }
    }
    out.push(item);
  }

  // Sentry client DSN (no live ping, just presence)
  {
    const dsn = config.sentryDsn?.trim();
    const item: ApiStatus = {
      id: 'sentry_client',
      name: 'Sentry DSN (client)',
      hasKey: !!dsn,
      status: dsn ? 'ok' : 'no-key',
      message: dsn
        ? 'Key set. Frontend errors will be sent to this Sentry project (verify in Sentry dashboard).'
        : 'Not set – frontend JavaScript errors will not be tracked in Sentry.',
      limitInfo: 'Sentry pricing & event limits depend on your Sentry plan.',
      usedBy: ['Next.js frontend (React) error tracking'],
    };
    out.push(item);
  }

  // Sentry server DSN (no live ping)
  {
    const dsn = config.sentryServerDsn?.trim();
    const item: ApiStatus = {
      id: 'sentry_server',
      name: 'Sentry Server DSN',
      hasKey: !!dsn,
      status: dsn ? 'ok' : 'no-key',
      message: dsn
        ? 'Key set. Backend/API errors will be sent to Sentry (verify in Sentry dashboard).'
        : 'Not set – backend/API errors will not be tracked in Sentry.',
      limitInfo: 'Sentry pricing & event limits depend on your Sentry plan.',
      usedBy: ['Next.js API routes and server-side error tracking'],
    };
    out.push(item);
  }

  // Stripe (Secret + Webhook + Publishable)
  {
    const secret = config.stripeSecretKey?.trim();
    const publishable = config.stripePublishableKey?.trim();
    const webhook = config.stripeWebhookSecret?.trim();
    const hasAny = !!secret || !!publishable || !!webhook;
    const item: ApiStatus = {
      id: 'stripe',
      name: 'Stripe (payments)',
      hasKey: hasAny,
      status: hasAny ? 'ok' : 'no-key',
      message: hasAny
        ? 'Keys set. Basic payments should work; verify test charge & webhooks in Stripe dashboard.'
        : 'Not set – paid plans and international payments disabled.',
      limitInfo: 'Stripe has account-level rate limits; see Stripe dashboard for request/minute and monthly volume.',
      usedBy: [
        'Pricing / subscription checkout (Stripe Secret + Publishable)',
        'Webhook handling for renewals & cancellations (Stripe Webhook Secret)',
      ],
    };
    out.push(item);
  }

  // PayPal
  {
    const clientId = config.paypalClientId?.trim();
    const secret = config.paypalClientSecret?.trim();
    const webhook = config.paypalWebhookId?.trim();
    const hasAny = !!clientId || !!secret || !!webhook;
    const item: ApiStatus = {
      id: 'paypal',
      name: 'PayPal API',
      hasKey: hasAny,
      status: hasAny ? 'ok' : 'no-key',
      message: hasAny
        ? 'Keys partially/fully set. Used for live payment verification.'
        : 'Not set – PayPal payments are disabled.',
      limitInfo: 'PayPal rate limits depend on merchant account status.',
      usedBy: ['Checkout API', 'Webhook endpoint for subscriptions'],
    };
    if (clientId && secret) {
       try {
         // simple auth ping
         const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
         const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
           method: 'POST',
           headers: {
             'Authorization': `Basic ${basicAuth}`,
             'Content-Type': 'application/x-www-form-urlencoded'
           },
           body: 'grant_type=client_credentials'
         });
         if (res.ok) {
           item.status = 'ok';
           item.message = 'Live auth OK. Valid Client ID and Secret.';
         } else {
           const data = await res.json().catch(()=>({}));
           item.status = 'error';
           item.message = data.error_description || `HTTP ${res.status} from PayPal`;
         }
       } catch (e: any) {
         item.status = 'error';
         item.message = e.message || 'PayPal auth check failed';
       }
    }
    out.push(item);
  }

  // Groq
  {
    const apiKey = config.groqApiKey?.trim();
    const item: ApiStatus = {
      id: 'groq',
      name: 'Groq API',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet' : 'Key missing',
      limitInfo: 'High speed inference. RPM limits based on tiers.',
      usedBy: ['Language inference fallback for fast models (e.g. LLaMA 3)'],
    };
    if (apiKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` }});
        if (res.ok) { item.status = 'ok'; item.message = 'Live auth OK. Models fetched.'; }
        else { item.status = 'error'; item.message = `HTTP ${res.status} from Groq`; }
      } catch (e: any) { item.status = 'error'; item.message = e.message || 'Groq check failed'; }
    }
    out.push(item);
  }

  // OpenRouter
  {
    const apiKey = config.openrouterApiKey?.trim();
    const item: ApiStatus = {
      id: 'openrouter',
      name: 'OpenRouter API',
      hasKey: !!apiKey,
      status: apiKey ? 'ok' : 'no-key',
      message: apiKey ? 'Not checked yet' : 'Key missing',
      limitInfo: 'Extensive model routing. Limits vary by provider routed to.',
      usedBy: ['Fallback and aggregated LLM access'],
    };
    if (apiKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: { 'Authorization': `Bearer ${apiKey}` }});
        if (res.ok) { item.status = 'ok'; item.message = 'Live auth OK. Token verified.'; }
        else { item.status = 'error'; item.message = `HTTP ${res.status} from OpenRouter`; }
      } catch (e: any) { item.status = 'error'; item.message = e.message || 'OpenRouter check failed'; }
    }
    out.push(item);
  }

  // Mistral, Cohere, DeepSeek, Together, HuggingFace, SerpApi, Rapidapi
  const otherApis = [
    { id: 'mistral', name: 'Mistral API', key: config.mistralApiKey, url: 'https://api.mistral.ai/v1/models', usedBy: ['Mistral LLM Backup'] },
    { id: 'cohere', name: 'Cohere API', key: config.cohereApiKey, url: 'https://api.cohere.com/v1/models', usedBy: ['Cohere Command models backup'] },
    { id: 'deepseek', name: 'DeepSeek API', key: config.deepseekApiKey, url: 'https://api.deepseek.com/models', usedBy: ['DeepSeek Chat fallback'] },
    { id: 'together', name: 'Together AI API', key: config.togetherApiKey, url: 'https://api.together.xyz/v1/models', usedBy: ['Together inference backup'] },
    { id: 'huggingface', name: 'HuggingFace API', key: config.huggingfaceApiKey, url: null, usedBy: ['HF Inference fallback'] },
    { id: 'serpapi', name: 'SerpApi', key: config.serpapiKey, url: null, usedBy: ['Google/YouTube Search Fallback'] },
    { id: 'rapidapi', name: 'RapidAPI', key: config.rapidapiKey, url: null, usedBy: ['YouTube 138 API endpoints'] }
  ];

  for (const api of otherApis) {
    const k = api.key?.trim();
    const item: ApiStatus = {
      id: api.id,
      name: api.name,
      hasKey: !!k,
      status: k ? 'ok' : 'no-key',
      message: k ? 'Key exists (live ping not configured or executed).' : 'Key missing.',
      limitInfo: 'Refer to respective developer console.',
      usedBy: api.usedBy,
    };
    if (k && api.url) {
      try {
         const res = await fetch(api.url, { headers: { 'Authorization': `Bearer ${k}` }});
         if (res.ok) { item.status = 'ok'; item.message = 'Live auth OK.'; }
         else { item.status = 'error'; item.message = `HTTP ${res.status} from ${api.name}`; }
      } catch (e: any) {
         item.status = 'error'; item.message = e.message;
      }
    }
    out.push(item);
  }
  
  // Custom APIs dynamically loaded
  if (config.customApis) {
     for (const [k, v] of Object.entries(config.customApis)) {
       const keyVal = (v as string)?.trim();
       out.push({
         id: `custom_${k}`,
         name: `Custom API: ${k}`,
         hasKey: !!keyVal,
         status: keyVal ? 'ok' : 'no-key',
         message: keyVal ? 'Custom API key present.' : 'Empty value.',
         limitInfo: 'Custom defined limit',
         usedBy: ['Custom extension features'],
       });
     }
  }

  return NextResponse.json({ apis: out });
}

