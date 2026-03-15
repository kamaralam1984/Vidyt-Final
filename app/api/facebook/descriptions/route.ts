import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

type ContentType = 'post' | 'reel' | 'live';

function generateDescriptions(title: string, keywords: string[], contentType: ContentType = 'post'): { text: string; seoScore: number }[] {
  const t = (title || '').trim() || 'Your Post';
  const kws = keywords.length ? keywords.slice(0, 8) : ['viral', 'facebook', 'trending'];
  const tagLine = kws.slice(0, 4).join(', ');
  const year = new Date().getFullYear();
  const mainKw = kws[0]?.replace(/\s+/g, '') || 'viral';

  let templates: string[];
  if (contentType === 'reel') {
    templates = [
      `${t}\n\nQuick reel: ${tagLine}. Double tap if you relate! 🔥 #facebook #reels #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Save & share! #reels #viral #facebook #${mainKw}`,
      `${t}\n\n${tagLine}. Follow for more reels. #facebookreels #trending #${mainKw} #${year}`,
      `${t} | Reel\n\n${tagLine}. Comment your thoughts! #reels #facebook #${mainKw}`,
      `${t}\n\n${kws.join(' | ')}. Like & share karein! #facebook #reels #viral #${mainKw} #${year}`,
    ];
  } else if (contentType === 'live') {
    templates = [
      `${t}\n\nLIVE now! ${tagLine}. Join the stream, say hi in comments. #live #facebooklive #${mainKw} #${year}`,
      `"${t}" – We're live! Topic: ${kws.slice(0, 3).join(', ')}. #live #stream #facebook #${mainKw}`,
      `${t}\n\nLive stream – ${tagLine}. Watch now! #facebooklive #live #${mainKw} #${year}`,
      `${t} | LIVE\n\n${tagLine}. Comment me hello! #live #facebook #${mainKw}`,
      `${t}\n\nGoing live – ${kws.join(' | ')}. Turn on notifications! #live #facebooklive #${mainKw} #${year}`,
    ];
  } else {
    templates = [
      `${t}\n\n${tagLine}. Like, comment, share karein! #facebook #viral #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Follow for more. #facebook #trending #${mainKw}`,
      `${t}\n\n${tagLine}. Share with friends who need this. #facebook #${mainKw} #${year}`,
      `"${t}" – ${kws.join(' | ')}. Comment below! #facebook #viral #${mainKw}`,
      `${t}\n\n${tagLine}. Save & share. #facebook #content #${mainKw} #${year}`,
    ];
  }

  return templates.map((text, i) => ({
    text,
    seoScore: Math.min(95, 68 + (i * 5) + (i % 5)),
  }));
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || '').trim();
  const keywordsParam = (searchParams.get('keywords') || '').trim();
  const contentType = (searchParams.get('contentType') || 'post') as ContentType;
  const keywords = keywordsParam ? keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) : [];

  const descriptions = generateDescriptions(title, keywords, contentType);
  return NextResponse.json({ descriptions });
}
