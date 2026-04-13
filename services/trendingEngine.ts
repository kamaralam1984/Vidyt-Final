import axios from 'axios';

let googleTrends: any;
try {
  googleTrends = require('google-trends-api');
} catch { googleTrends = null; }

export interface TrendingTopic {
  keyword: string;
  score: number;
  source: 'google' | 'youtube' | 'ai';
  confidence: 'high' | 'medium' | 'low';
  category?: string;
  rank?: number;
}

/**
 * Fetch REAL current trending topics — today's actual trends
 */
export async function getTrendingTopics(
  keywords: string[],
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'
): Promise<TrendingTopic[]> {
  const allTopics: TrendingTopic[] = [];

  // 1) Google Trends — Daily trending searches (REAL current trends)
  try {
    if (googleTrends) {
      const dailyRes = await googleTrends.dailyTrends({ geo: 'US' });
      const dailyData = JSON.parse(dailyRes);
      const days = dailyData?.default?.trendingSearchesDays || [];

      let rank = 0;
      for (const day of days.slice(0, 2)) { // Today + yesterday
        const searches = day.trendingSearches || [];
        for (const search of searches.slice(0, 15)) {
          rank++;
          const title = search.title?.query || '';
          if (!title) continue;
          const traffic = search.formattedTraffic || '0';
          // Parse traffic like "500K+", "1M+", "200K+"
          let trafficNum = 0;
          if (traffic.includes('M')) trafficNum = parseFloat(traffic) * 1000000;
          else if (traffic.includes('K')) trafficNum = parseFloat(traffic) * 1000;
          else trafficNum = parseInt(traffic.replace(/[^0-9]/g, '')) || 0;

          // Score: higher traffic = higher score
          const score = Math.min(98, Math.max(40, Math.round(60 + (trafficNum / 1000000) * 30)));

          const category = search.articles?.[0]?.source?.name || categorizeKeyword(title);

          allTopics.push({
            keyword: title,
            score: Math.min(98, score + (rank <= 5 ? 10 : rank <= 10 ? 5 : 0)),
            source: 'google',
            confidence: rank <= 5 ? 'high' : rank <= 15 ? 'medium' : 'low',
            category,
            rank,
          });
        }
      }
    }
  } catch (err) {
    console.error('[TrendingEngine] Google Daily Trends failed:', err);
  }

  // 2) YouTube Most Popular Videos — real trending videos
  try {
    const config = await (await import('@/lib/apiConfig')).getApiConfig();
    if (config.youtubeDataApiKey) {
      const regionCode = platform === 'youtube' ? 'US' : 'IN';
      const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode,
          maxResults: 20,
          key: config.youtubeDataApiKey,
        },
        timeout: 8000,
      });

      const videos = ytRes.data?.items || [];
      videos.forEach((video: any, i: number) => {
        const title = video.snippet?.title || '';
        const viewCount = parseInt(video.statistics?.viewCount || '0');
        const categoryId = video.snippet?.categoryId || '';
        const channelTitle = video.snippet?.channelTitle || '';

        // Extract meaningful keywords from title (not the full title)
        const cleanTitle = title.replace(/[|#\[\](){}]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanTitle.split(' ').filter((w: string) => w.length > 2);
        const keyword = words.slice(0, 5).join(' ');

        if (!keyword) return;

        const score = Math.min(97, Math.max(50, Math.round(70 + (viewCount / 10000000) * 20)));

        allTopics.push({
          keyword,
          score: Math.min(97, score + (i < 5 ? 8 : i < 10 ? 4 : 0)),
          source: 'youtube',
          confidence: i < 5 ? 'high' : i < 10 ? 'medium' : 'low',
          category: YOUTUBE_CATEGORIES[categoryId] || 'Entertainment',
          rank: (allTopics.length + 1),
        });
      });
    }
  } catch (e) {
    console.error('[TrendingEngine] YouTube Trending failed:', e);
  }

  // 3) Score user-provided keywords against Google Trends
  if (keywords.length > 0 && googleTrends) {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const response = await googleTrends.interestOverTime({
        keyword: keywords.slice(0, 5),
        startTime: sevenDaysAgo,
        endTime: today,
      });
      const parsed = JSON.parse(response);
      const timeline = parsed?.default?.timelineData || [];
      const latestPoint = timeline[timeline.length - 1];

      if (latestPoint?.value) {
        keywords.forEach((keyword, idx) => {
          const value = latestPoint.value[idx] ?? 0;
          if (value > 0) {
            allTopics.push({
              keyword,
              score: Math.max(20, Math.min(95, Math.round(value))),
              source: 'google',
              confidence: value > 50 ? 'high' : 'medium',
              category: categorizeKeyword(keyword),
              rank: allTopics.length + 1,
            });
          }
        });
      }
    } catch (err) {
      console.error('[TrendingEngine] Google keyword scoring failed:', err);
    }
  }

  // 4) AI-powered trending fallback if nothing found
  if (allTopics.length === 0) {
    try {
      const { routeAI } = await import('@/lib/ai-router');
      const today = new Date().toISOString().slice(0, 10);
      const aiRes = await routeAI({
        prompt: `List 15 currently trending topics on ${platform} as of ${today}. Return ONLY a JSON array like: [{"keyword":"topic","score":85,"category":"News"}]. No markdown.`,
        cacheKey: `trending-ai-${platform}-${today}`,
        cacheTtlSec: 3600,
      });
      try {
        const match = aiRes.text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          parsed.forEach((item: any, i: number) => {
            allTopics.push({
              keyword: item.keyword || item.topic || '',
              score: item.score || (90 - i * 3),
              source: 'ai',
              confidence: i < 5 ? 'high' : 'medium',
              category: item.category || 'Trending',
              rank: i + 1,
            });
          });
        }
      } catch { /* parse failed */ }
    } catch (e) {
      console.error('[TrendingEngine] AI fallback failed:', e);
    }
  }

  // 5) Deduplicate, rank, and sort
  const resultMap = new Map<string, TrendingTopic>();
  allTopics.forEach(t => {
    if (!t.keyword?.trim()) return;
    const key = t.keyword.toLowerCase().trim();
    const existing = resultMap.get(key);
    if (!existing || t.score > existing.score) {
      resultMap.set(key, t);
    }
  });

  const result = Array.from(resultMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  // Cache for 2 hours
  try {
    const { getRedis } = await import('@/lib/redis');
    const redis = getRedis();
    await redis.set(`trends:${platform}:${keywords.join(',')}`, JSON.stringify(result), 'EX', 2 * 60 * 60);
  } catch { /* ignore */ }

  return result;
}

export async function getTrendingScore(
  keywords: string[],
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'
): Promise<number> {
  const topics = await getTrendingTopics(keywords, platform);
  if (topics.length === 0) return 50;
  return Math.round(topics.reduce((sum, t) => sum + t.score, 0) / topics.length);
}

/** Simple keyword categorization */
function categorizeKeyword(kw: string): string {
  const k = kw.toLowerCase();
  if (/war|attack|election|politic|trump|biden|modi|government|vote/.test(k)) return 'News & Politics';
  if (/game|gaming|gta|fortnite|minecraft|xbox|playstation/.test(k)) return 'Gaming';
  if (/music|song|album|concert|singer|rapper/.test(k)) return 'Music';
  if (/movie|film|trailer|netflix|series|episode|season/.test(k)) return 'Film & TV';
  if (/sport|football|cricket|nba|soccer|tennis|match/.test(k)) return 'Sports';
  if (/tech|ai|apple|google|phone|iphone|samsung|software/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|market|invest|trade/.test(k)) return 'Finance';
  if (/health|fitness|diet|yoga|workout|medical/.test(k)) return 'Health';
  if (/food|recipe|cook|restaurant|eat/.test(k)) return 'Food';
  if (/travel|tour|destination|hotel|flight/.test(k)) return 'Travel';
  return 'Entertainment';
}

const YOUTUBE_CATEGORIES: Record<string, string> = {
  '1': 'Film & Animation', '2': 'Autos & Vehicles', '10': 'Music',
  '15': 'Pets & Animals', '17': 'Sports', '18': 'Short Movies',
  '19': 'Travel & Events', '20': 'Gaming', '21': 'Videoblogging',
  '22': 'People & Blogs', '23': 'Comedy', '24': 'Entertainment',
  '25': 'News & Politics', '26': 'Howto & Style', '27': 'Education',
  '28': 'Science & Technology', '29': 'Nonprofits & Activism',
  '30': 'Movies', '31': 'Anime/Animation', '32': 'Action/Adventure',
  '33': 'Classics', '34': 'Comedy', '35': 'Documentary', '36': 'Drama',
  '37': 'Family', '38': 'Foreign', '39': 'Horror', '40': 'Sci-Fi/Fantasy',
  '41': 'Thriller', '42': 'Shorts', '43': 'Shows', '44': 'Trailers',
};
