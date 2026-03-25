export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ViralPrediction, { type IViralPrediction } from '@/models/ViralPrediction';
import { getClientIP, rateLimit } from '@/lib/rateLimiter';
import { viralScoreFromEngagement, type OutcomeSource } from '@/lib/viralOutcome';

function isSuperRole(role: string | undefined): boolean {
  const r = String(role || '').toLowerCase();
  return r === 'super-admin' || r === 'superadmin';
}

/**
 * Record ground truth for a prediction (user feedback or admin).
 * POST body: { predictionId, views, likes, comments } | { predictionId, viralScore0to100 }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ip = getClientIP(req);
    const lim = rateLimit(`ai-outcome:${user.id}:${ip}`, 30, 60 * 1000);
    if (!lim.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const predictionId = String(body.predictionId || body.id || '').trim();
    if (!predictionId) {
      return NextResponse.json({ error: 'predictionId is required' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(predictionId)) {
      return NextResponse.json({ error: 'Invalid predictionId' }, { status: 400 });
    }

    await connectDB();
    // Mongoose typing here can sometimes infer a lean result as an array; normalize the type for safe access.
    type DocLean = Pick<IViralPrediction, 'userId'>;
    type DocLeanOrArray = DocLean | DocLean[] | null;
    const doc = (await ViralPrediction.findById(predictionId).lean()) as DocLeanOrArray;
    if (!doc || (Array.isArray(doc) && doc.length === 0)) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    const ownerId = Array.isArray(doc) ? String(doc[0]?.userId || '') : String(doc.userId || '');
    const canEdit = ownerId === user.id || isSuperRole(user.role);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let viralScore0to100: number;
    let views = 0;
    let likes = 0;
    let comments = 0;

    if (
      typeof body.viralScore0to100 === 'number' &&
      !Number.isNaN(body.viralScore0to100)
    ) {
      viralScore0to100 = Math.max(0, Math.min(100, body.viralScore0to100));
    } else {
      views = Math.max(0, Number(body.views || 0));
      likes = Math.max(0, Number(body.likes || 0));
      comments = Math.max(0, Number(body.comments || 0));
      viralScore0to100 = viralScoreFromEngagement(views, likes, comments);
    }

    const source: OutcomeSource = isSuperRole(user.role)
      ? 'admin'
      : 'user_submitted';

    await ViralPrediction.findByIdAndUpdate(predictionId, {
      $set: {
        outcome: {
          viralScore0to100,
          views,
          likes,
          comments,
          capturedAt: new Date(),
          source,
          notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : undefined,
        },
      },
    });

    return NextResponse.json({
      success: true,
      predictionId,
      outcome: {
        viralScore0to100,
        views,
        likes,
        comments,
        source,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to record outcome';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
