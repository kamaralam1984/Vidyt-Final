export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { requireAIToolAccess } from '@/lib/aiStudioAccess';
import connectDB from '@/lib/mongodb';
import AIThumbnail from '@/models/AIThumbnail';
import { getApiConfig } from '@/lib/apiConfig';
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
  const { niche, topic, emotion, video_title } = input;
  const topicDesc = topic || video_title || 'viral content';

  // Build a scene description from the actual topic — this is what makes the image topic-accurate
  const sceneFromTopic = buildSceneFromTopic(topicDesc, emotion);

  return `Ultra high quality cinematic scene, 16:9 aspect ratio, 8K resolution, hyper-realistic digital art.

MAIN SCENE: ${sceneFromTopic}

The image must be DIRECTLY about "${topicDesc}". Show a dramatic realistic scene that clearly represents ${topicDesc}. The viewer should immediately understand this is about ${topicDesc} by looking at the image.

STYLE: Hyper-realistic digital art, Hollywood blockbuster movie poster quality. High contrast, saturated vibrant colors, dramatic cinematic lighting, volumetric light rays.
MOOD: ${emotion}, intense, powerful, dramatic.
EFFECTS: Cinematic lens flares, particle embers, volumetric fog, depth of field, film grain, professional color grading.`;
}

function buildSceneFromTopic(topic: string, emotion: string): string {
  const t = topic.toLowerCase();

  // War/Military topics
  if (/war|attack|military|army|soldier|bomb|missile|strike|conflict|battle|defense/.test(t)) {
    return `A dramatic war/conflict scene related to "${topic}". Show soldiers, military vehicles, explosions, smoke, fire, and dramatic orange-red sky. A central military figure standing powerfully. Rubble, destruction, and urgency. War photography style.`;
  }
  // Politics/News
  if (/politic|election|president|minister|government|vote|leader|modi|trump|biden/.test(t)) {
    return `A powerful political scene related to "${topic}". A leader/politician at a podium with dramatic flags in background. Serious expression, intense lighting, crowd silhouettes. News broadcast quality.`;
  }
  // Technology/AI
  if (/tech|ai|artificial|robot|code|software|computer|phone|iphone|gadget/.test(t)) {
    return `A futuristic technology scene related to "${topic}". Holographic displays, neon blue circuits, a person interacting with advanced tech. Cyberpunk lighting, high-tech environment.`;
  }
  // Gaming
  if (/game|gaming|pubg|fortnite|minecraft|gta|valorant|esport/.test(t)) {
    return `An intense gaming scene related to "${topic}". Game characters in action, neon lights, motion blur, competitive gaming atmosphere. RGB lighting, dark background with vibrant accents.`;
  }
  // Sports
  if (/sport|football|cricket|soccer|basketball|tennis|ipl|match|player/.test(t)) {
    return `A dramatic sports scene related to "${topic}". An athlete in peak action, stadium lights, crowd blur, sweat and intensity. Sports photography, frozen action moment.`;
  }
  // Food/Cooking
  if (/food|cook|recipe|chef|restaurant|baking|kitchen/.test(t)) {
    return `A stunning food/cooking scene related to "${topic}". Beautifully plated food, steam rising, warm kitchen lighting. Professional food photography, rustic background, appetizing colors.`;
  }
  // Music
  if (/music|song|singer|concert|album|rapper|dj|beat/.test(t)) {
    return `A dramatic music/concert scene related to "${topic}". Stage lights, crowd silhouettes, neon colors, smoke machine effects. A performer on stage with dramatic spotlights.`;
  }
  // Fitness
  if (/fitness|gym|workout|yoga|weight|muscle|exercise/.test(t)) {
    return `An intense fitness scene related to "${topic}". A person working out with dramatic gym lighting, sweat, determination. Dark moody background with spotlights.`;
  }
  // Travel
  if (/travel|tour|destination|adventure|explore/.test(t)) {
    return `A breathtaking travel scene related to "${topic}". Stunning landscape, golden hour lighting, a traveler overlooking epic scenery. Drone shot quality, vibrant colors.`;
  }
  // Finance/Crypto
  if (/crypto|bitcoin|stock|market|invest|trading|money|finance/.test(t)) {
    return `A dramatic finance scene related to "${topic}". Trading charts, green/red candles, golden coins, a person analyzing data on multiple screens. Dark room with screen glow.`;
  }
  // Beauty/Fashion
  if (/beauty|makeup|skincare|fashion|model/.test(t)) {
    return `A glamorous beauty/fashion scene related to "${topic}". Professional beauty photography, perfect lighting, luxury aesthetic. Soft bokeh background, high-end magazine quality.`;
  }

  // Default: topic-specific dramatic scene
  return `A dramatic, visually stunning cinematic scene directly about "${topic}". The image must clearly show what ${topic} is about. ${emotion} mood, epic composition, cinematic lighting, professional movie poster quality. Show specific elements, objects, and scenes that represent ${topic}.`;
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
    const { videoTitle, topic, emotion, niche, generateImage, customPrompt } = body;

    if (!videoTitle?.trim() && !customPrompt?.trim()) {
      return NextResponse.json({ error: 'Video title or custom prompt is required' }, { status: 400 });
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
    const image_prompt = customPrompt?.trim()
      ? `YouTube thumbnail 16:9 aspect ratio. ${customPrompt.trim()}`
      : generateImagePrompt(input, thumbnail_text);
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
