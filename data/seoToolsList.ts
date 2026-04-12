export type ToolType = 'title' | 'description' | 'hashtag';

export interface SEOTool {
  slug: string;
  toolType: ToolType;
  primaryKeyword: string;
  category: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
}

const targetNiches = [
  'Gaming', 'PUBG', 'Free Fire', 'Minecraft', 'Valorant', 'CSGO', 'Roblox', 'GTA 5', 'Call of Duty', 'Apex Legends',
  'Vlogs', 'Travel', 'Daily Vlogs', 'Moto Vlogging', 'Family Vlogs',
  'Tech', 'Gadgets', 'Coding', 'Programming', 'Web Development', 'AI', 'Software',
  'Finance', 'Crypto', 'Day Trading', 'Investing', 'Stock Market', 'Real Estate',
  'Education', 'Study', 'Math', 'Science', 'Language Learning',
  'Music', 'Covers', 'Beat Making', 'DJ', 'Rap',
  'Fitness', 'Bodybuilding', 'Yoga', 'Weight Loss', 'Gym',
  'Food', 'Cooking', 'Street Food', 'Baking', 'Restaurant Reviews',
  'Beauty', 'Makeup', 'Skincare', 'Fashion', 'Hairstyles'
];

export const generateSEOToolsList = (): SEOTool[] => {
  const tools: SEOTool[] = [];

  // Core Generic Tools
  tools.push(
    {
      slug: 'youtube-title-generator',
      toolType: 'title',
      primaryKeyword: 'YouTube Title Generator',
      category: 'General',
      h1: 'Free YouTube Title Generator (AI Powered)',
      metaTitle: 'Best YouTube Title Generator | Get More Views | VidYT',
      metaDescription: 'Generate viral, high CTR YouTube titles instantly with our AI YouTube Title Generator. Optimize for SEO and hack the algorithm.'
    },
    {
      slug: 'youtube-description-generator',
      toolType: 'description',
      primaryKeyword: 'YouTube Description Generator',
      category: 'General',
      h1: 'Free YouTube Description Generator',
      metaTitle: 'Free AI YouTube Description Generator | SEO Optimized | VidYT',
      metaDescription: 'Create perfect YouTube descriptions in seconds. Our AI includes timestamps, SEO keywords, and social links automatically.'
    },
    {
      slug: 'youtube-hashtag-generator',
      toolType: 'hashtag',
      primaryKeyword: 'YouTube Hashtag Generator',
      category: 'General',
      h1: 'Free YouTube Hashtag Generator',
      metaTitle: 'YouTube Hashtag Generator for Viral Growth | VidYT',
      metaDescription: 'Discover the best trending tags with our YouTube Hashtag Generator. Rank higher and get more views for free.'
    }
  );

  // Programmatic generation of 150+ Nich tools
  targetNiches.forEach((niche) => {
    const slugKey = niche.toLowerCase().replace(/\s+/g, '-');
    
    // Title Gen
    tools.push({
      slug: `youtube-title-generator-${slugKey}`,
      toolType: 'title',
      primaryKeyword: `YouTube Title Generator for ${niche}`,
      category: niche,
      h1: `Free YouTube Title Generator for ${niche} Videos`,
      metaTitle: `YouTube Title Generator for ${niche} | VidYT`,
      metaDescription: `Use our AI YouTube Title Generator for ${niche} creators to craft viral, high-CTR titles and grow your channel instantly.`
    });

    // Description Gen
    tools.push({
      slug: `youtube-description-generator-${slugKey}`,
      toolType: 'description',
      primaryKeyword: `YouTube Description Generator for ${niche}`,
      category: niche,
      h1: `Free AI YouTube Description Generator for ${niche}`,
      metaTitle: `AI Description Generator for ${niche} Videos | VidYT`,
      metaDescription: `Write the perfect SEO description for your ${niche} videos. Hook viewers, insert LSI keywords, and rank higher.`
    });

    // Hashtag Gen
    tools.push({
      slug: `youtube-hashtag-generator-${slugKey}`,
      toolType: 'hashtag',
      primaryKeyword: `YouTube Hashtags for ${niche}`,
      category: niche,
      h1: `Trending YouTube Hashtag Generator for ${niche}`,
      metaTitle: `Best Tags & Hashtags for ${niche} Videos | VidYT`,
      metaDescription: `Find the most viral and trending tags for ${niche}. Our Hashtag generator helps you dominate the YouTube algorithm.`
    });
  });

  return tools;
};

// Singleton export
export const seoToolsList = generateSEOToolsList();
