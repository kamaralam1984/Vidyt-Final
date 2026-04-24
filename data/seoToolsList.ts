export interface SEOTool {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  category: string;
  toolType: 'title' | 'description' | 'hashtag';
}

export const seoToolsList: SEOTool[] = [
  {
    slug: 'youtube-title-generator',
    h1: 'YouTube Title Generator',
    metaTitle: 'YouTube Title Generator – Create Viral Titles Free | VidYT',
    metaDescription: 'Generate high-CTR YouTube titles instantly with AI. Boost views and beat the algorithm.',
    primaryKeyword: 'YouTube Title Generator',
    category: 'General',
    toolType: 'title',
  },
  {
    slug: 'youtube-description-generator',
    h1: 'YouTube Description Generator',
    metaTitle: 'YouTube Description Generator – SEO Descriptions Free | VidYT',
    metaDescription: 'Create keyword-rich YouTube descriptions that rank. Free AI-powered tool.',
    primaryKeyword: 'YouTube Description Generator',
    category: 'General',
    toolType: 'description',
  },
  {
    slug: 'youtube-hashtag-generator',
    h1: 'YouTube Hashtag Generator',
    metaTitle: 'YouTube Hashtag Generator – Best Tags for More Views | VidYT',
    metaDescription: 'Find the best hashtags for your YouTube videos. Boost reach and discovery instantly.',
    primaryKeyword: 'YouTube Hashtag Generator',
    category: 'General',
    toolType: 'hashtag',
  },
  {
    slug: 'gaming-title-generator',
    h1: 'Gaming YouTube Title Generator',
    metaTitle: 'Gaming YouTube Title Generator – Viral Gaming Titles | VidYT',
    metaDescription: 'Generate viral gaming video titles. Perfect for PUBG, GTA, Minecraft and more.',
    primaryKeyword: 'Gaming YouTube Title Generator',
    category: 'Gaming',
    toolType: 'title',
  },
  {
    slug: 'music-title-generator',
    h1: 'Music YouTube Title Generator',
    metaTitle: 'Music YouTube Title Generator – Trending Music Titles | VidYT',
    metaDescription: 'Create viral music video titles that attract listeners and boost YouTube views.',
    primaryKeyword: 'Music YouTube Title Generator',
    category: 'Music',
    toolType: 'title',
  },
];
