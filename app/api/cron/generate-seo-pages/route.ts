export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';

const DAILY_NICHES = [
  'Gaming', 'PUBG Mobile', 'Free Fire', 'Minecraft', 'GTA 5', 'Valorant', 'Roblox', 'Fortnite', 'Call of Duty', 'Apex Legends',
  'YouTube Growth', 'YouTube SEO', 'YouTube Shorts', 'YouTube Algorithm', 'YouTube Monetization',
  'Instagram Reels', 'Instagram Growth', 'Instagram SEO', 'Instagram Hashtags', 'Instagram Followers',
  'TikTok Viral', 'TikTok Growth', 'TikTok Algorithm', 'TikTok Hashtags', 'TikTok Trending',
  'Facebook Reels', 'Facebook Page Growth', 'Facebook Video', 'Facebook Algorithm', 'Facebook Monetization',
  'Cooking', 'Street Food', 'Baking', 'Indian Cooking', 'Healthy Recipes', 'Quick Meals',
  'Travel Vlog', 'Budget Travel', 'Solo Travel', 'Luxury Travel', 'Adventure Travel',
  'Fitness', 'Home Workout', 'Gym Tips', 'Weight Loss', 'Muscle Building', 'Yoga',
  'Tech Review', 'Phone Review', 'Laptop Review', 'AI Tools', 'Best Apps', 'Gadgets',
  'Crypto', 'Bitcoin', 'Day Trading', 'Stock Market', 'Investing Tips', 'Passive Income',
  'Makeup Tutorial', 'Skincare Routine', 'Hairstyle', 'Fashion Tips', 'Beauty Hacks',
  'Music Production', 'Beat Making', 'Guitar Tutorial', 'Singing Tips', 'DJ Mixing',
  'Study Tips', 'Exam Preparation', 'Online Courses', 'Language Learning', 'Math Tutorial',
  'Motivational', 'Self Improvement', 'Productivity', 'Time Management', 'Goal Setting',
  'Comedy', 'Funny Videos', 'Memes', 'Prank Videos', 'Stand Up Comedy',
  'News Channel', 'Breaking News', 'Political News', 'World News', 'Sports News',
  'Photography', 'Video Editing', 'Premiere Pro', 'After Effects', 'Photoshop',
  'Pet Videos', 'Dog Training', 'Cat Videos', 'Pet Care', 'Animal Rescue',
];

const KEYWORD_TEMPLATES = [
  '{niche} hashtags', '{niche} title generator', '{niche} description generator',
  'best {niche} hashtags {year}', '{niche} SEO tips', '{niche} viral tips',
  '{niche} keywords', 'how to grow {niche} channel', '{niche} trending topics',
  '{niche} video ideas', 'best {niche} tags', '{niche} optimization',
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

function categorize(kw: string): string {
  const k = kw.toLowerCase();
  if (/game|gaming|pubg|fortnite|minecraft|gta|valorant|roblox|free fire/.test(k)) return 'Gaming';
  if (/music|song|beat|dj|rap|guitar|singing/.test(k)) return 'Music';
  if (/cook|food|recipe|baking|street food|meal/.test(k)) return 'Food';
  if (/travel|tour|vlog|destination|adventure/.test(k)) return 'Travel';
  if (/fit|gym|workout|yoga|weight|muscle/.test(k)) return 'Fitness';
  if (/beauty|makeup|skincare|fashion|hair/.test(k)) return 'Beauty';
  if (/tech|ai|phone|laptop|gadget|app|software|edit/.test(k)) return 'Technology';
  if (/crypto|bitcoin|stock|invest|finance|trading|income/.test(k)) return 'Finance';
  if (/news|politic|election|world/.test(k)) return 'News';
  if (/study|exam|course|learn|tutorial|math/.test(k)) return 'Education';
  if (/youtube|instagram|tiktok|facebook|seo|hashtag|viral|channel|growth/.test(k)) return 'Social Media';
  if (/comedy|funny|meme|prank/.test(k)) return 'Comedy';
  if (/pet|dog|cat|animal/.test(k)) return 'Pets';
  if (/photo|video edit|premiere|photoshop/.test(k)) return 'Creative';
  if (/motivat|self|productiv|goal/.test(k)) return 'Self Improvement';
  return 'Entertainment';
}

// Category-specific tips to create unique content per niche
const CATEGORY_TIPS: Record<string, { hook: string; stat: string; mistake: string; tool: string }> = {
  Gaming:       { hook: 'Show your reaction in the first 2 seconds', stat: 'Gaming channels with optimized titles get 4.2x more clicks', mistake: 'Using the game name without a power word (Best, Epic, Insane)', tool: '/tools/gaming-title-generator' },
  Music:        { hook: 'Open with a 5-second preview of the best part', stat: 'Music videos with lyric keywords in titles rank 3x higher', mistake: 'Writing "Official Video" without the song name in the title', tool: '/tools/music-title-generator' },
  Food:         { hook: 'Show the finished dish in the first 3 seconds', stat: 'Recipe videos with ingredients in thumbnails get 60% more clicks', mistake: 'Long cooking intros — viewers skip after 8 seconds', tool: '/tools/youtube-title-generator' },
  Travel:       { hook: 'Open with the most jaw-dropping scene', stat: 'Travel vlogs with destination name in title get 2.8x more views', mistake: 'Generic titles like "Day 1 in X" without a value hook', tool: '/tools/youtube-title-generator' },
  Fitness:      { hook: 'Show before/after transformation or end result first', stat: 'Fitness videos with specific results in titles (e.g. "Lose 5kg") get 3.1x clicks', mistake: 'Skipping timestamps — 70% of fitness viewers use chapters', tool: '/tools/youtube-description-generator' },
  Beauty:       { hook: 'Flash the final look in the first 2 seconds', stat: 'Beauty tutorials with product names in titles get 2.5x more search traffic', mistake: 'Ignoring hashtags — beauty is the #1 category for hashtag discovery', tool: '/tools/makeup-title-generator' },
  Technology:   { hook: 'Show the coolest feature or result immediately', stat: 'Tech reviews with "vs" or "review" in title get 3.7x more impressions', mistake: 'Forgetting to mention release year — outdated titles lose clicks fast', tool: '/tools/ai-tools-title-generator' },
  Finance:      { hook: 'Open with a bold income claim or statistic', stat: 'Finance videos mentioning specific numbers earn 4x more search traffic', mistake: 'Too-vague titles — "Make Money Online" vs "Make $300/Day on Upwork"', tool: '/tools/youtube-title-generator' },
  Education:    { hook: 'Start with the result or skill learners will gain', stat: 'Tutorial videos with "in X minutes" in title get 2.2x more clicks', mistake: 'Not using chapter timestamps — 80% of learners use them to navigate', tool: '/tools/youtube-description-generator' },
  'Social Media': { hook: 'Show a growth graph or before/after metric upfront', stat: 'YouTube SEO guides with "algorithm" in the title get 3x more impressions', mistake: 'Posting without researching competing videos first', tool: '/tools/youtube-hashtag-generator' },
  Comedy:       { hook: 'Jump straight to the punchline in the first 5 seconds', stat: 'Comedy videos with emojis in titles see 18% higher CTR', mistake: 'Explaining the joke in the title — let the thumbnail do the teasing', tool: '/tools/youtube-title-generator' },
  News:         { hook: 'State the headline fact immediately', stat: 'News channels that post within 2 hours of breaking news get 5x more views', mistake: 'Clickbait that mismatches content — destroys watch time retention', tool: '/tools/youtube-title-generator' },
};

const DEFAULT_TIP = { hook: 'Lead with your most valuable moment', stat: 'Optimized video metadata gets 3x more organic reach', mistake: 'Ignoring the description — YouTube reads every word for ranking', tool: '/tools/youtube-title-generator' };

function generateContent(keyword: string, category: string) {
  const kw = keyword.trim();
  const kwCap = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const year = new Date().getFullYear();
  const baseWord = kw.split(' ')[0];
  const tip = CATEGORY_TIPS[category] || DEFAULT_TIP;

  // Rotate content variant (0-3) based on keyword hash for uniqueness
  const variant = kw.charCodeAt(0) % 4;

  const introParagraphs = [
    `Looking to go viral with **${kw}** content? You are in the right place. VidYT's AI-powered toolkit helps creators in the **${category}** space generate optimized titles, descriptions, hashtags, and scripts — all tuned to the YouTube algorithm in ${year}.`,
    `Creating content around **${kw}** is one of the smartest moves in the ${category} niche right now. The search volume is high, competition is manageable, and creators who nail the SEO fundamentals are seeing massive organic growth.`,
    `Struggling to get views on your **${kw}** videos? The problem is almost never the content quality — it is discoverability. Most creators skip the SEO step entirely, which means their best videos never reach the audience they deserve.`,
    `**${kwCap}** is a rapidly growing keyword in the ${category} niche. Channels that start targeting it now — before it becomes hyper-competitive — will own the top spots in YouTube search for years.`,
  ];

  const content = `## ${kwCap} — Complete Creator Guide ${year}

${introParagraphs[variant]}

---

### Why "${kwCap}" is a High-Value Keyword in ${year}

${tip.stat}. The ${category} category on YouTube is projected to grow by 35% in ${year}, driven by mobile-first viewers and the explosion of Shorts content. Ranking for **${kw}** now secures long-term passive traffic before competitors flood the niche.

Key signals YouTube uses to rank ${category} videos:
- **Title relevance** — exact or near-exact keyword match in the first 60 characters
- **Watch time** — viewer retention rate above 40% signals quality
- **CTR** — a well-optimized thumbnail + title should achieve 4–8% click-through rate
- **Hashtags** — 3–5 targeted hashtags (not 30 random ones) drives discovery
- **Description depth** — 200+ words with keyword used 3–4 times naturally

---

### Top 10 "${kwCap}" Hashtags for ${year}

Copy these directly into your next video:

\`#${kw.replace(/\s+/g, '')}\` \`#${baseWord}${year}\` \`#${baseWord}viral\` \`#${category.toLowerCase()}creator\` \`#${baseWord}tips\` \`#viral${baseWord}\` \`#${category.toLowerCase()}growth\` \`#${baseWord}tutorial\` \`#${baseWord}shorts\` \`#best${baseWord}\`

> **Pro tip:** Use your top 3 hashtags in the video description too — YouTube indexes description hashtags separately from tag hashtags.

---

### Step-by-Step: How to Rank #1 for "${kwCap}"

**Step 1 — Nail the Title**
Put "${kw}" within the first 50 characters. Add a power word (Best, Ultimate, Free, Fast, Easy) and a number if possible. Example: *"Best ${kwCap} Strategy That Got Me 100K Views"*

**Step 2 — Write a Long Description**
Start with a 2-sentence summary containing "${kw}", then add 150+ words of context, timestamps, and related keywords. VidYT's description generator does this in one click.

**Step 3 — Optimize Your Thumbnail**
${tip.hook}. Bold 3–4 word text overlay, bright contrasting colors, and a human face (if relevant) consistently outperforms plain-text thumbnails by 2–3x.

**Step 4 — Upload at Peak Hours**
The best upload windows for ${category} content: **Tuesday–Thursday between 2–4 PM EST**. Your existing subscribers get notified, giving the video an early engagement spike that triggers the algorithm.

**Step 5 — Engage in the First 30 Minutes**
Reply to every comment in the first 30 minutes after publishing. This signals to YouTube that your video is sparking conversation, which boosts distribution.

---

### Common ${category} Creator Mistakes to Avoid

**Mistake #1:** ${tip.mistake}.

**Mistake #2:** Keyword stuffing — repeating "${kw}" 10+ times in a description reads as spam. YouTube's algorithm and real viewers both reject it.

**Mistake #3:** Ignoring YouTube Shorts. Short-form content in the ${category} niche currently gets 5–8x more impressions than long-form for the same channel. Even a 60-second summary of your main video can 10x total views.

**Mistake #4:** No call to action. Every video should end with a specific CTA — subscribe, watch next, or join a community. Passive endings lose 30% of potential subscribers.

---

### Free ${kwCap} Tools by VidYT

VidYT gives you everything to dominate the ${category} niche:

- **[${kwCap} Title Generator](${tip.tool})** — AI-generated, high-CTR titles in seconds
- **[YouTube Description Generator](/tools/youtube-description-generator)** — SEO-optimized 200-word descriptions
- **[Hashtag Generator](/tools/youtube-hashtag-generator)** — 15 ranked hashtags per keyword
- **[Viral Optimizer](/viral-optimizer)** — Score your video idea before you film it
- **[Trending Topics](/trending)** — See what's blowing up in ${category} right now

---

### Frequently Asked Questions About ${kwCap}

#### 1. How many hashtags should I use for ${kw} videos?
Use 3–5 highly targeted hashtags per video. YouTube officially recommends fewer than 15. More than 15 hashtags triggers a spam filter and can reduce your video's reach. Focus on hashtags with 100K–1M posts for the best balance of visibility and competition.

#### 2. Does the YouTube title affect search ranking for "${kw}"?
Yes — title is the #1 ranking signal for YouTube search. Including "${kw}" in the first 60 characters gives your video the strongest possible keyword signal. Pair it with the same phrase in your description for compounding effect.

#### 3. How long should a ${category} video be to rank well?
For tutorial and educational ${category} content, 8–15 minutes performs best for watch time. For entertainment and vlogs, 5–10 minutes is the sweet spot. Shorts (under 60 seconds) are a separate algorithm and should be used in parallel, not instead of long-form.

#### 4. Can I use "${kw}" as a YouTube tag?
Yes. Add it as your first tag (exact match), then add 4–6 broad variations. Example: "${kw}", "best ${kw}", "${kw} ${year}", "${kw} for beginners". Tags are less important than titles and descriptions but still contribute 5–10% to ranking.

#### 5. How do I find trending ${kw} video ideas?
Use VidYT's [Trending Topics](/trending) page to see real-time trending searches in the ${category} niche. You can also check YouTube's autocomplete — type "${kw}" and note every suggestion. Those are real searches people are making right now.

---

*Last updated: ${year} · Data sourced from YouTube Analytics trends and VidYT's keyword database.*`;

  return {
    title: `${kwCap} — Free AI SEO Tool & Viral Guide ${year}`,
    metaTitle: `${kwCap} | Best ${category} SEO Tool & Hashtag Generator | VidYT`,
    metaDescription: `Get the best ${kw} titles, descriptions, hashtags, and viral tips for YouTube, Instagram, TikTok & Facebook. Free AI-powered ${kw} optimizer by VidYT.`,
    content,
    wordCount: content.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length,
    hashtags: [`#${baseWord.replace(/\s+/g, '')}`, `#${kw.replace(/\s+/g, '')}`, '#viral', '#trending', `#${baseWord}tips`, `#${baseWord}${year}`, '#youtube', '#shorts', '#fyp', '#subscribe', `#${category.toLowerCase()}`, '#creator', '#content', '#viralvideo', `#best${baseWord}`],
    relatedKeywords: [`${kw} tutorial`, `best ${kw}`, `${kw} tips`, `${kw} ${year}`, `how to ${kw}`, `${kw} for beginners`, `${kw} viral`, `${kw} trending`],
    viralScore: 65 + Math.floor(Math.random() * 30),
    category,
  };
}

/** GET /api/cron/generate-seo-pages — auto-generate new pages + upgrade thin existing pages */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const year = new Date().getFullYear();
    let created = 0;
    let upgraded = 0;
    const target = 100;

    // ── 1. Generate new pages ──────────────────────────────────────────────
    for (const niche of DAILY_NICHES) {
      if (created >= target) break;

      for (const template of KEYWORD_TEMPLATES) {
        if (created >= target) break;

        const keyword = template.replace('{niche}', niche).replace('{year}', String(year));
        const slug = slugify(keyword);

        // Skip if already exists
        const exists = await SeoPage.findOne({ slug }).select('_id wordCount').lean() as any;
        if (exists) continue;

        const category = categorize(keyword);
        const data = generateContent(keyword, category);

        await SeoPage.create({ slug, keyword, ...data, source: 'auto_daily' });
        created++;
      }
    }

    // ── 2. Upgrade 200 thin existing pages (wordCount < 400) ─────────────
    const thinPages = await SeoPage.find({
      $or: [{ wordCount: { $lt: 400 } }, { wordCount: { $exists: false } }],
      isIndexable: { $ne: true },
    }).select('slug keyword category').limit(200).lean();

    const upgradeOps: any[] = [];
    for (const p of thinPages as any[]) {
      const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (!kw) continue;
      const cat = p.category || categorize(kw);
      const data = generateContent(kw, cat);
      upgradeOps.push({
        updateOne: {
          filter: { slug: p.slug },
          update: { $set: { ...data, source: p.source || 'auto_daily' } },
        },
      });
      upgraded++;
    }
    if (upgradeOps.length) await SeoPage.bulkWrite(upgradeOps, { ordered: false });

    return NextResponse.json({
      success: true,
      created,
      upgraded,
      message: `Generated ${created} new pages · Upgraded ${upgraded} thin pages`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('Cron SEO page generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
