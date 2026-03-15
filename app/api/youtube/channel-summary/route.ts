import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';

function extractChannelIdentifier(url: string): string | null {
  const u = url.trim();
  const m = u.match(/youtube\.com\/channel\/([^/?]+)/) || u.match(/youtube\.com\/@([^/?]+)/) || u.match(/youtube\.com\/c\/([^/?]+)/);
  return m ? m[1] : null;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const channelUrl = (searchParams.get('channelUrl') || searchParams.get('url') || '').trim();
  if (!channelUrl) {
    return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });
  }

  const identifier = extractChannelIdentifier(channelUrl);
  if (!identifier) {
    return NextResponse.json({
      error: 'Invalid channel URL',
      suggestion: 'Use format: https://www.youtube.com/@username or https://www.youtube.com/channel/UC...',
    }, { status: 400 });
  }

  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey?.trim();

  if (!apiKey) {
    return NextResponse.json({
      channelTitle: 'Channel',
      videoCount: 0,
      subscriberCount: 0,
      viewCount: 0,
      channelDescription: '',
      channelKami: ['YouTube API key set nahi hai. Super Admin → API Config me YouTube Data API key add karein.'],
      settingKami: ['API key ke bina channel settings check nahi kar sakte.'],
      homepageKeywords: [] as { keyword: string; score: number }[],
      keywordReplaceSuggestions: [] as { replace: string; withKeyword: string; reason: string }[],
      recommendedKeywords: [] as { keyword: string; score: number }[],
      growthActions: [{ where: 'API Config', action: 'YouTube Data API key add karein', reason: 'Channel data aur keywords tabhi milenge' }],
      linked: true,
    });
  }

  try {
    const isChannelId = identifier.startsWith('UC') && identifier.length >= 20;
    let channelId = identifier;
    if (!isChannelId) {
      const handle = identifier.startsWith('@') ? identifier.slice(1) : identifier;
      const chRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet,statistics', key: apiKey, forHandle: handle },
        timeout: 10000,
      });
      if (chRes.data?.items?.length) {
        channelId = chRes.data.items[0].id;
      } else {
        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', key: apiKey, q: `@${handle}`, type: 'channel', maxResults: 1 },
          timeout: 10000,
        });
        const ch = searchRes.data?.items?.[0];
        if (ch?.id?.channelId) channelId = ch.id.channelId;
        else {
          const userRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: { part: 'snippet', key: apiKey, forUsername: handle },
            timeout: 10000,
          });
          if (userRes.data?.items?.length) channelId = userRes.data.items[0].id;
          else return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }
      }
    }

    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet,statistics,brandingSettings,contentDetails',
        key: apiKey,
        id: channelId,
      },
      timeout: 10000,
    });
    const ch = channelRes.data?.items?.[0];
    if (!ch) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const channelTitle = ch.snippet?.title || 'Channel';
    const videoCount = parseInt(ch.statistics?.videoCount || '0', 10);
    const subscriberCount = parseInt(ch.statistics?.subscriberCount || '0', 10);
    const viewCount = parseInt(ch.statistics?.viewCount || '0', 10);
    const channelDescription = (ch.snippet?.description || '').trim();
    const hasBanner = !!(ch.brandingSettings?.image?.bannerExternalUrl);
    const hasDescription = channelDescription.length >= 100;

    const studioKeywordsRaw = (ch.brandingSettings?.channel as { keywords?: string } | undefined)?.keywords;
    const studioKeywords: string[] = studioKeywordsRaw
      ? studioKeywordsRaw.split(/[,;\n]+/).map((k) => k.trim()).filter((k) => k.length > 0)
      : [];

    const channelKami: string[] = [];
    if (videoCount === 0) channelKami.push('Channel par abhi koi video nahi hai — pehli video upload karein.');
    else if (videoCount < 5) channelKami.push(`Sirf ${videoCount} video hai — regular upload se growth better hoti hai (hafta me 1–2).`);
    if (subscriberCount < 100) channelKami.push('Subscribers kam hain — video quality aur thumbnail improve karein, share karein.');
    if (viewCount === 0 && videoCount > 0) channelKami.push('Views nahi aa rahe — title, thumbnail aur description SEO improve karein.');
    if (!hasDescription) channelKami.push('Channel description short ya khali hai — 200+ chars me apna intro, kya milta hai channel pe, aur keywords likhein.');

    const settingKami: string[] = [];
    if (!hasBanner) settingKami.push('Channel banner set nahi hai — branding ke liye banner add karein (2560x1440).');
    if (!hasDescription) settingKami.push('About section me description poori likhein — keywords aur links add karein.');
    if (!ch.snippet?.country) settingKami.push('Channel country set karein (Settings → Channel → Advanced).');
    if (settingKami.length === 0) settingKami.push('Basic settings theek lag rahe hain. About me links aur social add karein.');

    const weakWords = new Set(['which', 'get', 'right', 'first', 'true', 'show', 'whole', 'talk', 'reaches', 'related', 'each', 'every', 'other', 'some', 'such', 'only', 'just', 'also', 'when', 'where', 'what', 'that', 'this', 'with', 'from', 'have', 'will', 'your', 'about']);
    const strongReplacements: Record<string, string> = { which: 'breaking', get: 'latest', right: 'verified', first: 'exclusive', true: 'factual', show: 'coverage', whole: 'full', talk: 'debate', reaches: 'reaches', related: 'trending' };
    function keywordScore(kw: string): number {
      const k = kw.replace(/^#/, '').toLowerCase();
      if (weakWords.has(k)) return 25 + Math.min(20, k.length * 2);
      if (k.length < 3) return 30;
      if (k.length > 20) return 55;
      let s = 50;
      if (kw.startsWith('#')) s += 10;
      if (k.length >= 4 && k.length <= 12) s += 15;
      if (/[0-9]/.test(k)) s += 5;
      return Math.min(98, Math.max(15, s + (k.length % 10)));
    }

    let homepageKeywordsRaw: string[] = [];
    if (studioKeywords.length > 0) {
      homepageKeywordsRaw = [...studioKeywords];
    } else {
      const hashMatch = channelDescription.match(/#[\w\u0900-\u097F]+/g);
      if (hashMatch) hashMatch.forEach((h: string) => { const w = h.slice(1).trim(); if (w.length > 1) homepageKeywordsRaw.push(h); });
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'we', 'they', 'my', 'your', 'our', 'me', 'us', 'it', 'its', 'as', 'so', 'if', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'subscrib', 'subscribe', 'like', 'comment', 'share', 'watch', 'video', 'videos', 'channel', 'click', 'link', 'links']);
      const words = channelDescription.replace(/#[\w\u0900-\u097F]+/g, '').split(/[\s,;.]+/).map((w: string) => w.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '').toLowerCase()).filter((w: string) => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));
      const seen = new Set(homepageKeywordsRaw.map((k) => k.toLowerCase()));
      for (const w of words) { if (!seen.has(w) && homepageKeywordsRaw.length < 25) { seen.add(w); homepageKeywordsRaw.push(w); } }
    }

    const homepageKeywords: { keyword: string; score: number }[] = homepageKeywordsRaw.slice(0, 30).map((kw) => ({ keyword: kw, score: keywordScore(kw) }));
    const keywordReplaceSuggestions: { replace: string; withKeyword: string; reason: string }[] = [];
    homepageKeywords.forEach(({ keyword: kw, score }) => {
      const k = kw.replace(/^#/, '').toLowerCase();
      if (score < 50 && strongReplacements[k]) {
        keywordReplaceSuggestions.push({
          replace: kw,
          withKeyword: strongReplacements[k],
          reason: `"${kw}" kam strong hai (${score}%). "${strongReplacements[k]}" search me zyada better chalega.`,
        });
      } else if (score < 45) {
        keywordReplaceSuggestions.push({
          replace: kw,
          withKeyword: 'relevant niche keyword',
          reason: `Is keyword ka score kam hai (${score}%). Apne niche ka strong keyword daal dein.`,
        });
      }
    });

    const channelTitleWords = channelTitle.split(/\s+/).filter((w: string) => w.length > 2).slice(0, 3);
    const recommendedKeywords: { keyword: string; score: number }[] = [];
    const recommendedSet = new Set(homepageKeywords.map((h) => h.keyword.toLowerCase()));
    channelTitleWords.forEach((w: string) => { if (!recommendedSet.has(w.toLowerCase())) { recommendedSet.add(w.toLowerCase()); recommendedKeywords.push({ keyword: w, score: 75 + Math.min(20, w.length) }); } });
    ['news', 'updates', 'viral', 'trending', 'subscribe', 'latest'].forEach((w, i) => { if (!recommendedSet.has(w)) { recommendedKeywords.push({ keyword: w, score: 72 + (i % 5) * 3 }); } });
    const recSorted = recommendedKeywords.slice(0, 10).sort((a, b) => b.score - a.score);

    const growthActions: { where: string; action: string; reason: string }[] = [];
    if (!hasDescription || channelDescription.length < 100) {
      growthActions.push({ where: 'Channel About (Home)', action: 'Description 200+ chars likhein — apna intro, kya content milta hai, main keywords', reason: 'SEO + discoverability, subscriber samajh sake channel kya hai' });
    } else {
      growthActions.push({ where: 'Channel About (Home)', action: 'Keywords aur links update karte rahein', reason: 'Search me channel better dikhega' });
    }
    if (!hasBanner) {
      growthActions.push({ where: 'Channel Banner', action: 'Banner image set karein (2560x1440)', reason: 'Branding strong hogi, naye visitors trust karenge' });
    }
    if (!ch.snippet?.country) {
      growthActions.push({ where: 'Channel Settings', action: 'Country set karein (Settings → Channel → Advanced)', reason: 'YouTube audience suggest karta hai' });
    }
    if (videoCount < 5 && videoCount > 0) {
      growthActions.push({ where: 'Upload Schedule', action: 'Hafta me 1–2 video regular upload karein', reason: 'Algorithm aur subscribers dono ko consistency pasand hai' });
    }
    if (subscriberCount < 100 && videoCount > 0) {
      growthActions.push({ where: 'Thumbnail & Title', action: 'Har video ka title aur thumbnail CTR ke liye optimize karein', reason: 'Zyada clicks = zyada views = growth' });
    }
    if (viewCount === 0 && videoCount > 0) {
      growthActions.push({ where: 'SEO & Share', action: 'Description me keywords, social pe share, community tab use karein', reason: 'Views badhane ke liye discoverability zaruri hai' });
    }
    if (growthActions.length === 0) {
      growthActions.push({ where: 'Content', action: 'Quality aur consistency banaye rahein', reason: 'Long-term growth ke liye' });
    }

    const res = NextResponse.json({
      channelId,
      channelTitle,
      videoCount,
      subscriberCount,
      viewCount,
      channelDescription: channelDescription.slice(0, 500),
      channelKami,
      settingKami,
      homepageKeywords,
      keywordReplaceSuggestions,
      recommendedKeywords: recSorted,
      growthActions,
      linked: true,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res;
  } catch (e) {
    console.error('Channel summary error:', e);
    return NextResponse.json({
      error: 'Channel data fetch nahi ho paya',
      channelKami: ['Channel link sahi se paste karein (e.g. youtube.com/@username). YouTube API error aa raha hai.'],
      settingKami: ['Pehle channel data load karein.'],
      homepageKeywords: [] as { keyword: string; score: number }[],
      keywordReplaceSuggestions: [] as { replace: string; withKeyword: string; reason: string }[],
      recommendedKeywords: [] as { keyword: string; score: number }[],
      growthActions: [] as { where: string; action: string; reason: string }[],
      linked: true,
    }, { status: 200 });
  }
}
