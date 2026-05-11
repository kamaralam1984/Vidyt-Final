export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const ARCHETYPE_TEMPLATES: Record<string, { emoji: string; label: string; words: string[]; hint: string }> = {
  curiosity: {
    emoji: '🔓', label: 'Curiosity Gap',
    words: ['Secret', 'Hidden', 'Nobody Tells You', 'Truth Behind', 'Exposed', 'You Won\'t Believe'],
    hint: 'Add mystery: "The Secret Behind [topic]" or "[topic] Nobody Talks About"',
  },
  list: {
    emoji: '🔢', label: 'List / Number',
    words: ['5 Ways', 'Top 10', '7 Reasons', '3 Mistakes', 'Part 1'],
    hint: 'Add a number: "5 [topic] Tips That Work" or "Top 7 [topic] Tricks"',
  },
  authority: {
    emoji: '🏆', label: 'Authority / Proof',
    words: ['Proven', 'Expert', 'After Years', 'Real Results', 'Science Says'],
    hint: 'Add credibility: "Proven [topic] Method" or "[topic] After 5 Years of Testing"',
  },
  transformation: {
    emoji: '🔄', label: 'Transformation',
    words: ['From Zero to', 'How I Changed', 'Before & After', 'Turned Into', 'Went From'],
    hint: 'Add a journey: "From [X] to [Y]" or "How [topic] Changed Everything"',
  },
  urgency: {
    emoji: '⏰', label: 'Urgency / FOMO',
    words: ['Now', '2026', 'Today', 'Breaking', 'Before It\'s Too Late', 'Latest'],
    hint: 'Add urgency: "[topic] (Watch NOW)" or "Do This Before It\'s Too Late"',
  },
  question: {
    emoji: '❓', label: 'Question / Direct',
    words: ['How to', 'Why Is', 'What If', 'Should You', 'Can You'],
    hint: 'Start with a question: "Why Is [topic] Different?" or "How to [topic]?"',
  },
  contrarian: {
    emoji: '⚡', label: 'Contrarian',
    words: ['Stop', 'Wrong', 'Never Do This', 'The Myth', 'Don\'t Believe'],
    hint: 'Add a pattern interrupt: "Stop [topic] Wrong" or "The [topic] Myth EXPOSED"',
  },
};

function fallbackVariants(title: string, missing: string[]): any[] {
  const t = title.trim() || 'your video topic';
  const top3 = missing.slice(0, 5);
  return top3.map((arch) => {
    const def = ARCHETYPE_TEMPLATES[arch];
    if (!def) return null;
    let variant = t;
    if (arch === 'curiosity') variant = `The Hidden Truth About ${t} Nobody Tells You`;
    else if (arch === 'list') variant = `5 Things About ${t} That Will Change Everything`;
    else if (arch === 'authority') variant = `${t} - The Proven Method After Years of Testing`;
    else if (arch === 'transformation') variant = `How ${t} Completely Changed My Life (Before & After)`;
    else if (arch === 'urgency') variant = `${t} - Watch This NOW Before It Is Too Late`;
    else if (arch === 'question') variant = `Why Is ${t} So Important Right Now?`;
    else if (arch === 'contrarian') variant = `Stop Getting ${t} Wrong - The Real Truth Revealed`;
    return { title: variant.slice(0, 100), archetype: arch, emoji: def.emoji, label: def.label };
  }).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const title = ((body.title as string) || '').trim();
    const missingArchetypes: string[] = Array.isArray(body.missingArchetypes) ? body.missingArchetypes : [];

    if (!title) return NextResponse.json({ variants: [] });

    const missingLabels = missingArchetypes
      .map((a) => ARCHETYPE_TEMPLATES[a])
      .filter(Boolean)
      .map((d) => `${d!.emoji} ${d!.label}`)
      .join(', ');

    try {
      const aiRes = await routeAI({
        prompt: `You are a YouTube title expert. Rewrite this title to add missing psychological archetype signals.

Current title: "${title}"
Missing archetypes (add these): ${missingLabels || 'Curiosity Gap, List/Number, Contrarian'}

Generate 5 improved title variants. Each variant should:
1. Keep the same core topic
2. Add 2-3 missing archetype signals
3. Be 50-80 characters
4. Be high-CTR (numbers, power words, brackets, curiosity)

Return ONLY valid JSON:
{
  "variants": [
    {"title": "<rewritten title>", "archetypes": ["curiosity", "list"], "emoji": "🔓🔢"},
    {"title": "<rewritten title>", "archetypes": ["authority", "urgency"], "emoji": "🏆⏰"},
    {"title": "<rewritten title>", "archetypes": ["contrarian", "question"], "emoji": "⚡❓"},
    {"title": "<rewritten title>", "archetypes": ["transformation", "list"], "emoji": "🔄🔢"},
    {"title": "<rewritten title>", "archetypes": ["curiosity", "contrarian"], "emoji": "🔓⚡"}
  ]
}`,
        cacheKey: `dna-improve:${title}:${missingArchetypes.join(',')}`.slice(0, 120),
        cacheTtlSec: 600,
        timeoutMs: 20000,
        fallbackText: '',
      });

      if (aiRes.provider !== 'fallback' && aiRes.text) {
        const d = aiRes.parseJson() as any;
        if (Array.isArray(d?.variants) && d.variants.length >= 2) {
          return NextResponse.json({
            variants: d.variants.slice(0, 5).map((v: any) => ({
              title: String(v.title || '').slice(0, 100),
              archetypes: Array.isArray(v.archetypes) ? v.archetypes : [],
              emoji: String(v.emoji || ''),
            })),
            _provider: aiRes.provider,
          });
        }
      }
    } catch { /* fall through */ }

    return NextResponse.json({ variants: fallbackVariants(title, missingArchetypes.length ? missingArchetypes : ['curiosity', 'list', 'contrarian', 'question', 'authority']) });
  } catch (e: any) {
    return NextResponse.json({ variants: [] }, { status: 500 });
  }
}
