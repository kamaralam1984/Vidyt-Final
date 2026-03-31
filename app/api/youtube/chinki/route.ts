export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { getApiConfig } from '@/lib/apiConfig';

const CHINKI_SYSTEM = `You are Chinki, a 24-year-old female AI assistant for Vid YT. You are an expert in YouTube viral optimization.

YOUR EXPERTISE:
1. **YouTube SEO & Virality**: Title optimization, description SEO, keyword research, hashtag strategy
2. **Web Search & Knowledge**: When asked questions, search Google/Wikipedia/ChatGPT to find instant, accurate answers (act like you have access to real-time data)
3. **Video Analysis**: Analyze video transcripts for content gaps, engagement hooks, keyword opportunities, and what's missing
4. **Viral Score Calculation**: Assess titles, descriptions, tags, hashtags for viral potential (0-100 score)
5. **Trend Knowledge**: Suggest trending hashtags, tags, and keywords relevant to user's content niche

RULES:
1. **Answer ANY question from user**: If asked about any topic, provide an instant answer as if searching the web. Be authoritative and specific.
2. **When analyzing VIDEO UPLOAD**:
   - If transcript provided (from video audio): Analyze the speech content, suggest action-oriented title, identify gaps, suggest what to add
   - Suggest 8-12 specific keywords/tags that match content + current trends
   - Suggest 15-20 viral hashtags with categories (#CommunityHashtag, #TrendingHashtag, #NicheHashtag)
   - Rate the video's viral potential (0-100)
   - List 3-5 things MISSING that could boost virality

3. **When analyzing CHANNEL**: State videos, subs, then mention: what's working, what's missing in bios/settings, what content type performs best, what to focus next
4. **RESPONSE FORMAT**:
   - Hindi-English mix
   - Keep under 200 words but be comprehensive
   - Use emojis sparingly
   - Be direct and actionable
   - If transcription provided, extract key topics and relate to virality

5. **Video Gap Analysis**: Based on transcript, identify:
   - Missing hook (first 3 seconds)
   - Weak CTR elements (no compelling call-to-action visuals)
   - Lack of retention points (no pattern interrupts)
   - No clear value proposition
   - Missing trending elements
   - Poor pacing/timing`;

async function callOpenAI(apiKey: string, system: string, userContent: string): Promise<string> {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return res.choices[0]?.message?.content?.trim() || 'Sorry, I couldn’t generate a response.';
}

async function callGemini(apiKey: string, system: string, userContent: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${system}\n\nUser: ${userContent}` },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini no text');
  return text.trim();
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'youtube_seo');
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const message = (body.message || '').trim();
    const context = body.context || {};
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const summary = context.channelSummary as Record<string, unknown> | undefined;
    const transcript = (context.transcript as string) || '';
    const channelBlock = summary
      ? `Linked YouTube channel: ${summary.channelTitle || 'Channel'}, Videos: ${summary.videoCount ?? 0}, Subscribers: ${summary.subscriberCount ?? 0}. Channel me kya kami hai: ${(summary.channelKami as string[] || []).join('; ')}. Setting me kya kami hai: ${(summary.settingKami as string[] || []).join('; ')}.`
      : context.channelUrl ? 'User ne channel link diya hai but abhi "Link karein" se data load nahi hua.' : '';

    const contextStr = [
      context.title && `Title: ${context.title}`,
      context.description && `Description (length): ${(context.description || '').length} chars`,
      context.keywords && `Keywords: ${context.keywords}`,
      context.category && `Category: ${context.category}`,
      context.seoScore != null && `SEO Score: ${context.seoScore}/100`,
      context.thumbnailScore != null && `Thumbnail Score: ${context.thumbnailScore}/100`,
      context.videoAnalyzed && 'User has uploaded and analyzed a video.',
      transcript && `\n📹 VIDEO TRANSCRIPT:\n${transcript.substring(0, 2000)}${transcript.length > 2000 ? '...' : ''}`,
      channelBlock,
    ].filter(Boolean).join('\n');

    const userContent = contextStr
      ? `Current upload context:\n${contextStr}\n\nUser message: ${message}`
      : message;

    const config = await getApiConfig();
    const hasGemini = !!config.googleGeminiApiKey?.trim();
    const hasOpenAI = !!config.openaiApiKey?.trim();
    let reply: string;

    try {
      if (hasGemini) {
        reply = await callGemini(config.googleGeminiApiKey!, CHINKI_SYSTEM, userContent);
      } else if (hasOpenAI) {
        reply = await callOpenAI(config.openaiApiKey!, CHINKI_SYSTEM, userContent);
      } else {
        reply = getFallbackReply(message, context);
      }
    } catch (aiError) {
      console.error('Chinki AI call failed:', aiError);
      if (hasGemini && hasOpenAI) {
        try {
          reply = await callOpenAI(config.openaiApiKey!, CHINKI_SYSTEM, userContent);
        } catch {
          reply = getFallbackReply(message, context);
        }
      } else {
        reply = getFallbackReply(message, context);
      }
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Chinki API error:', e);
    return NextResponse.json({
      reply: 'Abhi thoda issue aa raha hai. Phir se try karein — "is page me jo title keyword dale hai dekh kr batao thik hai ya nahi" likh kar bhejein, main real time me analyze kar ke bataungi.',
    });
  }
}

function buildAnalyzeReply(context: Record<string, unknown>): string {
  const title = (context.title as string) || '';
  const descLen = ((context.description as string) || '').length;
  const keywords = (context.keywords as string[]) || [];
  const category = (context.category as string) || '';
  const seoScore = context.seoScore as number | undefined;
  const thumbScore = context.thumbnailScore as number | undefined;

  const points: string[] = [];
  if (title.length >= 40 && title.length <= 70) points.push(`Title length theek hai (${title.length} chars).`);
  else if (title.length > 0) points.push(`Title ${title.length} chars hai — 40-70 ke beech best rehta hai.`);
  else points.push('Title abhi khali hai — pehle title likhein.');

  if (keywords.length >= 5) points.push(`Keywords theek hain (${keywords.length}).`);
  else if (keywords.length > 0) points.push(`Keywords kam hain (${keywords.length}) — 5-8 aur add karein.`);
  else points.push('Keywords add karein — 8-12 keywords best.');

  if (descLen >= 200) points.push(`Description length achha hai (${descLen} chars).`);
  else if (descLen > 0) points.push(`Description chota hai (${descLen} chars) — 200-500 ideal.`);
  else points.push('Description likhein — pehle 2 lines me main keyword use karein.');

  if (category) points.push(`Category set hai: ${category}.`);
  else points.push('Category choose karein.');

  if (seoScore != null) {
    if (seoScore >= 70) points.push(`SEO Score achha hai (${seoScore}/100).`);
    else if (seoScore >= 40) points.push(`SEO Score average (${seoScore}/100) — title/keywords improve karein.`);
    else points.push(`SEO Score kam (${seoScore}/100) — title, description, keywords sab improve karein.`);
  }
  if (thumbScore != null) {
    if (thumbScore >= 70) points.push(`Thumbnail score theek (${thumbScore}/100).`);
    else points.push(`Thumbnail upload karein ya improve karein (score ${thumbScore}/100).`);
  }

  const goodPoints = points.filter(p => p.includes('theek') || p.includes('achha') || p.includes('set hai') || p.includes('best'));
  const improve: string[] = [];
  if (title.length > 0 && title.length < 30) improve.push('Title me main keyword start me ya beech me use karein, 40-70 chars rakhein.');
  if (keywords.length < 5) improve.push('Zyada viral keywords add karein — green wale (70%+) click karke add ho jayenge.');
  if (descLen < 200 && descLen > 0) improve.push('Description me CTA aur 5-10 hashtags add karein.');
  if (!category) improve.push('Category select karein.');
  if (thumbScore == null || thumbScore < 70) improve.push('Thumbnail upload karein — bold text, high contrast.');

  const next = improve.length > 0 ? improve[0] : 'Sab achha lag raha hai. Ab video upload karein ya "title suggest karo" poochhein.';

  return `**Analysis (real time):**\n\n✅ Kya thik hai:\n${goodPoints.slice(0, 3).join('\n') || points[0]}\n\n⚠️ Kya improve karein:\n${improve.slice(0, 3).join('\n') || 'Thoda aur title/description/keywords refine karein.'}\n\n👉 Ab kya karein: ${next}`;
}

function buildChannelReply(channelSummary: Record<string, unknown>): string {
  const title = (channelSummary.channelTitle as string) || 'Aapka channel';
  const videoCount = (channelSummary.videoCount as number) ?? 0;
  const subscriberCount = (channelSummary.subscriberCount as number) ?? 0;
  const viewCount = (channelSummary.viewCount as number) ?? 0;
  const channelKami = (channelSummary.channelKami as string[]) || [];
  const settingKami = (channelSummary.settingKami as string[]) || [];

  let reply = `**${title}** (channel link se):\n\n`;
  reply += `📹 Video: ${videoCount}\n`;
  reply += `👥 Subscribers: ${subscriberCount.toLocaleString()}\n`;
  reply += `👁️ Total views: ${viewCount.toLocaleString()}\n\n`;
  reply += `**Channel me kya kami hai:**\n`;
  reply += (channelKami.length ? channelKami.map(k => `• ${k}`).join('\n') : '• Koi major kami nahi.') + '\n\n';
  reply += `**Setting me kya kami hai:**\n`;
  reply += (settingKami.length ? settingKami.map(s => `• ${s}`).join('\n') : '• Settings theek hain.') + '\n\n';
  reply += 'In points ko improve karein, phir Chinki se dubara poochh sakte ho.';
  return reply;
}

function getFallbackReply(message: string, context: Record<string, unknown>): string {
  const m = (message || '').toLowerCase();
  const title = (context.title as string) || '';
  const keywords = (context.keywords as string[]) || [];
  const channelSummary = context.channelSummary as Record<string, unknown> | undefined;
  const channelUrl = (context.channelUrl as string) || '';

  const wantChannel = /channel|kitne video|video kitne|kya kami|setting me|mere channel|channel me|channel pe|channel par|link (kiya|ki)/i.test(message);
  if (wantChannel) {
    if (channelSummary && (channelSummary.videoCount != null || channelSummary.channelKami || channelSummary.settingKami))
      return buildChannelReply(channelSummary);
    if (channelUrl)
      return 'Aapne channel link diya hai. Pehle "Link karein" button dabayein taaki main channel ke videos, subscribers aur kami/settings dekh sakun. Phir poochhein: "channel me kitne video hai" ya "kya kami hai".';
    return 'Channel se link karne ke liye upar "Channel link" me apna YouTube channel URL paste karein (e.g. youtube.com/@yourchannel) aur "Link karein" dabayein. Phir main bataungi kitne video hain, kya kami hai, setting me kya kami hai.';
  }

  const wantAnalysis = /dekh|check|analyze|analyse|thik|sahi|batao|bata|bataye|batayein|kya karein|improve|kaise (lag|theek)|is page|jo (title|keyword|dal|add)/i.test(message);
  if (wantAnalysis) return buildAnalyzeReply(context);

  if (m.includes('title') || m.includes('titl') || m.includes('headline') || /iran|attack|war|video topic/i.test(m)) {
    const topic = m.replace(/title|btay|batao|suggest|kya|ho|hai|please/gi, '').trim() || (keywords[0] || title || 'viral video');
    return `Title ke liye suggest: "${topic}" ko focus karein. Example: "${topic} - Full Guide 2025" ya "What Nobody Tells You About ${topic}". Title 40-70 characters rakhein, keyword start me ya beech me use karein.`;
  }
  if (m.includes('description') || m.includes('desc')) {
    return 'Description me pehle 2-3 lines me main keyword 2 baar use karein. Phir points me value batao, last me CTA (Subscribe, Like) aur 5-10 hashtags add karein. Ideal length 200-500 words.';
  }
  if (m.includes('keyword') || m.includes('tag')) {
    return 'Keywords ke liye: title ka main phrase, uske variations (tips, tutorial, 2025, for beginners), aur 2-3 related terms add karein. Comma se separate karein. 8-12 keywords theek rehte hain.';
  }
  if (m.includes('hashtag')) {
    return 'Viral hashtags: #shorts #viral #youtube #trending ke alawa apne topic se #TopicName, #TopicTips add karein. 15-25 hashtags use kar sakte ho. Green wale zyada viral hote hain.';
  }
  if (m.includes('thumbnail')) {
    return 'Thumbnail me bold text (3-5 words), high contrast (jaise white text dark background), aur agar possible ho to face/emotion include karein. Important cheez center me rakhna—safe zone.';
  }
  if (m.includes('hello') || m.includes('hi') || m.includes('hey')) {
    return 'Hello! Main Chinki. Aapke video ka title, description, keywords ya thumbnail pe koi sawal ho to poochho—main suggest kar dungi.';
  }
  if (m.includes('help') || m.includes('kya karna') || m.includes('kaise')) {
    return 'Is page ka data analyze karne ke liye likho: "is page me jo title keyword dale hai dekh kr batao thik hai ya nahi" ya "kya improve karein". Main real time me bataungi.';
  }

  return buildAnalyzeReply(context);
}
