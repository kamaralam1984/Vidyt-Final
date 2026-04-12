import { NextRequest, NextResponse } from 'next/server';

interface ThumbnailInput {
  video_title: string;
  topic: string;
  emotion: string;
  niche: string;
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
  
  // Base emotion
  triggers.push(emotion);
  
  // Niche-specific triggers
  if (niche === 'news') {
    triggers.push('urgency', 'fear');
  } else if (niche === 'entertainment') {
    triggers.push('curiosity', 'drama');
  } else if (niche === 'gaming') {
    triggers.push('hype', 'action');
  } else if (niche === 'education') {
    triggers.push('value', 'discovery');
  }
  
  // Topic-based triggers
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
  
  // Extract key phrases
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
  let score = 70; // Base score
  
  // Power words bonus
  POWER_WORDS.forEach(word => {
    if (text.includes(word)) score += 8;
  });
  
  // Emotion bonus
  if (['fear', 'shock', 'urgency'].includes(emotion)) score += 10;
  if (['curiosity', 'mystery'].includes(emotion)) score += 7;
  
  // Niche bonus
  if (niche === 'news') score += 5;
  
  // Length penalty (shorter is better)
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
  try {
    const input: ThumbnailInput = await request.json();
    
    // Step 1: AI Analysis
    const triggers = analyzeEmotionalTriggers(input);
    
    // Step 2: Generate Thumbnail Text
    const thumbnail_text = generateHookText(input);
    
    // Step 3: Image Generation Prompt
    const image_prompt = generateImagePrompt(input, thumbnail_text);
    
    // Step 4: Generate Variations
    const variations = generateVariations(thumbnail_text, input);
    
    // Step 5: CTR + Viral Optimization
    const all_texts = [thumbnail_text, ...variations];
    const ctr_scores = all_texts.map(text => calculateCTR(text, input.emotion, input.niche));
    const reasoning = all_texts.map(text => generateReasoning(text, input.emotion, input.niche));
    
    // Step 6: Design Instructions
    const template = NICHE_TEMPLATES[input.niche as keyof typeof NICHE_TEMPLATES] || NICHE_TEMPLATES.news;
    
    const output: ThumbnailOutput = {
      thumbnail_text,
      image_prompt,
      variations,
      ctr_scores,
      reasoning,
      design: {
        colors: template.colors,
        layout: template.layout,
        effects: 'glow effect on text, light flare, motion blur, depth shadow, gradient background'
      }
    };
    
    return NextResponse.json(output);
    
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}
