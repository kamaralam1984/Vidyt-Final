/**
 * Adaptive Learning Engine Service
 * Analyzes user interactions to generate personalized viral insights.
 * Falls back to global patterns when user data is insufficient.
 */

import connectDB from '@/lib/mongodb';
import ContentInteraction from '@/models/ContentInteraction';

// ─────────────────────────────────────
// Global viral pattern library (fallback)
// ─────────────────────────────────────
const GLOBAL_PATTERNS = {
  youtube: {
    top_hook_style: 'Shock + Curiosity combo',
    top_title_pattern: 'Power word + Topic + Result ("EXPOSED", "SECRET", "TRUTH")',
    top_keyword_types: 'Breaking news + niche keyword + year',
    best_posting_days: ['Tuesday', 'Friday', 'Sunday'],
    avg_viral_probability: '68%',
  },
  shorts: {
    top_hook_style: 'First-3-second visual + FOMO statement',
    top_title_pattern: 'Short punch title (under 50 chars) + #shorts',
    top_keyword_types: 'Trending hashtags + broad niche',
    best_posting_days: ['Wednesday', 'Saturday', 'Sunday'],
    avg_viral_probability: '72%',
  },
  instagram: {
    top_hook_style: 'Emotional + Story hook',
    top_title_pattern: 'Question or challenge format',
    top_keyword_types: 'Lifestyle + niche + trending + reels',
    best_posting_days: ['Monday', 'Thursday', 'Saturday'],
    avg_viral_probability: '65%',
  },
  tiktok: {
    top_hook_style: 'Reverse hook (start with the punchline)',
    top_title_pattern: 'Relatable situation + twist',
    top_keyword_types: 'fyp + trend sound + niche',
    best_posting_days: ['Tuesday', 'Friday', 'Saturday'],
    avg_viral_probability: '70%',
  },
  facebook: {
    top_hook_style: 'Controversy + social proof',
    top_title_pattern: 'News headline style + share bait',
    top_keyword_types: 'Current events + regional + viral',
    best_posting_days: ['Wednesday', 'Friday', 'Sunday'],
    avg_viral_probability: '60%',
  },
};

export interface LearningInsights {
  top_performing_pattern: string;
  recommended_strategy: string;
  confidence_score: string;
  personalized: boolean;
  data_points_used: number;
  top_hook_styles: string[];
  top_keywords: string[];
  learning_notes: string[];
}

/**
 * Generate learning insights for a user + platform.
 * Uses MongoDB interaction history when available, falls back to global patterns.
 */
export async function generateLearningInsights(
  userId: string,
  topic: string,
  platform: string,
  niche: string
): Promise<LearningInsights> {
  try {
    await connectDB();

    // Fetch last 90 days of interactions for this user + platform
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const interactions = await ContentInteraction.find({
      userId,
      platform,
      createdAt: { $gte: since },
    }).lean();

    if (interactions.length < 5) {
      // Not enough personal data — use global patterns
      return buildGlobalFallback(platform, interactions.length);
    }

    // ── Analyze what user copies the most ──
    const copyEvents = interactions.filter(i =>
      ['hook_copy', 'title_copy', 'keyword_copy', 'script_copy'].includes(i.interactionType)
    );

    // Hook style analysis
    const hookStyleCounts: Record<string, number> = {};
    interactions
      .filter(i => i.interactionType === 'hook_copy' && i.hookStyle)
      .forEach(i => {
        const s = i.hookStyle!;
        hookStyleCounts[s] = (hookStyleCounts[s] || 0) + 1;
      });

    const topHookStyles = Object.entries(hookStyleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([style]) => style);

    // Keyword analysis (most copied)
    const keywordCopies = interactions
      .filter(i => i.interactionType === 'keyword_copy')
      .map(i => i.content);

    const kwCounts: Record<string, number> = {};
    keywordCopies.forEach(kw => { kwCounts[kw] = (kwCounts[kw] || 0) + 1; });
    const topKeywords = Object.entries(kwCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([kw]) => kw);

    // Title pattern analysis
    const titleCopies = interactions.filter(i => i.interactionType === 'title_copy');
    const avgTitleIndex = titleCopies.length > 0
      ? titleCopies.reduce((s, i) => s + i.contentIndex, 0) / titleCopies.length
      : 2;

    // Preferred slot (position) tells us which ranking they trust
    const slotPreference = avgTitleIndex < 2 ? 'high-drama' : avgTitleIndex < 4 ? 'educational' : 'curiosity';

    // Hook style preference string
    const hookPref = topHookStyles.length > 0
      ? topHookStyles.join(' + ')
      : GLOBAL_PATTERNS[platform as keyof typeof GLOBAL_PATTERNS]?.top_hook_style || 'Shock + Curiosity';

    // Confidence: more interactions = higher confidence
    const confidence = Math.min(95, 40 + Math.round(copyEvents.length * 2));

    // Niche-specific insight
    const nicheNote = niche
      ? `For "${niche}" niche on ${platform}, your copy behavior shows preference for ${slotPreference}-style titles.`
      : `Based on your ${platform} interaction history.`;

    const learningNotes: string[] = [
      nicheNote,
      copyEvents.length > 20 ? '🏆 Strong pattern detected — high confidence personalization active.' : '📈 Learning in progress — keep generating & copying to improve accuracy.',
      topHookStyles.length > 0 ? `You convert best with: ${hookPref} hooks.` : 'Try copying more hooks to train your personalized model.',
    ];

    return {
      top_performing_pattern: `${hookPref} hooks + ${slotPreference}-style titles`,
      recommended_strategy: `Focus on ${hookPref} opening. Use ${slotPreference} title format. Copy your top keywords: ${topKeywords.slice(0, 3).join(', ') || topic + ' news, ' + topic + ' today'}.`,
      confidence_score: `${confidence}%`,
      personalized: true,
      data_points_used: interactions.length,
      top_hook_styles: topHookStyles.length > 0 ? topHookStyles : ['Curiosity', 'Shock', 'FOMO'],
      top_keywords: topKeywords.length > 0 ? topKeywords : [topic, `${topic} news`, `${topic} viral`],
      learning_notes: learningNotes,
    };
  } catch (err) {
    console.error('[LearningEngine] error:', err);
    return buildGlobalFallback(platform, 0);
  }
}

function buildGlobalFallback(platform: string, dataPoints: number): LearningInsights {
  const p = GLOBAL_PATTERNS[platform as keyof typeof GLOBAL_PATTERNS] || GLOBAL_PATTERNS.youtube;
  return {
    top_performing_pattern: `${p.top_hook_style} + ${p.top_title_pattern}`,
    recommended_strategy: `Use ${p.top_hook_style} in your hook. ${p.top_title_pattern} for title. Post on ${p.best_posting_days.join('/')} for best reach. Keywords: ${p.top_keyword_types}.`,
    confidence_score: '55% (global baseline)',
    personalized: false,
    data_points_used: dataPoints,
    top_hook_styles: [p.top_hook_style.split('+')[0].trim(), 'Story', 'FOMO'],
    top_keywords: [],
    learning_notes: [
      `Using global ${platform} viral patterns as baseline.`,
      'Interact with the Ultra AI Engine (copy hooks, titles, keywords) to personalize your model.',
      `Global avg viral probability on ${platform}: ${p.avg_viral_probability}.`,
    ],
  };
}

/**
 * Record a user interaction (called from API or frontend tracking).
 */
export async function recordInteraction(params: {
  userId: string;
  sessionId: string;
  topic: string;
  niche?: string;
  platform: string;
  language?: string;
  region?: string;
  interactionType: IContentInteraction['interactionType'];
  content: string;
  contentIndex?: number;
  hookStyle?: string;
}): Promise<void> {
  try {
    await connectDB();
    await ContentInteraction.create(params);
  } catch (err) {
    console.error('[LearningEngine] record error:', err);
  }
}

// Import the interface for the parameter typing above
import type { IContentInteraction } from '@/models/ContentInteraction';
