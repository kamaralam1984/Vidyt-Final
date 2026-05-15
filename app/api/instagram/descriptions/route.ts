export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

type ContentType = 'post' | 'reel' | 'story' | 'live';

// ─────────────────────────────────────
// Hardcoded fallback
// ─────────────────────────────────────
function fallbackCaptions(caption: string, keywords: string[], contentType: ContentType): { text: string; seoScore: number }[] {
  const t = (caption || '').trim() || 'Your post';
  const kws = keywords.length ? keywords.slice(0, 8) : ['viral', 'instagram', 'trending'];
  const tagLine = kws.slice(0, 4).join(', ');
  const year = new Date().getFullYear();
  const mainKw = kws[0]?.replace(/\s+/g, '') || 'viral';

  let templates: string[];
  if (contentType === 'reel') {
    templates = [
      `${t}\n\n${tagLine}. Double tap! 🔥 #instagram #reels #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Save & share! #reels #viral #instagood #${mainKw}`,
      `${t}\n\n${tagLine}. Follow for more reels. #instagramreels #trending #${mainKw} #${year}`,
      `${t} | Reel\n\n${tagLine}. Comment below! #reels #instagram #${mainKw}`,
      `${t}\n\n${kws.join(' | ')}. Like & share! #instagram #reels #viral #${mainKw} #${year}`,
    ];
  } else if (contentType === 'story') {
    templates = [
      `${t}\n\n${tagLine}. 👆 Tap to reply. #story #${mainKw}`,
      `"${t}" – ${kws.slice(0, 2).join(', ')}. Swipe up! #instagram #story #${mainKw}`,
      `${t}\n\n${tagLine}. #story #${mainKw} #${year}`,
      `${t} | Story\n\n${tagLine}. #instagram #${mainKw}`,
      `${t}\n\n${kws.join(' | ')}. #story #${mainKw}`,
    ];
  } else if (contentType === 'live') {
    templates = [
      `${t}\n\nLIVE now! ${tagLine}. Join & say hi! #live #instagramlive #${mainKw} #${year}`,
      `"${t}" – We're live! ${kws.slice(0, 3).join(', ')}. #live #instagram #${mainKw}`,
      `${t}\n\nLive – ${tagLine}. Watch now! #instagramlive #${mainKw} #${year}`,
      `${t} | LIVE\n\n${tagLine}. Comment hello! #live #${mainKw}`,
      `${t}\n\nGoing live – ${kws.join(' | ')}. #instagramlive #${mainKw} #${year}`,
    ];
  } else {
    templates = [
      `${t}\n\n${tagLine}. Like, comment, share! #instagram #viral #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Follow for more. #instagood #trending #${mainKw}`,
      `${t}\n\n${tagLine}. Tag someone who needs this. #instagram #${mainKw} #${year}`,
      `"${t}" – ${kws.join(' | ')}. Comment below! #instagram #viral #${mainKw}`,
      `${t}\n\n${tagLine}. Save & share. #instagram #content #${mainKw} #${year}`,
    ];
  }

  return templates.map((text, i) => ({ text, seoScore: Math.min(95, 68 + i * 5 + (i % 5)) }));
}

// ─────────────────────────────────────
// AI-driven captions
// ─────────────────────────────────────
async function getAICaptions(
  caption: string,
  keywords: string[],
  contentType: ContentType,
): Promise<{ descriptions: { text: string; seoScore: number }[]; provider: string } | null> {
  const year = new Date().getFullYear();
  const kwStr = keywords.length ? keywords.join(', ') : '(none provided)';
  const ctLabel = contentType === 'reel'
    ? 'Reel (short vertical video, 7-90s)'
    : contentType === 'story'
    ? 'Story (24h ephemeral, sticker-friendly)'
    : contentType === 'live'
    ? 'Live (real-time stream)'
    : 'Feed Post (carousel or single image)';

  const prompt = `You are an Instagram caption strategist. Write 5 high-engagement ${ctLabel} captions for the topic below.

Topic / draft: "${caption || 'general content'}"
Keywords: ${kwStr}
Year: ${year}

Caption rules:
- Hook in the FIRST 125 chars — that's what shows above the "more" cutoff on mobile.
- Use natural Hinglish if topic suggests Indian audience; pure English otherwise.
- Each caption MUST be unique in tone — story, listicle, contrarian, FOMO, behind-the-scenes/BTS, vulnerable confession, etc.
- Body: 90-300 chars main message with 2-3 line breaks (mobile readability).
- End with: CTA + 5-12 trending hashtags (mix of broad + niche).
${contentType === 'reel' ? '- Reels: ultra-snappy first line, encourage rewatching ("watch till end", "did you catch…").' : ''}
${contentType === 'story' ? '- Stories: short, sticker-prompt friendly ("DM me", "swipe to vote", "tap to reveal").' : ''}
${contentType === 'live' ? '- Live: real-time energy, "going live in 5", schedule mention, comment-driven.' : ''}
${contentType === 'post' ? '- Posts: storytelling + value, "save this for later", carousel-friendly bullet structure.' : ''}

Return ONLY this JSON (no markdown, no code block):
{
  "descriptions": [
    { "text": "...full caption with hashtags...", "seoScore": 70-95 },
    ... 5 items total
  ]
}`;

  const parse = (text: string) => {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      const j = JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) as {
        descriptions?: { text: string; seoScore: number }[];
      };
      if (!Array.isArray(j.descriptions) || j.descriptions.length === 0) return null;
      return j.descriptions
        .filter((d) => d && typeof d.text === 'string' && d.text.trim().length > 20)
        .slice(0, 5)
        .map((d) => ({
          text: d.text.trim(),
          seoScore: Math.max(60, Math.min(98, Math.round(Number(d.seoScore) || 80))),
        }));
    } catch {
      return null;
    }
  };

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `ig-desc:${contentType}:${caption}:${keywords.slice(0, 5).join(',')}`.toLowerCase(),
      cacheTtlSec: 240,
      fallbackText: '{}',
    });
    const parsed = parse(ai.text || '');
    if (!parsed || parsed.length === 0) return null;
    return { descriptions: parsed, provider: ai.provider };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const caption = (searchParams.get('caption') || searchParams.get('title') || '').trim();
  const keywordsParam = (searchParams.get('keywords') || '').trim();
  const contentType = (searchParams.get('contentType') || 'post') as ContentType;
  const keywords = keywordsParam ? keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) : [];

  const aiResult = await getAICaptions(caption, keywords, contentType);
  const descriptions = aiResult?.descriptions?.length
    ? aiResult.descriptions
    : fallbackCaptions(caption, keywords, contentType);

  return NextResponse.json({
    descriptions,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served template fallback',
  });
}
