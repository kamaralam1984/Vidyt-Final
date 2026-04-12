export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';
import { getUserFromRequest } from '@/lib/auth-jwt';
import { getGeoFromIP, getClientIP } from '@/lib/geolocation';
import { NextResponse } from 'next/server';
import { v5 as uuidv5 } from 'uuid';
import { enqueueTrackingEvent, type NormalizedTrackingAction } from '@/lib/trackingQueue';
import { logError } from '@/lib/observability';

export async function POST(request: Request) {
  // Extract client IP once so it's available for both the happy-path and error logging.
  const ip = getClientIP(request);

  try {
    // Primary: read JWT from Authorization header.
    // Fallback: use middleware-injected x-user-* headers (set by middleware after token verification).
    let decoded = await getUserFromRequest(request);
    if (!decoded) {
      const xUserId = request.headers.get('x-user-id');
      const xUserRole = request.headers.get('x-user-role');
      const xUserSubscription = request.headers.get('x-user-subscription');
      if (xUserId) {
        decoded = {
          id: xUserId,
          email: '',
          name: '',
          role: (xUserRole as any) || 'user',
          subscription: (xUserSubscription as any) || 'free',
        };
      }
    }
    // Tracking is best-effort — silently skip unauthenticated requests instead of returning 401.
    if (!decoded) return NextResponse.json({ skipped: true }, { status: 200 });

    const body = await request.json();
    const {
      page,
      previousPage,
      timestamp,
      action = 'page',
      sessionId,
    } = body || {};

    // Timestamp comes from the client; we keep it for eventId dedupe stability.
    const now = new Date(timestamp || Date.now());
    const roundedSecond = Math.floor(now.getTime() / 1000) * 1000;

    const normalizedAction: NormalizedTrackingAction =
      action === 'login' || action === 'start'
        ? 'start'
        : action === 'logout' || action === 'end'
          ? 'end'
          : action === 'heartbeat'
            ? 'heartbeat'
            : 'page';

    // We now push tracking writes to a queue (worker does DB writes in batches).
    // To keep session/activity dedupe correct under concurrency, we still resolve
    // an existing sessionId (or generate a deterministic one) before enqueueing.

    await connectDB();

    const pagePath = page || '/';
    const sessionIdStr = sessionId ? String(sessionId) : '';

    // If client provided sessionId, prefer it.
    let resolvedSessionId = sessionIdStr;
    let existingSession: any = null;
    if (resolvedSessionId) {
      existingSession = await UserSession.findOne({ userId: decoded.id, sessionId: resolvedSessionId }).lean();
    }

    if (!existingSession) {
      // Otherwise, use active session if present.
      existingSession = await UserSession.findOne({
        userId: decoded.id,
        isActive: true,
      })
        .sort({ lastSeen: -1 })
        .lean();

      if (existingSession?.sessionId) {
        resolvedSessionId = String(existingSession.sessionId);
      } else {
        // Deterministic session bucket: same user -> same sessionId in the bucket window.
        const bucketMs = Number(process.env.TRACKING_SESSION_BUCKET_MS ?? 30 * 60 * 1000); // 30m
        const bucket = Math.floor(Date.now() / bucketMs);
        resolvedSessionId = `vb_${decoded.id}_${bucket}`;
      }
    }

    // Compute geo only when we believe the session is new (avoids IP API on every event).
    let geo: any = null;
    if (!existingSession && (normalizedAction === 'start' || normalizedAction === 'page' || normalizedAction === 'heartbeat')) {
      const geoCacheKey = `ip:${ip}`;
      const ttlMs = Number(process.env.TRACKING_GEO_CACHE_TTL_MS ?? 60 * 60 * 1000); // 1h
      const gcache = (globalThis as any).__VB_GEO_CACHE__ || ((globalThis as any).__VB_GEO_CACHE__ = new Map());
      const cached = gcache.get(geoCacheKey);
      if (cached && Date.now() - cached.at < ttlMs) {
        geo = cached.val;
      } else {
        geo = await getGeoFromIP(ip);
        gcache.set(geoCacheKey, { at: Date.now(), val: geo });
      }
    }

    // EventId: deterministic UUIDv5 from stable fields + timestamp rounded to seconds.
    // This makes retries/concurrent duplicates idempotent.
    // Must be a UUID that passes `uuid` package validation (v5 namespace). The previous
    // `...000001` value is not valid per strict RFC checks and caused "Invalid UUID" at runtime.
    const TRACKING_EVENT_NS = '00000000-0000-0000-0000-000000000000';
    const eventId = uuidv5(
      [
        decoded.id,
        resolvedSessionId,
        normalizedAction,
        pagePath,
        previousPage ? String(previousPage) : '',
        String(Math.floor(roundedSecond / 1000)), // seconds
      ].join('|'),
      TRACKING_EVENT_NS
    );

    const userAgent = request.headers.get('user-agent') || undefined;

    const job = await enqueueTrackingEvent({
      eventId,
      userId: decoded.id,
      sessionId: resolvedSessionId,
      timestamp: now.toISOString(),
      normalizedAction,
      page: pagePath,
      previousPage: previousPage ? String(previousPage) : undefined,
      ipAddress: ip,
      userAgent,
      country: geo?.country,
      state: geo?.state,
      city: geo?.city,
      district: geo?.district,
      distanceFromAdmin: geo?.distanceFromAdmin,
    });

    // Best-effort: return success even if queue is temporarily slow.
    return NextResponse.json({ success: true, sessionId: resolvedSessionId, queued: Boolean(job?.id) });
  } catch (error) {
    logError('tracking_route_failed', error, {
      ip: ip,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
