import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
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

    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const context = body.context || {};

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const config = await getApiConfig();
    const contextStr = JSON.stringify(context, null, 2);
    const systemPrompt = `You are a helpful YouTube channel growth expert. Answer the user's question based ONLY on the following channel audit data. Be concise and actionable. Reply in the same language the user asks in (e.g. Hindi or English). If the data doesn't contain enough info to answer, say so and give general advice.

Channel audit data:
${contextStr}`;

    const fullPrompt = `${systemPrompt}\n\nUser question: ${question}\n\nYour answer:`;

    if (config.openaiApiKey?.trim()) {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });
      const answer = res.choices[0]?.message?.content?.trim() || 'No response.';
      return NextResponse.json({ answer });
    }

    if (config.googleGeminiApiKey?.trim()) {
      const answer = await callGemini(fullPrompt, config.googleGeminiApiKey);
      return NextResponse.json({ answer: answer.trim() });
    }

    return NextResponse.json(
      { error: 'AI not configured. Set OpenAI or Gemini API key in Super Admin → API Config.' },
      { status: 503 }
    );
  } catch (e: unknown) {
    console.error('Channel audit ask error:', e);
    const message = e instanceof Error ? e.message : 'Failed to get AI answer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
