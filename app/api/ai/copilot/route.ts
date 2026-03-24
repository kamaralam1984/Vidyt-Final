export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateVideoIdeas, 
  generateScript, 
  optimizeTitle, 
  generateHashtags 
} from '@/services/ai/contentCopilot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'generate-ideas':
        result = await generateVideoIdeas(
          params.niche || 'general',
          params.platform || 'youtube',
          params.count || 5
        );
        break;

      case 'generate-script':
        result = await generateScript(
          params.topic || '',
          params.duration || 60,
          params.platform || 'youtube'
        );
        break;

      case 'optimize-title':
        result = await optimizeTitle(
          params.title || '',
          params.platform || 'youtube'
        );
        break;

      case 'generate-hashtags':
        result = await generateHashtags(
          params.title || '',
          params.description || '',
          params.platform || 'youtube'
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate-ideas, generate-script, optimize-title, generate-hashtags' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('AI Copilot error:', error);
    return NextResponse.json(
      { 
        error: 'AI Copilot request failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
