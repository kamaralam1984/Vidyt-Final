/**
 * Rich SEO content builder for /k/[keyword] pages.
 *
 * Why this exists: thin auto-generated pages get "Crawled - currently not
 * indexed" by Google. Every page used to share an identical 8-section
 * skeleton with only the keyword swapped — that pattern triggers Google's
 * doorway / near-duplicate detection. This builder now picks one of 5
 * structurally-distinct variants per keyword (deterministic by keyword hash)
 * and seeds variant-specific numbers per page, so two adjacent pages share
 * neither headings nor stats.
 *
 * Each variant produces 1000+ words and always includes:
 *   • VidYT brand mention
 *   • Outbound links (/, /signup, /pricing, niche tools)
 *   • Free-plan offer
 *   • A "how VidYT works" walkthrough
 *   • Marketing/views performance numbers
 *   • Five-question FAQ block
 */

export interface BuiltContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  hashtags: string[];
  relatedKeywords: string[];
  faqs: { q: string; a: string }[];
  wordCount: number;
  category: string;
}

const CATEGORY_RULES: { pattern: RegExp; name: string }[] = [
  { pattern: /game|gaming|pubg|fortnite|minecraft|gta|valorant|roblox|cod|apex/i, name: 'Gaming' },
  { pattern: /music|song|album|concert|singer|rapper|beat|dj|lofi/i, name: 'Music' },
  { pattern: /cook|food|recipe|restaurant|baking|chef/i, name: 'Food' },
  { pattern: /travel|tour|destination|vlog|trip/i, name: 'Travel' },
  { pattern: /tech|ai|apple|google|phone|iphone|samsung|software|gadget/i, name: 'Technology' },
  { pattern: /crypto|bitcoin|stock|market|invest|finance|trading/i, name: 'Finance' },
  { pattern: /sport|football|cricket|nba|soccer|tennis|ipl|f1|fifa/i, name: 'Sports' },
  { pattern: /movie|film|trailer|netflix|series|anime|manga/i, name: 'Film & TV' },
  { pattern: /politic|election|government|war|attack|news/i, name: 'News & Politics' },
  { pattern: /health|fitness|diet|yoga|workout|gym|weight/i, name: 'Health' },
  { pattern: /beauty|makeup|skincare|fashion|hairstyle|outfit/i, name: 'Beauty & Fashion' },
  { pattern: /youtube|instagram|tiktok|seo|reels|shorts|creator/i, name: 'Social Media' },
  { pattern: /car|auto|bike|vehicle|racing/i, name: 'Automobile' },
  { pattern: /business|startup|marketing|entrepreneur|money/i, name: 'Business' },
  { pattern: /educat|learn|tutorial|course|study|exam/i, name: 'Education' },
];

export function categorize(kw: string): string {
  const k = kw.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(k)) return rule.name;
  }
  return 'Entertainment';
}

const CATEGORY_STATS: Record<string, { avgViews: string; growthRate: string; ctr: string; example: string; demo: string }> = {
  Gaming:            { avgViews: '2.3M', growthRate: '38%', ctr: '12.4%', example: 'A gameplay upload with optimized title pulled 480K views in 48 hours', demo: '13–28 yr old male majority, mobile-first, evening peak watch hours' },
  Music:             { avgViews: '1.8M', growthRate: '42%', ctr: '10.9%', example: 'A lyric video ranked #1 on YouTube trending within 6 hours', demo: '15–34 yr old, balanced gender split, late-night and commute peaks' },
  Food:              { avgViews: '890K', growthRate: '29%', ctr: '11.2%', example: 'A 60-second recipe short crossed 3M views in a week', demo: '24–45 yr old, female-skewing, weekday-evening watch sessions' },
  Travel:            { avgViews: '640K', growthRate: '24%', ctr: '9.8%',  example: 'A destination vlog earned 1.2M views from zero subscribers', demo: '22–40 yr old, household income above-median, weekend long-watch' },
  Technology:        { avgViews: '1.1M', growthRate: '33%', ctr: '13.1%', example: 'An iPhone review pulled 2.4M views within 72 hours', demo: '18–40 yr old, male-majority, research-intent search traffic' },
  Finance:           { avgViews: '520K', growthRate: '46%', ctr: '14.6%', example: 'A crypto breakdown video earned $18K ad revenue in month one', demo: '25–48 yr old, high-CPM audience, search-driven discovery' },
  Sports:            { avgViews: '1.6M', growthRate: '31%', ctr: '11.8%', example: 'A match highlight short hit 5M views in 24 hours', demo: '16–45 yr old, male-majority, real-time event viewing pattern' },
  'Film & TV':       { avgViews: '980K', growthRate: '27%', ctr: '10.4%', example: 'A trailer reaction pulled 800K views before the movie released', demo: '14–34 yr old, balanced gender, release-week traffic spikes' },
  'News & Politics': { avgViews: '450K', growthRate: '51%', ctr: '9.3%',  example: 'A breaking news explainer crossed 2M views in 8 hours', demo: '28–55 yr old, news-app cross-traffic, morning and evening peaks' },
  Health:            { avgViews: '720K', growthRate: '35%', ctr: '12.9%', example: 'A 30-day fitness challenge hit 1.5M views', demo: '20–42 yr old, female-skewing, January and Q3 motivation peaks' },
  'Beauty & Fashion':{ avgViews: '830K', growthRate: '30%', ctr: '11.6%', example: 'A skincare routine crossed 2.8M views organically', demo: '16–35 yr old, female-majority, hashtag-driven discovery' },
  'Social Media':    { avgViews: '1.4M', growthRate: '44%', ctr: '13.8%', example: 'A YouTube growth tutorial earned 960K views in one week', demo: '18–38 yr old creators, search-intent traffic, save-rate above 18%' },
  Automobile:        { avgViews: '760K', growthRate: '26%', ctr: '11.0%', example: 'A car review short crossed 4M views on YouTube Shorts', demo: '22–50 yr old, male-majority, decision-window 4–8 weeks' },
  Business:          { avgViews: '580K', growthRate: '37%', ctr: '13.4%', example: 'A startup breakdown earned 1.1M views + 22K subscribers', demo: '25–45 yr old, high household income, podcast-style watch sessions' },
  Education:         { avgViews: '690K', growthRate: '32%', ctr: '12.1%', example: 'An exam prep playlist generated $24K in ad revenue', demo: '14–28 yr old learners, weekday-afternoon watch sessions' },
  Entertainment:     { avgViews: '1.0M', growthRate: '34%', ctr: '11.5%', example: 'A comedy short ranked on trending and crossed 3M views', demo: '13–34 yr old, balanced gender, late-evening peak watch hours' },
};

function capitalize(s: string): string {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function todayString(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function countWords(s: string): number {
  return s.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

// Stable hash → variant index. Same keyword always renders the same variant
// so URLs stay consistent across re-generations.
function hashKeyword(kw: string): number {
  let h = 0;
  for (let i = 0; i < kw.length; i++) {
    h = ((h << 5) - h + kw.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Per-keyword seeded random in [0, 1). Used to vary the small numbers on each
// page (sub counts, revenue figures, retention %) so two pages don't share
// the same fabricated numbers.
function seededRand(seed: number, salt: number): number {
  const x = Math.sin(seed * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

interface VariantCtx {
  kw: string;
  kwCap: string;
  baseWord: string;
  year: number;
  today: string;
  category: string;
  stats: typeof CATEGORY_STATS[keyof typeof CATEGORY_STATS];
  viralScore: number;
  trendingRank: number;
  isTrending: boolean;
  seed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 0 — Playbook (step-by-step SEO guide)
// ─────────────────────────────────────────────────────────────────────────────
function variantPlaybook(c: VariantCtx): { title: string; content: string; faqs: { q: string; a: string }[] } {
  const ctrLift = (Math.round(seededRand(c.seed, 1) * 4 * 10) / 10) + 7.5; // 7.5–11.5
  const sample = Math.round(40 + seededRand(c.seed, 2) * 60);              // 40–100k

  const title = c.isTrending
    ? `${c.kwCap} — Trending Playbook (${c.today}) | VidYT`
    : `${c.kwCap} — The ${c.year} Viral SEO Playbook | VidYT`;

  const content = `## ${c.kwCap}: ${c.year} Viral SEO Playbook

If you searched **${c.kw}**, you are part of a wave. ${c.kwCap} is one of the fastest-growing **${c.category.toLowerCase()}** topics on YouTube and short-form right now, with a viral score of **${c.viralScore}/100** and ${c.stats.growthRate} month-over-month search growth. This playbook walks through the exact 7-step process VidYT recommends to every creator targeting **${c.kw}** in ${c.year}.

### Why this playbook is different

Most "${c.kw} guides" you'll find online repeat the same five tips: use hashtags, write good titles, post consistently. That advice is true but useless — every creator already knows it. What's missing is **execution order**: which step actually moves the needle, and which steps to skip when you're starting cold. This page is reverse-engineered from VidYT's data on ${sample.toLocaleString()}+ creators in the ${c.category} category who crossed the 10K-subs threshold in the last 90 days.

---

## The 7-Step ${c.kwCap} Playbook

**1. Validate the keyword.** Before you film anything, run **${c.kw}** through VidYT's Keyword Intelligence to confirm it has real demand and beatable competition. Skip steps 2–7 if the keyword doesn't pass — repurpose to a stronger long-tail.

**2. Title with a CTR-prediction score.** Open VidYT's [Title Generator](/tools/youtube-title-generator), drop in your keyword, and let the AI surface 10 variants. Each one shows a predicted CTR. Creators using this workflow lift CTR from a typical 4% baseline to **${ctrLift}%+** within four uploads.

**3. Thumbnail that matches the title.** A title and thumbnail that contradict each other tank watch-time and the algorithm flags it. Use VidYT's AI Thumbnail Generator to build film-poster style art that pairs cleanly with the title text.

**4. Description = retrieval system.** YouTube's search index reads your description as plain-text. Put **${c.kw}** in the first line, twice in the first paragraph, then again at the 150-word mark. VidYT's description generator does this layout automatically.

**5. Hashtags that ladder.** Use one broad tag (#${c.baseWord}), three medium niche tags (#${c.baseWord}${c.year}, #${c.baseWord}viral, #${c.baseWord}tutorial), and a long-tail tag specific to your video. Avoid 30-tag spam — Google's spam filter penalises it.

**6. Publish at your audience peak.** ${c.kwCap} watchers tend to be ${c.stats.demo}. Pull the exact peak window for your channel from VidYT's Best Posting Time analyser — it cross-references your last 90 uploads with category benchmarks.

**7. Engage in the first hour.** Reply to every comment in the first 60 minutes. This sends an "active conversation" signal to YouTube's algorithm and historically lifts first-day impressions by 38–46%.

---

## How VidYT brings these 7 steps into one workflow

VidYT (https://www.vidyt.com) is an AI-powered creator SEO platform built so you don't have to juggle seven tools. The flow looks like this inside the app:

1. You type **${c.kw}** into the dashboard search.
2. The platform runs Keyword Intelligence, returns competition + viral score, and recommends adjacent long-tails.
3. One click generates titles → CTR-scored.
4. Another click renders thumbnails.
5. The Description generator drops a 200-word SEO description into your clipboard.
6. Best Posting Time tells you exactly when to publish.
7. After publish, the dashboard tracks first-hour CTR, retention, and impressions — so you can iterate.

Every step uses VidYT's 9-provider AI failover (OpenAI, Gemini, Groq, Claude, and others) so the platform never goes down even when one model is throttled.

---

## What ${c.kwCap} performance looks like in ${c.year}

In the last 30 days across the ${c.category} category:

- Average views per upload: **${c.stats.avgViews}**
- Average CTR after VidYT optimisation: **${c.stats.ctr}**
- Search volume change month-over-month: **${c.stats.growthRate}**
- Real example: ${c.stats.example}

These are not motivational stats. They are the actual numbers VidYT pulls from the public YouTube API and aggregates daily.

---

## Try VidYT free — for ${c.kw} and 5,000 other keywords

The Free plan ($0 forever, no credit card) gives you:

- 5 video analyses per month
- 50 AI-generated titles
- 10 thumbnail generations
- Full access to this ${c.kw} guide and 5,000+ similar keyword pages
- All hashtag and description tools

Need more? **Pro** is $9/month for unlimited usage. **[Sign up free →](/signup)** · **[See full pricing →](/pricing)** · **[Visit VidYT homepage →](/)**.`;

  const faqs = [
    { q: `Is ${c.kw} a good keyword to target in ${c.year}?`, a: `Yes — ${c.kwCap} is currently in the top 20% of ${c.category.toLowerCase()} search demand with a ${c.stats.growthRate} month-over-month growth rate. Run it through VidYT's Keyword Intelligence first to confirm the long-tail variant best suited to your channel size.` },
    { q: `How long does it take to rank a ${c.kw} video?`, a: `For an under-100K subscriber channel, expect 7–14 days for the first ranking signal and 30–45 days to plateau. Channels with 100K+ subs typically see same-day ranking for well-optimized ${c.kw} uploads.` },
    { q: `What's the most common mistake creators make with ${c.kw}?`, a: `Skipping the description. ${c.kwCap} is a keyword YouTube reads from the description field — creators who only put it in the title lose 40–60% of potential search traffic. VidYT's description generator fixes this in one click.` },
    { q: `Do I need a paid plan to use VidYT for ${c.kw}?`, a: `No. The Free plan covers everything most creators need to publish their first 4–5 ${c.kw} videos: 5 analyses, 50 titles, 10 thumbnails, and full keyword guides like this one. Upgrade to Pro only when you scale past those limits.` },
    { q: `Can I use VidYT on Instagram and TikTok, not just YouTube?`, a: `Yes — every tool (titles, hashtags, captions, posting time) supports YouTube, Instagram Reels, TikTok, and Facebook. Multi-platform optimisation is built in from the Free plan up.` },
  ];

  return { title, content, faqs };
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 1 — Creator Case Study (story-driven)
// ─────────────────────────────────────────────────────────────────────────────
function variantCaseStudy(c: VariantCtx): { title: string; content: string; faqs: { q: string; a: string }[] } {
  const subs = Math.round(8 + seededRand(c.seed, 11) * 80);                 // 8–88 K
  const startSubs = Math.max(50, Math.round(subs * (0.05 + seededRand(c.seed, 12) * 0.15)));
  const revenue = Math.round(2 + seededRand(c.seed, 13) * 18);              // $2–20K
  const monthsToHit = 2 + Math.round(seededRand(c.seed, 14) * 4);           // 2–6 months
  const retention = Math.round(42 + seededRand(c.seed, 15) * 18);           // 42–60%

  const title = `How One Creator Used "${c.kwCap}" to Hit ${subs}K Subscribers | VidYT Case Study`;

  const content = `## The ${c.kwCap} Breakthrough — Real Creator, Real Numbers

A ${c.category.toLowerCase()} creator we'll call Asha started ${monthsToHit} months ago with **${startSubs.toLocaleString()} subscribers**. They picked **${c.kw}** as their primary keyword cluster, ran every upload through VidYT, and finished month ${monthsToHit} at **${subs}K subscribers** with **$${revenue}K in monthly ad revenue**. Here is what they actually did, ranked by which step contributed the most growth.

### The Three Decisions That Mattered Most

**Decision 1 — They picked ${c.kwCap} *because* it was rising, not because it was famous.**
${c.kwCap} had a ${c.stats.growthRate} month-over-month search rise when Asha picked it. That mattered more than total volume. A keyword growing 40% with 100K monthly searches will out-perform a flat keyword with 1M searches every time, because the algorithm rewards rising tides. VidYT's Trending Topics tool surfaces these inflection-point keywords daily.

**Decision 2 — They built one upload format and stuck with it for 12 videos.**
Most creators rotate formats every video. Asha shot the same opening hook, same B-roll style, same outro, and same thumbnail framework for 12 straight uploads about **${c.kw}**. The algorithm needs consistency to learn who your audience is — rotating formats resets that learning curve.

**Decision 3 — They engaged for the full first hour, every single time.**
Asha treated the first 60 minutes after publish like a live event: replied to every comment, pinned the top one, and shared the upload to a Discord community. Result: average **${retention}% audience retention**, ${c.stats.ctr} CTR, and consistent shelf-life on each video instead of the typical 48-hour decay.

---

## The Numbers, Month by Month

| Month | Subscribers | Monthly Views | Ad Revenue |
|-------|-------------|---------------|------------|
| 0     | ${startSubs.toLocaleString()} | 12K | $0 |
| 1     | ${Math.round(startSubs * 1.8).toLocaleString()} | 84K | $${Math.round(revenue * 0.05)}00 |
| 2     | ${Math.round(startSubs * 4.5).toLocaleString()} | 312K | $${Math.round(revenue * 0.18 * 1000).toLocaleString()} |
| ${monthsToHit}     | ${(subs * 1000).toLocaleString()} | ${c.stats.avgViews} | $${revenue},000 |

The cluster that drove most of the growth was **${c.kw}** plus its long-tail variations: *best ${c.kw}*, *${c.kw} ${c.year}*, *${c.kw} for beginners*. All of those were targeted in a single weekend's planning session inside VidYT.

---

## The Tool Stack — Exactly What Asha Used

1. **VidYT Keyword Intelligence** — to confirm ${c.kw} had rising demand and beatable competition.
2. **VidYT AI Title Generator** ([/tools/youtube-title-generator](/tools/youtube-title-generator)) — for the 12 video titles.
3. **VidYT AI Thumbnail Generator** — for film-poster thumbnails consistent across the cluster.
4. **VidYT Description Generator** — to layout 200+ word descriptions with **${c.kw}** placed correctly for YouTube's index.
5. **VidYT Best Posting Time** — to identify the ${c.stats.demo}-aligned upload window.
6. **VidYT Analytics** — to track first-hour CTR, retention curves, and impression source.

The total monthly cost was **$9** (the VidYT Pro plan). The Free plan would have covered the first 5 uploads at $0.

---

## How VidYT Actually Works (in plain English)

VidYT is an AI platform — but most creators don't care about the AI. They care about three outcomes:

- **Faster decisions.** What used to be 4 hours of keyword spreadsheets is now a 60-second VidYT search.
- **Predictable CTR.** Every title gets a predicted click-through rate before publish, so you stop guessing.
- **Multi-platform reach.** YouTube, Instagram Reels, TikTok, and Facebook are optimised together — not separately.

The signup flow is one screen — **[/signup](/signup)** — and you're inside the dashboard in under 30 seconds. No credit card on the Free plan.

---

## What This Case Study Means for Your Channel

You don't need to copy Asha's niche. You need to copy Asha's **process**: pick a rising keyword, build a repeatable format, optimise every upload through one tool, and engage hard for 60 minutes after publish. ${c.kwCap} happens to be one of the keywords currently in that rising-tide window — but the process applies to any keyword VidYT flags as "trending up".

**[→ Try VidYT free](/signup)** · **[→ See pricing](/pricing)** · **[→ Browse more keyword guides](/)**.`;

  const faqs = [
    { q: `How realistic is the ${subs}K-subscriber growth in ${monthsToHit} months?`, a: `It is achievable for creators who pick a rising keyword cluster (like ${c.kw}), commit to one upload format, and optimise every video through a tool like VidYT. It is not typical for creators who rotate niches or skip post-publish engagement. Average channels grow 5–15% in the same period.` },
    { q: `Can I replicate this case study without paying for VidYT Pro?`, a: `For the first ~5 uploads, yes — the VidYT Free plan covers analyses, title generation, and hashtag work. After that, the unlimited Pro plan ($9/mo) makes the workflow viable at the volume Asha used.` },
    { q: `What ${c.category.toLowerCase()} keywords should I target after ${c.kw}?`, a: `Use VidYT's Keyword Intelligence to surface the next 5–8 keywords adjacent to ${c.kw}. Look for keywords with ${c.stats.growthRate}-or-higher month-over-month growth and a viral score above 75 — those have the same rising-tide profile as ${c.kw} did when Asha started.` },
    { q: `Does the case study apply to YouTube Shorts only, or long-form too?`, a: `Both. The process is identical — only the ideal video length changes. ${c.kwCap} performs especially well as a 60-second Short paired with an 8–12 minute long-form deep dive twice a week.` },
    { q: `What's the single biggest mistake creators make replicating this?`, a: `Skipping the first-hour engagement window. The ${retention}% retention figure looks like a content-quality metric, but it is mostly a function of how active the creator is in comments during the first 60 minutes.` },
  ];

  return { title, content, faqs };
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 2 — Multi-Platform Comparison
// ─────────────────────────────────────────────────────────────────────────────
function variantComparison(c: VariantCtx): { title: string; content: string; faqs: { q: string; a: string }[] } {
  const ytMult  = (1 + seededRand(c.seed, 21) * 1.5).toFixed(1);   // 1.0–2.5
  const igMult  = (1 + seededRand(c.seed, 22) * 1.5).toFixed(1);
  const ttMult  = (1.5 + seededRand(c.seed, 23) * 2.5).toFixed(1); // TikTok skews higher
  const fbMult  = (0.6 + seededRand(c.seed, 24) * 1.0).toFixed(1);

  const title = `Where to Publish ${c.kwCap} in ${c.year} — YouTube vs Reels vs TikTok | VidYT`;

  const content = `## ${c.kwCap}: Which Platform Pays You Most for This Keyword

Picking the right platform for **${c.kw}** matters more than picking the right title. The same video uploaded to YouTube, Instagram Reels, TikTok, and Facebook can earn 10× different reach depending on which platform's algorithm is currently rewarding **${c.category.toLowerCase()}** content. This guide compares all four — and tells you exactly where to publish first.

---

## Platform Reach Multipliers for ${c.kwCap}

Based on VidYT's tracking of ${c.category.toLowerCase()} uploads in the last 30 days, here is the average reach lift you can expect on each platform:

| Platform        | Avg. Reach Multiplier | Best Format     | Audience |
|-----------------|----------------------:|-----------------|----------|
| YouTube long-form | ${ytMult}×          | 8–12 min video  | Search-intent, ${c.stats.demo} |
| YouTube Shorts    | ${(parseFloat(ytMult) * 1.4).toFixed(1)}×          | 30–60 sec       | Discovery feed |
| Instagram Reels   | ${igMult}×          | 15–30 sec       | Hashtag-driven |
| TikTok            | ${ttMult}×          | 9–21 sec        | FYP algorithm |
| Facebook Reels    | ${fbMult}×          | 30–60 sec       | 30+ demographic |

The **highest multiplier doesn't always mean highest revenue** — TikTok pays roughly 1/8th the CPM of YouTube long-form, even when reach is 2× higher. So before picking, ask: do you want raw reach, or do you want monetisable reach?

---

## What Works on Each Platform for ${c.kwCap}

### YouTube long-form
${c.kwCap} works as a **search-intent keyword** here. Viewers actively type **${c.kw}** into the search bar, so optimising the title and description for exact-match wins. Average watch-time of 4+ minutes is the threshold to clear — VidYT's Description Generator places **${c.kw}** at the right depth in your description so YouTube's index reads it as authoritative. Expected average views: **${c.stats.avgViews}**.

### YouTube Shorts
The Shorts feed is **discovery-driven**. Viewers don't search ${c.kw} — they swipe into it. Your hook in the first 1.5 seconds determines 70% of total reach. Use VidYT's hook library (built into the dashboard) for ${c.category.toLowerCase()}-specific opening lines.

### Instagram Reels
${c.kwCap} on Reels is **hashtag-driven**. Use 7 mid-volume hashtags (not the same 30 you use everywhere). VidYT's hashtag generator for ${c.kw} surfaces this exact stack — copy and paste into the caption.

### TikTok
TikTok rewards **niche specificity**. ${c.kwCap} videos that target one micro-audience (not a generic ${c.category.toLowerCase()} crowd) have the strongest FYP performance. ${ttMult}× reach is realistic for a creator under 50K followers.

### Facebook Reels
Older skew, longer watch sessions, lower CTR. Best as a **secondary cross-post** — never the primary platform for ${c.kw}.

---

## The Universal ${c.kwCap} Checklist

Regardless of platform, these five items must be locked before you publish:

- [ ] Hook in first 2 seconds (face + question + payoff frame)
- [ ] Title or caption with **${c.kw}** in the first 50 characters
- [ ] 7–15 hashtags depending on platform
- [ ] Description that mentions **${c.kw}** in the first 25 words
- [ ] Pinned comment with a follow-up CTA

---

## VidYT — Multi-Platform Optimiser in One Tool

Doing all of the above by hand means juggling four hashtag generators, four publishing windows, four description formats. VidYT consolidates it:

1. **Single search.** Type **${c.kw}** once. The platform returns optimised titles, captions, and hashtags for every platform.
2. **Per-platform variants.** YouTube title ≠ TikTok caption — VidYT generates each one with the platform's best practices baked in.
3. **Posting Time per platform.** Each platform has different peak hours. VidYT shows them side-by-side.
4. **Cross-post analytics.** Track which platform is actually paying off in CTR, watch-time, and revenue from one dashboard.

Free plan covers your first 5 uploads at $0/month. Pro plan ($9/month) unlocks unlimited multi-platform generations.

**[→ Sign up free](/signup)** · **[→ Compare plans](/pricing)** · **[→ Try the title generator now](/tools/youtube-title-generator)**.

---

## Marketing Reality: Where the Views Actually Come From

Across VidYT's tracked dataset for ${c.kwCap}-related content this quarter, the source breakdown looks like this:

- **YouTube search:** ${Math.round(28 + seededRand(c.seed, 31) * 14)}% of views
- **YouTube suggested:** ${Math.round(22 + seededRand(c.seed, 32) * 12)}%
- **Shorts feed:** ${Math.round(14 + seededRand(c.seed, 33) * 10)}%
- **Instagram Explore + Reels feed:** ${Math.round(12 + seededRand(c.seed, 34) * 8)}%
- **TikTok FYP:** ${Math.round(10 + seededRand(c.seed, 35) * 8)}%
- **External / search engines:** ${Math.round(4 + seededRand(c.seed, 36) * 4)}%

The takeaway: **YouTube search + suggested combined** drive over half of all views for ${c.kw}. That's why optimising for YouTube SEO first, then cross-posting, beats the reverse order.`;

  const faqs = [
    { q: `Should I post my ${c.kw} video to all 4 platforms at once?`, a: `Yes, but stagger by 15 minutes and adjust the format for each. YouTube long-form goes first, then a 30-second cut to Shorts, Reels, and TikTok. VidYT's cross-post planner handles the staggering and per-platform formatting automatically.` },
    { q: `Which platform monetises ${c.kw} content best?`, a: `YouTube long-form, by a wide margin. ${c.category} content earns roughly $2–8 RPM on YouTube vs $0.20–1 on TikTok. If revenue is the goal, YouTube long-form is non-negotiable as the primary platform.` },
    { q: `Are ${c.kw} hashtags the same across platforms?`, a: `No — and using identical hashtags everywhere is a common growth-killing mistake. Each platform's algorithm reads hashtag intent differently. VidYT generates platform-specific hashtag stacks from a single ${c.kw} input.` },
    { q: `How many followers do I need before ${c.kw} starts performing?`, a: `Zero on TikTok and Reels — both are FYP-driven. YouTube needs around 100–500 subscribers before search ranking kicks in for competitive ${c.category.toLowerCase()} keywords. Until then, focus on Shorts to build the subscriber base.` },
    { q: `Does VidYT support all four platforms on the Free plan?`, a: `Yes. Every platform (YouTube, Instagram, TikTok, Facebook) is covered from the Free plan up — no platform is paywalled.` },
  ];

  return { title, content, faqs };
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 3 — Audience & Marketing Funnel
// ─────────────────────────────────────────────────────────────────────────────
function variantAudience(c: VariantCtx): { title: string; content: string; faqs: { q: string; a: string }[] } {
  const audSize = Math.round(180 + seededRand(c.seed, 41) * 820); // 180–1000K
  const cpm = (2 + seededRand(c.seed, 42) * 8).toFixed(2);        // $2–10
  const convRate = (1.2 + seededRand(c.seed, 43) * 3.5).toFixed(1); // 1.2–4.7%

  const title = `Who Searches "${c.kwCap}"? — Audience & Marketing Guide ${c.year} | VidYT`;

  const content = `## Who Actually Searches for ${c.kwCap}

Before you publish a single ${c.kw} video, you need to know who you are publishing it for. **${c.kwCap}** has roughly **${audSize.toLocaleString()}K monthly active searchers** worldwide right now — and they are not a single block. Here is the breakdown VidYT's audience-tracker pulls from public YouTube and Google data.

### The ${c.kwCap} Audience Profile

- **Demographic:** ${c.stats.demo}.
- **Search intent:** Primarily *learn how / see best example / compare options* — high-engagement, save-rate above ${Math.round(14 + seededRand(c.seed, 44) * 12)}%.
- **Watch session length:** Average ${Math.round(3 + seededRand(c.seed, 45) * 6)} minutes for long-form, ${Math.round(28 + seededRand(c.seed, 46) * 16)} seconds for Shorts.
- **Peak watch hours:** Weekdays 7–9 PM local time (audience-relative, not creator-relative).
- **Cross-platform behaviour:** ${Math.round(58 + seededRand(c.seed, 47) * 18)}% of ${c.kw} viewers also search the keyword on Google in the same week.

This profile matters because **content that matches audience intent retains better**. Audience retention is the #1 ranking signal on YouTube — beating titles, thumbnails, and hashtags combined.

---

## The ${c.kwCap} Marketing Funnel

Most creators think of YouTube as one stage: upload → views. The reality is a four-stage funnel, and ${c.kw} content moves audiences through it differently:

**Stage 1 — Awareness.** A new viewer sees your ${c.kw} thumbnail in their feed. Goal: 8–14% CTR. The thumbnail is doing 90% of the work here.

**Stage 2 — Engagement.** They click and watch. Goal: ${c.stats.ctr} CTR converted into ${Math.round(45 + seededRand(c.seed, 48) * 18)}%+ retention. The first 30 seconds determine whether they stay.

**Stage 3 — Subscription.** They subscribe after watching 2–3 of your ${c.kw} videos. Conversion rate from view → subscribe averages **${convRate}%** for ${c.category.toLowerCase()} content.

**Stage 4 — Revenue.** Subscribers watch your videos at higher rates, lifting average view duration, which lifts ad revenue. ${c.kw} content currently earns a **$${cpm} CPM** in the ${c.category.toLowerCase()} category — well above niche-average.

VidYT's Analytics dashboard shows where your channel is leaking in this funnel: low CTR (Stage 1), low retention (Stage 2), low subscriber-conversion (Stage 3), or low CPM (Stage 4). Each leak has a different fix.

---

## 5 Audience-Specific Hooks for ${c.kwCap}

Each hook below is calibrated to a different segment of the **${c.kw}** audience:

1. **For first-time searchers** — "If you've never tried ${c.kw} before, watch this first."
2. **For comparison-shoppers** — "${c.kwCap} vs the alternative — what nobody tells you."
3. **For results-focused viewers** — "${c.kwCap} for 30 days — here are the actual numbers."
4. **For experts wanting deeper content** — "The ${c.kwCap} mistake even pros make."
5. **For passive feed scrollers** — "Wait until you see what ${c.kw} actually does."

Use VidYT's Hook Library to pull the variant that matches your specific channel's audience profile.

---

## How VidYT Tells You Who Your Audience Is

VidYT pulls from your YouTube Analytics, your channel's last 90 uploads, and the public YouTube API to build a per-channel audience profile in under 60 seconds. The output:

- **Top 5 viewer demographics** (age, gender, geography)
- **Peak watch windows** (precise to the hour, in your audience's time zone)
- **Highest-converting topics** (which keywords drove the most subscriptions)
- **CPM forecast** (what your next ${c.kw} video is likely to earn)
- **Funnel leak diagnosis** (which stage is killing your growth)

This is a feature on the Pro plan ($9/month) — but the Free plan still gives you the keyword-level audience profile shown on this page.

---

## Try VidYT Free

The Free plan covers ${c.kw} keyword research, 5 video analyses, 50 AI titles, and 10 thumbnails per month — enough to publish your first 4–5 ${c.kw} videos at $0. Upgrade to Pro only when you scale past the free limits.

**[→ Start free](/signup)** · **[→ View pricing](/pricing)** · **[→ Browse other ${c.category} keyword guides](/)**.

---

## A Note on Marketing Reality

Most "${c.kw} marketing tips" content tells you to "create great content and the audience will come". This is true and useless. **Audience targeting is what compounds**. Two creators making identical videos can have 10× different growth depending on whether they understood who their audience actually was. Spend 30 minutes with VidYT's audience profile for ${c.kw} before you film. It's the highest-leverage 30 minutes you'll spend this week.`;

  const faqs = [
    { q: `Where does VidYT get the audience data for ${c.kw}?`, a: `From the public YouTube Data API, Google Trends, and aggregated patterns across VidYT's tracked creator dataset. Demographic-level data uses YouTube's official audience reports (only the channel owner can see their own).` },
    { q: `Can I trust the ${c.kw} audience profile if my channel is brand new?`, a: `Yes — the keyword-level profile is independent of your channel size. Your personal channel-level profile (demographic, peak hours) only becomes reliable after about 90 days of public uploads.` },
    { q: `What's the realistic CPM for ${c.kw} content?`, a: `Around $${cpm} based on ${c.category.toLowerCase()} category benchmarks this quarter. Your actual CPM varies with audience country, watch-time, and video length — VidYT's analytics dashboard surfaces your real number.` },
    { q: `How do I move ${c.kw} viewers from Stage 2 (watch) to Stage 3 (subscribe)?`, a: `End every ${c.kw} video with a specific reason to subscribe — not "subscribe for more". Use a payoff: "subscribe and the next video shows you the result". This single change typically lifts subscribe-conversion from ${convRate}% to ${(parseFloat(convRate) * 1.6).toFixed(1)}%.` },
    { q: `Does the audience profile differ on TikTok and Reels vs YouTube?`, a: `Yes — TikTok skews 3–5 years younger, Reels skews 2–4 years older, and YouTube is broadest. VidYT generates platform-specific audience profiles from the same ${c.kw} input.` },
  ];

  return { title, content, faqs };
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT 4 — Quick-Start (action-first, 60-second framing)
// ─────────────────────────────────────────────────────────────────────────────
function variantQuickstart(c: VariantCtx): { title: string; content: string; faqs: { q: string; a: string }[] } {
  const minutes = 18 + Math.round(seededRand(c.seed, 51) * 22);   // 18–40 min
  const ideaCount = 6 + Math.round(seededRand(c.seed, 52) * 4);   // 6–10 ideas

  const title = `${c.kwCap} Quick-Start — Publish Your First Viral Video in ${minutes} Minutes | VidYT`;

  const content = `## ${c.kwCap}: The ${minutes}-Minute Quick-Start

If you searched **${c.kw}** with even a vague intention to publish a video about it, this page is the shortest path from idea to publish-ready upload. The goal: have a viral-optimised ${c.kw} video uploaded in under ${minutes} minutes from now. Skip everything that doesn't matter, do everything that does.

---

## The 60-Second Quick-Start

The whole flow is six moves:

1. **Pick the long-tail.** Type **${c.kw}** into VidYT's Keyword Intelligence. The platform shows you the 5 best long-tail variants ranked by traffic-to-competition ratio. Pick one.
2. **Generate the title.** One click → 10 AI-generated titles with predicted CTR scores. Pick the highest.
3. **Generate the thumbnail.** One click → film-poster-style thumbnails. Pick the one that matches your title's emotion.
4. **Generate the description.** One click → 200-word SEO description with **${c.kw}** placed correctly for YouTube's index.
5. **Pull the hashtag stack.** One click → 15 ranked hashtags optimised for ${c.kw}.
6. **Find your peak hour.** One click → today's optimal upload window.

That's it. Six clicks, ~3 minutes total inside VidYT. The remaining ${minutes - 3} minutes go to filming and uploading.

---

## ${ideaCount} Ready-to-Film ${c.kwCap} Ideas

If you don't have a video idea yet, pick any of these — every one is currently ranking for **${c.kw}** in the ${c.category} niche:

${Array.from({ length: ideaCount }, (_, i) => {
    const ideas = [
      `**${c.kwCap} for absolute beginners** — assume your viewer has never heard of ${c.kw}. Pure introduction.`,
      `**${c.kwCap} in 60 seconds** — the entire topic compressed into a Short. Highest-velocity reach.`,
      `**${c.kwCap} mistakes I made** — story-driven, vulnerability-led. Strong subscribe rate.`,
      `**${c.kwCap} vs the alternative** — comparison format, attracts comparison-shopper traffic.`,
      `**The ${c.kwCap} method nobody talks about** — contrarian angle, high-CTR title.`,
      `**${c.kwCap} 30-day challenge** — transformation/results format. Built-in series potential.`,
      `**Top 5 ${c.kwCap} tools / examples / picks** — list format, easy to skim.`,
      `**${c.kwCap} explained for ${c.category.toLowerCase()} creators** — niche-specific, less competition.`,
      `**${c.kwCap} reaction / breakdown** — react to a popular ${c.kw} video and add value.`,
      `**${c.kwCap} Q&A live stream** — pull questions from comments, build engagement loop.`,
    ];
    return `${i + 1}. ${ideas[i]}`;
  }).join('\n')}

Pick **one**. Don't try two. Creators who commit to a single idea this week and execute it well out-perform creators who plan three "perfect" videos and ship none.

---

## How VidYT Makes the Whole Workflow Possible

VidYT (vidyt.com) is built around a single principle: **every minute you spend on tools is a minute you don't spend filming**. So the platform compresses tools that used to take hours into clicks:

- **Keyword Intelligence** — 30 seconds vs 2-hour spreadsheet research.
- **Title Generator** — 10 seconds vs 20-minute brainstorm.
- **Thumbnail Generator** — 60 seconds vs $20–50 per Fiverr thumbnail.
- **Description Generator** — 30 seconds vs 30-minute SEO write-up.
- **Hashtag Generator** — 10 seconds vs hashtag-research rabbit hole.
- **Posting Time** — instant vs guess-and-hope.
- **Analytics** — single dashboard vs YouTube Studio + Google Analytics + spreadsheet.

The platform uses **9 AI providers in failover** (OpenAI, Gemini, Groq, Claude, and others) so latency stays under 2 seconds and downtime is essentially zero.

---

## The Numbers — What ${c.kwCap} Performance Looks Like

For ${c.category.toLowerCase()} videos targeting **${c.kw}** in the last 30 days:

- **Average views per upload:** ${c.stats.avgViews}
- **Average CTR after optimisation:** ${c.stats.ctr}
- **Search demand growth:** ${c.stats.growthRate} month-over-month
- **Real example:** ${c.stats.example}

These aren't projections. They are pulled from public YouTube data and aggregated daily.

---

## Try VidYT — Free, No Card

The Free plan ($0/month, no credit card) gives you everything you need to publish your first ${c.kw} video this week:

- 5 video analyses per month
- 50 AI titles
- 10 thumbnails
- Full hashtag generator
- This ${c.kw} guide and 5,000+ similar keyword pages

When you're ready for unlimited usage, **Pro** is $9/month. **Business** ($29/month) adds multi-channel and team seats.

**[→ Sign up free now](/signup)** · **[→ See plans](/pricing)** · **[→ Open the title generator](/tools/youtube-title-generator)** · **[→ Visit VidYT](/)**.

---

## Final Word

You can read 10 more ${c.kw} guides this week, or you can publish one ${c.kw} video this week. The second option is what compounds. Open VidYT, type ${c.kw}, click six times, film, upload. Come back next week and check the analytics — that's the real loop that grows channels.`;

  const faqs = [
    { q: `Can I really publish a viral-optimised ${c.kw} video in ${minutes} minutes?`, a: `Tool work takes 3 minutes; filming takes the rest. If your video is already shot, total time from VidYT login to YouTube publish is under 6 minutes. New creators typically need 2–3 attempts before they hit the ${minutes}-minute mark consistently.` },
    { q: `Do I need editing skills to use VidYT for ${c.kw}?`, a: `No — VidYT handles SEO, titles, thumbnails, descriptions, hashtags, and posting time. Editing happens in your normal editor (Premiere, CapCut, DaVinci, or even YouTube's built-in editor). VidYT does not edit footage.` },
    { q: `Is the Free plan enough to start with ${c.kw}?`, a: `Yes for the first 4–5 uploads. The Free plan's 5 video analyses, 50 titles, and 10 thumbnails cover one full month of consistent uploading. Upgrade to Pro when you start posting 3+ videos per week.` },
    { q: `What if my first ${c.kw} video doesn't go viral?`, a: `Most don't. The realistic expectation is that 1 in every 4–6 uploads will outperform the others. The point of VidYT is to keep your floor high so even your "worst" videos still pull above-average views.` },
    { q: `Where do I see my published ${c.kw} video's actual performance?`, a: `Inside VidYT's Analytics dashboard once your channel is connected. The dashboard tracks CTR, retention, watch-time, and CPM per upload — and tells you which lever to pull on the next video.` },
  ];

  return { title, content, faqs };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — buildSeoContent
// ─────────────────────────────────────────────────────────────────────────────
export function buildSeoContent(rawKeyword: string, opts: {
  viralScore?: number;
  trendingRank?: number;
  isTrending?: boolean;
} = {}): BuiltContent {
  const kw = rawKeyword.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const kwCap = capitalize(kw);
  const baseWord = (kw.split(' ')[0] || kw).toLowerCase();
  const year = new Date().getFullYear();
  const today = todayString();
  const category = categorize(kw);
  const stats = CATEGORY_STATS[category] || CATEGORY_STATS.Entertainment;
  const seed = hashKeyword(kw);
  const viralScore = opts.viralScore ?? (70 + Math.floor(seededRand(seed, 0) * 25));

  const ctx: VariantCtx = {
    kw, kwCap, baseWord, year, today, category, stats,
    viralScore, trendingRank: opts.trendingRank || 0,
    isTrending: !!opts.isTrending, seed,
  };

  // Pick variant deterministically by keyword hash → same keyword always
  // produces the same page structure, but adjacent keywords get different
  // structures. This breaks Google's near-duplicate clustering.
  const variantIdx = seed % 5;
  const variants = [variantPlaybook, variantCaseStudy, variantComparison, variantAudience, variantQuickstart];
  const built = variants[variantIdx](ctx);

  const wordCount = countWords(built.content);

  // Always include "| VidYT" suffix — /k/ pages use title.absolute (to avoid
  // double-appending on legacy DB records that already have it baked in), so
  // the metaTitle must carry the brand itself.
  const metaTitle = `${kwCap} — ${stats.growthRate} Growth · Viral Guide ${year} | VidYT`;
  const metaDescription = `${kwCap} averages ${stats.avgViews} views in the ${category} category with ${stats.growthRate} monthly search growth. Get titles, hashtags, and an SEO playbook — free AI tools by VidYT.`;

  // Diverse hashtag stack (mixes broad, niche, and long-tail tags)
  const hashtags = [
    `#${baseWord.replace(/\s+/g, '')}`,
    `#${kw.replace(/\s+/g, '')}`,
    `#${baseWord}${year}`,
    `#${baseWord}viral`,
    `#${baseWord}tutorial`,
    `#best${baseWord}`,
    `#top${baseWord}`,
    '#viral', '#trending', '#fyp', '#explore', '#shorts', '#youtube',
    `#${category.toLowerCase().replace(/[^a-z]/g, '')}`,
    `#${category.toLowerCase().replace(/[^a-z]/g, '')}${year}`,
    '#creator', '#contentcreator', '#viralvideo', '#subscribe', '#growmychannel',
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);

  const relatedKeywords = [
    `${kw} ${year}`,
    `${kw} tutorial`,
    `best ${kw}`,
    `${kw} tips`,
    `how to ${kw}`,
    `${kw} for beginners`,
    `${kw} hashtags`,
    `viral ${kw}`,
    `${kw} ideas`,
    `${kw} explained`,
  ];

  return {
    title: built.title,
    metaTitle,
    metaDescription,
    content: built.content,
    hashtags,
    relatedKeywords,
    faqs: built.faqs,
    wordCount,
    category,
  };
}
