import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

/**
 * Background removal proxy — uses remove.bg API.
 * Set REMOVE_BG_API_KEY in .env to activate.
 * Free tier: 50 images/month at remove.bg
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'REMOVE_BG_API_KEY not set' }, { status: 400 });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();

    const form = new FormData();
    form.append('size', 'auto');

    if (imageBase64) {
      // Strip data-url prefix if present
      const b64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      form.append('image_file_b64', b64);
    } else if (imageUrl) {
      form.append('image_url', imageUrl);
    } else {
      return NextResponse.json({ error: 'imageUrl or imageBase64 required' }, { status: 400 });
    }

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `remove.bg error: ${err}` }, { status: 500 });
    }

    // remove.bg returns raw PNG bytes
    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ imageBase64: `data:image/png;base64,${b64}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
