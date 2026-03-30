/**
 * AI Studio - Script, Thumbnail, Hooks, Shorts, YouTube Growth
 * Hybrid: OpenAI (from API Config or env) → Gemini fallback → mock.
 */

import { getApiConfig } from '@/lib/apiConfig';

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data?.error?.message || 'Gemini no text');
  return text;
}

function parseJsonFromText(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

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
    `#${topic.replace(/\s+/g, '')}`,
    `#${platform}`,
    '#viral',
    '#tips',
    '#trending',
    '#learn',
    '#hacks',
    '#shorts',
    '#fyp',
    '#explore',
    '#growth',
    '#success',
    '#motivation',
    '#tutorial',
    '#content'
  ].slice(0, 15);

  const baseCTA = `If you found this ${topic} tutorial valuable, hit that like button and subscribe for more! 🔥 Drop your biggest question about ${topic} in the comments below!`;

  if (lang === 'hindi') {
    return {
      hooks: [
        `क्या आप जानते हैं कि ${topic} सब कुछ बदल सकता है?`,
        `स्क्रॉल मत कीजिए! यह ${topic} टिप आपके घंटे बचाएगी।`,
        `काश मुझे ${topic} के बारे में पहले पता होता।`,
      ],
      script: `[हुक - 0-3 सेकंड]\n${topic} पर एक तेज़ सवाल या दावे से शुरुआत करें।\n\n[परिचय - 3-10 सेकंड]\nदर्शकों को स्वागत दें। कहें: "इस ${duration} वीडियो में, आप ${topic} के बारे में सब कुछ सीखेंगे।"\n\n[मुख्य मूल्य - 50% वीडियो]\n${topic} पर 5 मुख्य बातें:\n1. ${topic} पर पहला महत्वपूर्ण विचार\n2. ${topic} के लिए दूसरी रणनीति\n3. ${topic} पर तीसरी सलाह\n4. ${topic} के साथ आम गलतियाँ\n5. ${topic} को लागू करने का तरीका\n\n[कहानी/सबूत - 20% वीडियो]\nअपनी व्यक्तिगत कहानी साझा करें जो साबित करे कि ${topic} कैसे काम करता है।\n\n[कॉल टू एक्शन - आखिरी 5 सेकंड]\nकहें: "अगर यह ${topic} टिप मददगार लगी तो लाइक करें, फॉलो करें, और ${topic} पर अपना सवाल कमेंट करें!"\n\n[नोट]\nकुल शब्द: लगभग ${wordCount} शब्द (${durationSeconds} सेकंड)\nगति: प्रति मिनट 130 शब्द\nSEO: ${topic} 4-5 बार दोहराया गया`,
      titles: [
        `${topic} की पूरी गाइड (${platform})`,
        `${duration} में ${topic} कैसे मास्टर करें`,
        `${topic}: जो कोई नहीं बताता`,
        `${topic} के 5 ज़बरदस्त टिप्स`,
        `${topic} समझाया गया (हिंदी)`,
      ],
      hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#tips', '#trending', '#hindi', '#explore', '#fyp', '#video', '#growth', '#strategy', '#learn', '#success', '#motivation', '#content'].slice(0, 15),
      cta: `अगर यह मददगार लगा तो लाइक और फॉलो करें। ${topic} पर अपना सवाल कमेंट में लिखें! 🔥`,
    };
  }

  if (lang === 'spanish') {
    return {
      hooks: [
        `¿Sabías que ${topic} puede cambiarlo todo?`,
        `¡Deja de scroll! Este tip de ${topic} te ahorrará horas.`,
        `Ojalá hubiera sabido esto sobre ${topic} antes.`,
      ],
      script: `[GANCHO - 0-3 segundos]\nCapta la atención con una pregunta sobre ${topic}.\n\n[INTRO - 3-10 segundos]\nSaluda y di: "En este video de ${duration}, aprenderás todo sobre ${topic}."\n\n[VALOR PRINCIPAL - 50% del video]\nExplica 5 puntos clave de ${topic}:\n1. Primera insight sobre ${topic}\n2. Segunda estrategia de ${topic}\n3. Tercer consejo sobre ${topic}\n4. Errores comunes con ${topic}\n5. Cómo implementar ${topic}\n\n[HISTORIA - 20% del video]\nComparte tu historia personal sobre ${topic}.\n\n[LLAMADA A LA ACCIÓN - Últimos 5 segundos]\n"Si te sirvió este tip de ${topic}, dale like, sigue y comenta tu pregunta sobre ${topic}!"\n\n[NOTA]\nPalabras: aproximadamente ${wordCount} palabras (${durationSeconds} segundos)\nVelocidad: 130 palabras por minuto`,
      titles: [
        `Guía completa de ${topic} (${platform})`,
        `Cómo dominar ${topic} en ${duration}`,
        `${topic}: Lo que nadie te cuenta`,
        `5 tips de ${topic} que cambian el juego`,
        `${topic} explicado (español)`,
      ],
      hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#tips', '#trending', '#español', '#explore', '#fyp', '#video', '#growth', '#estrategia', '#aprende', '#éxito', '#motivación', '#contenido'].slice(0, 15),
      cta: `Si te sirvió, dale like y sigue para más de ${topic}. ¡Comenta tu pregunta! 🔥`,
    };
  }

  return {
    hooks: baseHooks,
    script: baseScript,
    titles: baseTitles,
    hashtags: baseHashtags,
    cta: baseCTA,
  };
}

function mockThumbnail(title: string, topic: string, emotion: string, niche: string) {
  const emotions: Record<string, { colors: string[]; texts: string[] }> = {
    shock: { colors: ['#FF0000', '#FFFFFF', '#000000'], texts: ['SHOCKING', 'YOU WON\'T BELIEVE', 'EXPOSED'] },
    curiosity: { colors: ['#FFD700', '#1a1a2e', '#FFFFFF'], texts: ['WHAT HAPPENS NEXT?', 'THE SECRET', 'DISCOVER'] },
    excitement: { colors: ['#00FF00', '#FF6600', '#FFFF00'], texts: ['AMAZING', 'INSANE', 'MUST SEE'] },
  };
  const e = emotions[emotion.toLowerCase()] || emotions.curiosity;
  const ctr = 45 + Math.floor(Math.random() * 45);
  return {
    textSuggestions: e.texts.concat([title.slice(0, 40), topic, niche].filter(Boolean)).slice(0, 5),
    layoutIdea: `Bold text overlay (${emotion} style). Main phrase center, supporting line above or below. Use high contrast for ${niche} audience.`,
    colorPalette: e.colors,
    ctrScore: Math.min(100, ctr),
  };
}

function mockHooks(topic: string, niche: string, platform: string) {
  const hooks = [
    { hook: `What if I told you everything you know about ${topic} is wrong?`, psychologyType: 'Curiosity hook', whyItWorks: 'Creates instant curiosity and doubt.' },
    { hook: `Nobody wants to talk about this ${topic} truth.`, psychologyType: 'Controversy hook', whyItWorks: 'Triggers engagement through contrarian angle.' },
    { hook: `Last year I failed at ${topic}. Then this happened.`, psychologyType: 'Story hook', whyItWorks: 'Personal story builds connection.' },
    { hook: `Your competitors are already using this ${topic} trick.`, psychologyType: 'FOMO hook', whyItWorks: 'Fear of missing out drives clicks.' },
    { hook: `The ${topic} secret that changed my life.`, psychologyType: 'Curiosity hook', whyItWorks: 'Promise of hidden knowledge.' },
    { hook: `Stop doing ${topic} the wrong way.`, psychologyType: 'Controversy hook', whyItWorks: 'Challenges common belief.' },
    { hook: `I tried ${topic} for 30 days. Here\'s what happened.`, psychologyType: 'Story hook', whyItWorks: 'Transformation story format.' },
    { hook: `You\'re losing views by ignoring this ${topic} tip.`, psychologyType: 'FOMO hook', whyItWorks: 'Loss aversion.' },
    { hook: `Why ${topic} doesn\'t work (and what does).`, psychologyType: 'Curiosity hook', whyItWorks: 'Problem-solution framing.' },
    { hook: `The ${topic} method nobody teaches.`, psychologyType: 'Controversy hook', whyItWorks: 'Exclusive angle.' },
  ];
  return { hooks };
}

export async function generateScript(params: {
  topic: string;
  platform: string;
  duration: string;
  language: string;
}): Promise<{ hooks: string[]; script: string; titles: string[]; hashtags: string[]; cta: string }> {
  const config = await getApiConfig();
  const lang = params.language.trim() || 'English';
  const wordCount = getWordCountForDuration(params.duration);
  const durationInSeconds = getDurationInSeconds(params.duration);
  
  const seoPrompt = `You are a viral content expert specializing in SEO-optimized video scripts. Generate a script for topic "${params.topic}" that will be published on ${params.platform} with a duration of ${params.duration} (approximately ${wordCount} words for average ${durationInSeconds}-second speaking pace).

REQUIREMENTS:
1. Script length: Exactly ${wordCount} words (±10% tolerance)
2. Platform: Optimize for ${params.platform} (YouTube/Reels/Shorts/TikTok best practices)
3. SEO Optimization:
   - Include the main keyword "${params.topic}" naturally 3-5 times
   - Add related keywords and variations
   - Write for CTR (click-through rate) - compelling hook in first 3 seconds
   - Structure: Hook (0-3s) → Intro (3-10s) → Value (main content) → Story/Example → CTA
4. Viral Elements:
   - Include emotional triggers (curiosity, urgency, FOMO)
   - Add pattern interrupt points to prevent scrolling away
   - Include clear value proposition early
5. Output in ${lang}

Return ONLY valid JSON (no markdown/code blocks):
{
  "hooks": ["hook1", "hook2", "hook3"],
  "script": "full video script with timing markers and exact word count",
  "titles": ["title1", "title2", "title3", "title4", "title5"],
  "hashtags": ["hashtag1", "hashtag2", ..., "hashtag15"],
  "cta": "call to action string",
  "wordCount": ${wordCount},
  "estimatedDuration": "${params.duration}",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "viralScore": 85
}`;

  if (config.openaiApiKey?.trim()) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: seoPrompt }],
        temperature: 0.8,
        max_tokens: 2500
      });
      const text = res.choices[0]?.message?.content?.trim() || '{}';
      const json = parseJsonFromText(text) as any;
      return {
        hooks: Array.isArray(json.hooks) ? json.hooks : [],
        script: json.script || '',
        titles: Array.isArray(json.titles) ? json.titles : [],
        hashtags: Array.isArray(json.hashtags) ? json.hashtags : [],
        cta: json.cta || ''
      };
    } catch (e) {
      console.warn('OpenAI script failed:', e);
    }
  }
  
  if (config.googleGeminiApiKey?.trim()) {
    try {
      const text = await callGemini(seoPrompt, config.googleGeminiApiKey);
      const json = parseJsonFromText(text) as any;
      return {
        hooks: Array.isArray(json.hooks) ? json.hooks : [],
        script: json.script || '',
        titles: Array.isArray(json.titles) ? json.titles : [],
        hashtags: Array.isArray(json.hashtags) ? json.hashtags : [],
        cta: json.cta || ''
      };
    } catch (e) {
      console.warn('Gemini script failed:', e);
    }
  }
  
  return mockScript(params.topic, params.platform, params.duration, params.language);
}

export async function generateThumbnail(params: {
  videoTitle: string;
  topic: string;
  emotion: string;
  niche: string;
}): Promise<{ textSuggestions: string[]; layoutIdea: string; colorPalette: string[]; ctrScore: number }> {
  const config = await getApiConfig();
  const prompt = `Thumbnail ideas for video "${params.videoTitle}", topic ${params.topic}, emotion ${params.emotion}, niche ${params.niche}. Return JSON only: textSuggestions (array of 5), layoutIdea (string), colorPalette (array of 3 hex colors), ctrScore (number 0-100).`;
  if (config.openaiApiKey?.trim()) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const res = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
      const json = parseJsonFromText(res.choices[0]?.message?.content?.trim() || '{}') as any;
      return { textSuggestions: Array.isArray(json.textSuggestions) ? json.textSuggestions : [], layoutIdea: json.layoutIdea || '', colorPalette: Array.isArray(json.colorPalette) ? json.colorPalette : [], ctrScore: typeof json.ctrScore === 'number' ? json.ctrScore : 65 };
    } catch (e) {
      console.warn('OpenAI thumbnail failed:', e);
    }
  }
  if (config.googleGeminiApiKey?.trim()) {
    try {
      const text = await callGemini(prompt, config.googleGeminiApiKey);
      const json = parseJsonFromText(text) as any;
      return { textSuggestions: Array.isArray(json.textSuggestions) ? json.textSuggestions : [], layoutIdea: json.layoutIdea || '', colorPalette: Array.isArray(json.colorPalette) ? json.colorPalette : [], ctrScore: typeof json.ctrScore === 'number' ? json.ctrScore : 65 };
    } catch (e) {
      console.warn('Gemini thumbnail failed:', e);
    }
  }
  return mockThumbnail(params.videoTitle, params.topic, params.emotion, params.niche);
}

export async function generateHooks(params: { topic: string; niche: string; platform: string }): Promise<{ hooks: { hook: string; psychologyType: string; whyItWorks: string }[] }> {
  const config = await getApiConfig();
  const prompt = `Generate 10 viral hooks for topic "${params.topic}", niche ${params.niche}, platform ${params.platform}. Return JSON: { hooks: [ { hook, psychologyType, whyItWorks }, ... ] }`;
  if (config.openaiApiKey?.trim()) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const res = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.8 });
      const json = parseJsonFromText(res.choices[0]?.message?.content?.trim() || '{}') as any;
      if (Array.isArray(json.hooks) && json.hooks.length > 0) return { hooks: json.hooks };
    } catch (e) {
      console.warn('OpenAI hooks failed:', e);
    }
  }
  if (config.googleGeminiApiKey?.trim()) {
    try {
      const text = await callGemini(prompt, config.googleGeminiApiKey);
      const json = parseJsonFromText(text) as any;
      if (Array.isArray(json.hooks) && json.hooks.length > 0) return { hooks: json.hooks };
    } catch (e) {
      console.warn('Gemini hooks failed:', e);
    }
  }
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

  // 1. Best Posting Day
  const byDay = new Map<string, number>();
  videos.forEach((v) => {
    const d = v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('en-US', { weekday: 'long' }) : 'Unknown';
    byDay.set(d, (byDay.get(d) || 0) + (v.views || 0));
  });
  const sortedDays = [...byDay.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedDays[0]) insights.push(`Your best posting day is ${sortedDays[0][0]} (highest total views).`);

  // 2. Trend Analysis
  const recentVideos = videos.slice(0, 10);
  const olderVideos = videos.slice(10, 20);
  if (recentVideos.length && olderVideos.length) {
    const recentAvg = recentVideos.reduce((s, v) => s + v.views, 0) / recentVideos.length;
    const olderAvg = olderVideos.reduce((s, v) => s + v.views, 0) / olderVideos.length;
    if (recentAvg < olderAvg * 0.8) {
      insights.push("⚠️ Your channel views are declining. Improve thumbnails and hooks to regain momentum.");
    } else if (recentAvg > olderAvg * 1.2) {
      insights.push("🚀 Your channel is growing! Double down on your recent content style.");
    }
  }

  // 3. Performance Insights
  const avgViews = videos.reduce((s, v) => s + v.views, 0) / videos.length;
  if (avgViews < 1000) {
    insights.push("📉 Low engagement detected. Try experimenting with trending topics in your niche.");
  }

  const bestVideo = [...videos].sort((a, b) => b.views - a.views)[0];
  if (bestVideo && bestVideo.views > avgViews * 3) {
    insights.push(`🔥 Your video "${bestVideo.title?.slice(0, 30)}..." is overperforming. Create a follow-up or part 2.`);
  }

  // 4. Video Length Strategy
  const durations = videos.map(v => v.duration).filter(Boolean) as number[];
  if (durations.length > 0) {
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    if (avgDuration <= 60) {
      insights.push('🎯 Your current focus is on Shorts. Try adding 1-2 long-form videos (8+ min) to build deeper audience connection.');
    } else {
      insights.push('🎥 Your long-form videos drive watch time. Ensure you add high-energy hooks in the first 30 seconds.');
    }
  }

  // 5. General Strategy
  insights.push('🕒 Improvement: Try posting at 7 PM IST to catch peak audience activity.');
  insights.push('🖼️ Pro Tip: Use high-contrast thumbnails with larger text to improve CTR.');

  return insights;
}
