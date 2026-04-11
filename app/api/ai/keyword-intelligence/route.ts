export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  let parsedKeyword = 'viral content';
  let parsedPage = 'SEO_TOOLS_PAGE';

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { primaryKeyword, currentPage = 'SEO_TOOLS_PAGE', platform = 'youtube', contentType = 'video', niche = '' } = body;
    
    if (primaryKeyword) parsedKeyword = primaryKeyword;
    if (currentPage) parsedPage = currentPage;

    if (!primaryKeyword) {
      return NextResponse.json({ error: 'Primary Keyword is required' }, { status: 400 });
    }

    const prompt = `You are an advanced AI Keyword Intelligence Engine integrated across a full SaaS platform (VidYT). Your job is to generate, analyze, and optimize keywords dynamically based on the page context where the user is interacting.

---

INPUT:
* Primary Keyword: ${primaryKeyword}
* Current Page: ${currentPage}
* Platform: ${platform}
* Content Type: ${contentType}
* Niche: ${niche}

---

SUPPORTED PAGES (VERY IMPORTANT CONTEXT):
1. SEO_TOOLS_PAGE
2. VIDEO_ANALYZER_PAGE
3. VIDEO_UPLOAD_PAGE
4. TRENDING_KEYWORDS_PAGE
5. TITLE_GENERATOR_PAGE
6. DESCRIPTION_GENERATOR_PAGE
7. HASHTAG_GENERATOR_PAGE
8. VIRAL_AI_ANALYZER_PAGE
9. SHORTS_CREATOR_PAGE
10. CHANNEL_INTELLIGENCE_PAGE
11. COMPETITOR_ANALYSIS_PAGE
12. ANALYTICS_DASHBOARD_PAGE
13. CONTENT_CALENDAR_PAGE
14. POSTING_TIME_PAGE
15. EXPORT_REPORT_PAGE
16. SUPPORT_AI_PAGE

---

PAGE-WISE BEHAVIOR RULES:

IF Current Page = SEO_TOOLS_PAGE:
→ Generate autocomplete, long-tail, SEO keywords, low competition keywords

IF Current Page = VIDEO_ANALYZER_PAGE:
→ Extract keywords from video context + generate SEO tags + improvement keywords

IF Current Page = VIDEO_UPLOAD_PAGE:
→ Generate optimized title keywords, tags, hashtags for publishing

IF Current Page = TRENDING_KEYWORDS_PAGE:
→ Generate trending + viral + real-time keywords (news priority)

IF Current Page = TITLE_GENERATOR_PAGE:
→ Focus on high-CTR keywords and emotional triggers

IF Current Page = DESCRIPTION_GENERATOR_PAGE:
→ Generate structured SEO keyword clusters for descriptions

IF Current Page = HASHTAG_GENERATOR_PAGE:
→ Generate platform-specific hashtags (#shorts, #viral, #news)

IF Current Page = VIRAL_AI_ANALYZER_PAGE:
→ Assign viral scores to keywords and rank them

IF Current Page = SHORTS_CREATOR_PAGE:
→ Generate short-form keywords, hooks, captions, trending hashtags

IF Current Page = CHANNEL_INTELLIGENCE_PAGE:
→ Generate niche keywords + competitor keywords + growth keywords

IF Current Page = COMPETITOR_ANALYSIS_PAGE:
→ Extract and suggest competitor-based keywords

IF Current Page = ANALYTICS_DASHBOARD_PAGE:
→ Highlight top-performing keywords and ranking insights

IF Current Page = CONTENT_CALENDAR_PAGE:
→ Suggest keywords based on future trends and scheduling

IF Current Page = POSTING_TIME_PAGE:
→ Recommend best keywords for specific time slots

IF Current Page = EXPORT_REPORT_PAGE:
→ Provide keyword summary and performance data

IF Current Page = SUPPORT_AI_PAGE:
→ Suggest help-related keywords and query intent

---

OUTPUT FORMAT (STRICT JSON):
{
"page": "${currentPage}",
"primary_keyword": "${primaryKeyword}",
"suggested_keywords": [],
"long_tail_keywords": [],
"trending_keywords": [],
"viral_keywords": [],
"low_competition_keywords": [],
"hashtags": [],
"titles": [],
"hooks": [],
"keyword_scores": [
{
"keyword": "",
"trend_score": 0-100,
"viral_score": 0-100,
"seo_score": 0-100
}
],
"best_keywords": []
}

---

RULES:
* Always adapt output based on CURRENT PAGE
* Do NOT generate irrelevant keyword types
* Keep keywords platform-specific
* Prioritize trending + viral + SEO balance
* Avoid repetition
* Minimum 10 keywords per category where applicable
* Ensure real-world usable keyword patterns
* Return ONLY valid JSON, without any markdown blocks or explanation.

---

FINAL GOAL:
Create a unified keyword intelligence system that works seamlessly across all pages, powering search suggestions, SEO optimization, viral prediction, content strategy, and analytics insights.`;

    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      cacheKey: `keyword-intel:${platform}:${contentType}:${currentPage}:${primaryKeyword}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    const text = ai.text || '{}';

    // Attempt to extract JSON from the response text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response into JSON');
    }

    const parsedData = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));

    return NextResponse.json({
      success: true,
      data: parsedData,
      provider: ai.provider,
      tier: ai.provider === 'fallback' ? 'local' : ['openai', 'gemini'].includes(ai.provider) ? 'paid' : 'free',
    });

  } catch (error: any) {
    console.error('Keyword intelligence API error:', error);
    
    // Context-aware fallback using the user's input if it was successfully parsed
    const fallbackPk = parsedKeyword;
    const fallbackPg = parsedPage;

    const fallbackData = {
      page: fallbackPg,
      primary_keyword: fallbackPk,
      suggested_keywords: [`${fallbackPk} tips`, `${fallbackPk} guide`, `${fallbackPk} ideas`, `master ${fallbackPk}`],
      long_tail_keywords: [`how to ${fallbackPk}`, `best ${fallbackPk} strategy 2026`, `${fallbackPk} step by step`],
      trending_keywords: [`${fallbackPk} 2026`, `new ${fallbackPk} trend`, `latest ${fallbackPk}`],
      viral_keywords: [`viral ${fallbackPk}`, `${fallbackPk} exposed`, `shocking ${fallbackPk}`],
      low_competition_keywords: [`${fallbackPk} for beginners`, `easy ${fallbackPk} method`],
      hashtags: [`#${fallbackPk.replace(/\s+/g, '')}`, '#viral', '#trending', '#youtube'],
      titles: [`Complete Guide to ${fallbackPk}`, `The Secret of ${fallbackPk}`],
      hooks: [`Stop doing ${fallbackPk} wrong...`, `Here is how you can master ${fallbackPk}`],
      keyword_scores: [
        { keyword: fallbackPk, trend_score: 50, viral_score: 50, seo_score: 50 }
      ],
      best_keywords: [fallbackPk, `viral ${fallbackPk}`]
    };

    return NextResponse.json({ success: true, data: fallbackData, isFallback: true, errorDetails: error.message });
  }
}
