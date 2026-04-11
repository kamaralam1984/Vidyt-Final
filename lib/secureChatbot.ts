import OpenAI from 'openai';
import { getApiConfig } from '@/lib/apiConfig';

type ChatbotInput = {
  botName: string;
  question: string;
  plan: string;
  functions: string[];
  context?: string;
  behaviorPrompt?: string;
  localFallback?: string;
};

type ChatbotOutput = {
  reply: string;
  provider: 'openai' | 'gemini' | 'openrouter' | 'groq' | 'huggingface' | 'local';
  tier: 'paid' | 'free' | 'local';
};

const SENSITIVE_REQUEST = /(super\s*admin|database|mongodb|sql|password|passwd|secret|token|api\s*key|private\s*key|root\s*access|server\s*access|env\s*file|\.env)/i;
const SENSITIVE_RESPONSE = /(mongodb|password|api key|secret|private key|root access|super admin credentials|database dump)/i;

function makePolicyPrompt(input: ChatbotInput): string {
  const functionsLine = input.functions.length > 0 ? input.functions.join(', ') : 'No specific functions listed';
  return [
    `You are ${input.botName}, an assistant for Vid YT users.`,
    'Your job: answer user questions about their plan usage, product features, workflows, and troubleshooting.',
    `User plan: ${input.plan}`,
    `User allowed functions/features: ${functionsLine}`,
    'STRICT SECURITY RULES:',
    '- Never reveal super-admin details, database details, passwords, secrets, API keys, infra details, or internal credentials.',
    '- If user asks for restricted/internal secrets, refuse politely and redirect to safe help.',
    '- Do not claim access to hidden/private data.',
    '- Keep answers practical, direct, and user-action oriented.',
    input.behaviorPrompt || '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildLocalReply(input: ChatbotInput): string {
  if (input.localFallback && input.localFallback.trim()) return input.localFallback.trim();
  const q = input.question.toLowerCase();
  const fnText = input.functions.length ? input.functions.join(', ') : 'available tools in your current plan';
  if (SENSITIVE_REQUEST.test(q)) {
    return 'Main super-admin, database, password, API keys ya internal server details share nahi kar sakta. Main aapko sirf safe product guidance de sakta hoon.';
  }
  if (/plan|upgrade|subscription|limit|usage|quota/.test(q)) {
    return `Aapke current plan (${input.plan}) me usage limits aur features dashboard/sidebar me dikhte hain. Aap "${fnText}" use kar sakte hain. Agar limit hit ho rahi hai to subscription page se upgrade karein.`;
  }
  if (/error|issue|not work|bug|problem|fail/.test(q)) {
    return `Issue ko solve karne ke liye pehle exact step + error text check karein, phir relevant feature (${fnText}) par focused retry karein. Agar problem persist kare to support ticket me screenshot + steps bhejein.`;
  }
  if (/youtube|seo|title|thumbnail|keyword|viral/.test(q)) {
    return 'Best result ke liye title me primary keyword, strong hook, clear benefit aur thumbnail me high contrast + readable text rakhein. Keywords 8-12 relevant terms tak rakhein aur description me first lines me intent clear karein.';
  }
  return `Main aapke plan (${input.plan}) aur available functions (${fnText}) ke hisaab se help kar sakta hoon. Aap specific sawal poochhein, main actionable steps dunga.`;
}

async function callOpenAI(apiKey: string, system: string, user: string): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 800,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || '';
}

async function callGemini(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser question:\n${user}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      }),
    },
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini failed');
  return String(text).trim();
}

async function callOpenRouter(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 800,
      temperature: 0.4,
    }),
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(data?.error?.message || 'OpenRouter failed');
  return String(text).trim();
}

async function callGroq(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 800,
      temperature: 0.4,
    }),
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(data?.error?.message || 'Groq failed');
  return String(text).trim();
}

async function callHuggingFace(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: `${system}\n\nUser:\n${user}`,
      parameters: { max_new_tokens: 500, temperature: 0.4, return_full_text: false },
    }),
  });
  const data = await res.json();
  const text = Array.isArray(data) ? data?.[0]?.generated_text : data?.generated_text;
  if (!text) throw new Error('HuggingFace failed');
  return String(text).trim();
}

function secureNormalize(reply: string, input: ChatbotInput): string {
  const text = String(reply || '').trim();
  if (!text) return buildLocalReply(input);
  if (SENSITIVE_RESPONSE.test(text)) {
    return 'Main internal credentials ya sensitive system details share nahi kar sakta. Main aapko sirf product usage aur plan-related safe guidance de sakta hoon.';
  }
  return text;
}

export async function askSecureChatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  if (SENSITIVE_REQUEST.test(input.question)) {
    return {
      reply: buildLocalReply(input),
      provider: 'local',
      tier: 'local',
    };
  }

  const cfg = await getApiConfig();
  const system = makePolicyPrompt(input);
  const userMessage = [
    `Question: ${input.question}`,
    input.context ? `Context:\n${input.context}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // 1) Paid APIs
  const paidCandidates: Array<{ key?: string; provider: 'openai' | 'gemini'; call: (k: string) => Promise<string> }> = [
    { key: cfg.openaiApiKey, provider: 'openai', call: (k) => callOpenAI(k, system, userMessage) },
    { key: cfg.googleGeminiApiKey, provider: 'gemini', call: (k) => callGemini(k, system, userMessage) },
  ];

  for (const c of paidCandidates) {
    const key = c.key?.trim();
    if (!key) continue;
    try {
      const txt = await c.call(key);
      return { reply: secureNormalize(txt, input), provider: c.provider, tier: 'paid' };
    } catch (e) {
      console.warn(`[secureChatbot] paid provider failed: ${c.provider}`);
    }
  }

  // 2) Free APIs
  const freeCandidates: Array<{
    key?: string;
    provider: 'openrouter' | 'groq' | 'huggingface';
    call: (k: string) => Promise<string>;
  }> = [
    { key: process.env.OPENROUTER_API_KEY, provider: 'openrouter', call: (k) => callOpenRouter(k, system, userMessage) },
    { key: process.env.GROQ_API_KEY, provider: 'groq', call: (k) => callGroq(k, system, userMessage) },
    { key: process.env.HUGGINGFACE_API_KEY, provider: 'huggingface', call: (k) => callHuggingFace(k, system, userMessage) },
  ];

  for (const c of freeCandidates) {
    const key = c.key?.trim();
    if (!key) continue;
    try {
      const txt = await c.call(key);
      return { reply: secureNormalize(txt, input), provider: c.provider, tier: 'free' };
    } catch (e) {
      console.warn(`[secureChatbot] free provider failed: ${c.provider}`);
    }
  }

  // 3) Local backend fallback
  return {
    reply: buildLocalReply(input),
    provider: 'local',
    tier: 'local',
  };
}
