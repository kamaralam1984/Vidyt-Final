export interface MarketingTool {
  id: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  content: string;
  howItWorks: { step: string; description: string }[];
  appUrl: string;
  iconName: string; // Used to pick the right Lucide icon
  gradient: string;
}

export const MARKETING_TOOLS: Record<string, MarketingTool> = {
  'daily-ideas': {
    id: 'daily-ideas',
    title: 'Daily Ideas',
    seoTitle: 'Daily YouTube Video Ideas Generator | ViralBoost AI',
    seoDescription: 'Get daily trending YouTube video ideas tailored to your niche. AI-powered trend analysis to help you go viral every day.',
    heroHeadline: 'Never Run Out of Viral Video Ideas Again',
    heroSubheadline: 'Wake up to fresh, niche-specific ideas backed by real-time data and AI scores.',
    content: `
      Finding the right topic is 80% of the battle on YouTube. Most creators struggle because they rely on guesswork or copy what's already stale. ViralBoost AI's Daily Ideas tool changes the game by scanning live trends across YouTube, Google, and social media to find what's bubbling up *right now* in your specific niche.

      Our advanced AI model doesn't just give you a title; it provides a 'Viral Potential Score' based on current search volume, competition density, and audience sentiment. Whether you're in gaming, finance, tech, or lifestyle, you'll receive 3-5 personalized concepts every single morning. This isn't just a list; it's a strategic roadmap for your channel's growth. 

      Imagine the peace of mind knowing that your next video is already optimized for the algorithm before you even hit record. Stop wasting hours browsing Reddit or Twitter for inspiration. With Daily Ideas, you have a professional research team working for you 24/7. This is the difference between a channel that plateaus and one that scales exponentially. To unlock the full potential of your content and stay ahead of your competitors, a ViralBoost AI subscription is your most powerful asset. Join thousands of successful creators who have turned their passion into a predictable business using our data-driven insights.
    `,
    howItWorks: [
      { step: 'Set Your Niche', description: 'Tell the AI about your channel topic and target audience.' },
      { step: 'AI Trend Scan', description: 'Our system analyzes thousands of data points across the web.' },
      { step: 'Get Scaled Ideas', description: 'Receive ideas with viral scores and best posting times.' }
    ],
    appUrl: '/ai/script-generator?mode=ideas',
    iconName: 'Lightbulb',
    gradient: 'from-amber-400 to-orange-500',
  },
  'ai-coach': {
    id: 'ai-coach',
    title: 'AI Coach',
    seoTitle: 'AI YouTube Growth Coach | Personal Channel Mentor',
    seoDescription: 'Get personalized channel growth advice from our AI Coach. Expert guidance on retention, CTR, and audience engagement.',
    heroHeadline: 'Your Personal YouTube Mentor, Available 24/7',
    heroSubheadline: 'Get expert-level growth strategies and direct answers to your toughest channel questions.',
    content: `
      Scaling a YouTube channel can feel like a lonely uphill battle. You have questions about your analytics, your thumbnails aren't clicking, or your retention is dropping, and you don't know why. ViralBoost AI Coach is designed to be the mentor every creator needs but few can afford. 

      Unlike generic advice you find in forums, our AI Coach analyzes your specific channel data, niche norms, and current algorithm shifts to provide tailored guidance. Whether you're asking "How do I fix my 30-second drop-off?" or "Is this niche too saturated for a new creator?", you'll get data-backed, actionable answers in seconds. 

      The coach focuses on the four pillars of YouTube success: Click-Through Rate (CTR), Average View Duration (AVD), End Screen conversions, and Community engagement. It's like having a full-time YouTube growth consultant in your pocket, helping you avoid costly mistakes that set channels back by months. Successful creators know that the fastest way to the top is to learn from those who have the data. By subscribing to ViralBoost AI, you're not just getting a tool; you're investing in an education that will pay dividends for the rest of your career. Don't leave your growth to luck—get the personalized strategy you deserve.
    `,
    howItWorks: [
      { step: 'Ask Anything', description: 'Type in any question about your channel or a specific video.' },
      { step: 'Data Analysis', description: 'The AI reviews your channel performance and niche benchmarks.' },
      { step: 'Action Plan', description: 'Get a step-by-step roadmap to fix issues and boost views.' }
    ],
    appUrl: '/ai/script-generator?mode=coach',
    iconName: 'Brain',
    gradient: 'from-sky-400 to-indigo-500',
  },
  'keyword-research': {
    id: 'keyword-research',
    title: 'Keyword Research',
    seoTitle: 'YouTube Keyword Research Tool | Find High-Volume Keywords',
    seoDescription: 'Discover high-intent keywords for your YouTube videos. Increase your search ranking and get more organic views.',
    heroHeadline: 'Own the Search Results with Data-Driven SEO',
    heroSubheadline: 'Find the exact phrases your audience is typing into the search bar right now.',
    content: `
      YouTube is the world's second-largest search engine, and if you're not optimizing for the right keywords, you're leaving thousands of views on the table. Our Keyword Research tool goes beyond simple search volume. We show you the "Search Intent" behind every phrase—are they looking for a tutorial, a review, or entertainment? 

      ViralBoost AI provides a comprehensive "Opportunity Score" for every keyword, balancing search demand against creator competition. This allows you to find "Golden Keywords"—topics with high interest but low competition from established channels. This is the secret weapon for small to medium-sized channels to rank #1 and get "evergreen" views that accumulate for years.

      Don't just tag your videos with random words. Use our tool to identify the primary and secondary keywords that will trigger the algorithm's recommendation engine. Proper SEO is the foundation of any sustainable YouTube business. A subscription to ViralBoost AI gives you access to the same high-level data used by top digital marketing agencies, allowing you to dominate your niche with precision. Stop guessing what people want and start giving them exactly what they're searching for. Your journey to the top of the search results starts here.
    `,
    howItWorks: [
      { step: 'Enter a Topic', description: 'Input a general keyword or video idea into the search bar.' },
      { step: 'Analyze Stats', description: 'See volume, competition, and trend data over the last 12 months.' },
      { step: 'Pick Winners', description: 'Export the best keywords directly to your tags and description.' }
    ],
    appUrl: '/dashboard/youtube-seo?tab=keywords',
    iconName: 'ClipboardList',
    gradient: 'from-emerald-400 to-teal-500',
  },
  'script-writer': {
    id: 'script-writer',
    title: 'Script Writer',
    seoTitle: 'AI YouTube Script Generator | Viral Script Writing Tool',
    seoDescription: 'Write viral YouTube scripts in minutes with AI. High-retention hooks, full scripts, and CTAs for any platform.',
    heroHeadline: 'Write Scripts That Keep Viewers Hooked to the End',
    heroSubheadline: 'Generate high-retention outlines, full scripts, and viral hooks in one single flow.',
    content: `
      The first 30 seconds of your video determine its fate. If your hook is weak, the algorithm will kill your reach. ViralBoost AI's Script Writer uses psychological frameworks like the "Open Loop" and "Pattern Interrupt" to ensure your scripts are impossible to look away from. 

      Whether you need a 60-second Short or a 20-minute deep dive, our AI understands the pacing required for different platforms. It doesn't just write text; it suggests visual cues, B-roll placements, and the perfect moment for your Call to Action (CTA). We've analyzed the scripts of the top 1% of creators to build an engine that replicates their success patterns.

      Writing a script from scratch can take 5-10 hours. With our AI, you can have a professional-grade draft in 5-10 minutes. This allows you to produce more high-quality content without burning out. In the competitive world of YouTube, consistency and quality are non-negotiable. By subscribing to ViralBoost AI, you're buying back your time while simultaneously increasing your production value. Give your videos the structure they need to go viral and turn viewers into loyal subscribers. Your best video starts with a world-class script—let us write it for you.
    `,
    howItWorks: [
      { step: 'Input Topic', description: 'Describe your video and choose your platform and tone.' },
      { step: 'Select Hook', description: 'Choose from 3 viral hook options to grab immediate attention.' },
      { step: 'Generate Script', description: 'Get a full script with visual cues and a compelling CTA.' }
    ],
    appUrl: '/ai/script-generator',
    iconName: 'FileText',
    gradient: 'from-violet-400 to-fuchsia-500',
  },
  'title-generator': {
    id: 'title-generator',
    title: 'Title Generator',
    seoTitle: 'Viral YouTube Title Generator | AI-Powered CTR Booster',
    seoDescription: 'Generate high-CTR YouTube titles with AI. Get multiple variations with viral scores to maximize your views.',
    heroHeadline: 'Get More Clicks Without Using Clickbait',
    heroSubheadline: 'Instantly turn boring titles into irresistible headlines with higher viral potential.',
    content: `
      Your title is the gateway to your video. Even the best content is worthless if nobody clicks on it. Most creators make the mistake of using purely descriptive titles like "My New PC Build," while the winners use curiosity-driven headlines like "I regret building this PC..." ViralBoost AI's Title Generator bridges that gap for you.

      Our AI analyzes millions of high-performing titles to suggest variations that trigger the "Curiosity Gap" while remaining relevant to your content. We don't just give you a list; we give you a 'Confidence Score' for each title, predicting which one will perform best with the YouTube algorithm. 

      A great title can triple your views overnight. If you're tired of seeing your hard work go to waste with single-digit CTRs, this is the solution you've been looking for. By upgrading to a ViralBoost AI subscription, you're ensuring that every video you upload has the best possible "face" to present to the world. Don't leave your most important asset to chance—use the data that top-tier creators use to dominate the "Suggested Videos" feed. Turn every browse impression into a view and watch your channel explode.
    `,
    howItWorks: [
      { step: 'Enter Concept', description: 'Tell the AI what your video is about or give it a working title.' },
      { step: 'Review Options', description: 'See 5-10 AI-generated titles with human-readable viral scores.' },
      { step: 'Test & Go', description: 'Pick the winner and watch your Click-Through Rate soar.' }
    ],
    appUrl: '/dashboard/youtube-seo?tab=titles',
    iconName: 'Type',
    gradient: 'from-rose-400 to-red-500',
  },
  'channel-audit': {
    id: 'channel-audit',
    title: 'Channel Audit',
    seoTitle: 'YouTube Channel Audit Tool | Deep Channel Analysis',
    seoDescription: 'Get a comprehensive audit of your YouTube channel. Identify what is working and what is holding you back.',
    heroHeadline: 'Fix Your Channel and Unlock Hidden Growth',
    heroSubheadline: 'Get a deep, honest review of your entire channel’s health in under 60 seconds.',
    content: `
      Is your channel stuck? You might be doing everything "right" but still seeing flat growth. Often, the problem is hidden in the patterns—meta-data inconsistency, poor brand identity, or a niche that's too broad. ViralBoost AI's Channel Audit tool performs a deep-scan of your last 30-50 videos to find the friction points stopping your growth.

      We provide a "Channel Health Score" alongside specific recommendations for your bio, banner, video frequency, and metadata optimization. We also identify your "Power Videos"—the ones that the algorithm loves—and explain why they worked so you can replicate that success. 

      A professional channel audit usually costs hundreds of dollars. With ViralBoost AI, you get an automated, data-driven audit included in your subscription. This level of clarity is invaluable for creators who want to treat their channel like a serious business. Stop throwing spaghetti at the wall. Get a clear, actionable plan to polish your channel into a professional brand that attracts high-value advertisers and a loyal audience. The path from hobbyist to full-time creator begins with a transparent understanding of where you are right now.
    `,
    howItWorks: [
      { step: 'Connect Channel', description: 'Securely link your YouTube channel (or search for your handle).' },
      { step: 'Deep Scan', description: 'The AI analyzes your metadata, branding, and performance data.' },
      { step: 'Get Report', description: 'Receive a full PDF-style report with actionable growth tips.' }
    ],
    appUrl: '/channel-audit',
    iconName: 'Gauge',
    gradient: 'from-cyan-400 to-blue-500',
  },
  'ai-shorts': {
    id: 'ai-shorts',
    title: 'AI Shorts Clipping',
    seoTitle: 'AI YouTube Shorts Clipper | Long Video to Shorts Toolkit',
    seoDescription: 'Automatically turn long YouTube videos into viral Shorts, Reels, and TikToks. AI-powered clipping and captioning.',
    heroHeadline: 'Multiply Your Reach with 1-Click Shorts',
    heroSubheadline: 'Turn one long video into a week of viral short-form content for TikTok, Reels, and Shorts.',
    content: `
      Short-form content is the fastest way to gain new subscribers in 2024. But manually finding the best moments in a 20-minute video and editing them for vertical view is a nightmare that most creators don't have time for. ViralBoost AI's Shorts Clipping tool automates the entire process.

      Our AI identifies high-engagement moments—the funny bits, the controversial statements, or the high-value tips—and automatically crops them to 9:16 format. It even adds trendy, high-retention captions that keep viewers from scrolling past. You can take one podcast, vlog, or tutorial and generate 5-10 pieces of "teaser" content that drive traffic back to your main channel.

      This is how the biggest creators like MrBeast and Joe Rogan dominate every platform. They don't edit everything themselves; they use systems. By subscribing to ViralBoost AI, you're gaining a professional editing assistant that never sleeps. Don't let your long-form videos die after 48 hours. Repurpose them into a vertical content machine that builds your brand 24/7. Your audience is on TikTok and Reels—go meet them there without adding hours to your workflow.
    `,
    howItWorks: [
      { step: 'Upload Video', description: 'Paste a YouTube link or upload your long-form MP4 file.' },
      { step: 'AI Highlights', description: 'The system scans for the 5 most engaging segments automatically.' },
      { step: 'Vertical Export', description: 'Get vertical clips with AI captions, ready to post in minutes.' }
    ],
    appUrl: '/ai/shorts-creator',
    iconName: 'Scissors',
    gradient: 'from-emerald-400 to-lime-500',
  },
  'thumbnail-maker': {
    id: 'thumbnail-maker',
    title: 'AI Thumbnail Maker',
    seoTitle: 'AI YouTube Thumbnail Generator | Click-Ready Designs',
    seoDescription: 'Create high-converting YouTube thumbnails with AI. Designs that look like they were made by a pro editor.',
    heroHeadline: 'Design "Big Creator" Thumbnails in Seconds',
    heroSubheadline: 'Get AI-powered design suggestions, background removal, and layout optimization.',
    content: `
      You have millisecond to stop someone from scrolling. If your thumbnail looks amateur, they'll never see your video. But hiring a thumbnail designer cost $50-$100 per video, and learning Photoshop takes years. ViralBoost AI's Thumbnail Maker gives you the pro-look without the pro-price.

      Our tool uses AI to suggest the best color palettes, fonts, and layouts based on what's currently working in your niche. We help you pick the "Face" of the video and automatically remove backgrounds, add glowing borders, and enhance text readability. It’s a design suite built specifically for YouTube growth, not just general graphic design.

      A better thumbnail can be the difference between 1,000 views and 100,000 views. In the world of YouTube, your CTR is your lifeblood. By subscribing to ViralBoost AI, you're ensuring that your videos always look premium and "clickable." Stand out in the sea of mediocre thumbnails and command the attention your content deserves. Give your channel the professional aesthetic that attracts high-quality subscribers and positions you as an authority in your field.
    `,
    howItWorks: [
      { step: 'Choose Format', description: 'Select your niche and upload your raw photos or video stills.' },
      { step: 'AI Remix', description: 'Let the AI suggest 3 layouts that are proven to grab attention.' },
      { step: 'Fine Tune', description: 'Adjustment text, colors, and effects before downloading in HD.' }
    ],
    appUrl: '/dashboard/youtube-seo?tab=thumbnails',
    iconName: 'ImageIcon',
    gradient: 'from-yellow-400 to-orange-500',
  },
  'optimize': {
    id: 'optimize',
    title: 'Optimize',
    seoTitle: 'YouTube Video Optimizer | SEO & Viral Score Checker',
    seoDescription: 'Optimize your YouTube videos for the algorithm. Final check for titles, descriptions, and tags before you publish.',
    heroHeadline: 'The Final Viral Check Before You Hit Publish',
    heroSubheadline: 'Get a comprehensive score and specific fixes to ensure your video is ready to explode.',
    content: `
      Publishing a video without optimization is like launching a rocket without a flight plan. Most creators hit "Publish" and hope for the best, only to be disappointed by 0 views. ViralBoost AI's Optimize tool is your final "Triple-Check" to ensure every upload has maximum viral odds.

      We scan your title, description, tags, and thumbnail to give you an overall "Viral Readiness Score." If your description is too short, your tags are irrelevant, or your title doesn't match the thumbnail's promise, we tell you *exactly* how to fix it. This is the same rigorous checklist used by professional YouTube managers to ensure nothing is left to chance.

      Stop wondering why your videos aren't getting impressions. The algorithm is a system, and our tool helps you speak its language. A ViralBoost AI subscription gives you the peace of mind that you've done everything humanly possible to succeed with every single upload. Consistency in quality leads to consistency in growth. Join the ranks of creators who treat their uploads like high-stakes launches and see the results in your analytics. Your hard work deserves to be seen—make sure it is.
    `,
    howItWorks: [
      { step: 'Scan Metadata', description: 'Paste your planned title, description, and upload your thumbnail.' },
      { step: 'Get Viral Score', description: 'See your readiness score from 0-100% with specific critiques.' },
      { step: 'Apply Fixes', description: 'Use the AI suggestions to polish your metadata for the algorithm.' }
    ],
    appUrl: '/dashboard/youtube-seo',
    iconName: 'Sparkles',
    gradient: 'from-sky-400 to-purple-500',
  },
};
