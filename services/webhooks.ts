import connectDB from '@/lib/mongodb';
import Webhook from '@/models/Webhook';

export async function triggerWebhooks(userId: string, event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await connectDB();
    const hooks = await Webhook.find({ userId, isActive: true, events: event }).lean();
    for (const hook of hooks) {
      try {
        await fetch(hook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
        });
      } catch (_) {
        // ignore per-webhook errors
      }
    }
  } catch (_) {}
}
