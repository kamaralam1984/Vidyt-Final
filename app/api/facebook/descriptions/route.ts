export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

type ContentType = 'post' | 'reel' | 'live';

// ─────────────────────────────────────
// Hardcoded fallback (used when AI unavailable)
// ─────────────────────────────────────
function fallbackDescriptions(title: string, keywords: string[], contentType: ContentType): { text: string; seoScore: number }[] {
  const t = (title || '').trim() || 'Your Post';
  const kws = keywords.length ? keywords.slice(0, 8) : ['viral', 'facebook', 'trending'];
  const tagLine = kws.slice(0, 4).join(', ');
  const year = new Date().getFullYear();
  const mainKw = kws[0]?.replace(/\s+/g, '') || 'viral';

  let templates: string[];
  if (contentType === 'reel') {
    templates = [
      `${t}\n\nQuick reel: ${tagLine}. Double tap if you relate! 🔥 #facebook #reels #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Save & share! #reels #viral #facebook #${mainKw}`,
      `${t}\n\n${tagLine}. Follow for more reels. #facebookreels #trending #${mainKw} #${year}`,
      `${t} | Reel\n\n${tagLine}. Comment your thoughts! #reels #facebook #${mainKw}`,
      `${t}\n\n${kws.join(' | ')}. Like & share karein! #facebook #reels #viral #${mainKw} #${year}`,
    ];
  } else if (contentType === 'live') {
    templates = [
      `${t}\n\nLIVE now! ${tagLine}. Join the stream, say hi in comments. #live #facebooklive #${mainKw} #${year}`,
      `"${t}" – We're live! Topic: ${kws.slice(0, 3).join(', ')}. #live #stream #facebook #${mainKw}`,
      `${t}\n\nLive stream – ${tagLine}. Watch now! #facebooklive #live #${mainKw} #${year}`,
      `${t} | LIVE\n\n${tagLine}. Comment me hello! #live #facebook #${mainKw}`,
      `${t}\n\nGoing live – ${kws.join(' | ')}. Turn on notifications! #live #facebooklive #${mainKw} #${year}`,
    ];
  } else {
    templates = [
      `${t}\n\n${tagLine}. Like, comment, share karein! #facebook #viral #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Follow for more. #facebook #trending #${mainKw}`,
      `${t}\n\n${tagLine}. Share with friends who need this. #facebook #${mainKw} #${year}`,
      `"${t}" – ${kws.join(' | ')}. Comment below! #facebook #viral #${mainKw}`,
      `${t}\n\n${tagLine}. Save & share. #facebook #content #${mainKw} #${year}`,
    ];
  }

  return templates.map((text, i) => ({ text, seoScore: Math.min(95, 68 + i * 5 + (i % 5)) }));
}

// ─────────────────────────────────────
// AI-driven caption generation
// ─────────────────────────────────────
async function getAIDescriptions(
  title: string,
  keywords: string[],
  contentType: ContentType,
): Promise<{ descriptions: { text: string; seoScore: number }[]; provider: string } | null> {
  const year = new Date().getFullYear();
  const kwStr = keywords.length ? keywords.join(', ') : '(none provided)';
  const ctLabel = contentType === 'reel' ? 'Reel (short vertical video)' : contentType === 'live' ? 'Live Stream' : 'Feed Post';

  const prompt = `You are a Facebook content strategist. Write 5 high-engagement ${ctLabel} captions for the topic below.

Title / topic: "${title || 'general content'}"
Keywords: ${kwStr}
Year: ${year}

Caption rules:
- Open with a hook (question, bold claim, stat, or emoji + curiosity).
- Use natural Hinglish if the topic suggests Indian audience; pure English otherwise.
- Each caption MUST be unique in tone — story, listicle, contrarian, FOMO, behind-the-scenes, etc.
- 90-220 chars body. Then 4-8 trending hashtags inline.
- Include 1 clear CTA ("Comment your take", "Share with…", "Save for later").
${contentType === 'reel' ? '- Reels: ultra-snappy, 1-2 line hook.' : ''}
${contentType === 'live' ? '- Live: time-sensitive, "going live", "join the stream" energy.' : ''}

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
      cacheKey: `fb-desc:${contentType}:${title}:${keywords.slice(0, 5).join(',')}`.toLowerCase(),
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
  const title = (searchParams.get('title') || '').trim();
  const keywordsParam = (searchParams.get('keywords') || '').trim();
  const contentType = (searchParams.get('contentType') || 'post') as ContentType;
  const keywords = keywordsParam ? keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) : [];

  const aiResult = await getAIDescriptions(title, keywords, contentType);
  const descriptions = aiResult?.descriptions?.length
    ? aiResult.descriptions
    : fallbackDescriptions(title, keywords, contentType);

  return NextResponse.json({
    descriptions,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served template fallback',
  });
}
