export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { checkAllAIHealth } from '@/lib/ai-router';
import { checkYouTubeHealth } from '@/lib/youtube-router';
import { getAllCircuitHealth, resetCircuit, forceOpenCircuit } from '@/lib/circuit-breaker';
import { getProviderStats, disableProvider, enableProvider, isProviderEnabled } from '@/lib/ai-router';
import { getApiConfig } from '@/lib/apiConfig';

/** GET /api/admin/api-health → full health report */
export async function GET(request: NextRequest) {
  // Basic admin guard: require admin token header or session
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== (process.env.ADMIN_SECRET || 'admin-secret-2024')) {
    // Also allow logged-in super admin via cookie (simple check)
    const cookies = request.headers.get('cookie') || '';
    if (!cookies.includes('superadmin=true') && !cookies.includes('role=super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const [aiHealth, ytHealth] = await Promise.all([
    checkAllAIHealth(),
    checkYouTubeHealth(),
  ]);

  const circuits = getAllCircuitHealth();
  const stats = getProviderStats();

  // Which providers are manually enabled/disabled
  const allProviders = [
    'openai', 'gemini', 'groq', 'openrouter', 'mistral',
    'cohere', 'deepseek', 'together', 'huggingface',
    'youtube-official', 'serpapi', 'rapidapi-youtube',
  ];

  const providerMeta = allProviders.map((name) => ({
    name,
    enabled: isProviderEnabled(name),
    circuit: circuits.find((c) => c.name === name),
    aiHealth: aiHealth[name],
    ytHealth: ytHealth[name],
    usage: stats[name] || { calls: 0, failures: 0, lastUsed: 0 },
  }));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    providers: providerMeta,
    summary: {
      aiHealthy: Object.values(aiHealth).filter((h) => h.status === 'ok').length,
      aiTotal: Object.keys(aiHealth).length,
      ytHealthy: Object.values(ytHealth).filter((h) => h.status === 'ok').length,
      ytTotal: Object.keys(ytHealth).length,
    },
  });
}

/** POST /api/admin/api-health → control actions */
export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== (process.env.ADMIN_SECRET || 'admin-secret-2024')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, provider } = body;

  if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 });

  switch (action) {
    case 'enable':
      enableProvider(provider);
      return NextResponse.json({ ok: true, message: `${provider} enabled` });
    case 'disable':
      disableProvider(provider);
      return NextResponse.json({ ok: true, message: `${provider} disabled` });
    case 'reset-circuit':
      resetCircuit(provider);
      return NextResponse.json({ ok: true, message: `Circuit reset for ${provider}` });
    case 'open-circuit':
      forceOpenCircuit(provider);
      return NextResponse.json({ ok: true, message: `Circuit forced OPEN for ${provider}` });
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
