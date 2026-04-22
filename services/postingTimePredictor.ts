/**
 * Posting Time Predictor
 * Tier 1: AI content analysis via routeAI (OpenAI → Gemini → Groq → ...)
 * Tier 2: Keyword-based category detection (deterministic)
 * Tier 3: Research-based platform defaults (no random)
 */

export interface PostingTime {
  day: string;
  hour: number;
  confidence: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Research-based optimal times per platform (no randomness) ────────────────
// Sources: YouTube Creator Academy, HubSpot, Sprout Social research data
const PLATFORM_DEFAULTS: Record<string, { day: string; hour: number; confidence: number }> = {
  youtube:   { day: 'Thursday', hour: 15, confidence: 72 }, // 3 PM — peak YouTube traffic
  facebook:  { day: 'Wednesday', hour: 13, confidence: 68 }, // 1 PM midweek
  instagram: { day: 'Tuesday', hour: 11, confidence: 70 },  // 11 AM highest engagement
  tiktok:    { day: 'Friday', hour: 18, confidence: 74 },   // 6 PM Friday
};

// ─── Category-based time adjustments (deterministic) ─────────────────────────
interface CategoryRule {
  keywords: string[];
  day: string;
  hour: number;
  confidence: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  { keywords: ['comedy', 'funny', 'meme', 'prank', 'laugh', 'humor'],      day: 'Friday',    hour: 20, confidence: 76 },
  { keywords: ['education', 'tutorial', 'how to', 'learn', 'guide', 'tips'], day: 'Tuesday',   hour: 10, confidence: 78 },
  { keywords: ['music', 'song', 'dance', 'singing', 'cover', 'beat'],       day: 'Friday',    hour: 17, confidence: 74 },
  { keywords: ['gaming', 'game', 'gameplay', 'minecraft', 'fortnite'],      day: 'Saturday',  hour: 16, confidence: 75 },
  { keywords: ['news', 'politics', 'current', 'update', 'breaking'],        day: 'Monday',    hour: 8,  confidence: 70 },
  { keywords: ['fitness', 'workout', 'exercise', 'health', 'yoga'],         day: 'Monday',    hour: 7,  confidence: 73 },
  { keywords: ['cooking', 'recipe', 'food', 'kitchen', 'chef'],             day: 'Sunday',    hour: 12, confidence: 72 },
  { keywords: ['travel', 'vlog', 'tour', 'adventure', 'explore'],           day: 'Saturday',  hour: 10, confidence: 71 },
  { keywords: ['tech', 'review', 'unboxing', 'gadget', 'phone', 'laptop'],  day: 'Wednesday', hour: 14, confidence: 76 },
  { keywords: ['finance', 'money', 'invest', 'stock', 'business'],          day: 'Tuesday',   hour: 9,  confidence: 74 },
  { keywords: ['fashion', 'style', 'makeup', 'beauty', 'skincare'],         day: 'Wednesday', hour: 12, confidence: 72 },
  { keywords: ['motivational', 'success', 'mindset', 'self', 'inspire'],    day: 'Monday',    hour: 6,  confidence: 71 },
  { keywords: ['bigg boss', 'reality', 'drama', 'gossip', 'celebrity'],     day: 'Sunday',    hour: 21, confidence: 75 },
  { keywords: ['cricket', 'ipl', 'football', 'sports', 'match', 'khel'],    day: 'Saturday',  hour: 15, confidence: 73 },
  { keywords: ['bhajan', 'puja', 'mandir', 'religious', 'devotional'],      day: 'Sunday',    hour: 7,  confidence: 70 },
];

function detectCategory(title: string, description = ''): CategoryRule | null {
  const text = (title + ' ' + description).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) return rule;
  }
  return null;
}

/** Synchronous fallback — always returns deterministic result, zero randomness */
export function predictBestPostingTime(
  videoCategory?: string,
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'
): PostingTime {
  // Category detection from hint
  if (videoCategory) {
    const match = detectCategory(videoCategory);
    if (match) {
      return { day: match.day, hour: match.hour, confidence: match.confidence };
    }
  }
  const defaults = PLATFORM_DEFAULTS[platform] || PLATFORM_DEFAULTS.youtube;
  return { day: defaults.day, hour: defaults.hour, confidence: defaults.confidence };
}

/** AI-powered posting time prediction with full fallback chain */
export async function predictBestPostingTimeAI(
  title: string,
  description: string,
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube',
): Promise<PostingTime & { method: string }> {

  // ── Tier 1: AI analysis via routeAI ────────────────────────────────────
  try {
    const { routeAI } = await import('@/lib/ai-router');
    const prompt = `You are a YouTube/social media expert. Based on this video content, predict the BEST posting time for maximum views.

Video title: "${title}"
Platform: ${platform}
${description ? `Description hint: "${description.slice(0, 200)}"` : ''}

Return ONLY valid JSON:
{
  "day": "<day of week e.g. Tuesday>",
  "hour": <hour 0-23 in 24h format>,
  "confidence": <number 60-95>,
  "reason": "<1 line reason>"
}
No explanation outside JSON.`;

    const result = await routeAI({
      prompt,
      timeoutMs: 8000,
      cacheKey: `posttime:${platform}:${Buffer.from(title).toString('base64').slice(0, 24)}`,
      cacheTtlSec: 86400,
    });

    const text = result.text || '';
    const json = text.match(/\{[\s\S]*?\}/)?.[0];
    if (json) {
      const d = JSON.parse(json.replace(/,\s*([}\]])/g, '$1'));
      const day = DAYS.find(dy => dy.toLowerCase() === String(d.day || '').toLowerCase());
      const hour = Math.max(0, Math.min(23, Number(d.hour ?? 14)));
      const confidence = Math.max(60, Math.min(95, Number(d.confidence ?? 72)));
      if (day) {
        console.log(`[PostingTime] AI (${result.provider}): ${day} ${hour}:00, confidence ${confidence}%`);
        return { day, hour, confidence, method: result.provider };
      }
    }
  } catch (e) {
    console.warn('[PostingTime] AI failed:', e);
  }

  // ── Tier 2: Keyword category detection ─────────────────────────────────
  const categoryMatch = detectCategory(title, description);
  if (categoryMatch) {
    console.log(`[PostingTime] Category match: ${categoryMatch.day} ${categoryMatch.hour}:00`);
    return { day: categoryMatch.day, hour: categoryMatch.hour, confidence: categoryMatch.confidence, method: 'category-rules' };
  }

  // ── Tier 3: Platform defaults (research-based, no random) ───────────────
  const defaults = PLATFORM_DEFAULTS[platform] || PLATFORM_DEFAULTS.youtube;
  console.log(`[PostingTime] Platform defaults: ${defaults.day} ${defaults.hour}:00`);
  return { day: defaults.day, hour: defaults.hour, confidence: defaults.confidence, method: 'platform-defaults' };
}

/** Posting heatmap — deterministic, no random values */
export function generatePostingHeatmap(
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'
): Array<{ day: string; hour: number; engagement: number }> {
  const optimal = PLATFORM_DEFAULTS[platform] || PLATFORM_DEFAULTS.youtube;
  const optimalDayIdx = DAYS.indexOf(optimal.day);

  const heatmap: Array<{ day: string; hour: number; engagement: number }> = [];

  DAYS.forEach((day, dayIdx) => {
    for (let hour = 0; hour <= 23; hour++) {
      const isWeekday = dayIdx >= 1 && dayIdx <= 5;
      const hourDist = Math.abs(hour - optimal.hour);
      const dayDist = Math.min(Math.abs(dayIdx - optimalDayIdx), 7 - Math.abs(dayIdx - optimalDayIdx));

      // Base from research: morning commute (7-9), lunch (12-13), evening (18-21)
      let base = 20;
      if (hour >= 7 && hour <= 9) base = 45;
      else if (hour >= 12 && hour <= 13) base = 50;
      else if (hour >= 18 && hour <= 21) base = 55;
      else if (hour >= 22 || hour <= 5) base = 15;

      if (isWeekday) base += 10;
      if (hour === optimal.hour && dayIdx === optimalDayIdx) base = 95;
      else if (hourDist <= 1 && dayDist <= 1) base = Math.min(90, base + 25);
      else if (hourDist <= 2 && dayDist <= 1) base = Math.min(80, base + 15);

      heatmap.push({ day, hour, engagement: Math.min(100, base) });
    }
  });

  return heatmap;
}
