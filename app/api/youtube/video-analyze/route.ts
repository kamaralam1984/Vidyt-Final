export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { getApiConfig } from '@/lib/apiConfig';

const WHISPER_SUPPORTED_EXT = /\.(mp3|mp4|m4a|wav|webm|mpeg|mpga|m4v)$/i;

const WHISPER_MAX_BYTES = 25 * 1024 * 1024;
const WHISPER_TIMEOUT_MS = 120000; // 2 min for upload + transcription

async function transcribeWithWhisper(
  apiKey: string,
  file: Blob & { name?: string; type?: string; arrayBuffer?: () => Promise<ArrayBuffer>; size?: number }
): Promise<{ text: string | null; error?: string }> {
  const name = file.name || 'audio.mp4';
  if (!WHISPER_SUPPORTED_EXT.test(name)) {
    return { text: null, error: 'Unsupported format. Use mp3, mp4, m4a, wav, webm.' };
  }
  try {
    const arrayBuffer = await (file.arrayBuffer?.() ?? (file as unknown as { arrayBuffer(): Promise<ArrayBuffer> }).arrayBuffer?.());
    const size = arrayBuffer.byteLength;
    if (size > WHISPER_MAX_BYTES) {
      return { text: null, error: `File too large (${(size / 1024 / 1024).toFixed(1)} MB). OpenAI Whisper max is 25 MB.` };
    }
    const OpenAIModule = await import('openai');
    const OpenAI = OpenAIModule.default;
    const openai = new OpenAI({ apiKey, timeout: WHISPER_TIMEOUT_MS });
    const buffer = Buffer.from(arrayBuffer);
    const fileForWhisper = await OpenAI.toFile(buffer, name, { type: file.type || 'video/mp4' });
    const transcription = await openai.audio.transcriptions.create({
      file: fileForWhisper,
      model: 'whisper-1',
    });
    return { text: transcription?.text?.trim() || null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Whisper transcription error:', err);
    if (message.includes('api_key') || message.includes('Incorrect API key') || message.includes('invalid_api_key')) {
      return { text: null, error: 'OpenAI API key invalid or inactive. Check Super Admin → API keys.' };
    }
    if (message.includes('rate_limit') || message.includes('Rate limit')) {
      return { text: null, error: 'OpenAI rate limit. Try again in a minute.' };
    }
    if (
      message.includes('Connection') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ECONNRESET') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ENOTFOUND') ||
      message.includes('network') ||
      message.includes('fetch failed')
    ) {
      return {
        text: null,
        error: 'Connection to OpenAI failed. Check internet, firewall/proxy, or try a smaller video (< 10 MB). Retry in a moment.',
      };
    }
    return { text: null, error: message || 'Transcription failed.' };
  }
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return res.choices[0]?.message?.content?.trim() || '{}';
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini no text');
  return text.trim();
}

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
    return {
      title: (parsed.title as string) || fallback.title,
      description: (parsed.description as string) || fallback.description,
      keywords: Array.isArray(parsed.keywords) ? (parsed.keywords as string[]) : fallback.keywords,
      hashtags: Array.isArray(parsed.hashtags) ? (parsed.hashtags as string[]) : fallback.hashtags,
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

    // Transcribe video content when OpenAI key + file available (video me jo baatein hui hain)
    let transcript: string | null = null;
    let transcriptionError: string | undefined;
    if (file && config.openaiApiKey?.trim()) {
      const result = await transcribeWithWhisper(config.openaiApiKey, file);
      transcript = result.text;
      transcriptionError = result.error;
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

    let text: string | null = null;

    if (config.openaiApiKey?.trim()) {
      try {
        text = await callOpenAI(config.openaiApiKey, prompt);
      } catch (openaiErr) {
        console.error('Video analyze OpenAI error:', openaiErr);
        const fallback = getFallbackSuggestions(topicHint);
        return NextResponse.json({
          suggestions: fallback,
          message: 'AI suggestion failed. Using default suggestions. Check your OpenAI key in Super Admin.',
          transcript: transcript || undefined,
          openAiKeyConfigured: true,
          transcriptionError: transcriptionError || (openaiErr instanceof Error ? openaiErr.message : undefined),
        });
      }
    } else if (config.googleGeminiApiKey?.trim()) {
      try {
        text = await callGemini(config.googleGeminiApiKey, prompt);
      } catch (geminiErr) {
        console.error('Video analyze Gemini error:', geminiErr);
        const fallback = getFallbackSuggestions(topicHint);
        return NextResponse.json({
          suggestions: fallback,
          message: 'AI suggestion failed. Using default suggestions. Check your Gemini key in Super Admin.',
          transcript: transcript || undefined,
          openAiKeyConfigured: false,
          transcriptionError: transcriptionError || (geminiErr instanceof Error ? geminiErr.message : undefined),
        });
      }
    } else {
      const fallback = getFallbackSuggestions(topicHint);
      return NextResponse.json({
        suggestions: fallback,
        message: 'Set OpenAI or Gemini in Super Admin for AI-powered suggestions.',
        transcript: undefined,
        openAiKeyConfigured: false,
        transcriptionError: transcriptionError || 'OpenAI API key not set. Add it in Super Admin → API keys for audio transcription.',
      });
    }

    const suggestions = text ? parseSuggestions(text) : getFallbackSuggestions(topicHint);
    const openAiKeyConfigured = Boolean(config.openaiApiKey?.trim());
    return NextResponse.json({
      suggestions,
      fromTranscript: hasContent,
      transcript: transcript || undefined,
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
