export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ContentInteraction from '@/models/ContentInteraction';

/**
 * POST /api/learn/feedback
 * Submit real performance data for content that was published.
 * This closes the learning loop by labeling interactions with outcomes.
 *
 * Body: { sessionId, views, ctr, retention, engagement, viralLabel }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { sessionId, views, ctr, retention, engagement, viralLabel } = body;

    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    await connectDB();

    const update: Record<string, unknown> = {};
    if (typeof views === 'number') update.performanceViews = views;
    if (typeof ctr === 'number') update.performanceCTR = ctr;
    if (typeof retention === 'number') update.performanceRetention = retention;
    if (typeof engagement === 'number') update.performanceEngagement = engagement;
    if (viralLabel === 0 || viralLabel === 1) update.viralLabel = viralLabel;

    const result = await ContentInteraction.updateMany(
      { userId: user.id, sessionId },
      { $set: update }
    );

    return NextResponse.json({ ok: true, updated: result.modifiedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Feedback failed' }, { status: 500 });
  }
}

/**
 * GET /api/learn/feedback?stats=1
 * Returns aggregated learning statistics for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [totalInteractions, hookCopies, titleCopies, kwCopies, feedbackCount] = await Promise.all([
      ContentInteraction.countDocuments({ userId: user.id, createdAt: { $gte: since } }),
      ContentInteraction.countDocuments({ userId: user.id, interactionType: 'hook_copy', createdAt: { $gte: since } }),
      ContentInteraction.countDocuments({ userId: user.id, interactionType: 'title_copy', createdAt: { $gte: since } }),
      ContentInteraction.countDocuments({ userId: user.id, interactionType: 'keyword_copy', createdAt: { $gte: since } }),
      ContentInteraction.countDocuments({ userId: user.id, viralLabel: { $exists: true }, createdAt: { $gte: since } }),
    ]);

    // Top platforms
    const platformCounts = await ContentInteraction.aggregate([
      { $match: { userId: user.id, createdAt: { $gte: since } } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    // Top hook styles
    const hookStyles = await ContentInteraction.aggregate([
      { $match: { userId: user.id, interactionType: 'hook_copy', hookStyle: { $exists: true }, createdAt: { $gte: since } } },
      { $group: { _id: '$hookStyle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const learningLevel =
      totalInteractions >= 50 ? 'Expert'
        : totalInteractions >= 20 ? 'Intermediate'
        : totalInteractions >= 5 ? 'Beginner'
        : 'New';

    return NextResponse.json({
      stats: {
        totalInteractions,
        hookCopies,
        titleCopies,
        keywordCopies: kwCopies,
        feedbackSessions: feedbackCount,
        topPlatforms: platformCounts.map(p => ({ platform: p._id, count: p.count })),
        topHookStyles: hookStyles.map(h => ({ style: h._id, count: h.count })),
        learningLevel,
        modelConfidence: Math.min(95, 40 + Math.round(totalInteractions * 1.5)) + '%',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Stats failed' }, { status: 500 });
  }
}
