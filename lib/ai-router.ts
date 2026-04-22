/**
 * Universal AI Router - Failover System
 * Priority chain: OpenAI → Gemini → Groq → OpenRouter → Mistral → Cohere → DeepSeek → HuggingFace → Mock
 * Features: Circuit Breaker, Timeout, Retry, Caching
 */

import { isCircuitOpen, recordSuccess, recordFailure } from './circuit-breaker';
import { getWithFallback, setWithFallback } from './in-memory-cache';

// Per-provider usage stats (in-memory)
const providerStats: Record<string, { calls: number; failures: number; lastUsed: number }> = {};

function trackUsage(provider: string, success: boolean) {
  if (!providerStats[provider]) providerStats[provider] = { calls: 0, failures: 0, lastUsed: 0 };
  providerStats[provider].calls++;
  providerStats[provider].lastUsed = Date.now();
  if (!success) providerStats[provider].failures++;
}

export function getProviderStats() {
  return providerStats;
}

// Manual disable list (admin can toggle)
const disabledProviders = new Set<string>();

export function disableProvider(name: string) { disabledProviders.add(name); }
export function enableProvider(name: string) { disabledProviders.delete(name); }
export function isProviderEnabled(name: string) { return !disabledProviders.has(name); }

/** Wrap a call with timeout */
async function withTimeout<T>(fn: () => Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

/** Parse JSON safely from AI response text */
function parseJsonSafe(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try { return JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1')); } catch { return {}; }
}

// ─────────────────────────────────────────
// Individual Provider Caller Functions
// ─────────────────────────────────────────

async function callOpenAI(prompt: string, key: string, systemPrompt?: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: key });
  const messages: { role: 'system' | 'user'; content: string }[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.8,
    max_tokens: 2000,
  });
  return res.choices[0]?.message?.content?.trim() || '';
}

async function callGemini(prompt: string, key: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini: no text');
  return text;
}

async function callGroq(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`Groq: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq: no text');
  return text;
}

async function callOpenRouter(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter: no text');
  return text;
}

async function callMistral(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`Mistral: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Mistral: no text');
  return text;
}

async function callCohere(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://api.cohere.com/v1/generate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'command',
      prompt,
      max_tokens: 2000,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`Cohere: ${res.status}`);
  const data = await res.json();
  const text = data?.generations?.[0]?.text;
  if (!text) throw new Error('Cohere: no text');
  return text;
}

async function callDeepSeek(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('DeepSeek: no text');
  return text;
}

async function callHuggingFace(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 800, temperature: 0.8, return_full_text: false },
    }),
  });
  if (!res.ok) throw new Error(`HuggingFace: ${res.status}`);
  const data = await res.json();
  const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  if (!text) throw new Error('HuggingFace: no text');
  return text;
}

async function callTogetherAI(prompt: string, key: string): Promise<string> {
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3-8b-chat-hf',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`TogetherAI: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('TogetherAI: no text');
  return text;
}

// ─────────────────────────────────────────
// The Main Router
// ─────────────────────────────────────────

export interface AIRouterOptions {
  prompt: string;
  systemPrompt?: string;
  cacheKey?: string;
  cacheTtlSec?: number;
  timeoutMs?: number;
  fallbackText?: string;
}

export interface AIRouterResult {
  text: string;
  provider: string;
  fromCache: boolean;
  parseJson: () => Record<string, unknown>;
}

export async function routeAI(options: AIRouterOptions): Promise<AIRouterResult> {
  const { prompt, systemPrompt, cacheKey, cacheTtlSec = 300, timeoutMs = 30000, fallbackText } = options;

  // 1. Check cache first
  if (cacheKey) {
    const cached = await getWithFallback<AIRouterResult>(cacheKey);
    if (cached) return { ...cached, fromCache: true };
  }

  // 2. Load API keys
  const { getApiConfig } = await import('./apiConfig');
  const config = await getApiConfig();

  // Priority list: name → caller function (all keys from getApiConfig which checks DB first, then env)
  const providers: Array<{ name: string; key: string; call: (p: string, k: string) => Promise<string> }> = [
    { name: 'openai', key: config.openaiApiKey, call: (p, k) => callOpenAI(p, k, systemPrompt) },
    { name: 'gemini', key: config.googleGeminiApiKey, call: callGemini },
    { name: 'groq', key: config.groqApiKey || process.env.GROQ_API_KEY || '', call: callGroq },
    { name: 'openrouter', key: config.openrouterApiKey || process.env.OPENROUTER_API_KEY || '', call: callOpenRouter },
    { name: 'mistral', key: config.mistralApiKey || process.env.MISTRAL_API_KEY || '', call: callMistral },
    { name: 'cohere', key: config.cohereApiKey || process.env.COHERE_API_KEY || '', call: callCohere },
    { name: 'deepseek', key: config.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '', call: callDeepSeek },
    { name: 'together', key: config.togetherApiKey || process.env.TOGETHER_API_KEY || '', call: callTogetherAI },
    { name: 'huggingface', key: config.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY || '', call: callHuggingFace },
  ];

  // 3. Try each provider with circuit breaker + timeout + retry
  for (const provider of providers) {
    if (!provider.key?.trim()) continue;
    if (!isProviderEnabled(provider.name)) continue;
    if (isCircuitOpen(provider.name)) {
      console.log(`[AIRouter] ${provider.name} circuit OPEN, skipping`);
      continue;
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await withTimeout(() => provider.call(prompt, provider.key), timeoutMs);
        recordSuccess(provider.name);
        trackUsage(provider.name, true);
        const result: AIRouterResult = {
          text,
          provider: provider.name,
          fromCache: false,
          parseJson: () => parseJsonSafe(text),
        };
        // Cache successful response
        if (cacheKey) await setWithFallback(cacheKey, result, cacheTtlSec);
        console.log(`[AIRouter] Success via ${provider.name}`);
        return result;
      } catch (err) {
        lastErr = err;
        console.warn(`[AIRouter] ${provider.name} attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
      }
    }
    // Record failure after all retries exhausted
    recordFailure(provider.name);
    trackUsage(provider.name, false);
    console.error(`[AIRouter] ${provider.name} FAILED after retries:`, lastErr instanceof Error ? lastErr.message : lastErr);
  }

  // 4. All APIs failed → serve cached (stale) or safe fallback
  if (cacheKey) {
    const stale = await getWithFallback<AIRouterResult>(cacheKey);
    if (stale) {
      console.warn('[AIRouter] All APIs failed. Serving stale cache.');
      return { ...stale, fromCache: true };
    }
  }

  // 5. Ultimate fallback: safe message
  const fallback = fallbackText || 'AI service is temporarily unavailable. Please try again in a moment.';
  console.error('[AIRouter] ALL providers failed. Returning safe fallback message.');
  return {
    text: fallback,
    provider: 'fallback',
    fromCache: false,
    parseJson: () => ({}),
  };
}

// ─────────────────────────────────────────
// Vision AI Router (image analysis)
// Priority: OpenAI GPT-4o-mini → Gemini Flash → null
// ─────────────────────────────────────────

export interface VisionAIResult {
  text: string;
  provider: string;
  parseJson: () => Record<string, unknown>;
}

async function callOpenAIVision(imageUrl: string, prompt: string, key: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: key });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
        { type: 'text', text: prompt },
      ],
    }],
    max_tokens: 500,
  });
  return res.choices[0]?.message?.content?.trim() || '';
}

async function callGeminiVision(imageUrl: string, prompt: string, key: string): Promise<string> {
  // Fetch image as base64
  const axios = (await import('axios')).default;
  const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
  const base64 = Buffer.from(imgRes.data).toString('base64');
  const mimeType = imgRes.headers['content-type'] || 'image/jpeg';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini vision: no text');
  return text;
}

/**
 * Route image analysis to best available vision AI.
 * Returns null if no vision API is available (caller should use fallback).
 */
export async function routeVisionAI(
  imageUrl: string,
  prompt: string,
  cacheKey?: string,
): Promise<VisionAIResult | null> {
  if (!imageUrl || imageUrl.includes('placeholder')) return null;

  if (cacheKey) {
    const cached = await getWithFallback<VisionAIResult>(cacheKey);
    if (cached) return { ...cached };
  }

  const { getApiConfig } = await import('./apiConfig');
  const config = await getApiConfig();

  const visionProviders: Array<{ name: string; key: string; call: () => Promise<string> }> = [
    { name: 'openai-vision', key: config.openaiApiKey || '', call: () => callOpenAIVision(imageUrl, prompt, config.openaiApiKey) },
    { name: 'gemini-vision', key: config.googleGeminiApiKey || '', call: () => callGeminiVision(imageUrl, prompt, config.googleGeminiApiKey) },
  ];

  for (const p of visionProviders) {
    if (!p.key?.trim()) continue;
    if (!isProviderEnabled(p.name)) continue;
    if (isCircuitOpen(p.name)) continue;
    try {
      const text = await withTimeout(p.call, 15000);
      if (!text) continue;
      recordSuccess(p.name);
      trackUsage(p.name, true);
      const result: VisionAIResult = { text, provider: p.name, parseJson: () => parseJsonSafe(text) };
      if (cacheKey) await setWithFallback(cacheKey, result, 3600);
      console.log(`[VisionAI] Success via ${p.name}`);
      return result;
    } catch (err: any) {
      recordFailure(p.name);
      trackUsage(p.name, false);
      console.warn(`[VisionAI] ${p.name} failed:`, err?.message);
    }
  }
  return null;
}

/** Health check for all AI providers */
export async function checkAllAIHealth(): Promise<Record<string, { status: 'ok' | 'fail' | 'no-key'; latencyMs?: number }>> {
  const { getApiConfig } = await import('./apiConfig');
  const config = await getApiConfig();

  const groqKey = config.groqApiKey || process.env.GROQ_API_KEY || '';
  const openrouterKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
  const mistralKey = config.mistralApiKey || process.env.MISTRAL_API_KEY || '';
  const cohereKey = config.cohereApiKey || process.env.COHERE_API_KEY || '';
  const deepseekKey = config.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
  const togetherKey = config.togetherApiKey || process.env.TOGETHER_API_KEY || '';
  const huggingfaceKey = config.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY || '';

  const providers = [
    { name: 'openai', key: config.openaiApiKey, url: 'https://api.openai.com/v1/models', headers: { Authorization: `Bearer ${config.openaiApiKey}` } },
    { name: 'gemini', key: config.googleGeminiApiKey, url: `https://generativelanguage.googleapis.com/v1beta/models?key=${config.googleGeminiApiKey}`, headers: {} },
    { name: 'groq', key: groqKey, url: 'https://api.groq.com/openai/v1/models', headers: { Authorization: `Bearer ${groqKey}` } },
    { name: 'openrouter', key: openrouterKey, url: 'https://openrouter.ai/api/v1/models', headers: { Authorization: `Bearer ${openrouterKey}` } },
    { name: 'mistral', key: mistralKey, url: 'https://api.mistral.ai/v1/models', headers: { Authorization: `Bearer ${mistralKey}` } },
    { name: 'cohere', key: cohereKey, url: 'https://api.cohere.com/v1/models', headers: { Authorization: `Bearer ${cohereKey}` } },
    { name: 'deepseek', key: deepseekKey, url: 'https://api.deepseek.com/v1/models', headers: { Authorization: `Bearer ${deepseekKey}` } },
    { name: 'together', key: togetherKey, url: 'https://api.together.xyz/v1/models', headers: { Authorization: `Bearer ${togetherKey}` } },
    { name: 'huggingface', key: huggingfaceKey, url: 'https://huggingface.co/api/whoami-v2', headers: { Authorization: `Bearer ${huggingfaceKey}` } },
  ];

  const results: Record<string, { status: 'ok' | 'fail' | 'no-key'; latencyMs?: number }> = {};

  await Promise.all(
    providers.map(async (p) => {
      if (!p.key?.trim()) { results[p.name] = { status: 'no-key' }; return; }
      const start = Date.now();
      try {
        const res = await Promise.race([
          fetch(p.url, { headers: p.headers as Record<string, string> }),
          new Promise<Response>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
        ]);
        results[p.name] = {
          status: (res as Response).ok ? 'ok' : 'fail',
          latencyMs: Date.now() - start,
        };
      } catch {
        results[p.name] = { status: 'fail', latencyMs: Date.now() - start };
      }
    })
  );

  return results;
}
