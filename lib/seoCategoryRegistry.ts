/**
 * Category-rotation registry for the daily SEO auto-page engine.
 *
 * Spec (owner-defined):
 *   • 3 pages/day per active category
 *   • Hard global cap: 60 pages/day
 *   • Subtopics rotate so the same combo isn't re-generated until the
 *     full subtopic pool has cycled
 *   • If active categories × 3 > 60, categories themselves rotate too
 *
 * Used by: app/api/cron/generate-seo-pages/route.ts
 *
 * Design notes:
 *   • All keywords are pre-validated against the seoKeywordSanitizer
 *     (≤ 4 tokens, ≤ 50 chars). Subtopics here have been chosen to fit.
 *   • Day index is UTC-day since 2026-01-01 — deterministic & stable
 *     across cron retries within the same UTC day.
 */
export interface SeoCategory {
  /** Display + categorisation key. */
  name: string;
  /** Disable a category without deleting (for seasonal pauses). */
  active: boolean;
  /**
   * Specific subtopics. Each must be 1–4 tokens, ≤ 50 chars, semantically
   * distinct from other subtopics in the same category. Add more here to
   * extend the rotation pool — never use {placeholder}-style templates.
   */
  subtopics: string[];
}

/** Per-category daily creation cap. Owner-locked at 3. */
export const PER_CATEGORY_DAILY = 3;

/** Global daily creation cap. Reverted 200 → 50 after GSC showed 2,034 pages
 *  stuck in "Discovered - currently not indexed" — Google's crawl budget
 *  was exhausted by volume. Pair with raised MIN_AUTO_CREATE_QUALITY (80)
 *  in generate-seo-pages route. Earn trust first, scale later. */
export const GLOBAL_DAILY_CAP = 50;

/**
 * Active categories. Add/remove freely — rotation engine adapts.
 * Subtopic counts intentionally vary; rotation handles uneven pools.
 */
export const SEO_CATEGORIES: SeoCategory[] = [
  { name: 'YouTube Growth', active: true, subtopics: [
    'YouTube Shorts SEO', 'YouTube Thumbnail Trends', 'YouTube AI Editing',
    'YouTube Automation', 'YouTube Growth Hacks', 'YouTube Monetization',
    'YouTube Hashtag Trends', 'YouTube Viral Niches', 'YouTube Algorithm 2026',
    'YouTube Creator Tools',
  ]},
  { name: 'AI Tools', active: true, subtopics: [
    'AI Video Editor', 'AI Thumbnail Maker', 'AI Script Writer',
    'AI Content Planner', 'AI SEO Optimizer', 'AI Voice Generator',
    'AI Caption Tool', 'AI Trend Finder',
  ]},
  { name: 'Blogging', active: true, subtopics: [
    'Blog SEO Strategy', 'Blog Topic Research', 'Blog Monetization',
    'Blog Traffic Growth', 'Blog Email Funnel', 'Blog Content Calendar',
    'Blog Niche Selection',
  ]},
  { name: 'Affiliate Marketing', active: true, subtopics: [
    'Affiliate Niche Picks', 'Affiliate Link Strategy', 'Affiliate Funnel Build',
    'Affiliate Email Series', 'Affiliate Review Sites', 'Affiliate Youtube Channel',
  ]},
  { name: 'Finance', active: true, subtopics: [
    'Personal Finance Tips', 'Stock Market Basics', 'Crypto Investing',
    'Passive Income Ideas', 'Saving Money Hacks', 'Index Fund Guide',
    'Tax Saving Strategy',
  ]},
  { name: 'Fitness', active: true, subtopics: [
    'Home Workout Plan', 'Weight Loss Routine', 'Muscle Building Diet',
    'Yoga For Beginners', 'Cardio Fat Burn', 'Mobility Stretches',
    'Fitness App Review',
  ]},
  { name: 'Gaming', active: true, subtopics: [
    'Gaming Channel Setup', 'Gameplay Editing Tips', 'Gaming Thumbnail Style',
    'Gaming Stream Growth', 'Gaming Niche Picks', 'Gaming Sponsorships',
  ]},
  { name: 'Technology', active: true, subtopics: [
    'Smartphone Reviews', 'Laptop Buying Guide', 'Smart Home Setup',
    'Wearable Tech Picks', 'Tech Channel Niches', 'Gadget Review Format',
  ]},
  { name: 'Education', active: true, subtopics: [
    'Online Course Creation', 'Study Tips Students', 'Exam Prep Strategy',
    'Language Learning Apps', 'Educational Youtube Niche', 'Self Learning Roadmap',
  ]},
  { name: 'Business', active: true, subtopics: [
    'Small Business Ideas', 'Business Branding Tips', 'Customer Acquisition',
    'Business Automation', 'Lean Startup Method', 'B2B Lead Gen',
  ]},
  { name: 'Creator Economy', active: true, subtopics: [
    'Creator Brand Building', 'Creator Sponsorship Deals', 'Creator Membership Models',
    'Creator Newsletter Growth', 'Creator Multi Platform', 'Creator Burnout Recovery',
  ]},
  { name: 'Digital Marketing', active: true, subtopics: [
    'SEO Content Strategy', 'Email Marketing Funnel', 'Paid Ads Optimization',
    'Influencer Outreach', 'Conversion Rate Tips', 'Local SEO Guide',
  ]},
  { name: 'Motivation', active: true, subtopics: [
    'Morning Routine Habits', 'Discipline Building', 'Mindset Reset',
    'Goal Setting Framework', 'Focus Deep Work', 'Procrastination Fix',
  ]},
  { name: 'Entertainment', active: true, subtopics: [
    'Movie Review Format', 'Reaction Channel Tips', 'Comedy Sketch Ideas',
    'Pop Culture Breakdown', 'Celebrity News Niche', 'Trending Memes Guide',
  ]},
  { name: 'Social Media', active: true, subtopics: [
    'Social Content Calendar', 'Engagement Hacks', 'Cross Platform Posting',
    'Hashtag Research', 'Story Format Ideas', 'Carousel Post Design',
  ]},
  { name: 'Startup Growth', active: true, subtopics: [
    'Startup Pitch Deck', 'Startup Hiring Guide', 'Startup Pmf Search',
    'Startup Bootstrapping', 'Startup Funding Rounds', 'Startup Marketing',
  ]},
  { name: 'SEO', active: true, subtopics: [
    'On Page SEO', 'Technical SEO Audit', 'Backlink Strategy',
    'Keyword Clustering', 'Content Refresh Tactic', 'Schema Markup Tips',
  ]},
  { name: 'Automation', active: true, subtopics: [
    'No Code Automation', 'Zapier Workflow Ideas', 'Make Com Setup',
    'Email Automation', 'Social Auto Poster', 'Workflow Templates',
  ]},
  { name: 'Earning Apps', active: true, subtopics: [
    'Best Earning Apps', 'Cashback App Review', 'Survey Apps Income',
    'Microtask Earning Apps', 'Refer Earn Apps', 'Daily Reward Apps',
  ]},
  { name: 'Freelancing', active: true, subtopics: [
    'Freelance Niche Picks', 'Freelance Client Acquisition', 'Freelance Pricing Models',
    'Freelance Portfolio Tips', 'Freelance Cold Outreach', 'Freelance Contract Basics',
  ]},
  { name: 'Coding', active: true, subtopics: [
    'Coding Roadmap Beginners', 'Frontend Project Ideas', 'Backend Tech Stack',
    'Coding Channel Niche', 'Open Source Contribution', 'Coding Interview Prep',
  ]},
  { name: 'Online Business', active: true, subtopics: [
    'Online Store Setup', 'Digital Product Ideas', 'Subscription Box Model',
    'Service Business Online', 'Online Course Sales', 'Print On Demand',
  ]},
  { name: 'SaaS', active: true, subtopics: [
    'Saas Idea Validation', 'Saas Onboarding Flow', 'Saas Pricing Tiers',
    'Saas Churn Reduction', 'Saas Content Strategy', 'Saas Demo Funnel',
  ]},
  { name: 'Video Editing', active: true, subtopics: [
    'Premiere Pro Workflow', 'Davinci Color Grading', 'Capcut Mobile Edit',
    'Editing Pacing Tips', 'B Roll Strategy', 'Sound Design Basics',
  ]},
  { name: 'Streaming', active: true, subtopics: [
    'Twitch Channel Setup', 'Streaming Overlay Design', 'Stream Audio Quality',
    'Streamer Community Growth', 'Multi Stream Strategy', 'Stream Monetization',
  ]},
  { name: 'Instagram Growth', active: true, subtopics: [
    'Instagram Reels Hooks', 'Instagram Bio Optimization', 'Instagram Story Strategy',
    'Instagram Carousel Ideas', 'Instagram Hashtag Stack', 'Instagram Collab Posts',
  ]},
  { name: 'TikTok Trends', active: true, subtopics: [
    'Tiktok Hook Ideas', 'Tiktok Sound Strategy', 'Tiktok Niche Selection',
    'Tiktok Live Growth', 'Tiktok Series Format', 'Tiktok Collab Plays',
  ]},
  { name: 'Shorts Reels', active: true, subtopics: [
    'Short Hook Templates', 'Reel Pacing Edits', 'Vertical Video Framing',
    'Shorts Caption Style', 'Reels Story Arc', 'Cross Post Shorts',
  ]},
  { name: 'Productivity', active: true, subtopics: [
    'Time Blocking Method', 'Notion Productivity Setup', 'Weekly Review Ritual',
    'Inbox Zero Method', 'Energy Management Tips', 'Deep Work Schedule',
  ]},
  { name: 'Future Tech', active: true, subtopics: [
    'Ar Vr Content', 'Web3 Creator Tools', 'Robotics Channel Niche',
    'Quantum Tech Explainers', 'Future Of Work', 'Spatial Computing',
  ]},
];

/** UTC days since 2026-01-01 — stable across same-day cron retries. */
export function getDayIndex(now: Date = new Date()): number {
  const epoch = Date.UTC(2026, 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((today - epoch) / 86400000));
}

/**
 * Pick today's working set of categories.
 *
 * If active × PER_CATEGORY_DAILY ≤ GLOBAL_DAILY_CAP, every active category
 * runs daily. If not, we rotate a sliding window of `floor(cap / per_cat)`
 * categories per day so each category surfaces every few days.
 */
export function pickTodayCategories(now: Date = new Date()): SeoCategory[] {
  const active = SEO_CATEGORIES.filter(c => c.active);
  const slotsPerDay = Math.floor(GLOBAL_DAILY_CAP / PER_CATEGORY_DAILY);
  if (active.length <= slotsPerDay) return active;

  const day = getDayIndex(now);
  const offset = (day * slotsPerDay) % active.length;
  const out: SeoCategory[] = [];
  for (let i = 0; i < slotsPerDay; i++) {
    out.push(active[(offset + i) % active.length]);
  }
  return out;
}

/**
 * Pick today's PER_CATEGORY_DAILY subtopics from a category — rotating
 * deterministically so the same subtopics aren't reused until the pool
 * has cycled.
 */
export function pickTodaySubtopics(
  cat: SeoCategory,
  count: number = PER_CATEGORY_DAILY,
  now: Date = new Date(),
): string[] {
  const pool = cat.subtopics.filter(Boolean);
  if (pool.length === 0) return [];
  if (pool.length <= count) return [...pool];

  const day = getDayIndex(now);
  const offset = (day * count) % pool.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(offset + i) % pool.length]);
  }
  return out;
}
