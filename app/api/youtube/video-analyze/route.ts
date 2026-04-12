export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { transcribeAudio } from '@/lib/transcription';
import { routeAI } from '@/lib/ai-router';
import { getApiConfig } from '@/lib/apiConfig';

function parseSuggestions(text: string): { title: string; description: string; keywords: string[]; hashtags: string[] } {
  const fallback = {
    title: 'Catchy Video Title for Better CTR',
    description: 'Add a clear description with keywords and a call to action. Include relevant hashtags.',
    keywords: ['viral', 'youtube', 'tips', 'growth', 'content'],
    hashtags: ['#viral', '#youtube', '#shorts', '#trending', '#2025'],
  };
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1')) as Record<string, unknown>;
    const keywords = Array.isArray(parsed.keywords) ? (parsed.keywords as string[]) : fallback.keywords;
    const hashtags = Array.isArray(parsed.hashtags) ? (parsed.hashtags as string[]) : fallback.hashtags;
    return {
      title: (parsed.title as string) || fallback.title,
      description: (parsed.description as string) || fallback.description,
      keywords: Array.from(new Set(keywords.map((k) => String(k).replace(/^#/, '').trim().toLowerCase()).filter(Boolean))).slice(0, 10),
      hashtags: Array.from(new Set(hashtags.map((h) => `#${String(h).replace(/^#/, '').trim().toLowerCase()}`))).slice(0, 10),
    };
  } catch {
    return fallback;
  }
}

function getFallbackSuggestions(topicHint: string): { title: string; description: string; keywords: string[]; hashtags: string[] } {
  const year = new Date().getFullYear();
  return {
    title: `Best ${topicHint} Tips ${year} | Viral Guide`,
    description: `In this video we cover ${topicHint}. Key points and tips inside.\n\nSubscribe for more. Like and comment. #${topicHint.replace(/\s+/g, '')} #shorts #viral #youtube #${year}`,
    keywords: [topicHint, 'viral', 'youtube', 'tips', 'growth', 'shorts', 'trending', String(year)],
    hashtags: ['#shorts', '#viral', '#youtube', '#trending', `#${topicHint.replace(/\s+/g, '')}`, '#tips', '#growth', '#content', '#creator', '#fyp', '#explore', '#subscribe', '#like', '#comment', `#${year}`],
  };
}

export async function POST(request: NextRequest) {
  try {
    const denied = await denyIfNoFeature(request, 'youtube_seo');
    if (denied) return denied;

    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const topic = (formData.get('topic') as string) || '';

    const filename = file?.name || 'video';
    const topicHint = (topic || filename).replace(/\.[^.]*$/, '').replace(/[-_]/g, ' ').trim() || 'viral content';

    let config;
    try {
      config = await getApiConfig();
    } catch (configErr) {
      console.error('Video analyze getApiConfig error:', configErr);
      const fallback = getFallbackSuggestions(topicHint);
      return NextResponse.json({
        suggestions: fallback,
        message: 'Config unavailable. Using default suggestions.',
        transcript: undefined,
        openAiKeyConfigured: false,
        transcriptionError: 'API config could not be loaded. Check Super Admin → API keys.',
      });
    }

    // Transcribe video content using our highly robust multi-provider SaaS transcription system
    let transcript: string | null = null;
    let transcriptionError: string | undefined;
    if (file) {
      let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
      if (ip.includes(',')) ip = ip.split(',')[0].trim();

      const result = await transcribeAudio(file, filename, ip);
      if (result.success) {
        transcript = result.transcript;
      } else {
        transcriptionError = result.error;
      }
    }

    const hasContent = Boolean(transcript?.length);
    const contentBlock = hasContent
      ? `VIDEO TRANSCRIPT (video me jo baatein hui hain - isi se title, description, keywords aur hashtags banao):\n"""\n${transcript}\n"""`
      : `(No transcript available. Use filename and topic hint only: "${topicHint}")`;

    const prompt = `You are a YouTube SEO expert. Based on the VIDEO CONTENT below, suggest metadata so the title and description reflect the EXACT content spoken in the video when transcript is provided, and are SEO-friendly.

${contentBlock}

RULES:
- TITLE: When transcript is provided, use the main theme/topic actually spoken—catchy, clear, 40-70 chars. Do NOT use filename only; derive from exact content.
- DESCRIPTION: When transcript is provided, summarize what is actually said in the video in 2-3 short paragraphs; include 1-2 keywords naturally. Add CTA (subscribe, like). When no transcript, use topic/filename.
- KEYWORDS: Video type (tutorial, vlog, tips, etc.) and content ke hisaab se 8-12 search-friendly keywords.
- HASHTAGS: Video ke topic ke hisaab se 15-25 viral/relevant hashtags (#shorts #viral #youtube etc.).

Return ONLY valid JSON with keys: title (string), description (string), keywords (array of strings), hashtags (array of strings with #). No markdown, no code block.`;

    const ai = await routeAI({
      prompt,
      timeoutMs: 12000,
      fallbackText: JSON.stringify(getFallbackSuggestions(topicHint)),
      cacheKey: `video-analyze:${topicHint}:${hasContent ? 'transcript' : 'topic'}`,
      cacheTtlSec: 180,
    });
    const suggestions = parseSuggestions(ai.text || JSON.stringify(getFallbackSuggestions(topicHint)));
    const openAiKeyConfigured = Boolean(config.openaiApiKey?.trim());
    return NextResponse.json({
      suggestions,
      fromTranscript: hasContent,
      transcript: transcript || undefined,
      provider: ai.provider,
      tier: ai.provider === 'fallback' ? 'local' : ['openai', 'gemini'].includes(ai.provider) ? 'paid' : 'free',
      openAiKeyConfigured,
      transcriptionError: transcriptionError || undefined,
    });
  } catch (e) {
    console.error('Video analyze error:', e);
    const topicHint = 'viral content';
    const fallback = getFallbackSuggestions(topicHint);
    return NextResponse.json({
      suggestions: fallback,
      message: 'Something went wrong. Using default suggestions.',
      transcript: undefined,
      openAiKeyConfigured: false,
      transcriptionError: e instanceof Error ? e.message : undefined,
    });
  }
}
