export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
}

// POST /api/admin/super/bulk-email/ai-generate
// body: { topic: string }
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    const { topic } = await req.json();
    if (!topic?.trim()) return NextResponse.json({ error: 'topic required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

    const prompt = `Write a professional marketing email for the following topic: "${topic}".
Return JSON with exactly two fields:
- "subject": a compelling email subject line (max 80 chars)
- "body": the full HTML email body (use simple inline styles, no external CSS)

Respond ONLY with valid JSON.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({ subject: parsed.subject || '', body: parsed.body || '' });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
