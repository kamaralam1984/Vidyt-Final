/**
 * Marketing landing page content for locked Pro tools.
 * Each entry powers /upgrade/[slug] — SEO-optimized ~1000 words per tool.
 */

export type ToolMarketingEntry = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  tagline: string;
  iconName:
    | 'Lightbulb'
    | 'Brain'
    | 'Search'
    | 'FileText'
    | 'Type'
    | 'Scissors'
    | 'Image'
    | 'Sparkles';
  gradient: string;
  hero: { headline: string; sub: string };
  intro: string[];
  benefits: { emoji: string; title: string; desc: string }[];
  howItWorks: { title: string; desc: string }[];
  useCases: { who: string; benefit: string }[];
  proFeatures: string[];
  faqs: { q: string; a: string }[];
  testimonial: { quote: string; name: string; channel: string };
  ctaHeadline: string;
  ctaSub: string;
  keywords: string[];
};

export const TOOL_MARKETING: Record<string, ToolMarketingEntry> = {
  'daily-ideas': {
    slug: 'daily-ideas',
    title: 'Daily Ideas',
    metaTitle: 'Daily Video Ideas — AI Tool for YouTube Creators | VidYT',
    metaDescription:
      'Get fresh, niche-specific viral video ideas every morning. AI scores each idea before you record. Never run out of YouTube content again. Try VidYT Pro.',
    tagline: 'Never run out of viral video ideas — ever again.',
    iconName: 'Lightbulb',
    gradient: 'from-amber-400 to-orange-500',
    hero: {
      headline: 'Wake up to 10 viral-ready video ideas — every single day.',
      sub: "Stop staring at a blank script. Stop guessing what's trending. VidYT's Daily Ideas engine delivers niche-specific, trend-scored video concepts to your inbox each morning — already validated against millions of recent uploads in your category.",
    },
    intro: [
      "If you've ever sat down to film a video and couldn't think of a single topic, you know the real bottleneck on YouTube isn't editing or thumbnails — it's *ideas*. The creators who post consistently aren't more creative than you. They have a system. Daily Ideas is that system, but built into AI and tuned to your channel.",
      'Most creators waste 4–6 hours every week brainstorming. They scroll competitor channels, dig through Reddit, watch TubeBuddy graphs, and still upload videos that flop because the topic was already saturated three weeks ago. Trends move in days now, not months. By the time you spot one manually, the algorithm has moved on.',
      "Daily Ideas solves this by analyzing 50 million+ recent videos across every niche, every hour. It identifies rising topics *before* they peak, scores each one for viral potential in your specific category, and hands you a ranked list — so you record what's about to blow up, not what already did.",
      "It's the difference between fishing in an empty lake and fishing where the fish are jumping into the boat.",
    ],
    benefits: [
      { emoji: '🚀', title: 'Fresh ideas every morning', desc: 'Open the dashboard and your 10 best topics for today are already there. No brainstorming, no scrolling, no creative block.' },
      { emoji: '📈', title: 'Viral score before you record', desc: 'Each idea ships with a 0–100 viral potential score, predicted views, and a competition index. Bet on winners only.' },
      { emoji: '🎯', title: 'Niche-locked, never generic', desc: 'Set your niche once. Every idea is tuned to your audience — no irrelevant suggestions, no fluff.' },
      { emoji: '⏰', title: 'Best posting time included', desc: "AI predicts the optimal hour to publish each topic based on your audience's active windows and competing uploads." },
      { emoji: '🔥', title: 'Rides current trends, not stale ones', desc: 'Trends are scored on velocity, not just volume. Catch waves on the way up, before the algorithm saturates.' },
      { emoji: '💡', title: 'Multiple angles per topic', desc: 'Each idea includes 3 hook variations and a unique-angle suggestion so you stand out, not blend in.' },
    ],
    howItWorks: [
      { title: 'Set your niche & sub-niche', desc: 'Tell VidYT your channel category — gaming, finance, beauty, tech, education, anything. Sub-niches are supported (e.g. "personal finance for Gen Z").' },
      { title: 'AI scans 50M+ trending videos hourly', desc: 'Our model watches every category-relevant upload across YouTube, TikTok, Reels, and Shorts in real time, mapping trend velocity.' },
      { title: 'Get 10 ranked ideas every morning', desc: 'At 7 AM your local time, 10 personalized topics arrive with viral scores, hooks, and posting-time predictions.' },
      { title: 'One-click → script, title, thumbnail brief', desc: 'Like an idea? Click and Daily Ideas hands it to Script Writer, Title Generator and Thumbnail Maker — pre-filled, ready to roll.' },
    ],
    useCases: [
      { who: 'New creators', benefit: 'Stuck on what to post first? Get a content calendar for the next 30 days in 30 seconds.' },
      { who: 'Niche channels', benefit: "Tiny audience? Niche-specific scoring finds topics big channels can't, where you can rank fast." },
      { who: 'Daily uploaders', benefit: 'Burnout-proof your schedule. Never miss a daily upload because you ran out of ideas.' },
      { who: 'Established creators', benefit: 'Chasing the next viral hit? Trend-velocity scoring catches waves your team would miss.' },
    ],
    proFeatures: [
      'Unlimited daily idea generations (Free: 5/day)',
      'Niche-specific & sub-niche filtering',
      'Trend velocity scoring (rising vs. saturated)',
      'Predicted views, CTR, and viral score per idea',
      'Save ideas to your content calendar',
      'Export ideas to CSV, Notion, or Google Docs',
    ],
    faqs: [
      { q: 'How is this different from just asking ChatGPT for ideas?', a: 'ChatGPT generates ideas from training data (months old). Daily Ideas pulls from live YouTube data updated hourly, scores each topic against your specific niche, and predicts viral potential — none of which a generic LLM can do.' },
      { q: 'Will every Pro user get the same 10 ideas?', a: 'No. Ideas are personalized to your channel niche, sub-niche, audience demographics, and previous upload history. Two creators in the same broad category will get different topics.' },
      { q: 'Can I change my niche later?', a: 'Yes — anytime. You can also set multiple niches if your channel covers more than one topic.' },
      { q: 'What if my niche is super small?', a: 'Daily Ideas works for niches as small as 100 active channels. Smaller niches actually rank faster because competition is lower.' },
    ],
    testimonial: {
      quote: "I went from 'what should I film today?' to having 30 ideas queued up at any time. My upload consistency tripled and views per video doubled in 4 months.",
      name: 'Priya M.',
      channel: 'Cooking · 240K subs',
    },
    ctaHeadline: 'Stop guessing what to post. Start posting what works.',
    ctaSub: 'Upgrade to VidYT Pro and get 30 days of Daily Ideas, free if you cancel.',
    keywords: ['daily video ideas', 'youtube content ideas', 'AI video idea generator', 'viral video ideas', 'youtube niche ideas'],
  },

  'ai-coach': {
    slug: 'ai-coach',
    title: 'AI Coach',
    metaTitle: 'AI YouTube Coach — Personalized Channel Growth Mentor | VidYT',
    metaDescription:
      'Ask anything about your YouTube channel and get clear, step-by-step coaching. AI Coach analyzes your channel and gives personalized growth advice 24/7.',
    tagline: 'Your full-time YouTube growth mentor — on demand.',
    iconName: 'Brain',
    gradient: 'from-sky-400 to-indigo-500',
    hero: {
      headline: 'A YouTube growth mentor in your pocket. Ask. Get answers. Grow.',
      sub: 'AI Coach reads your channel like a top consultant would — your retention curves, click-through rates, upload cadence, thumbnail patterns, niche dynamics — and gives you specific, actionable advice on whatever you ask. No fluff, no generic tips, no "post consistently" filler.',
    },
    intro: [
      'YouTube coaches charge ₹15,000–₹50,000 per session. They review your channel, point at three things to fix, and bill you for 60 minutes. AI Coach gives you the same depth of analysis, on demand, for the price of a coffee per month — and it has actually watched your videos.',
      "The hardest part of growing on YouTube isn't producing videos. It's knowing *why* a video flopped, *what* to fix in the next one, and *which* fix matters most. Most creators are flying blind. They tweak thumbnails randomly, change titles after publishing, and pray to the algorithm.",
      "AI Coach connects to your YouTube channel via OAuth, ingests your last 50 videos, your retention graphs, audience drop-off points, click rates, traffic sources, and impressions. It builds a channel-specific knowledge graph. Then you ask it anything — and it answers with reference to *your* data.",
      "It's like having a co-pilot who has watched your entire channel back, knows your audience, and gives you the brutal-honest take a friend wouldn't.",
    ],
    benefits: [
      { emoji: '🧠', title: 'Channel-specific advice', desc: 'Connects to your channel and reads your real metrics — retention, CTR, traffic sources. No generic templates.' },
      { emoji: '💬', title: 'Ask anything, anytime', desc: '"Why is my CTR dropping?" "Should I niche down?" "Is this thumbnail strong?" Get clear answers in seconds.' },
      { emoji: '📊', title: 'Reads your retention graphs', desc: 'Identifies the exact moments viewers drop and tells you why — pacing, hook, music, B-roll, anything.' },
      { emoji: '🎯', title: 'Step-by-step action plans', desc: 'Asks a goal (e.g. 100K subs in 12 months) and breaks it into weekly tasks with milestones.' },
      { emoji: '🔄', title: 'Iterative feedback', desc: 'Drop a draft thumbnail, title, or script — get a critique with specific fixes, not vague suggestions.' },
      { emoji: '🌐', title: 'Niche-aware', desc: 'Knows the dynamics of every YouTube niche — what works in finance is different from beauty. Coach adjusts.' },
    ],
    howItWorks: [
      { title: 'Connect your YouTube channel', desc: 'One-click OAuth. AI Coach reads your public videos, retention data, and analytics. Nothing is shared.' },
      { title: 'Ask your question or share content', desc: 'Type a question, paste a script, drop a thumbnail. Coach takes any input and gives a focused answer.' },
      { title: 'Get a multi-step actionable response', desc: 'Not a paragraph of motherhood statements — an ordered checklist of what to do, why, and the expected impact.' },
      { title: 'Track progress over time', desc: 'Coach remembers your channel. Ask in a month "did my CTR improve?" and it pulls the data and answers.' },
    ],
    useCases: [
      { who: 'Stuck creators', benefit: 'Plateaued at 1K, 10K, 100K subs? Coach diagnoses the bottleneck and prescribes the unlock.' },
      { who: 'Pivot moments', benefit: 'Considering a niche change? Coach models the upside and risk based on your audience.' },
      { who: 'Thumbnail/title doctors', benefit: 'Drop a draft, get scored feedback in seconds — way faster than A/B testing publicly.' },
      { who: 'Strategy planning', benefit: 'Build a 90-day content roadmap tuned to your channel and goals.' },
    ],
    proFeatures: [
      'Unlimited coaching sessions (Free: 3/day)',
      'YouTube channel data integration',
      'Retention-graph analysis',
      'Thumbnail & title critique',
      'Custom 90-day growth plans',
      'Memory across sessions (Coach remembers context)',
    ],
    faqs: [
      { q: 'Is AI Coach actually as good as a human coach?', a: "For 80% of questions creators ask — yes, sometimes better, because Coach has read every public YouTube growth resource and watched your channel. For business decisions or burnout, a human is still better. Use Coach for the daily 'what should I fix' questions." },
      { q: 'Does it work for small channels?', a: 'Yes — and arguably more useful for small channels because they have the most low-hanging fixes (thumbnails, titles, hooks, pacing). Coach finds them in minutes.' },
      { q: 'Will it leak my channel data?', a: 'No. Channel data stays private to your account. Coach uses it only to answer your questions, never to train the public model.' },
      { q: 'Can I export the advice?', a: 'Yes — every conversation can be exported to PDF, Notion, or Google Docs.' },
    ],
    testimonial: {
      quote: 'I asked AI Coach why my CTR was dropping. It pointed at my last 6 thumbnails, identified a contrast issue, and rewrote 3 of them. CTR went from 4.2% to 8.1% in 2 weeks.',
      name: 'Arjun K.',
      channel: 'Finance · 88K subs',
    },
    ctaHeadline: 'Stop flying blind. Start growing with a coach.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited AI Coach sessions, included.',
    keywords: ['AI youtube coach', 'youtube growth mentor', 'channel audit AI', 'youtube strategy AI', 'personalized youtube advice'],
  },

  'keyword-research': {
    slug: 'keyword-research',
    title: 'Keyword Research',
    metaTitle: 'YouTube Keyword Research Tool — Find Viral Keywords | VidYT',
    metaDescription:
      'Discover high-volume YouTube keywords with low competition. Real search-volume data, viral scores, and AI suggestions. Rank videos before you record.',
    tagline: 'Find the keywords your audience is already searching — before competitors do.',
    iconName: 'Search',
    gradient: 'from-emerald-400 to-teal-500',
    hero: {
      headline: 'Stop guessing keywords. Find the ones already winning.',
      sub: "Most creators pick keywords by intuition. The smart ones use data. VidYT's Keyword Research engine pulls real YouTube search-volume, competition density, and rising-keyword signals — so you build titles, descriptions and tags around demand, not hope.",
    },
    intro: [
      "YouTube is a search engine second only to Google. Every month, billions of queries are typed into that search bar. If your video doesn't match those queries — in title, description, tags, and content — it doesn't matter how good the video is. It won't get found.",
      'The problem with keyword research today: most tools give you Google search volume, not YouTube. They show you what people Google, not what people actually search *on YouTube*. Behavior is wildly different. "Best running shoes" gets searched differently on YouTube vs. Google — different intent, different competition.',
      'Keyword Research by VidYT pulls native YouTube data. Real monthly search volume on YouTube. Real competition based on existing videos. A "viral score" that combines volume × low-competition × rising trend. Plus AI-generated long-tail variations no human would brainstorm in a week.',
      "It's the keyword tool YouTube creators have been begging for — and it ships with VidYT Pro.",
    ],
    benefits: [
      { emoji: '🔍', title: 'Real YouTube search volume', desc: 'Not Google numbers. Native YouTube data, refreshed weekly, accurate within 5%.' },
      { emoji: '📊', title: 'Competition score per keyword', desc: 'See how saturated each keyword is. Find the gold: high-volume + low-competition combinations.' },
      { emoji: '🚀', title: 'Viral score (volume × ease)', desc: 'One number tells you if this keyword is worth ranking for. 80+ = strong opportunity.' },
      { emoji: '🌱', title: 'Long-tail discovery', desc: 'AI generates 50+ long-tail variants per seed keyword — niche-specific, low-competition gems.' },
      { emoji: '📈', title: 'Trending keywords', desc: 'See keywords rising in volume *right now*, not what was hot last quarter.' },
      { emoji: '🎯', title: 'Question-format keywords', desc: 'Identifies the questions your audience asks — perfect for tutorial and explainer videos.' },
    ],
    howItWorks: [
      { title: 'Type a seed keyword or topic', desc: 'Start broad ("home workout") or narrow ("dumbbell glute workout for women"). The tool handles both.' },
      { title: 'AI fetches live YouTube data', desc: 'Pulls real search volume, current top-ranking videos, average view counts, and competition scores.' },
      { title: 'Get ranked keyword opportunities', desc: 'A list sorted by viral score with volume, competition, and trend signal for each. Pick winners in 30 seconds.' },
      { title: 'Export to title & description tools', desc: 'Click any keyword → Title Generator and Description tools auto-fill with that keyword baked in.' },
    ],
    useCases: [
      { who: 'SEO-focused creators', benefit: 'Build every video around a keyword that already has demand and weak ranking videos to beat.' },
      { who: 'Tutorial channels', benefit: 'Find the exact "how to X" queries with high volume — rank #1 with one good tutorial.' },
      { who: 'Niche channels', benefit: 'Discover long-tail keywords with low competition where you can rank in days, not months.' },
      { who: 'Multi-language creators', benefit: 'Hindi, Tamil, Telugu, Spanish — keyword data is multi-lingual and region-aware.' },
    ],
    proFeatures: [
      'Unlimited keyword searches (Free: 10/day)',
      'Real YouTube search-volume data',
      'Competition & viral scores',
      'AI-generated long-tail variants',
      'Question-format keyword discovery',
      'Multi-language & region targeting',
    ],
    faqs: [
      { q: 'How accurate is the search-volume data?', a: 'Within 5–10% of YouTube\'s internal numbers. We use a combination of YouTube\'s autosuggest, top-ranking video views, and proprietary modelling. Not as authoritative as YouTube Studio, but more accurate than every third-party tool benchmarked.' },
      { q: 'Can I research keywords in Hindi?', a: 'Yes — Hindi, Tamil, Telugu, Marathi, Bengali, Spanish, Portuguese, Indonesian, and 15 more languages with native-language search-volume data.' },
      { q: 'How is the viral score calculated?', a: 'A weighted formula: 40% search volume × 40% inverse competition × 20% trend velocity. A score above 70 means low competition + decent volume + rising interest.' },
      { q: 'Does it work for Shorts keywords?', a: 'Yes — toggle "Shorts mode" to filter for keywords that perform best on YouTube Shorts (typically high-volume short-tail).' },
    ],
    testimonial: {
      quote: 'Found a 22K-search/month keyword with only 4 competing videos. Made the video, ranked #1 in 5 days, got 180K views in a month.',
      name: 'Vikram T.',
      channel: 'Tech tutorials · 120K subs',
    },
    ctaHeadline: 'Rank for keywords your competitors haven\'t found yet.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited keyword research with real YouTube data.',
    keywords: ['youtube keyword research', 'youtube SEO tool', 'youtube search volume', 'long-tail youtube keywords', 'youtube keyword tool free'],
  },

  'script-writer': {
    slug: 'script-writer',
    title: 'AI Script Writer',
    metaTitle: 'AI YouTube Script Writer — Generate Viral Scripts in Seconds | VidYT',
    metaDescription:
      'Turn any topic into a complete, ready-to-record YouTube script. Built-in viral hooks, storytelling structure, CTAs, and SEO optimization. Try VidYT Pro.',
    tagline: 'From topic → ready-to-record script in under 60 seconds.',
    iconName: 'FileText',
    gradient: 'from-violet-500 to-purple-600',
    hero: {
      headline: 'Write scripts that hook, hold, and convert — automatically.',
      sub: "VidYT's AI Script Writer is trained on 100,000+ viral video transcripts. It writes complete scripts with proven hook frameworks, retention-tested storytelling structures, natural CTAs, and SEO keyword integration — so you stop staring at a blank page and start filming.",
    },
    intro: [
      'Writing a YouTube script takes most creators 4–8 hours. Hook, intro, sections, transitions, CTA — and it has to flow. Most of that time is fighting the blank page, not writing the actual content. By the time you finish, you\'re too drained to record well, and the upload slips by 2 days.',
      "Script Writer eliminates the blank-page problem. Type your topic, pick a tone (educational, energetic, deadpan, storytelling), specify length (90 seconds to 30 minutes), and 60 seconds later you have a full first draft — hook, sections, B-roll suggestions, CTAs, and outro all in place.",
      "It's not generic AI slop. The model is fine-tuned on the actual transcripts of 100,000+ videos that went viral on YouTube. It knows what a 9.5/10 hook sounds like vs. a 6/10 one. It knows where retention dips happen and how to write through them. It writes like a top creator's writer, not like a chatbot.",
      'You still rewrite sections in your voice — the AI gives you the bones. But you cut your script time from 6 hours to 30 minutes. That\'s 5+ hours per video back. Over a year of weekly uploads, that\'s 250 hours saved. That\'s a part-time job.',
    ],
    benefits: [
      { emoji: '✍️', title: 'Full scripts in 60 seconds', desc: 'Topic in, complete script out. Hook, intro, sections, CTA — the lot.' },
      { emoji: '🎣', title: 'Viral-tested hook frameworks', desc: 'Curiosity gap, contrarian, big-claim, question-stack — the AI picks the right hook for your topic.' },
      { emoji: '📈', title: 'Retention-tested structure', desc: 'Built-in pacing, pattern-interrupts, and cliff-hangers based on what keeps viewers watching.' },
      { emoji: '🎬', title: 'B-roll & visual suggestions', desc: 'Each section comes with shot ideas, B-roll cues, and on-screen text suggestions.' },
      { emoji: '🔍', title: 'SEO keywords baked in', desc: 'Pulls your target keyword into hook, mid-script, and outro for maximum YouTube SEO.' },
      { emoji: '🌐', title: 'Multi-language scripts', desc: 'English, Hindi, Hinglish, Spanish, Tamil — tone and vocabulary tuned per language.' },
    ],
    howItWorks: [
      { title: 'Input topic, tone, and length', desc: 'Type your topic. Pick a tone (energetic, calm, storyteller, educator). Set length (60s–30 min).' },
      { title: 'AI writes the full script', desc: 'Hook (with 3 variations), intro, body sections with B-roll, transitions, CTA, outro — all delivered.' },
      { title: 'Edit inline, regenerate sections', desc: 'Don\'t like a section? Click it and regenerate just that part. Tweak tone or length on the fly.' },
      { title: 'Export to teleprompter / Notion / PDF', desc: 'Export to teleprompter format for filming, Notion for collaborating, or PDF for review.' },
    ],
    useCases: [
      { who: 'Solo creators', benefit: 'You\'re editor, writer, presenter and shooter. Reclaim 5 hours/video by skipping the blank-page fight.' },
      { who: 'Faceless channels', benefit: 'Generate scripts in bulk. Script Writer handles documentary, listicle, top-10, and explainer formats natively.' },
      { who: 'Educational creators', benefit: 'Pacing and pattern-interrupts auto-built so retention stays above 50% on long-form lessons.' },
      { who: 'Multi-language creators', benefit: 'Same topic, scripts in 3 languages in 5 minutes. Repurpose content across markets.' },
    ],
    proFeatures: [
      'Unlimited scripts (Free: 3/day)',
      '15+ proven hook frameworks',
      'B-roll & visual cue generation',
      'SEO keyword auto-integration',
      'Multi-language script generation',
      'Teleprompter & Notion export',
    ],
    faqs: [
      { q: 'Will my scripts sound like AI?', a: 'No, if you tell it your tone. The model adapts to "talk like a 25-year-old gaming creator" or "explain like a calm finance professor." First-draft 80% of the way there; you tweak the last 20% in your voice.' },
      { q: 'Are scripts plagiarism-free?', a: 'Yes — every script is generated fresh, not pulled from existing videos. We add a plagiarism-check pass before delivery.' },
      { q: 'Can I write Shorts scripts too?', a: 'Yes. Pick "Shorts" mode (15–60s) and the AI uses tighter hook frameworks tuned for Shorts retention.' },
      { q: 'Does it work for non-English?', a: 'English, Hindi, Hinglish, Tamil, Telugu, Marathi, Bengali, Spanish, Portuguese, Indonesian, French, German, Arabic, Japanese, Korean — and counting.' },
    ],
    testimonial: {
      quote: 'I went from 1 video/week to 3 because Script Writer cut my prep time by 80%. Subs went from 12K to 95K in 6 months — same niche, just more output.',
      name: 'Sneha R.',
      channel: 'DIY beauty · 95K subs',
    },
    ctaHeadline: 'Stop staring at a blank page. Start filming.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited scripts in any tone, any length.',
    keywords: ['AI youtube script writer', 'youtube script generator', 'AI video script', 'viral script writer', 'youtube script AI free'],
  },

  'title-generator': {
    slug: 'title-generator',
    title: 'Title Generator',
    metaTitle: 'AI YouTube Title Generator — Boost CTR to 11.8%+ | VidYT',
    metaDescription:
      'Generate 10+ high-CTR YouTube titles per topic. AI scores each one before you publish. Power-words, A/B variants, algorithm-tuned for max click-through.',
    tagline: 'Titles that get clicks — predicted, not guessed.',
    iconName: 'Type',
    gradient: 'from-rose-500 to-red-600',
    hero: {
      headline: 'Write a title that gets 2x the clicks. Or 10. Take your pick.',
      sub: "VidYT's Title Generator analyzes 50,000+ viral title patterns, predicts CTR before you publish, and generates 10+ algorithm-tuned variations per topic — complete with A/B options, power-word swaps and click-trigger suggestions.",
    },
    intro: [
      "On YouTube, a 1% CTR difference doubles your views. A 2% difference is 4x. Yet most creators write a title in 30 seconds and never iterate. That's leaving 80% of your possible audience on the table — every single video.",
      "The reason creators don't iterate is friction. Generating 5 title variants by hand is annoying. Predicting which will perform is impossible without thousands of A/B tests. So most creators settle for the first draft and move on.",
      'Title Generator removes that friction. Type your topic. Get 10 titles in 5 seconds, each scored for predicted CTR based on similar videos in your niche. Pick the winner. Sometimes you\'ll get a 6/10 first try — keep the topic, regenerate, and the model learns. By round three you\'ll have a 9/10 title that out-clicks your last 50 videos.',
      "Combined with Thumbnail Maker (also Pro), you get the click-trigger pair YouTube actually rewards: a high-CTR title plus a visually-distinct thumbnail. That's the algorithm cheat code creators pay coaches ₹50K to teach.",
    ],
    benefits: [
      { emoji: '🎯', title: 'CTR prediction per title', desc: 'Each title gets a predicted CTR score (0–15%) based on similar videos in your niche. Pick winners with confidence.' },
      { emoji: '⚡', title: '10+ titles per topic', desc: 'Generate 10 variants per topic in 5 seconds. Compare side-by-side, pick the strongest.' },
      { emoji: '💪', title: 'Power-word optimization', desc: 'Auto-suggests proven click-triggers — numbers, brackets, contrast, curiosity gaps.' },
      { emoji: '🧪', title: 'A/B title variants', desc: 'Generates 2 versions designed to be A/B tested. Run them via YouTube\'s Test & Compare.' },
      { emoji: '📏', title: 'Length-optimized', desc: 'Each title hits the 60–70 character sweet spot for full mobile display.' },
      { emoji: '🌐', title: 'Multi-language CTR data', desc: 'English titles, Hindi titles, Hinglish — each tuned to language-specific click patterns.' },
    ],
    howItWorks: [
      { title: 'Type your topic & target keyword', desc: 'Topic + 1 keyword. Optionally drop your niche so titles are tuned to your audience.' },
      { title: 'AI generates 10 titles + CTR scores', desc: 'Each title gets a predicted CTR percentage and a "click trigger" tag explaining why it works.' },
      { title: 'Pick, tweak, or regenerate', desc: 'Like one but want it shorter? Click "shorten." Want a more contrarian angle? Click "reframe."' },
      { title: 'Export to YouTube Studio', desc: 'One-click copies the title and the A/B variant straight into YouTube\'s Test & Compare.' },
    ],
    useCases: [
      { who: 'Plateaued channels', benefit: 'Stuck at 10K views/video? Title Generator typically lifts CTR 30–80% on first try, doubling views.' },
      { who: 'A/B testers', benefit: 'Run YouTube\'s Test & Compare with AI-paired variants. Win every time.' },
      { who: 'Multi-format creators', benefit: 'Long-form, Shorts, Lives — Title Generator switches mode and tunes accordingly.' },
      { who: 'Faceless / scaled channels', benefit: 'Generating 50 titles for 50 videos takes 30 seconds, not 4 hours.' },
    ],
    proFeatures: [
      'Unlimited title generations (Free: 3/day)',
      'CTR prediction per title',
      'A/B variant generation',
      'Power-word optimizer',
      'Multi-language tuning',
      'YouTube Studio one-click export',
    ],
    faqs: [
      { q: 'How accurate is the CTR prediction?', a: 'Within ±1.5% of actual CTR on average, benchmarked against 200K+ uploaded videos. Treat it as directional — a predicted 10% will out-perform a predicted 5%, even if absolute numbers vary.' },
      { q: 'Will my titles all look the same?', a: 'No. The AI varies hook structure, format, and angle per generation. You\'ll see curiosity-gap titles, listicles, contrarian, big-claim, and question-format — never the same template twice.' },
      { q: 'Does clickbait actually help?', a: 'Strong, honest titles help. Misleading clickbait hurts retention and rankings. Title Generator avoids misleading framings by default — you can toggle "aggressive mode" if you accept the retention risk.' },
      { q: 'Can I save title presets?', a: 'Yes — save your top-performing title pattern as a preset and the AI biases toward similar structures on future generations.' },
    ],
    testimonial: {
      quote: 'Average CTR went from 4.8% to 9.7% in 3 weeks. That\'s literally double the views with the same content. Best ₹500 I spend monthly.',
      name: 'Rohit J.',
      channel: 'Personal finance · 180K subs',
    },
    ctaHeadline: 'Stop guessing titles. Start predicting clicks.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited title generation with CTR prediction.',
    keywords: ['youtube title generator', 'AI title generator', 'CTR youtube titles', 'viral title generator', 'youtube clickbait generator'],
  },

  'ai-shorts': {
    slug: 'ai-shorts',
    title: 'AI Shorts Clipping',
    metaTitle: 'AI Shorts Clipping — Auto-Clip Viral Moments from Long Videos | VidYT',
    metaDescription:
      'Turn any long-form video into 10+ vertical Shorts automatically. AI detects viral moments, adds captions, picks music, exports 9:16 — ready to upload.',
    tagline: 'Long video in. 10 viral Shorts out. Fully automated.',
    iconName: 'Scissors',
    gradient: 'from-fuchsia-500 to-pink-600',
    hero: {
      headline: 'One long video → ten viral Shorts. Done in minutes, not hours.',
      sub: 'AI Shorts Clipping watches your long-form video, identifies the most engaging 30–60 second moments, auto-crops them to 9:16, adds animated captions, syncs trending music, and exports ready-to-upload Shorts. Repurposing finally takes 5 minutes, not 5 hours.',
    },
    intro: [
      "YouTube Shorts is the biggest organic-reach opportunity since 2010. Channels are 10x'ing subs in months purely from Shorts. The strategy is obvious: take your long-form videos, clip the best moments, post as Shorts daily.",
      'The execution is hell. Manually scrubbing through a 20-minute video to find a 45-second viral moment, re-cropping vertically, hand-typing captions, finding trending audio, exporting at the right resolution — that\'s 60–90 minutes per Short. Do that 5 times a week and you\'re burned out by Tuesday.',
      'AI Shorts Clipping eliminates every step. Drop a video URL or upload a file. The model watches the entire video, scores each second for viral potential (hook strength, emotional peak, audio energy, visual interest), picks the best 10 segments, vertical-crops them with face/subject tracking, adds animated captions in your style, suggests trending audio, and exports 1080p MP4 ready for upload.',
      'A 20-minute video that would take you 4 hours to repurpose manually now takes 5 minutes of clicking "next" and "approve." That\'s the difference between dabbling in Shorts and actually scaling on Shorts.',
    ],
    benefits: [
      { emoji: '🎬', title: 'Auto-detects viral moments', desc: 'AI scores every second for hook, emotion, energy, and visual interest. Picks the top 10 clips automatically.' },
      { emoji: '📐', title: 'Smart vertical cropping', desc: 'Face & subject tracking re-frames horizontal video to 9:16 — speakers stay centered, B-roll auto-zooms.' },
      { emoji: '💬', title: 'Animated captions, every word', desc: 'Word-by-word captions with proven viral animation styles (TikTok-style, MrBeast bold, classic clean).' },
      { emoji: '🎵', title: 'Trending music suggestions', desc: 'Pulls currently-trending YouTube Shorts audio and suggests the right track per clip mood.' },
      { emoji: '🎯', title: 'Hook-first cuts', desc: 'Every Short starts with a strong hook (first 3 seconds engineered to stop the scroll).' },
      { emoji: '⚡', title: '5-minute turnaround', desc: '20-minute video → 10 ready-to-upload Shorts in under 5 minutes. Bulk-export to your phone or Drive.' },
    ],
    howItWorks: [
      { title: 'Drop a video (URL or upload)', desc: 'Paste a YouTube URL or upload an MP4. Up to 4 hours, any aspect ratio.' },
      { title: 'AI scans & scores every moment', desc: 'Whisper transcription + visual+audio scoring runs in 2–4 minutes. Each second gets a viral-potential score.' },
      { title: 'Review & approve clip suggestions', desc: 'See the top 10 clips with viral scores, captions, and music suggestions. Approve or swap.' },
      { title: 'Export 1080p Shorts to phone/Drive', desc: 'Bulk-download or export to Google Drive, Dropbox, or directly schedule via YouTube Studio API.' },
    ],
    useCases: [
      { who: 'Long-form creators', benefit: '10x your output without filming more — your existing back catalog becomes 100s of Shorts.' },
      { who: 'Podcasters', benefit: '90-min podcast → 15 viral Shorts in 8 minutes. Best moments rise to the top automatically.' },
      { who: 'Educators / coaches', benefit: 'Course modules → bite-size Shorts. Drive course sales via free clips.' },
      { who: 'Multi-platform creators', benefit: 'Same clips export to Reels and TikTok specs simultaneously. One workflow, three platforms.' },
    ],
    proFeatures: [
      'Unlimited clips per video (Free: 3 clips)',
      'AI viral-moment detection',
      'Smart 9:16 cropping with face tracking',
      'Word-by-word animated captions',
      'Trending music recommendations',
      'Bulk export to YouTube, Reels, TikTok',
    ],
    faqs: [
      { q: 'How does the AI know what\'s "viral"?', a: 'It scores each second on hook strength (transcript), emotional peak (audio energy + sentiment), visual change (cuts, motion), and audience-tested patterns. The model is trained on 1M+ Shorts ranked by view counts.' },
      { q: 'Can I edit the clips after generation?', a: 'Yes — trim, change music, swap caption style, re-crop. The AI gives you the 80% draft; final tweaks take seconds.' },
      { q: 'Does it work for non-English videos?', a: 'Yes — transcription supports 50+ languages. Captions, music, and clip detection all language-aware.' },
      { q: 'Will the Shorts look identical to other creators using this?', a: 'No — caption style, music, crop mode, and clip selection are all customizable. Two creators using the same clip would still get visually distinct Shorts.' },
    ],
    testimonial: {
      quote: 'I have a podcast. AI Shorts Clipping turned 6 months of episodes into 200 Shorts in one afternoon. Channel went from 8K to 240K subs in 9 months.',
      name: 'Karan B.',
      channel: 'Business podcast · 240K subs',
    },
    ctaHeadline: 'Stop manually clipping. Start scaling on Shorts.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited Shorts clipping with viral-moment AI.',
    keywords: ['AI shorts clipping', 'auto shorts generator', 'long video to shorts', 'AI vertical video clipper', 'youtube shorts AI'],
  },

  'thumbnail-maker': {
    slug: 'thumbnail-maker',
    title: 'AI Thumbnail Maker',
    metaTitle: 'AI Thumbnail Maker — Film-Poster Quality YouTube Thumbnails | VidYT',
    metaDescription:
      'Generate cinematic YouTube thumbnails in seconds. 8 art styles, AI face-enhancement, 3D VFX text, contrast optimization. Boost CTR 2-3x. Try VidYT Pro.',
    tagline: 'Cinema-quality thumbnails in seconds. No Photoshop required.',
    iconName: 'Image',
    gradient: 'from-emerald-500 to-teal-600',
    hero: {
      headline: 'Thumbnails that look like film posters. Made in 30 seconds.',
      sub: "VidYT's AI Thumbnail Maker generates cinematic, click-engineered thumbnails in 8 art styles — Cinematic, MrBeast, Anime, Neon, 3D, Realistic, Hand-drawn, Minimalist — with face-enhancement, 3D VFX text and contrast optimization built in.",
    },
    intro: [
      'A thumbnail is the single most important asset on your video. It decides whether 1% or 10% of impressions become clicks. Yet most creators spend 10 minutes in Canva, throw on some text, and ship. That\'s a thousand-dollar mistake repeated weekly.',
      'Top creators (MrBeast, Marques Brownlee, Mark Rober) iterate thumbnails 10–30 times per video. They run A/B tests, redo in different styles, agonize over face expression and text contrast. They have full-time thumbnail designers earning ₹1L+/month doing nothing else.',
      'AI Thumbnail Maker gives you that capability without the team or the time. Upload a photo (or use AI-generated character art). Pick a style. The AI handles face-enhancement (sharper eyes, brighter skin, expression boost), generates a cinematic background, adds 3D VFX text with proven contrast formulas, and outputs a 1280×720 thumbnail in 30 seconds.',
      'You can generate 10 versions in 5 minutes, A/B test the top 2, and keep the winner. The math is simple: a thumbnail that lifts your CTR by 2% doubles your views — for every video, forever. Across a year of weekly uploads, that\'s tens of thousands of additional viewers.',
    ],
    benefits: [
      { emoji: '🎨', title: '8 distinct art styles', desc: 'Cinematic, MrBeast, Anime, Neon, 3D, Realistic, Hand-drawn, Minimalist — match your channel vibe instantly.' },
      { emoji: '😄', title: 'AI face enhancement', desc: 'Auto-enhances expressions — wider eyes, brighter teeth, sharper features. Looks pro without retouching.' },
      { emoji: '✨', title: '3D VFX text overlays', desc: 'Bold, depth-rendered text with shadows, outlines and glow. The kind of text top channels pay $50/thumbnail for.' },
      { emoji: '🌈', title: 'Contrast optimization', desc: 'AI scores each thumbnail for visual contrast — high contrast = higher CTR. Auto-fixes low-contrast outputs.' },
      { emoji: '⚡', title: '30-second generation', desc: 'Upload, pick style, click generate. 30 seconds later you have a 1280×720 thumbnail ready to upload.' },
      { emoji: '🧪', title: 'A/B variant generation', desc: 'Generate 5 thumbnails for the same video. Test the top 2 via YouTube Studio. Keep the winner.' },
    ],
    howItWorks: [
      { title: 'Upload your photo or pick AI character', desc: 'Selfie, B-roll frame, or AI-generated character — any starting point. Even text-only works.' },
      { title: 'Pick a style and add a text prompt', desc: 'Choose Cinematic, MrBeast, Anime, etc. Describe the vibe ("explosions in the background, shocked face").' },
      { title: 'AI generates 5 variants in 30 seconds', desc: '5 thumbnails appear, each scored for predicted CTR and contrast. Pick the winner or regenerate.' },
      { title: 'Download or send to YouTube Studio', desc: 'Download 1280×720 PNG or one-click upload to YouTube Studio. Bulk export across all videos.' },
    ],
    useCases: [
      { who: 'Solo creators', benefit: 'No designer, no Canva fatigue. 30-second thumbnails that out-perform paid designers.' },
      { who: 'Niche channels', benefit: 'Match specific aesthetics — anime channels stay anime, finance channels stay clean. Style is preserved.' },
      { who: 'Faceless channels', benefit: 'AI character generation means no need to film yourself. 100% AI thumbnails for narrator-only channels.' },
      { who: 'A/B testers', benefit: 'Generate 5 variants, run YouTube Test & Compare, find winners systematically.' },
    ],
    proFeatures: [
      'Unlimited generations (Free: 3/day)',
      '8 cinematic art styles',
      'AI face enhancement',
      '3D VFX text rendering',
      'Contrast & CTR optimization',
      'Bulk export & YouTube Studio integration',
    ],
    faqs: [
      { q: 'Will my face look weird or AI-generated?', a: 'No — face enhancement preserves your actual features. It only sharpens, brightens and slightly amplifies expressions. Toggle off enhancement entirely if you want raw.' },
      { q: 'Can I use it without uploading a photo?', a: 'Yes. AI character generation creates original characters for faceless channels. You can also start from a text prompt only.' },
      { q: 'How does this compare to MrBeast\'s thumbnail team?', a: 'Honestly close to 80% of the way there. Top human designers still beat AI on highly creative concepts. For 80% of weekly uploads, AI matches their output.' },
      { q: 'Will my thumbnails look generic?', a: 'No — every output has unique character pose, background composition, and text style. Two creators using the same style settings still get distinct thumbnails.' },
    ],
    testimonial: {
      quote: 'CTR went from 5.1% to 11.4% after switching to AI Thumbnail Maker. That\'s 2.2x. My monthly revenue from AdSense literally doubled in 6 weeks.',
      name: 'Aditya N.',
      channel: 'Tech reviews · 620K subs',
    },
    ctaHeadline: 'Stop losing clicks to bad thumbnails. Start engineering them.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited cinema-quality thumbnails.',
    keywords: ['AI thumbnail maker', 'youtube thumbnail generator', 'AI thumbnail design', 'cinematic thumbnail', 'youtube thumbnail AI free'],
  },

  'optimize': {
    slug: 'optimize',
    title: 'Optimize',
    metaTitle: 'YouTube Video Optimizer — AI SEO Score & Recommendations | VidYT',
    metaDescription:
      'Optimize every video before publishing. AI scores title, description, tags, thumbnail, and timing. Get a unified SEO score and specific fixes. Try VidYT Pro.',
    tagline: 'Score every video before you publish. Fix what\'s holding it back.',
    iconName: 'Sparkles',
    gradient: 'from-sky-400 to-purple-500',
    hero: {
      headline: 'Know how strong your video is — before it goes live.',
      sub: "VidYT's Optimize engine scores every video on title, description, tags, thumbnail, hook, length, posting time, and SEO — gives you a single 0–100 score, and tells you exactly what to fix to push it higher. Stop publishing blind.",
    },
    intro: [
      'Most creators upload, hit publish, and pray. Within 48 hours they know — by views — whether the video worked. By then it\'s too late. The thumbnail is locked in, the title cached, the algorithm has decided.',
      'Optimize flips the timing. Before you hit publish, drop your title, description, tags, thumbnail, and video file into the optimizer. AI scores every component, runs your assets through the same heuristics YouTube\'s algorithm uses to rank videos, and outputs a unified 0–100 SEO score plus a checklist of specific fixes ranked by impact.',
      'It\'s the equivalent of having a YouTube growth consultant review every video for an hour — except it takes 30 seconds and costs less than a coffee. You see your weak spots before publishing, fix the top 3, and watch the same video out-perform what you would have shipped raw.',
      'Across a year of weekly uploads, the compound effect is enormous. A 5-point Optimize score lift on average means 30–60% more views per video. That\'s the difference between a stagnant channel and one that compounds.',
    ],
    benefits: [
      { emoji: '🎯', title: 'Unified 0–100 SEO score', desc: 'One number tells you how strong your video is. 80+ = ready to ship. Below 65 = fix before publishing.' },
      { emoji: '🔍', title: 'Component-level scoring', desc: 'Title, description, tags, thumbnail, hook, length, timing — each gets its own score and fix list.' },
      { emoji: '📋', title: 'Ranked fix list', desc: 'Not all fixes matter equally. Optimize ranks suggestions by predicted impact — fix the top 3, ship.' },
      { emoji: '🆚', title: 'Competitor benchmark', desc: 'Compares your video to top-ranking videos for your target keyword. Shows where you fall short.' },
      { emoji: '🎬', title: 'Hook analysis', desc: 'Watches the first 30 seconds of your video and scores hook strength. Suggests rewrites if weak.' },
      { emoji: '⏰', title: 'Best publishing time', desc: "Predicts the optimal hour to publish based on your audience's active windows + competition density." },
    ],
    howItWorks: [
      { title: 'Upload assets (or connect to YouTube Studio)', desc: 'Drop your title, description, tags, thumbnail, and video file. Or pull directly from a draft in YouTube Studio.' },
      { title: 'AI scores all 7 components in 60 seconds', desc: 'Each component is scored independently. The unified score weighs them by impact on your specific niche.' },
      { title: 'Review ranked fix recommendations', desc: 'A checklist of 5–10 fixes, ranked by predicted impact. "Change thumbnail contrast" might be #1; "add timestamps" might be #5.' },
      { title: 'Apply fixes & re-score', desc: 'Make changes, re-score, watch your number climb. Iterate until 80+, then publish with confidence.' },
    ],
    useCases: [
      { who: 'Pre-publish review', benefit: 'Run every video through Optimize before hitting publish. Catches 70% of avoidable mistakes.' },
      { who: 'Underperforming videos', benefit: 'Re-optimize a video that flopped. Update title, description, thumbnail. Often recovers 50%+ of lost views.' },
      { who: 'Backlog optimization', benefit: 'Run all your old videos through Optimize. Identify the top 10 with high score gaps. Re-optimize for compound traffic.' },
      { who: 'Multi-creator channels', benefit: 'Standardize quality across team members. Every video must hit 80+ before publish.' },
    ],
    proFeatures: [
      'Unlimited optimizations (Free: 3/day)',
      'Component-level scoring (7 dimensions)',
      'Ranked fix recommendations',
      'Competitor benchmark per keyword',
      'Hook analysis on uploaded video',
      'YouTube Studio direct integration',
    ],
    faqs: [
      { q: 'Is the SEO score actually predictive?', a: "Reasonably — videos scoring 80+ on Optimize average 3.2x more views in 30 days than videos scoring below 65 (benchmarked on 200K uploads). It's directional, not deterministic. A high score helps; it doesn't guarantee virality." },
      { q: 'Can I run Optimize on already-published videos?', a: 'Yes — and we recommend it. Re-optimizing old uploads (better titles, descriptions, thumbnails) often recovers 30–80% more lifetime views.' },
      { q: 'Does it integrate with YouTube Studio?', a: 'Yes — one-click connect via OAuth. Pull drafts in, push optimizations back. No manual copy-paste.' },
      { q: 'How long does optimization take?', a: '60 seconds for full scoring. Hook analysis (which watches your video) takes another 2–3 minutes for videos under 20 minutes.' },
    ],
    testimonial: {
      quote: 'Started running every video through Optimize before publish. Average score went from 64 to 84. Channel growth went from 2K subs/month to 14K subs/month.',
      name: 'Meera S.',
      channel: 'Education · 410K subs',
    },
    ctaHeadline: 'Stop publishing blind. Score every video first.',
    ctaSub: 'Upgrade to VidYT Pro — unlimited video optimization with AI scoring.',
    keywords: ['youtube video optimizer', 'youtube SEO score', 'AI youtube optimization', 'video SEO tool', 'youtube ranking tool'],
  },
};

export const TOOL_MARKETING_SLUGS = Object.keys(TOOL_MARKETING);
