import { getTrendingTopics } from './trendingEngine';
import { TitleAnalysis } from './titleOptimizer';

export async function generateHashtags(
  titleAnalysis: TitleAnalysis,
  videoDescription: string = '',
  existingHashtags: string[] = []
): Promise<string[]> {
  const hashtags: Set<string> = new Set();
  
  // Add existing hashtags
  existingHashtags.forEach(tag => hashtags.add(tag.toLowerCase()));
  
  // Add keywords from title analysis
  titleAnalysis.keywords.forEach(keyword => {
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKeyword.length > 2) {
      hashtags.add(cleanKeyword);
    }
  });
  
  // Extract hashtags from description
  const descriptionHashtags = extractHashtagsFromText(videoDescription);
  descriptionHashtags.forEach(tag => hashtags.add(tag.toLowerCase()));
  
  // Get trending topics
  const trendingTopics = await getTrendingTopics(titleAnalysis.keywords);
  trendingTopics.slice(0, 5).forEach(topic => {
    const cleanTopic = topic.keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanTopic.length > 2) {
      hashtags.add(cleanTopic);
    }
  });
  
  // Add popular generic hashtags
  const popularHashtags = [
    'viral', 'fyp', 'foryou', 'trending', 'shorts',
    'viralvideo', 'explore', 'instagood', 'love',
    'like', 'follow', 'share', 'comment', 'subscribe',
  ];
  
  popularHashtags.forEach(tag => {
    if (hashtags.size < 20) {
      hashtags.add(tag);
    }
  });
  
  // Convert to array and format
  return Array.from(hashtags)
    .map(tag => `#${tag}`)
    .slice(0, 20);
}

function extractHashtagsFromText(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}
