export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdminAccess } from '@/lib/adminAuth';
import AIModelVersion from '@/models/AIModelVersion';
import ViralPrediction from '@/models/ViralPrediction';
import Ticket from '@/models/Ticket';
import AIJobLog from '@/models/AIJobLog';
import { getCacheJSON, setCacheJSON } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const access = await requireAdminAccess(request);
    if (access.error) return access.error;

    await connectDB();
    const cacheKey = 'admin:super:ai-monitoring:v1';
    const cached = await getCacheJSON<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const [activeModel, totalPredictions, labeledPredictions, supportStats, queueStats, recentModels] =
      await Promise.all([
      AIModelVersion.findOne({ isActive: true }).sort({ createdAt: -1 }).lean(),
      ViralPrediction.countDocuments({}),
      ViralPrediction.countDocuments({ 'outcome.viralScore0to100': { $exists: true, $ne: null } }),
      Ticket.aggregate([
        {
          $group: {
            _id: null,
            autoReplied: { $sum: { $cond: ['$aiAutoReplied', 1, 0] } },
            escalated: { $sum: { $cond: ['$assignedToAdmin', 1, 0] } },
            avgConfidence: { $avg: '$aiConfidence' },
          },
        },
      ]),
      AIJobLog.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      AIModelVersion.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const confidenceDistribution = await Ticket.aggregate([
      {
        $bucket: {
          groupBy: '$aiConfidence',
          boundaries: [0, 0.25, 0.5, 0.75, 1.01],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const payload = {
      success: true,
      model: activeModel || null,
      totalPredictions,
      labeledPredictions,
      support: supportStats[0] || { autoReplied: 0, escalated: 0, avgConfidence: 0 },
      queue: queueStats,
      confidenceDistribution,
      recentModels,
      generatedAt: new Date().toISOString(),
    };
    await setCacheJSON(cacheKey, payload, 30);
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load monitoring data' }, { status: 500 });
  }
}
