export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini no text');
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Channel Audit feature access
    try {
      const { default: FeatureAccess } = await import('@/models/FeatureAccess');
      const doc = (await FeatureAccess.findOne({ feature: 'channel_audit' }).lean()) as
        | { allowedRoles?: string[] }
        | null;
      const roles = doc?.allowedRoles?.length ? doc.allowedRoles : ['manager', 'admin', 'super-admin'];
      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Channel Audit tool is not enabled for your role. Contact Super Admin.' },
          { status: 403 }
        );
      }
    } catch {
      // fall back: allow existing behavior
    }

    const body = await request.json().catch(() => ({}));
    const context = body.context || {};
    const contextStr = JSON.stringify(context, null, 2);

    const config = await getApiConfig();
    const systemPrompt = `You are an expert YouTube channel growth strategist. Analyze the provided channel audit data, which includes recently analyzed videos, their titles, tags, and viral scores.

Based on this specific channel's niche, please provide:
1. Specific, actionable advice on EXACTLY what type of videos the creator should upload next to improve their Average Viral Score, get more views, and go viral. Focus on specific formats, topics, or hooks that work well in this niche.
2. A list of 3 to 5 REAL, actual successful YouTube channels in their specific niche that they should study for inspiration. Mention their names and what they do well. 
3. Any other highly actionable, non-generic YouTube optimization advice.

Reply in a clear format using Markdown. If you see Hindi use in the context or titles, you may provide a bilingual or Hindi response; otherwise default to English. Keep your answer highly practical and concise.

Channel audit data context:
${contextStr}`;

    const fullPrompt = `${systemPrompt}\n\nYour expert recommendations:`;

    if (config.openaiApiKey?.trim()) {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: "Please analyze the channel data and generate the recommendations and real channel examples as instructed." },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });
      const recommendations = res.choices[0]?.message?.content?.trim() || 'No response.';
      return NextResponse.json({ recommendations });
    }

    if (config.googleGeminiApiKey?.trim()) {
      const recommendations = await callGemini(fullPrompt, config.googleGeminiApiKey);
      return NextResponse.json({ recommendations: recommendations.trim() });
    }

    return NextResponse.json(
      { error: 'AI not configured. Set OpenAI or Gemini API key in Super Admin → API Config.' },
      { status: 503 }
    );
  } catch (e: unknown) {
    console.error('Channel audit recommendations error:', e);
    const message = e instanceof Error ? e.message : 'Failed to get recommendations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
