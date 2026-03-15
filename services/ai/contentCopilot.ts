/**
 * AI Content Copilot - Enhanced with Trend Data
 * Uses API Config (DB / env) for OpenAI key so paid API works from website settings.
 */

import OpenAI from 'openai';
import { getApiConfig } from '@/lib/apiConfig';
import { discoverTrends } from '@/services/trends/discovery';
import ViralDataset from '@/models/ViralDataset';
import connectDB from '@/lib/mongodb';

async function getOpenAIClient(): Promise<OpenAI | null> {
  const config = await getApiConfig();
  const key = config.openaiApiKey?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export interface ContentIdea {
  title: string;
  description: string;
  hashtags: string[];
  estimatedViralScore: number;
  targetAudience: string;
  keyPoints: string[];
}

export interface Script {
  hook: string; // First 3 seconds
  mainContent: string[];
  callToAction: string;
  estimatedDuration: number;
}

/**
 * Generate video ideas based on trends and niche
 * Enhanced with real trend data
 */
export async function generateVideoIdeas(
  niche: string,
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok',
  count: number = 5
): Promise<ContentIdea[]> {
  // Get trending topics for better ideas
  let trendingTopics: string[] = [];
  try {
    await connectDB();
    const trends = await discoverTrends(platform);
    trendingTopics = trends.slice(0, 10).map(t => t.keyword);
    
    // Also get successful patterns from viral dataset
    const viralVideos = await ViralDataset.find({
      platform,
      isViral: true,
    })
      .limit(20)
      .select('title hashtags')
      .lean();
    
    const successfulPatterns = viralVideos.map(v => v.title);
    trendingTopics = [...trendingTopics, ...successfulPatterns.slice(0, 5)];
  } catch (error) {
    console.warn('Failed to fetch trends, using basic generation:', error);
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    return generateEnhancedIdeas(niche, platform, count, trendingTopics);
  }

  try {
    const trendsContext = trendingTopics.length > 0
      ? `\n\nCurrent trending topics: ${trendingTopics.slice(0, 5).join(', ')}`
      : '';

    const prompt = `Generate ${count} viral video ideas for ${platform} in the "${niche}" niche.${trendsContext}
Each idea should include:
1. A catchy title
2. A brief description
3. 5-10 relevant hashtags
4. Estimated viral potential (0-100)
5. Target audience
6. Key talking points

Format as JSON array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content creator and viral video strategist. Use trending topics to create relevant ideas.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const ideas = JSON.parse(content);
    
    return ideas.map((idea: any) => ({
      title: idea.title || '',
      description: idea.description || '',
      hashtags: idea.hashtags || [],
      estimatedViralScore: idea.estimatedViralPotential || 50,
      targetAudience: idea.targetAudience || 'General',
      keyPoints: idea.keyPoints || [],
    }));
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateEnhancedIdeas(niche, platform, count, trendingTopics);
  }
}

/**
 * Generate video script
 */
export async function generateScript(
  topic: string,
  duration: number, // in seconds
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<Script> {
  const openai = await getOpenAIClient();
  if (!openai) {
    return generateBasicScript(topic, duration, platform);
  }

  try {
    const prompt = `Create a ${platform} video script for "${topic}" that is ${duration} seconds long.
Include:
1. A strong hook (first 3 seconds) that grabs attention
2. Main content points (3-5 key points)
3. A compelling call-to-action
4. Estimated duration breakdown

Format as JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional video script writer specializing in viral content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const script = JSON.parse(content);
    
    return {
      hook: script.hook || `Watch this ${topic} video to discover something amazing!`,
      mainContent: script.mainContent || [],
      callToAction: script.callToAction || 'Like and subscribe for more!',
      estimatedDuration: script.estimatedDuration || duration,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateBasicScript(topic, duration, platform);
  }
}

/**
 * Optimize title for viral potential
 * Enhanced with trend analysis
 */
export async function optimizeTitle(
  originalTitle: string,
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<string[]> {
  // Get trending keywords for title optimization
  let trendingKeywords: string[] = [];
  try {
    await connectDB();
    const trends = await discoverTrends(platform);
    trendingKeywords = trends.slice(0, 5).map(t => t.keyword);
  } catch (error) {
    console.warn('Failed to fetch trends for title optimization:', error);
  }

  const openai = await getOpenAIClient();
  if (!openai) {
    return generateEnhancedTitles(originalTitle, platform, trendingKeywords);
  }

  try {
    const trendsContext = trendingKeywords.length > 0
      ? `\n\nConsider incorporating these trending keywords: ${trendingKeywords.join(', ')}`
      : '';

    const prompt = `Generate 5 optimized viral titles for ${platform} based on this title: "${originalTitle}"${trendsContext}
Make them:
- Attention-grabbing
- Under 60 characters
- Include emotional triggers
- Platform-optimized
- Incorporate trending keywords naturally

Return as JSON array of strings.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating viral video titles. Use trending keywords to maximize reach.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '[]';
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateEnhancedTitles(originalTitle, platform, trendingKeywords);
  }
}

/**
 * Generate hashtags for content
 */
export async function generateHashtags(
  title: string,
  description: string,
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<string[]> {
  const openai = await getOpenAIClient();
  if (!openai) {
    return generateBasicHashtags(title, description, platform);
  }

  try {
    const prompt = `Generate 20 optimized hashtags for ${platform} based on:
Title: "${title}"
Description: "${description}"

Include mix of:
- Broad hashtags
- Niche hashtags
- Trending hashtags
- Branded hashtags

Return as JSON array of strings.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at hashtag strategy for social media.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '[]';
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateBasicHashtags(title, description, platform);
  }
}

// Enhanced fallback functions with trend data
function generateEnhancedIdeas(
  niche: string,
  platform: string,
  count: number,
  trendingTopics: string[] = []
): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  const ideaTemplates = [
    `${niche} Idea: {topic} That Will Shock You`,
    `The Truth About {topic} in ${niche}`,
    `Why {topic} Is Trending Now`,
    `${niche} Secrets: {topic} Edition`,
    `Amazing {topic} Discovery in ${niche}`,
  ];

  for (let i = 0; i < count; i++) {
    const topic = trendingTopics[i] || `${niche} Content`;
    const template = ideaTemplates[i % ideaTemplates.length];
    const title = template.replace('{topic}', topic);
    
    ideas.push({
      title,
      description: `Explore ${topic} in the ${niche} niche. This content is trending and has high viral potential.`,
      hashtags: [
        niche.toLowerCase(),
        topic.toLowerCase().replace(/\s+/g, ''),
        'viral',
        'trending',
        platform === 'tiktok' ? 'fyp' : platform === 'instagram' ? 'reels' : 'shorts',
        'foryou',
        ...trendingTopics.slice(0, 3).map(t => t.toLowerCase().replace(/\s+/g, '')),
      ].slice(0, 10),
      estimatedViralScore: trendingTopics.includes(topic) ? 70 + Math.random() * 20 : 50 + Math.random() * 30,
      targetAudience: 'General',
      keyPoints: [
        `Introduction to ${topic}`,
        `Key insights about ${topic}`,
        `Why ${topic} matters`,
        `Actionable takeaways`,
      ],
    });
  }
  return ideas;
}

// Basic fallback (kept for compatibility)
function generateBasicIdeas(niche: string, platform: string, count: number): ContentIdea[] {
  return generateEnhancedIdeas(niche, platform, count, []);
}

function generateBasicScript(topic: string, duration: number, platform: string): Script {
  return {
    hook: `You won't believe what happens when we explore ${topic}!`,
    mainContent: [
      `Introduction to ${topic}`,
      `Key point 1 about ${topic}`,
      `Key point 2 about ${topic}`,
      `Conclusion and summary`,
    ],
    callToAction: 'Like, comment, and subscribe for more!',
    estimatedDuration: duration,
  };
}

function generateEnhancedTitles(
  originalTitle: string,
  platform: string,
  trendingKeywords: string[] = []
): string[] {
  const templates = [
    `${originalTitle} - You Won't Believe This!`,
    `Amazing ${originalTitle} That Went Viral`,
    `${originalTitle}: The Truth Revealed`,
    `Why ${originalTitle} Is Trending Now`,
    `${originalTitle} - Must Watch!`,
  ];

  // Enhance with trending keywords if available
  if (trendingKeywords.length > 0) {
    const keyword = trendingKeywords[0];
    return [
      `${originalTitle} - ${keyword} Edition`,
      `Why ${keyword} Makes ${originalTitle} Viral`,
      `${originalTitle}: ${keyword} Secrets Revealed`,
      `The ${keyword} Guide to ${originalTitle}`,
      `${originalTitle} - ${keyword} Trend Alert`,
    ];
  }

  return templates;
}

function generateBasicTitles(originalTitle: string, platform: string): string[] {
  return generateEnhancedTitles(originalTitle, platform, []);
}

function generateBasicHashtags(title: string, description: string, platform: string): string[] {
  const words = (title + ' ' + description).toLowerCase().split(/\s+/);
  const uniqueWords = [...new Set(words)].filter(w => w.length > 3).slice(0, 10);
  return [
    ...uniqueWords,
    'viral',
    'trending',
    'fyp',
    'foryou',
    platform,
    'shorts',
    'reels',
    'viralvideo',
  ];
}
