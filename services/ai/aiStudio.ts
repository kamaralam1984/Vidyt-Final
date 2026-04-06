/**
 * AI Studio - Script, Thumbnail, Hooks, Shorts, YouTube Growth
 * Hybrid Universal Router Integration: OpenAI → Gemini → Groq ... → mock.
 */

import { routeAI } from '@/lib/ai-router';
import { getApiConfig } from '@/lib/apiConfig';

/**
 * Calculate word count based on video duration
 * Average speaking rate: 130-150 words per minute
 */
function getWordCountForDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(sec|min)/i);
  if (!match) return 300; // default

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'sec') {
    // ~2.2 words per second (130 WPM)
    return Math.max(50, Math.round(value * 2.2));
  }
  // ~130 words per minute
  return value * 130;
}

/**
 * Convert duration to seconds for easier calculation
 */
function getDurationInSeconds(duration: string): number {
  const match = duration.match(/(\d+)\s*(sec|min)/i);
  if (!match) return 300; // default 5 min

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  return unit === 'sec' ? value : value * 60;
}

function mockScript(topic: string, platform: string, duration: string, language: string) {
  const lang = (language || 'English').toLowerCase();
  const wordCount = getWordCountForDuration(duration);
  const durationSeconds = getDurationInSeconds(duration);
  
  // Base script structure with SEO optimization
  const baseHooks = [
    `Did you know ${topic} can change everything?`,
    `Stop scrolling! This ${topic} tip will save you hours.`,
    `I wish I knew this ${topic} secret earlier.`,
  ];
  
  const baseScript = `[HOOK - 0-3 seconds]\nStart with curiosity: "Did you know that ${topic}?" or share an unexpected fact about ${topic}.\n\n[INTRO - 3-10 seconds]\nGreet viewers. Say: "In this ${duration} video, you'll learn everything about ${topic}. By the end, you'll understand how to apply ${topic} effectively."\n\n[MAIN VALUE - 50% of video]\nBreakdown 3-5 key points about ${topic}:\n1. First insight on ${topic} (explain with examples)\n2. Second strategy related to ${topic} (use real-world application)\n3. Third tip for ${topic} (show how it works)\n4. Common mistake with ${topic} (what people get wrong)\n5. How to implement ${topic} (actionable steps)\n\n[STORY/PROOF - 20% of video]\nShare: "Here's how I discovered ${topic} works best..." Tell a short personal story or case study proving ${topic}.\n\n[PROOF POINTS - 15% of video]\nShow results or testimonials related to ${topic}. Build credibility around ${topic}.\n\n[CALL TO ACTION - Last 5 seconds]\nEnd with: "If this ${topic} tip helped you, smash like, follow for more, and comment your biggest question about ${topic}!"\n\n[STRUCTURE NOTE]\nTotal word count: approximately ${wordCount} words (${durationSeconds} seconds at 130 WPM)\nPace: Speak naturally, ~130 words per minute for ${duration}.\nKeyword density: ${topic} appears 4-5 times throughout (SEO optimized)\nCTA placement: Last 5 seconds for maximum engagement`;

  const baseTitles = [
    `Complete Guide to ${topic} (${platform})`,
    `How to Master ${topic} in ${duration}`,
    `${topic}: The Secret Nobody Tells You`,
    `5 Proven ${topic} Tips That Change Your Game`,
    `${topic} Explained - Full Tutorial`,
  ];

  const baseHashtags = [
    `#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#tips', '#trending', '#learn'
  ].slice(0, 15);

  const baseCTA = `If you found this ${topic} tutorial valuable, hit that like button and subscribe for more! 🔥 Drop your biggest question about ${topic} in the comments below!`;

  if (lang === 'hindi') {
    return {
      hooks: [`क्या आप जानते हैं कि ${topic} सब कुछ बदल सकता है?`, `स्क्रॉल मत कीजिए! यह ${topic} टिप आपके घंटे बचाएगी।`],
      script: `[हुक - 0-3 सेकंड]\n${topic} पर एक तेज़ सवाल या दावे से शुरुआत करें।\n\n[परिचय - 3-10 सेकंड]\nदर्शकों को स्वागत दें। कहें: "इस ${duration} वीडियो में, आप ${topic} के बारे में सब कुछ सीखेंगे।"\n\n[मुख्य मूल्य - 50% वीडियो]\n${topic} पर 5 मुख्य बातें:\n1. ${topic} पर पहला महत्वपूर्ण विचार\n2. ${topic} के लिए दूसरी रणनीति\n\n[कहानी/सबूत - 20% वीडियो]\nअपनी व्यक्तिगत कहानी साझा करें जो साबित करे कि ${topic} कैसे काम करता है।\n\n[कॉल टू एक्शन - आखिरी 5 सेकंड]\nकहें: "अगर यह ${topic} टिप मददगार लगी तो लाइक करें, फॉलो करें, और ${topic} पर अपना सवाल कमेंट करें!"`,
      titles: [`${topic} की पूरी गाइड (${platform})`, `${duration} में ${topic} कैसे मास्टर करें`],
      hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#tips', '#hindi'].slice(0, 15),
      cta: `अगर यह मददगार लगा तो लाइक और फॉलो करें। ${topic} पर अपना सवाल कमेंट में लिखें! 🔥`,
    };
  }

  return { hooks: baseHooks, script: baseScript, titles: baseTitles, hashtags: baseHashtags, cta: baseCTA };
}

function mockThumbnail(title: string, topic: string, emotion: string, niche: string) {
  const hash = (title + topic).split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 123;
  const ctr = 45 + (hash % 45);
  return {
    textSuggestions: [title.slice(0, 40), topic, niche].filter(Boolean),
    layoutIdea: `Bold text overlay (${emotion} style). Main phrase center, supporting line above or below. Use high contrast.`,
    colorPalette: ['#FF0000', '#FFFFFF', '#000000'],
    ctrScore: Math.min(100, ctr),
  };
}

function mockHooks(topic: string, niche: string, platform: string) {
  const hooks = [
    { hook: `What if I told you everything you know about ${topic} is wrong?`, psychologyType: 'Curiosity hook', whyItWorks: 'Creates instant curiosity and doubt.' },
    { hook: `Nobody wants to talk about this ${topic} truth.`, psychologyType: 'Controversy hook', whyItWorks: 'Triggers engagement through contrarian angle.' },
  ];
  return { hooks };
}

export async function generateScript(params: { topic: string; platform: string; duration: string; language: string; }): Promise<{ hooks: string[]; script: string; titles: string[]; hashtags: string[]; cta: string }> {
  const lang = params.language.trim() || 'English';
  const wordCount = getWordCountForDuration(params.duration);
  const durationInSeconds = getDurationInSeconds(params.duration);
  
  const seoPrompt = `You are a viral content expert specializing in SEO-optimized video scripts. Generate a script for topic "${params.topic}" that will be published on ${params.platform} with a duration of ${params.duration} (approximately ${wordCount} words for average ${durationInSeconds}-second speaking pace). Make sure output is in ${lang} and ONLY returning a JSON structure with {hooks, script, titles, hashtags, cta}`;

  const res = await routeAI({ prompt: seoPrompt, timeoutMs: 15000, cacheKey: `script:${params.topic}:${lang}` });
  const json = res.parseJson() as any;

  if (json && Object.keys(json).length > 0 && Array.isArray(json.hooks)) {
      return {
        hooks: Array.isArray(json.hooks) ? json.hooks : [],
        script: json.script || '',
        titles: Array.isArray(json.titles) ? json.titles : [],
        hashtags: Array.isArray(json.hashtags) ? json.hashtags : [],
        cta: json.cta || ''
      };
  }

  return mockScript(params.topic, params.platform, params.duration, params.language);
}

export async function generateThumbnail(params: { videoTitle: string; topic: string; emotion: string; niche: string; }): Promise<{ textSuggestions: string[]; layoutIdea: string; colorPalette: string[]; ctrScore: number }> {
  const prompt = `Thumbnail ideas for video "${params.videoTitle}", topic ${params.topic}, emotion ${params.emotion}, niche ${params.niche}. Return JSON only: { textSuggestions (array of 5), layoutIdea (string), colorPalette (array of 3 hex colors), ctrScore (number 0-100) }`;
  const res = await routeAI({ prompt, timeoutMs: 8000, cacheKey: `thumb:${params.topic}:${params.emotion}` });
  const json = res.parseJson() as any;

  if (json && Object.keys(json).length > 0) {
      return { 
        textSuggestions: Array.isArray(json.textSuggestions) ? json.textSuggestions : [], 
        layoutIdea: json.layoutIdea || '', 
        colorPalette: Array.isArray(json.colorPalette) ? json.colorPalette : [], 
        ctrScore: typeof json.ctrScore === 'number' ? json.ctrScore : 65 
      };
  }

  return mockThumbnail(params.videoTitle, params.topic, params.emotion, params.niche);
}

export async function generateHooks(params: { topic: string; niche: string; platform: string }): Promise<{ hooks: { hook: string; psychologyType: string; whyItWorks: string }[] }> {
  const prompt = `Generate 10 viral hooks for topic "${params.topic}", niche ${params.niche}, platform ${params.platform}. Return JSON: { hooks: [ { hook, psychologyType, whyItWorks } ] }`;
  const res = await routeAI({ prompt, timeoutMs: 10000, cacheKey: `hooks:${params.topic}` });
  const json = res.parseJson() as any;

  if (json && Array.isArray(json.hooks) && json.hooks.length > 0) return { hooks: json.hooks };
  return mockHooks(params.topic, params.niche, params.platform);
}

export function generateShortsMock(): {
  clips: { id: string; startTime: number; endTime: number; title: string; caption: string; hookText: string; hashtags: string[] }[];
} {
  const clips = [];
  for (let i = 0; i < 5; i++) {
    const start = i * 60;
    clips.push({
      id: `clip-${i + 1}`,
      startTime: start,
      endTime: start + 45,
      title: `Short Clip ${i + 1} - Key Moment`,
      caption: `Key moment ${i + 1}. Follow for more! #shorts #viral #fyp`,
      hookText: `Wait for it... moment ${i + 1}!`,
      hashtags: ['#shorts', '#viral', '#fyp', '#trending'],
    });
  }
  return { clips };
}

export function generateClipsFromSegments(
  segments: { startTime: number; endTime: number }[],
  videoTitle: string
): { id: string; startTime: number; endTime: number; title: string; caption: string; hookText: string; hashtags: string[] }[] {
  return segments.slice(0, 5).map((seg, i) => {
    const dur = Math.round(seg.endTime - seg.startTime);
    return {
      id: `clip-${i + 1}`,
      startTime: seg.startTime,
      endTime: seg.endTime,
      title: `Short ${i + 1} – ${videoTitle || 'Key moment'} (${dur}s)`,
      caption: `${videoTitle || 'Key moment'} – Part ${i + 1}. Follow for more! #shorts #viral #fyp #trending`,
      hookText: `Best part – don't skip! 🔥 Part ${i + 1}`,
      hashtags: ['#shorts', '#viral', '#fyp', '#trending', `#part${i + 1}`],
    };
  });
}

export function generateYouTubeInsights(videos: { views: number; title?: string; publishedAt?: Date; duration?: number; viralScore?: number }[]): string[] {
  const insights: string[] = [];
  if (!videos || videos.length === 0) return ['Connect your channel to get AI insights.'];

  const byDay = new Map<string, number>();
  videos.forEach((v) => {
    const d = v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('en-US', { weekday: 'long' }) : 'Unknown';
    byDay.set(d, (byDay.get(d) || 0) + (v.views || 0));
  });
  const sortedDays = [...byDay.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedDays[0]) insights.push(`Your best posting day is ${sortedDays[0][0]} (highest total views).`);

  const avgViews = videos.reduce((s, v) => s + v.views, 0) / videos.length;
  if (avgViews < 1000) {
    insights.push("📉 Low engagement detected. Try experimenting with trending topics in your niche.");
  }
  insights.push('🕒 Improvement: Try posting at 7 PM IST to catch peak audience activity.');

  return insights;
}
