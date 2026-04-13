export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkAllAIHealth } from '@/lib/ai-router';
import { getApiConfig } from '@/lib/apiConfig';
import { getProviderStats } from '@/lib/ai-router';

/**
 * Complete API-to-Page mapping for the entire VidYT platform.
 * Each entry = one API service, showing every page/feature that uses it.
 */
function getApiPageMap(config: Record<string, any>) {
  return [
    // ── AI / LLM Providers (via routeAI) ──
    {
      id: 'openai',
      name: 'OpenAI',
      category: 'AI / LLM',
      model: 'GPT-4o-mini',
      hasKey: !!config.openaiApiKey?.trim(),
      purpose: 'Primary AI provider for all content generation, analysis, and recommendations.',
      pages: [
        { page: 'AI Studio — Script Generator', route: '/api/ai/script-generator', desc: 'Generates full YouTube video scripts with hooks, structure, and CTAs' },
        { page: 'AI Studio — Hook Generator', route: '/api/ai/hook-generator', desc: 'Creates attention-grabbing video hooks in multiple styles' },
        { page: 'AI Studio — Thumbnail Ideas', route: '/api/ai/thumbnail-generator', desc: 'Generates thumbnail concepts and text overlay suggestions' },
        { page: 'AI Studio — Shorts Creator', route: '/api/ai/shorts-creator', desc: 'Creates short-form video scripts from long-form content' },
        { page: 'AI Studio — Daily Ideas', route: '/api/ai/daily-ideas', desc: 'Generates trending topic ideas based on niche and current trends' },
        { page: 'SEO Tools — Title Generator', route: '/api/generate/title', desc: 'Creates SEO-optimized YouTube video titles' },
        { page: 'SEO Tools — Tag Generator', route: '/api/generate/tags', desc: 'Generates relevant hashtags and tags for discoverability' },
        { page: 'SEO Tools — Description Writer', route: '/api/generate/description', desc: 'Writes keyword-rich video descriptions' },
        { page: 'SEO Tools — Keyword Intelligence', route: '/api/ai/keyword-intelligence', desc: 'Deep keyword research with search volume and competition analysis' },
        { page: 'Video Analyze', route: '/api/youtube/video-analyze', desc: 'Whisper transcription + metadata suggestions' },
        { page: 'Channel Intelligence', route: '/api/youtube/channel-intelligence', desc: 'AI-powered niche detection, insights, and strategy recommendations' },
        { page: 'Viral Predictor', route: '/api/viral/ultra-intelligence', desc: 'Predicts viral potential score with AI analysis' },
        { page: 'Strategy Advisor (Admin)', route: '/api/admin/super/audit', desc: 'Channel audit with AI recommendations and Q&A' },
        { page: 'Social Posting Time', route: '/api/social-posting-time', desc: 'Optimal posting time predictions across platforms' },
        { page: 'YouTube Growth Tools', route: '/api/tools/youtube-growth', desc: 'Personalized growth strategy recommendations' },
        { page: 'Trending Pages (Cron)', route: '/api/cron/generate-trending-pages', desc: 'Auto-generates trending topic pages for SEO' },
      ],
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      category: 'AI / LLM',
      model: 'Gemini 2.0 Flash',
      hasKey: !!config.googleGeminiApiKey?.trim(),
      purpose: 'Second-priority AI fallback. Powers Chinki assistant and serves as backup for all AI features.',
      pages: [
        { page: 'All AI Studio Tools', route: '/api/ai/*', desc: 'Fallback when OpenAI is unavailable or rate-limited' },
        { page: 'All SEO Tools', route: '/api/generate/*', desc: 'Fallback for title, tags, description generation' },
        { page: 'Video Analyze', route: '/api/youtube/video-analyze', desc: 'Metadata suggestions fallback' },
        { page: 'Channel Intelligence', route: '/api/youtube/channel-intelligence', desc: 'Niche detection and insights fallback' },
        { page: 'Viral Predictor', route: '/api/viral/ultra-intelligence', desc: 'Viral analysis fallback' },
      ],
    },
    {
      id: 'groq',
      name: 'Groq',
      category: 'AI / LLM',
      model: 'LLaMA 3 8B',
      hasKey: !!(config.groqApiKey || process.env.GROQ_API_KEY)?.trim(),
      purpose: 'Ultra-fast inference fallback. Best for quick responses when primary providers are slow.',
      pages: [
        { page: 'All AI Features (Fallback #3)', route: 'via routeAI', desc: 'Third-priority fallback after OpenAI and Gemini fail' },
      ],
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      category: 'AI / LLM',
      model: 'Mistral-7B-Instruct (free)',
      hasKey: !!(config.openrouterApiKey || process.env.OPENROUTER_API_KEY)?.trim(),
      purpose: 'Multi-model routing fallback. Provides access to many models via single API key.',
      pages: [
        { page: 'All AI Features (Fallback #4)', route: 'via routeAI', desc: 'Fourth-priority fallback in AI router chain' },
      ],
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      category: 'AI / LLM',
      model: 'mistral-small-latest',
      hasKey: !!(config.mistralApiKey || process.env.MISTRAL_API_KEY)?.trim(),
      purpose: 'European AI provider fallback for content generation.',
      pages: [
        { page: 'All AI Features (Fallback #5)', route: 'via routeAI', desc: 'Fifth-priority fallback' },
      ],
    },
    {
      id: 'cohere',
      name: 'Cohere',
      category: 'AI / LLM',
      model: 'Command',
      hasKey: !!(config.cohereApiKey || process.env.COHERE_API_KEY)?.trim(),
      purpose: 'Enterprise AI fallback with strong text generation capabilities.',
      pages: [
        { page: 'All AI Features (Fallback #6)', route: 'via routeAI', desc: 'Sixth-priority fallback' },
      ],
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      category: 'AI / LLM',
      model: 'deepseek-chat',
      hasKey: !!(config.deepseekApiKey || process.env.DEEPSEEK_API_KEY)?.trim(),
      purpose: 'Cost-effective AI fallback for general text generation.',
      pages: [
        { page: 'All AI Features (Fallback #7)', route: 'via routeAI', desc: 'Seventh-priority fallback' },
      ],
    },
    {
      id: 'together',
      name: 'Together AI',
      category: 'AI / LLM',
      model: 'LLaMA-3-8B',
      hasKey: !!(config.togetherApiKey || process.env.TOGETHER_API_KEY)?.trim(),
      purpose: 'Open-source model hosting fallback.',
      pages: [
        { page: 'All AI Features (Fallback #8)', route: 'via routeAI', desc: 'Eighth-priority fallback' },
      ],
    },
    {
      id: 'huggingface',
      name: 'HuggingFace',
      category: 'AI / LLM',
      model: 'Mistral-7B-Instruct-v0.3',
      hasKey: !!(config.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY)?.trim(),
      purpose: 'Last-resort AI fallback via HuggingFace inference API.',
      pages: [
        { page: 'All AI Features (Fallback #9)', route: 'via routeAI', desc: 'Final fallback before mock response' },
      ],
    },

    // ── YouTube ──
    {
      id: 'youtube',
      name: 'YouTube Data API v3',
      category: 'Platform',
      model: null,
      hasKey: !!config.youtubeDataApiKey?.trim(),
      purpose: 'Core YouTube integration — channel data, video stats, search, upload, and analytics.',
      pages: [
        { page: 'YouTube Channel Connect', route: '/api/youtube/channels/connect', desc: 'Links user YouTube channel via OAuth' },
        { page: 'YouTube Channel Summary', route: '/api/youtube/channel-summary', desc: 'Fetches subscriber count, total views, video count' },
        { page: 'Channel Intelligence', route: '/api/youtube/channel-intelligence', desc: 'Advanced analytics — recent videos, engagement, growth' },
        { page: 'Strategy Advisor (Admin)', route: '/api/admin/super/audit', desc: 'Fetches channel data for AI audit recommendations' },
        { page: 'Best Posting Time', route: '/api/youtube/best-posting-time', desc: 'Analyzes video publish times vs performance' },
        { page: 'Competitor Analysis', route: '/api/youtube/competitors', desc: 'Fetches competitor channel stats for comparison' },
        { page: 'YouTube SEO Analyzer', route: '/api/youtube/seo', desc: 'Analyzes video SEO signals (title, tags, description)' },
        { page: 'Video Upload', route: '/api/youtube/upload', desc: 'Uploads videos directly to YouTube from dashboard' },
        { page: 'Multi Upload', route: '/api/youtube/upload-multi', desc: 'Batch uploads multiple videos to YouTube' },
        { page: 'My Videos', route: '/api/youtube/my-videos', desc: 'Fetches user uploaded videos list with stats' },
        { page: 'Video Analyze', route: '/api/youtube/video-analyze', desc: 'Gets video metadata and performance metrics' },
        { page: 'Daily Ideas', route: '/api/ai/daily-ideas', desc: 'Fetches trending YouTube videos for idea generation' },
      ],
    },

    // ── Transcription ──
    {
      id: 'assemblyai',
      name: 'AssemblyAI',
      category: 'Transcription',
      model: null,
      hasKey: !!config.assemblyaiApiKey?.trim(),
      purpose: 'Professional audio-to-text transcription for video analysis and shorts creation.',
      pages: [
        { page: 'Video Analyze', route: '/api/youtube/video-analyze', desc: 'Transcribes video audio for content analysis' },
        { page: 'Shorts Creator', route: '/api/ai/shorts-creator', desc: 'Transcribes long-form video to extract short clips' },
        { page: 'Transcribe API', route: '/api/transcribe', desc: 'Direct audio transcription endpoint' },
      ],
    },

    // ── Payments ──
    {
      id: 'razorpay',
      name: 'Razorpay',
      category: 'Payments',
      model: null,
      hasKey: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      purpose: 'Primary payment gateway for Indian users — handles subscriptions, one-time payments, and webhooks.',
      pages: [
        { page: 'Pricing / Checkout', route: '/api/payments/create-order', desc: 'Creates Razorpay order for plan purchase' },
        { page: 'Payment Verification', route: '/api/payments/verify-payment', desc: 'Verifies payment signature and activates plan' },
        { page: 'Signup Payment', route: '/api/payments/verify-signup-payment', desc: 'Handles payment during registration flow' },
        { page: 'Payment Webhook', route: '/api/payments/webhook', desc: 'Processes Razorpay webhook events (renewal, cancellation)' },
      ],
    },
    {
      id: 'paypal',
      name: 'PayPal',
      category: 'Payments',
      model: null,
      hasKey: !!(config.paypalClientId && config.paypalClientSecret),
      purpose: 'International payment gateway for global users — PayPal Checkout and subscription management.',
      pages: [
        { page: 'International Checkout', route: '/api/payments/paypal/create-order', desc: 'Creates PayPal order for international payments' },
        { page: 'PayPal Webhook', route: '/api/webhooks/paypal', desc: 'Processes PayPal webhook events (renewal, cancellation)' },
      ],
    },

    // ── Email ──
    {
      id: 'resend',
      name: 'Resend',
      category: 'Email',
      model: null,
      hasKey: !!config.resendApiKey?.trim(),
      purpose: 'Transactional email delivery — OTP codes, password resets, payment receipts, and admin notifications.',
      pages: [
        { page: 'Auth — OTP / Password Reset', route: '/api/auth/*', desc: 'Sends OTP codes and password reset emails' },
        { page: 'Plan Receipts', route: '/api/admin/send-plan-receipts', desc: 'Sends payment receipt emails to users' },
        { page: 'Admin Notifications', route: 'services/email.ts', desc: 'Broadcasts and subscription notifications' },
      ],
    },

    // ── Search / Data ──
    {
      id: 'serpapi',
      name: 'SerpApi',
      category: 'Search',
      model: null,
      hasKey: !!(config.serpapiKey || process.env.SERPAPI_KEY)?.trim(),
      purpose: 'Google & YouTube search results API — used as fallback for video discovery and competitor research.',
      pages: [
        { page: 'Competitor Analysis', route: '/api/youtube/competitors', desc: 'Searches for competitor videos and channels' },
        { page: 'Trending Discovery', route: '/api/ai/daily-ideas', desc: 'Fallback for trending topic discovery' },
      ],
    },
    {
      id: 'rapidapi',
      name: 'RapidAPI',
      category: 'Search',
      model: null,
      hasKey: !!(config.rapidapiKey || process.env.RAPIDAPI_KEY)?.trim(),
      purpose: 'Alternative YouTube data endpoints (138 APIs) — fallback when YouTube Data API quota is exhausted.',
      pages: [
        { page: 'Channel Videos', route: '/api/channel/videos', desc: 'Fetches channel videos when YouTube API quota is depleted' },
        { page: 'Video Stats', route: '/api/videos/*', desc: 'Alternative video statistics and metadata' },
      ],
    },

    // ── Monitoring ──
    {
      id: 'sentry',
      name: 'Sentry',
      category: 'Monitoring',
      model: null,
      hasKey: !!(config.sentryDsn || config.sentryServerDsn)?.trim(),
      purpose: 'Error tracking and performance monitoring for both frontend and backend.',
      pages: [
        { page: 'All Frontend Pages', route: 'Sentry DSN (client)', desc: 'Captures React errors, performance issues, and user sessions' },
        { page: 'All API Routes', route: 'Sentry Server DSN', desc: 'Captures server-side errors and API failures' },
      ],
    },
  ];
}

export async function GET(request: NextRequest) {
  const authUser = await getUserFromRequest(request);
  if (!authUser || authUser.role !== 'super-admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await getApiConfig();
  const apiMap = getApiPageMap(config);

  // Get AI provider health + usage stats in parallel
  let aiHealth: Record<string, any> = {};
  let usageStats: Record<string, any> = {};

  try {
    [aiHealth, usageStats] = await Promise.all([
      checkAllAIHealth().catch(() => ({})),
      Promise.resolve(getProviderStats()),
    ]);
  } catch {
    // Non-critical
  }

  // Merge health/usage into the map
  const enriched = apiMap.map(api => ({
    ...api,
    health: aiHealth[api.id] || null,
    usage: usageStats[api.id] || null,
  }));

  return NextResponse.json({
    apis: enriched,
    summary: {
      total: apiMap.length,
      configured: apiMap.filter(a => a.hasKey).length,
      missing: apiMap.filter(a => !a.hasKey).length,
      aiProviders: apiMap.filter(a => a.category === 'AI / LLM').length,
      aiHealthy: Object.values(aiHealth).filter((h: any) => h?.status === 'ok').length,
      aiFailing: Object.values(aiHealth).filter((h: any) => h?.status === 'fail').length,
    },
    generatedAt: new Date().toISOString(),
  });
}
