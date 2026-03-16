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

function mockScript(topic: string, platform: string, duration: string, language: string) {
  const lang = (language || 'English').toLowerCase();
  if (lang === 'hindi') {
    return {
      hooks: [
        `क्या आप जानते हैं कि ${topic} सब कुछ बदल सकता है?`,
        `स्क्रॉल मत कीजिए! यह ${topic} टिप आपके घंटे बचाएगी।`,
        `काश मुझे ${topic} के बारे में पहले पता होता।`,
      ],
      script: `[हुक - पहले 3 सेकंड]\n${topic} पर एक तेज़ दावा या सवाल से ध्यान खींचें।\n\n[परिचय]\nखुद का परिचय दें और इस ${duration} वीडियो में ${platform} के लिए दर्शक क्या सीखेंगे, वो बताएं।\n\n[मुख्य बात]\n${topic} के अहम पॉइंट्स साफ सेक्शन में समझाएं।\n\n[कहानी/व्याख्या]\nअपनी बात समझाने के लिए एक छोटी कहानी या उदाहरण साझा करें।\n\n[कॉल टू एक्शन]\nदर्शकों से लाइक, सब्सक्राइब और ${topic} पर सवाल कमेंट करने को कहें।`,
      titles: [
        `${topic} की पूरी गाइड (${platform})`,
        `${duration} में ${topic} कैसे मास्टर करें`,
        `${topic}: जो कोई नहीं बताता`,
        `${topic} के 5 ज़बरदस्त टिप्स`,
        `${topic} समझाया (हिंदी)`,
      ],
      hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#tips', '#trending', '#hindi', '#explore', '#fyp', '#video', '#growth', '#strategy', '#learn', '#success', '#motivation', '#content'].slice(0, 15),
      cta: `अगर यह मददगार लगा तो लाइक और फॉलो करें। ${topic} पर अपना सवाल कमेंट में लिखें!`,
    };
  }
  if (lang === 'spanish') {
    return {
      hooks: [
        `¿Sabías que ${topic} puede cambiarlo todo?`,
        `¡Deja de scroll! Este tip de ${topic} te ahorrará horas.`,
        `Ojalá hubiera sabido esto sobre ${topic} antes.`,
      ],
      script: `[GANCHO - Primeros 3 segundos]\nCapta la atención con una afirmación o pregunta sobre ${topic}.\n\n[INTRO]\nPreséntate y qué aprenderán en este video de ${duration} para ${platform}.\n\n[VALOR PRINCIPAL]\nExplica los puntos clave de ${topic} en secciones claras.\n\n[HISTORIA/EXPLICACIÓN]\nComparte una historia o ejemplo que ilustre tu punto.\n\n[LLAMADA A LA ACCIÓN]\nPide like, suscripción y que comenten su pregunta sobre ${topic}.`,
      titles: [
        `Guía completa de ${topic} (${platform})`,
        `Cómo dominar ${topic} en ${duration}`,
        `${topic}: Lo que nadie te cuenta`,
        `5 tips de ${topic} que cambian el juego`,
        `${topic} explicado (español)`,
      ],
      hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#tips', '#trending', '#español', '#explore', '#fyp', '#video', '#growth', '#estrategia', '#aprende', '#éxito', '#motivación', '#contenido'].slice(0, 15),
      cta: `Si te sirvió, dale like y sigue para más de ${topic}. ¡Comenta tu pregunta!`,
    };
  }
  if (lang === 'french') {
    return {
      hooks: [
        `Saviez-vous que ${topic} peut tout changer ?`,
        `Arrêtez de scroller ! Ce conseil sur ${topic} vous fera gagner des heures.`,
        `J'aurais aimé savoir ça sur ${topic} plus tôt.`,
      ],
      script: `[ACCROCHE - 3 premières secondes]\nAttirez l'attention avec une affirmation ou question sur ${topic}.\n\n[INTRO]\nPrésentez-vous et ce que les viewers apprendront dans cette vidéo ${duration} pour ${platform}.\n\n[VALEUR PRINCIPALE]\nDétaillez les points clés sur ${topic} en sections claires.\n\n[HISTOIRE/EXPLICATION]\nPartagez une courte histoire ou exemple qui illustre votre propos.\n\n[APPEL À L'ACTION]\nDemandez like, abo et de commenter leur question sur ${topic}.`,
      titles: [
        `Guide complet de ${topic} (${platform})`,
        `Comment maîtriser ${topic} en ${duration}`,
        `${topic} : ce que personne ne dit`,
        `5 conseils ${topic} qui changent la donne`,
        `${topic} expliqué (français)`,
      ],
      hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${platform}`, '#viral', '#conseils', '#tendance', '#français', '#explore', '#fyp', '#vidéo', '#croissance', '#stratégie', '#apprendre', '#succès', '#motivation', '#contenu'].slice(0, 15),
      cta: `Si ça vous a aidé, likez et suivez pour plus de ${topic}. Commentez votre question !`,
    };
  }
  return {
    hooks: [
      `Did you know that ${topic} can change everything?`,
      `Stop scrolling! This ${topic} tip will save you hours.`,
      `I wish I knew this about ${topic} earlier.`,
    ],
    script: `[HOOK - First 3 seconds]\nGrab attention with a bold claim or question about ${topic}.\n\n[INTRO]\nIntroduce yourself and what viewers will learn in this ${duration} video for ${platform}.\n\n[MAIN VALUE]\nBreak down the key points about ${topic}. Use clear sections.\n\n[STORY/EXPLANATION]\nShare a short story or example that illustrates your point.\n\n[CALL TO ACTION]\nAsk viewers to like, subscribe, and comment their biggest question about ${topic}.`,
    titles: [
      `The Ultimate Guide to ${topic} (${platform})`,
      `How to Master ${topic} in ${duration}`,
      `${topic}: What Nobody Tells You`,
      `5 Game-Changing ${topic} Tips`,
      `${topic} Explained (${language})`,
    ],
    hashtags: [
      `#${topic.replace(/\s+/g, '')}`,
      `#${platform}`,
      '#viral',
      '#tips',
      '#trending',
      '#contentcreator',
      '#explore',
      '#fyp',
      '#viralvideo',
      '#growth',
      '#strategy',
      '#learn',
      '#howto',
      '#success',
      '#motivation',
    ].slice(0, 15),
    cta: `If this helped you, hit like and follow for more ${topic} content. Drop a comment with your biggest question!`,
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
  const prompt = `You are a viral content expert. Generate for topic "${params.topic}", platform ${params.platform}, duration ${params.duration}. Write ALL output in ${lang}. Return JSON only: hooks (array of 3), script (full video script), titles (array of 5), hashtags (array of 15), cta (string).`;
  if (config.openaiApiKey?.trim()) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const res = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.8 });
      const text = res.choices[0]?.message?.content?.trim() || '{}';
      const json = parseJsonFromText(text) as any;
      return { hooks: Array.isArray(json.hooks) ? json.hooks : [], script: json.script || '', titles: Array.isArray(json.titles) ? json.titles : [], hashtags: Array.isArray(json.hashtags) ? json.hashtags : [], cta: json.cta || '' };
    } catch (e) {
      console.warn('OpenAI script failed:', e);
    }
  }
  if (config.googleGeminiApiKey?.trim()) {
    try {
      const text = await callGemini(prompt, config.googleGeminiApiKey);
      const json = parseJsonFromText(text) as any;
      return { hooks: Array.isArray(json.hooks) ? json.hooks : [], script: json.script || '', titles: Array.isArray(json.titles) ? json.titles : [], hashtags: Array.isArray(json.hashtags) ? json.hashtags : [], cta: json.cta || '' };
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

export function generateYouTubeInsights(videos: { views: number; publishedAt?: Date; duration?: number }[]): string[] {
  const insights: string[] = [];
  if (videos.length > 0) {
    const byDay = new Map<string, number>();
    videos.forEach((v, i) => {
      const d = v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('en-US', { weekday: 'long' }) : 'Unknown';
      byDay.set(d, (byDay.get(d) || 0) + (v.views || 0));
    });
    const bestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
    if (bestDay) insights.push(`Your best posting day is ${bestDay[0]} (highest total views).`);
    const durations = videos.map(v => v.duration).filter(Boolean) as number[];
    if (durations.length > 0) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (avg <= 90) insights.push('Videos between 30-90 seconds tend to perform better for Shorts.');
      else insights.push('Longer videos (8+ min) can drive more watch time if retention is high.');
    }
    insights.push('Post consistently: 2-3 times per week for growth.');
  }
  return insights.length ? insights : ['Connect your channel to get AI insights.'];
}
