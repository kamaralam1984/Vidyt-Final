export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

type ContentType = 'video' | 'short' | 'live';

function generateDescriptions(title: string, keywords: string[], category: string, contentType: ContentType = 'video'): { text: string; seoScore: number }[] {
  const t = (title || '').trim() || 'Your Video';
  const kws = keywords.length ? keywords.slice(0, 8) : ['viral', 'tips', 'youtube'];
  const cat = (category || '').trim() || 'Entertainment';
  const year = new Date().getFullYear();
  const mainKw = kws[0]?.replace(/\s+/g, '') || 'viral';
  const tagLine = kws.slice(0, 4).join(', ');

  const templates = [
    `${t}\n\nIs video me hum ${t.toLowerCase()} ke baare me detail me baat karte hain. ${tagLine} jaisi cheezen cover ki gayi hain. Agar aap ${cat} content pasand karte hain to subscribe zaroor karein.\n\nLike karein, comment me apna sawal likhein. #${mainKw} #shorts #youtube #${year}`,
    `Welcome! Aaj ki video: "${t}". Hume ${kws.slice(0, 3).join(', ')} pe focus kiya hai. Ye ${cat} category ke under hai. Channel subscribe karein aur bell dabayein.\n\n#youtube #viral #trending #${mainKw} #${year}`,
    `${t} – Is video me aap seekhenge: ${tagLine}. Sab kuch step-by-step. ${cat} lovers ke liye useful. Comment me bataen kaise laga!\n\nSubscribe for more. #shorts #viral #tips #${year}`,
    `"${t}" – Full breakdown. Keywords jo cover kiye: ${kws.join(' | ')}. ${cat} category. Like karein agar helpful laga, subscribe karein aur comment karein.\n\n#youtube #growth #${mainKw} #${year}`,
    `${t} | ${cat}\n\nYe video ${t.toLowerCase()} par based hai. Main points: ${tagLine}. End tak dekhein. Like, share, subscribe. #viral #youtube #${year} #shorts #${mainKw}`,
  ];

  return templates.map((text, i) => ({
    text,
    seoScore: Math.min(95, 68 + (i * 4) + Math.floor(Math.random() * 8)),
  }));
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || '').trim();
  const keywordsParam = (searchParams.get('keywords') || '').trim();
  const category = (searchParams.get('category') || '').trim();
  const contentType = (searchParams.get('contentType') || 'video') as ContentType;
  const keywords = keywordsParam ? keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) : [];

  const descriptions = generateDescriptions(title, keywords, category, contentType);
  return NextResponse.json({ descriptions });
}
