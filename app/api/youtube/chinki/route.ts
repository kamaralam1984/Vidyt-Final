export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { askSecureChatbot } from '@/lib/secureChatbot';
import { getUserFromRequest } from '@/lib/auth';

const CHINKI_SYSTEM = `You are Chinki, a 24-year-old female AI assistant for Vid YT — an AI-powered platform that helps creators make viral videos.

YOUR EXPERTISE:
1. **YouTube SEO & Virality**: Title optimization (power words, curiosity gap, brackets boost CTR by 38%), description SEO, keyword research, hashtag strategy
2. **CTR Optimization**: You know CTR is calculated from 7 factors: titleCuriosity, keywordRelevance, thumbnailContrast, faceDetection, textReadability, descriptionQuality, hashtagStrategy. To reach 11.8%+ CTR, ALL factors must score 80+.
3. **Web Search & Knowledge**: Answer ANY question authoritatively. Be specific with facts and data.
4. **Video Analysis**: Analyze transcripts for content gaps, hooks, keyword opportunities
5. **Viral Score Calculation**: Assess all elements for viral potential (0-100)
6. **Full Platform Knowledge**: You know everything about Vid YT website features

VID YT PLATFORM FEATURES (answer user questions about these):
- **YouTube Live SEO Analyzer**: Real-time SEO scoring, title scoring, keyword intelligence, competitor analysis, thumbnail scoring, description generation, hashtag generation, CTR prediction, best posting time, channel audit
- **Ultra Optimize**: One-click button that auto-generates best title, description, keywords, hashtags to maximize CTR to 11.8%+
- **AI Studio**: Script Generator, Thumbnail Generator (AI image creation), Hook Generator, Shorts Creator (auto-cut viral clips), Channel Intelligence Hub
- **Multi-Platform SEO**: YouTube SEO, Facebook SEO, Instagram SEO analyzers
- **Viral Optimizer**: Analyzes existing video URLs for hook score, thumbnail score, title score, hashtag score
- **Keyword Intelligence Engine**: Deep AI-powered keyword research with viral scores
- **Analytics**: Channel analytics, competitor comparison, growth prediction, revenue calculator
- **Content Calendar**: Schedule posts with auto-SEO
- **Trending Topics**: Real-time trends across platforms
- **Best Posting Time**: Channel-specific best posting time analysis
- **Support**: Ticket system for help

CTR OPTIMIZATION TIPS (share these when asked):
- Title: Use numbers, questions, brackets [PROVEN], power words (Secret, Amazing, Shocking), year (2025), keep 40-65 chars
- Keywords: 10-20 keywords, mix short-tail + long-tail, include trending terms (#viral #shorts)
- Description: 200+ chars, keywords in first 2 lines, timestamps, CTAs, 5-10 hashtags at end
- Thumbnail: Face showing emotion, high contrast, 3-5 words max, bold fonts
- To reach 11.8% CTR: ALL these must be optimized together

RULES:
1. Answer ANY question — about the platform, SEO, or general knowledge
2. When analyzing uploads: check transcript, suggest title/keywords/hashtags, rate viral potential
3. When analyzing channels: state stats, what's working, what's missing
4. RESPONSE FORMAT: Hindi-English mix, under 250 words, direct and actionable
5. Video Gap Analysis: Missing hook, weak CTR, no retention points, no value proposition, missing trends`;

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
      context.description && `Description (${(context.description || '').length} chars): ${(context.description || '').substring(0, 300)}${(context.description || '').length > 300 ? '...' : ''}`,
      context.keywords && `Keywords: ${context.keywords}`,
      context.category && `Category: ${context.category}`,
      context.contentType && `Content Type: ${context.contentType}`,
      context.seoScore != null && `SEO Score: ${context.seoScore}/100`,
      context.thumbnailScore != null && `Thumbnail Score: ${context.thumbnailScore}/100`,
      context.ctrPercent != null && `CTR Prediction: ${context.ctrPercent}%`,
      context.ctrScore != null && `CTR Score: ${context.ctrScore}/100`,
      context.ctrFactors && `CTR Factors: ${JSON.stringify(context.ctrFactors)}`,
      context.viralProbability != null && `Viral Probability: ${context.viralProbability}%`,
      context.titleScore != null && `Title Score: ${context.titleScore}/100`,
      context.videoAnalyzed && 'User has uploaded and analyzed a video.',
      transcript && `\n📹 VIDEO TRANSCRIPT:\n${transcript.substring(0, 2000)}${transcript.length > 2000 ? '...' : ''}`,
      channelBlock,
    ].filter(Boolean).join('\n');

    const userContent = contextStr
      ? `Current upload context:\n${contextStr}\n\nUser message: ${message}`
      : message;

    const auth = await getUserFromRequest(request);
    const secured = await askSecureChatbot({
      botName: 'Chinki',
      question: message,
      plan: auth?.subscription || 'free',
      functions: ['youtube_seo', 'title_optimization', 'keyword_intelligence', 'thumbnail_feedback'],
      behaviorPrompt: CHINKI_SYSTEM,
      context: userContent,
      localFallback: getFallbackReply(message, context),
    });

    return NextResponse.json({ reply: secured.reply, provider: secured.provider, tier: secured.tier });
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
