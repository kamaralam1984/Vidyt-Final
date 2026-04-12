export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIThumbnail from '@/models/AIThumbnail';
import { getApiConfig } from '@/lib/apiConfig';
import OpenAI from 'openai';
import { generateAIImage } from '@/lib/ai-image';

interface ThumbnailInput {
  video_title: string;
  topic: string;
  emotion: string;
  niche: string;
  generateImage?: boolean;
}

interface ThumbnailOutput {
  thumbnail_text: string;
  image_prompt: string;
  variations: string[];
  ctr_scores: number[];
  reasoning: string[];
  design: {
    colors: string[];
    layout: string;
    effects: string;
  };
  image_url?: string;
}

const POWER_WORDS = ['EXPOSED', 'SHOCKING', 'SECRET', 'WARNING', 'LEAKED', 'REVEALED', 'BANNED', 'CRISIS', 'URGENT', 'ALERT'];

const NICHE_TEMPLATES = {
  news: {
    emotions: ['fear', 'urgency', 'shock'],
    colors: ['#FF0000', '#000000', '#FFFF00', '#FFFFFF'],
    visuals: ['explosions', 'alerts', 'warning', 'maps', 'breaking news'],
    layout: 'bold text center, warning banners top/bottom'
  },
  entertainment: {
    emotions: ['curiosity', 'drama', 'excitement'],
    colors: ['#FF1493', '#00BFFF', '#FFD700', '#000000'],
    visuals: ['expressive faces', 'bright lights', 'dramatic scenes'],
    layout: 'face on right, text on left, vibrant background'
  },
  gaming: {
    emotions: ['hype', 'action', 'intensity'],
    colors: ['#00FF00', '#FF00FF', '#00FFFF', '#000000'],
    visuals: ['motion blur', 'neon effects', 'action scenes', 'gaming elements'],
    layout: 'dynamic angle, neon text, action poses'
  },
  education: {
    emotions: ['clarity', 'value', 'discovery'],
    colors: ['#4169E1', '#FFFFFF', '#F0F0F0', '#000000'],
    visuals: ['clean graphics', 'minimal design', 'professional look'],
    layout: 'clean centered text, subtle background, professional'
  }
};

function analyzeEmotionalTriggers(input: ThumbnailInput): string[] {
  const triggers: string[] = [];
  const { emotion, niche, topic, video_title } = input;
  
  triggers.push(emotion);
  
  if (niche === 'news') {
    triggers.push('urgency', 'fear');
  } else if (niche === 'entertainment') {
    triggers.push('curiosity', 'drama');
  } else if (niche === 'gaming') {
    triggers.push('hype', 'action');
  } else if (niche === 'education') {
    triggers.push('value', 'discovery');
  }
  
  const topic_lower = topic.toLowerCase();
  if (topic_lower.includes('war') || topic_lower.includes('attack')) {
    triggers.push('fear', 'urgency');
  }
  if (topic_lower.includes('secret') || topic_lower.includes('exposed')) {
    triggers.push('curiosity', 'mystery');
  }
  
  return triggers;
}

function generateHookText(input: ThumbnailInput): string {
  const { video_title, topic, emotion, niche } = input;
  const words = video_title.split(' ');
  
  const hooks = [
    `${words[0]?.toUpperCase() || ''}: ${POWER_WORDS[0]}`,
    `${emotion.toUpperCase()} TRUTH`,
    `${topic.split(' ').slice(0, 2).join(' ').toUpperCase()}`,
    `${POWER_WORDS[1]}: ${words[words.length - 1]?.toUpperCase() || ''}`,
    `2026: ${POWER_WORDS[2]}`
  ];
  
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function generateImagePrompt(input: ThumbnailInput, text: string): string {
  const { niche, topic, emotion } = input;
  const template = NICHE_TEMPLATES[niche as keyof typeof NICHE_TEMPLATES] || NICHE_TEMPLATES.news;
  
  const visual_elements = template.visuals[Math.floor(Math.random() * template.visuals.length)];
  
  return `YouTube thumbnail 16:9 aspect ratio, cinematic hyper-realistic style. 
Bold text "${text}" in massive font, center-focused, with red glow effect.
Background: dramatic ${visual_elements} scene, slightly blurred for depth.
Color scheme: high contrast red, yellow, black, white.
Effects: light flares, subtle motion blur, depth shadows, gradient overlay.
Style: MrBeast-style high impact, viral YouTube thumbnail, professional photography quality.
Emotion: ${emotion}, niche: ${niche}`;
}

function generateVariations(mainText: string, input: ThumbnailInput): string[] {
  const variations = [
    mainText.replace(POWER_WORDS[0], POWER_WORDS[1]),
    `${input.topic.split(' ').slice(0, 3).join(' ').toUpperCase()} EXPOSED`,
    `SHOCKING: ${input.video_title.split(' ').slice(-2).join(' ').toUpperCase()}`
  ];
  
  return variations.slice(0, 2);
}

function calculateCTR(text: string, emotion: string, niche: string): number {
  let score = 70;
  
  POWER_WORDS.forEach(word => {
    if (text.includes(word)) score += 8;
  });
  
  if (['fear', 'shock', 'urgency'].includes(emotion)) score += 10;
  if (['curiosity', 'mystery'].includes(emotion)) score += 7;
  
  if (niche === 'news') score += 5;
  
  if (text.split(' ').length <= 3) score += 5;
  if (text.split(' ').length > 5) score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

function generateReasoning(text: string, emotion: string, niche: string): string {
  const reasons = [];
  
  if (POWER_WORDS.some(word => text.includes(word))) {
    reasons.push('power words create curiosity gap');
  }
  
  if (['fear', 'urgency', 'shock'].includes(emotion)) {
    reasons.push('strong emotional trigger');
  }
  
  if (text.split(' ').length <= 3) {
    reasons.push('concise high-impact text');
  }
  
  if (niche === 'news') {
    reasons.push('optimized for news audience behavior');
  }
  
  return reasons.join(', ') || 'standard optimization applied';
}

export async function POST(request: NextRequest) {
  const access = await requireAIToolAccess(request, 'ai_thumbnail_maker');
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body = await request.json();
    const { videoTitle, topic, emotion, niche, generateImage } = body;
    
    if (!videoTitle?.trim()) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    }

    const input: ThumbnailInput = {
      video_title: videoTitle.trim(),
      topic: (topic || '').trim(),
      emotion: (emotion || 'curiosity').trim(),
      niche: (niche || '').trim(),
      generateImage: !!generateImage,
    };
    
    const triggers = analyzeEmotionalTriggers(input);
    const thumbnail_text = generateHookText(input);
    const image_prompt = generateImagePrompt(input, thumbnail_text);
    const variations = generateVariations(thumbnail_text, input);
    
    const all_texts = [thumbnail_text, ...variations];
    const ctr_scores = all_texts.map(text => calculateCTR(text, input.emotion, input.niche));
    const reasoning = all_texts.map(text => generateReasoning(text, input.emotion, input.niche));
    
    const template = NICHE_TEMPLATES[input.niche as keyof typeof NICHE_TEMPLATES] || NICHE_TEMPLATES.news;
    
    // Step 3: Generate the Image Reference (with fallback)
    let image_url = undefined;
    let warning = undefined;
    let generationProvider = 'none';

    if (input.generateImage) {
      try {
        const generation = await generateAIImage(image_prompt, input.niche);
        image_url = generation.url;
        generationProvider = generation.provider;
        if (generation.warning) warning = generation.warning;
      } catch (e: any) {
        console.error("AI Image Generation failed completely:", e.message);
        warning = "AI image generation is temporarily unavailable.";
      }
    }

    const output: ThumbnailOutput & { warning?: string, generationProvider?: string } = {
      thumbnail_text,
      image_prompt,
      variations,
      ctr_scores,
      reasoning,
      design: {
        colors: template.colors,
        layout: template.layout,
        effects: 'glow effect on text, light flare, motion blur, depth shadow, gradient background'
      },
      image_url,
      warning,
      generationProvider
    };

    await connectDB();
    await AIThumbnail.create({
      userId: access.userId,
      videoTitle: input.video_title,
      topic: input.topic,
      emotion: input.emotion,
      niche: input.niche,
      textSuggestions: all_texts,
      layoutIdea: output.design.layout,
      colorPalette: output.design.colors,
      ctrScore: ctr_scores[0],
    });

    return NextResponse.json(output);
    
  } catch (e: any) {
    console.error('Thumbnail generation error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}
