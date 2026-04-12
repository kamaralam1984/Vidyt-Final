export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const TRENDING_TOPICS = [
  { keywords: ['AI Revolution', 'Machine Learning', 'ChatGPT', 'Neural Networks', 'Deep Learning', 'Automation', 'Technology', 'Innovation', 'Future', 'Digital', 'Algorithms', 'Data Science', 'Smart AI', 'Tech Tips', 'AI Tools', 'Coding', 'Programming', 'Software', 'Tech News', 'Artificial Intelligence'], titles: ['How AI Is Changing Everything in 2026', 'ChatGPT Tutorial: Complete Guide', 'AI Tools That Will Blow Your Mind', 'Machine Learning Explained Simply', 'Is AI Replacing Your Job?', '5 AI Tools Every Creator Needs', 'The Future of Artificial Intelligence', 'ChatGPT Tricks You Didnt Know', 'AI vs Human: The Ultimate Showdown', 'Why AI Is Taking Over'], descriptions: ['Learn about the latest AI tools and technologies shaping our future. Discover how machine learning and artificial intelligence are revolutionizing industries. Complete guide for beginners.', 'Comprehensive breakdown of AI and its real-world applications. Everything you need to know about automation, machine learning, and the future of technology.', 'Explore cutting-edge AI technologies and tools that are transforming businesses. Get insights into ChatGPT, machine learning, and digital innovation.', 'Deep dive into artificial intelligence fundamentals. Learn coding concepts, neural networks, and data science with practical examples.', 'Understanding AI technology and its impact on society. From automation to innovation, discover what the future holds.'], hashtags: ['#AI', '#ChatGPT', '#MachineLearning', '#Technology', '#Innovation', '#ArtificialIntelligence', '#Tech', '#FutureOfTech', '#DataScience', '#Automation', '#Programming', '#Software', '#DigitalTransformation', '#TechTips', '#AITools', '#NeuroNetwork', '#Coding', '#BigData', '#TechNews', '#SmartAI', '#NewTechnology', '#DigitalAge', '#Algorithms', '#CloudComputing', '#IoT', '#Blockchain', '#WebDevelopment', '#FullStack', '#FrontEnd', '#BackEnd', '#Database', '#DevOps', '#GitHub', '#Linux', '#Docker', '#Kubernetes', '#Python', '#JavaScript', '#Java', '#Cybersecurity', '#DataProtection', '#CloudSecurity', '#NetworkSecurity', '#InfoSec', '#VPN', '#Encryption', '#MalwareProtection', '#SecurityTips', '#Hacker', '#CyberAttack', '#DigitalSafety', '#OnlineSafety'] },
  { keywords: ['YouTube Growth', 'Channel Strategy', 'Viral Content', 'Engagement Tips', 'SEO Ranking', 'Content Marketing', 'Video Strategy', 'Audience Building', 'Creator Tips', 'CFO Secrets', 'YouTube Algorithm', 'Subscriber Growth', 'Watch Time', 'Click Through Rate', 'Thumbnail Design', 'Video Title', 'Description Optimization', 'Trending Videos', 'Content Calendar', 'Analytics'], titles: ['How I Got 1M Subscribers in 6 Months', 'YouTube Algorithm Secrets EXPOSED', '8% CTR on Every Video - Heres How', 'Thumbnail Design That Doubles Views', 'The Ultimate YouTube Growth Hack', 'Why 99% Creators Get It Wrong', 'Viral Video Formula That Works', 'YouTube Success Blueprint 2026', 'How To Beat The Algorithm', 'Fastest Growing Channels Reveal Secrets'], descriptions: ['Discover proven strategies for rapid YouTube growth. Learn insider tips on video optimization, audience engagement, and algorithmic ranking from successful creators.', 'Complete YouTube success guide covering channel strategy, video optimization, SEO, and audience growth techniques that actually work in 2026.', 'Master the YouTube algorithm and grow your channel exponentially. Expert strategies for content creation, thumbnails, titles, and viewer engagement.', 'Get ahead of the competition with proven YouTube growth tactics. Learn what successful creators do differently to achieve millions of views.', 'Transform your YouTube channel with data-driven strategies. Increase watch time, engagement, and subscriber count using these insider techniques.'], hashtags: ['#YouTube', '#YouTubeGrowth', '#ContentCreator', '#VideoMarketing', '#YouTubeTips', '#ChannelGrowth', '#SubscriberGrowth', '#YouTubeAlgorithm', '#CTR', '#Thumbnail', '#VideoOptimization', '#SEO', '#VirtualCreator', '#OnlineMarketing', '#DigitalMarketing', '#SocialMedia', '#CreatorEconomy', '#Influencer', '#BrandBuilding', '#Marketing', '#GrowthHacking', '#Analytics', '#Engagement', '#ViewsCTR', '#TrendingVideos', '#ViralContent', '#VideoStrategy', '#ContentStrategy', '#AudienceBuilding', '#CommunityManagement', '#Monetization', '#AdRevenue', '#Partnership', '#Sponsorship', '#Affiliate', '#EarningOnline', '#PassiveIncome', '#SideHustle', '#Entrepreneurship', '#BusinessGrowth', '#SuccessTips', '#Motivation', '#Inspiration', '#CareerGrowth', '#SelfImprovement', '#Productivity', '#TimeManagement', '#GoalSetting', '#Success', '#Millionaire', '#WealthCreation'] },
  { keywords: ['Trending Music', 'Music Production', 'Beat Making', 'Music Tutorial', 'Viral Songs', 'Chart Toppers', 'Music News', 'Artist Collab', 'Record Labels', 'Spotify Trends', 'Music Marketing', 'Album Release', 'Single Release', 'Music Video', 'Concert Review', 'Music Streaming', 'Royalties', 'Music Rights', 'Composition', 'Mixing'], titles: ['How To Make Beats Like Famous Producers', 'Viral Songs Of 2026 Breakdown', 'Music Production: Pro Tips', '5 Secrets Billionaire Musicians Know', 'How To Get Millions On Spotify', 'Music Marketing Strategies That Work', 'The Science Behind Catchy Songs', 'How To Produce Hit Records', 'Music Trends Explained By Experts', 'From Bedroom Producer To Million Streams'], descriptions: ['Learn music production from industry experts. Master beat making, mixing, mastering, and the technical skills needed to create professional-quality music tracks.', 'Deep dive into trending music and what makes songs go viral. Understand the musical elements and marketing strategies behind chart-topping hits.', 'Comprehensive guide to music production, composition, and distribution. Learn how successful artists create, market, and monetize their music.', 'Discover the secrets of professional music producers and successful artists. Get insights into production techniques, marketing, and audience building.', 'Everything you need to know about modern music creation and distribution. From composition to streaming platforms, master the complete process.'], hashtags: ['#Music', '#MusicProduction', '#BeatMaking', '#Producer', '#MusicTutorial', '#MusicianLife', '#Musician', '#Artist', '#Singer', '#Songwriter', '#Composer', '#Mixing', '#Mastering', '#Recording', '#StudioSessions', '#MusicStudio', '#Equipment', '#Instruments', '#Guitar', '#Piano', '#Drums', '#Vocals', '#Harmony', '#Melody', '#Rhythm', '#Genre', '#Hip-Hop', '#Pop', '#Rock', '#Electronic', '#EDM', '#Jazz', '#Classical', '#Ambient', '#Indie', '#Alternative', '#R&B', '#Soul', '#Folk', '#Country', '#Reggae', '#Latin', '#World', '#MusicVideo', '#SoundtrackMusic', '#Live', '#Concert', '#Festival', '#Performance', '#Spotify', '#iTunes', '#YouTube', '#Streaming', '#MusicRantings'] },
  { keywords: ['Gaming Tips', 'Game Review', 'Gaming Trends', 'Esports', 'Streaming Games', 'Game Strategy', 'New Games', 'Game Development', 'Gaming Setup', 'Gaming PC', 'Console Games', 'Mobile Games', 'Gaming Community', 'Tournament', 'Gaming News', 'Gaming Guide', 'Gameplay', 'Graphics', 'Performance', 'Gaming Hardware'], titles: ['Best Gaming Setup For Beginners 2026', 'This Game Is INSANE (Gameplay)', 'How Pro Gamers Get 500+ FPS', 'Console vs PC Gaming - Ultimate Test', 'Gaming Tricks Noobs Dont Know', 'The Game That Could Change Everything', 'How To Dominate In Competitive Gaming', 'Gaming Hardware That Matters Most', 'Ranked Games Strategy That Wins', 'New Game Releases You Must Play'], descriptions: ['Get insights into professional gaming strategies, hardware setups, and techniques used by top esports players. Learn how to improve your gaming performance.', 'Latest gaming news, reviews, and trends. Discover new games, gaming hardware recommendations, and tips to level up your gaming skills.', 'Comprehensive guide to gaming - from casual to competitive. Learn about game strategies, hardware, streaming, and the esports industry.', 'Master gaming fundamentals and advanced techniques. Understand game mechanics, meta strategies, and hardware optimization for peak performance.', 'Everything gamers need to know about gaming technology, trends, and competitive play. Stay updated with the latest gaming industry news and reviews.'], hashtags: ['#Gaming', '#Gamer', '#GamersOfYouTube', '#Gameplay', '#Gaming Setup', '#PC Gaming', '#Console Gaming', '#PlayStation', '#Xbox', '#Nintendo', '#Mobile Gaming', '#Game Review', '#Gaming News', '#Esports', '#Competitive Gaming', '#Streaming', '#Twitch', '#Gaming.Tutorial', '#Gaming Tips', '#Game Guide', '#Gaming Channel', '#FPS', '#RPG', '#Strategy', '#Action', '#Adventure', '#Racing', '#Sports Games', '#Simulation', '#Horror Games', '#Battle Royale', '#Tournament', '#Gaming Community', '#Gamer Girl', '#Pro Gamer', '#Content Creator', '#Streamer', '#Gaming Setup Tour', '#PC Build', '#Gaming Monitor', '#Gaming Mouse', '#Gaming Keyboard', '#Gaming Headset', '#Gaming Chair', '#RGB', '#Mechanical Keyboard', '#High Refresh Rate', '#4K Gaming', '#VR Gaming', '#Gaming Hardware'] },
  { keywords: ['Business Strategy', 'Entrepreneurship', 'Startup Tips', 'Business Growth', 'Marketing Strategy', 'Money Making', 'Side Hustle', 'Passive Income', 'Investing', 'Financial Tips', 'E-commerce', 'Dropshipping', 'Affiliate Marketing', 'Business Automation', 'Social Media Marketing', 'Email Marketing', 'Content Marketing', 'Customer Service', 'Sales Strategy', 'Business Tools'], titles: ['How To Make $10k/Month From Home', 'The Startup Blueprint Millionaires Use', 'Business Secrets Big Companies Hide', 'How I Built a $1M Business Fast', '5 Income Streams At Age 25', 'The Ultimate Business Growth Strategy', 'What Rich People Know About Money', 'How To Scale Your Business 10x', 'Business Ideas That Actually Work', 'The Complete Entrepreneurs Handbook'], descriptions: ['Master business fundamentals and entrepreneurial strategies. Learn how to start, grow, and scale a successful business from industry experts and successful entrepreneurs.', 'Comprehensive business guide covering startup strategies, marketing, growth hacking, and financial management for aspiring entrepreneurs.', 'Discover proven business models and strategies for rapid growth. Learn from successful entrepreneurs about building profitable businesses from scratch.', 'Get insights into business development, customer acquisition, and revenue growth. Learn the strategies behind successful startups and established companies.', 'Everything you need to build and grow a profitable business. From idea validation to scaling, master the complete entrepreneurial journey.'], hashtags: ['#Business', '#Entrepreneurship', '#StartUp', '#BusinessIdeas', '#BusinessTips', '#BusinessStrategy', '#BusinessGrowth', '#SideHustle', '#MoneyMaking', '#PassiveIncome', '#Investing', '#Finance', '#FinancialFreedom', '#Wealth', '#WealthBuilding', '#RealEstate', '#Investment', '#StockMarket', '#Cryptocurrency', '#Bitcoin', '#Blockchain', '#MoneyTips', '#SavingMoney', '#BudgetingTips', '#DebtFree', '#MoneyManagement', '#CareerGrowth', '#Leadership', '#Management', '#Corporate', '#Office', '#WorkLife', '#Remote Work', '#Freelance', '#Freelancer', '#ContractWork', '#Networking', '#Professional', '#LinkedIn', '#JobInterview', '#Promotion', '#Salary', '#Negotiation', '#Skills', '#Training', '#Learning', '#Education', '#Certification', '#Course', '#Online Learning'] }
];

const TRENDING_KEYWORDS = [
  'Viral', 'Trending', 'Exposed', 'Tutorial', 'How to', 'Complete Guide', 'Beginners', 'Pro Tips',
  'Game Changer', 'Game Changing', 'Secrets', 'Hacks', 'Tricks', 'Shocking', 'MUST SEE', 'WARNING',
  'Leaked', 'Revealed', 'Breaking', 'News Update', 'Latest', 'New Strategy', 'Works 2026',
  'Easy Way', 'Simple Method', 'Proven Way', 'Fastest Way', 'Best Way', 'Ultimate',
  'Complete', 'Full Course', 'Masterclass', 'Webinar', 'Live Stream', 'Q&A',
];


function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateKeywords(topic: string, count: number): string[] {
  const allKeywords = TRENDING_TOPICS.flatMap(t => t.keywords);
  const topicWords = topic.toLowerCase().split(' ');
  const combined = [...new Set([...topicWords, ...allKeywords])];
  return shuffle(Array.from(combined)).slice(0, count);
}

function generateTitles(topic: string, count: number): string[] {
  const templates = [
    `How To ${topic} - Complete Guide`,
    `${topic}: Secrets EXPOSED`,
    `${topic} Tutorial For Beginners`,
    `5 ${topic} Tricks Pros Know`,
    `${topic} Game Changer 2026`,
    `The Ultimate ${topic} Strategy`,
    `${topic} Tips That Actually Work`,
    `${topic}: What Nobody Tells You`,
    `${topic} Blueprint For Success`,
    `${topic}: I Made $1M With This`,
  ];
  return templates.slice(0, count);
}

function generateDescriptions(topic: string, count: number): string[] {
  const templates = [
    `Learn everything about ${topic}. This comprehensive guide covers all you need to know about modern ${topic} in 2026. Complete tutorial for beginners and professionals.`,
    `Master ${topic} with proven strategies and expert tips. Discover how top creators and professionals dominate the ${topic} space with insider knowledge.`,
    `Complete breakdown of ${topic} and how to succeed. Get actionable insights and strategies from industry experts who've achieved massive success.`,
    `Everything you need to know about ${topic}. From fundamentals to advanced techniques, this guide covers the complete spectrum of ${topic} expertise.`,
    `Transform your approach to ${topic}. Learn cutting-edge strategies and techniques that successful professionals use daily to achieve outstanding results.`,
  ];
  return templates.slice(0, count);
}

function generateHashtags(topic: string, count: number): string[] {
  const allHashtags = TRENDING_TOPICS.flatMap(t => t.hashtags);
  const topicWords = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  const customHashtags = [
    `#${topicWords}`,
    `#${topic.split(' ')[0] || ''}Viral`,
    `#${topic.split(' ')[0] || ''}Tips`,
    `#${topic.split(' ')[0] || ''}Trending`,
    `#${topic.split(' ')[0] || ''}Guide`,
  ].filter(h => h.length > 1);

  const combined = [...new Set([...customHashtags, ...allHashtags])];
  return shuffle(Array.from(combined)).slice(0, Math.min(count, combined.length));
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic = 'viral content' } = await request.json();

    const keywords = generateKeywords(topic, 20);
    const titles = generateTitles(topic, 10);
    const descriptions = generateDescriptions(topic, 5);
    const hashtags = generateHashtags(topic, 50);

    return NextResponse.json({
      keywords,
      titles,
      descriptions,
      hashtags,
      topic,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('SEO generation error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to generate SEO content' },
      { status: 500 }
    );
  }
}
