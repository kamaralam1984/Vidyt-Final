export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

type ContentType = 'post' | 'reel' | 'story' | 'live';

function generateCaptions(caption: string, keywords: string[], contentType: ContentType): { text: string; seoScore: number }[] {
  const t = (caption || '').trim() || 'Your post';
  const kws = keywords.length ? keywords.slice(0, 8) : ['viral', 'instagram', 'trending'];
  const tagLine = kws.slice(0, 4).join(', ');
  const year = new Date().getFullYear();
  const mainKw = kws[0]?.replace(/\s+/g, '') || 'viral';

  let templates: string[];
  if (contentType === 'reel') {
    templates = [
      `${t}\n\n${tagLine}. Double tap! 🔥 #instagram #reels #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Save & share! #reels #viral #instagood #${mainKw}`,
      `${t}\n\n${tagLine}. Follow for more reels. #instagramreels #trending #${mainKw} #${year}`,
      `${t} | Reel\n\n${tagLine}. Comment below! #reels #instagram #${mainKw}`,
      `${t}\n\n${kws.join(' | ')}. Like & share! #instagram #reels #viral #${mainKw} #${year}`,
    ];
  } else if (contentType === 'story') {
    templates = [
      `${t}\n\n${tagLine}. 👆 Tap to reply. #story #${mainKw}`,
      `"${t}" – ${kws.slice(0, 2).join(', ')}. Swipe up! #instagram #story #${mainKw}`,
      `${t}\n\n${tagLine}. #story #${mainKw} #${year}`,
      `${t} | Story\n\n${tagLine}. #instagram #${mainKw}`,
      `${t}\n\n${kws.join(' | ')}. #story #${mainKw}`,
    ];
  } else if (contentType === 'live') {
    templates = [
      `${t}\n\nLIVE now! ${tagLine}. Join & say hi! #live #instagramlive #${mainKw} #${year}`,
      `"${t}" – We're live! ${kws.slice(0, 3).join(', ')}. #live #instagram #${mainKw}`,
      `${t}\n\nLive – ${tagLine}. Watch now! #instagramlive #${mainKw} #${year}`,
      `${t} | LIVE\n\n${tagLine}. Comment hello! #live #${mainKw}`,
      `${t}\n\nGoing live – ${kws.join(' | ')}. #instagramlive #${mainKw} #${year}`,
    ];
  } else {
    templates = [
      `${t}\n\n${tagLine}. Like, comment, share! #instagram #viral #${mainKw} #${year}`,
      `"${t}" – ${kws.slice(0, 3).join(', ')}. Follow for more. #instagood #trending #${mainKw}`,
      `${t}\n\n${tagLine}. Tag someone who needs this. #instagram #${mainKw} #${year}`,
      `"${t}" – ${kws.join(' | ')}. Comment below! #instagram #viral #${mainKw}`,
      `${t}\n\n${tagLine}. Save & share. #instagram #content #${mainKw} #${year}`,
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
  const caption = (searchParams.get('caption') || searchParams.get('title') || '').trim();
  const keywordsParam = (searchParams.get('keywords') || '').trim();
  const contentType = (searchParams.get('contentType') || 'post') as ContentType;
  const keywords = keywordsParam ? keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) : [];

  const descriptions = generateCaptions(caption, keywords, contentType);
  return NextResponse.json({ descriptions });
}
