import OpenAI from 'openai';
import { getApiConfig } from './apiConfig';

export interface VisionAnalysisResult {
  title: string;
  topic: string;
  visual_description: string;
  provider: string;
  isFallback?: boolean;
}

/**
 * Analyzes an image to generate a YouTube title, topic, and visual description.
 * Tries OpenAI GPT-4o first, then falls back to Gemini 2.0 Flash.
 */
export async function analyzeImage(
  imageBase64: string,
  niche: string = 'entertainment'
): Promise<VisionAnalysisResult> {
  const config = await getApiConfig();
  let lastError: any = null;

  const prompt = `Analyze this image and generate:
1. A highly clickable YouTube video title.
2. A short 1-3 word main topic.
3. A detailed visual description of the main subject (person, objects) and background to recreate this scene style in another AI.
Return EXACTLY in JSON format: {"title": "...", "topic": "...", "visual_description": "..."}`;

  // 1. Try OpenAI GPT-4o
  if (config.openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(response.choices[0]?.message?.content || '{}');
      if (data.title && data.topic) {
        return {
          title: data.title,
          topic: data.topic,
          visual_description: data.visual_description || 'A person in a professional setting',
          provider: 'openai'
        };
      }
    } catch (e: any) {
      console.warn('[Vision] OpenAI analysis failed:', e.message);
      lastError = e;
    }
  }

  // 2. Fallback to Gemini 2.0 Flash
  if (config.googleGeminiApiKey) {
    try {
      // Extract base64 and mime type from data URL
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(config.googleGeminiApiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Data } }
                ]
              }],
              generationConfig: { 
                temperature: 0.7, 
                maxOutputTokens: 500,
                response_mime_type: "application/json" 
              },
            }),
          }
        );

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
          if (parsed.title && parsed.topic) {
            return {
              title: parsed.title,
              topic: parsed.topic,
              visual_description: parsed.visual_description || 'A person in a professional setting',
              provider: 'gemini'
            };
          }
        }
      }
    } catch (e: any) {
      console.error('[Vision] Gemini fallback failed:', e.message);
      lastError = e;
    }
  }

  // 3. Absolute Fallback (Deterministic)
  console.warn('[Vision] All AI analysis failed. Using deterministic fallback.');
  const fallbacks: Record<string, { title: string, topic: string, visual_description: string }> = {
    news: { title: "BREAKING: Viral News Event Revealed", topic: "Breaking News", visual_description: "A person look shocked in front of a news set background" },
    gaming: { title: "INSANE: How I Mastered This Impossible Game", topic: "Pro Gaming", visual_description: "A gamer with a headset in a dark room with neon lights" },
    entertainment: { title: "SHOCKING: The Secret They Didn't Want You To Know", topic: "Shocking Secret", visual_description: "A dramatic portrait with high contrast lighting" },
    education: { title: "EXPLAINED: The Ultimate Guide to Mastery", topic: "Expert Guide", visual_description: "A person in front of a chalkboard or library" }
  };

  const selected = fallbacks[niche] || fallbacks.entertainment;
  
  return {
    ...selected,
    provider: 'fallback',
    isFallback: true
  };
}
