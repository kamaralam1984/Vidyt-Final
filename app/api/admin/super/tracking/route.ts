export const dynamic = "force-dynamic";

import connectDB from '@/lib/mongodb';
import TrackingLog from '@/models/TrackingLog';
import UserSession from '@/models/UserSession';
import ActivityLog from '@/models/ActivityLog';
import ActivityTimeline from '@/models/ActivityTimeline';
import { getUserFromRequest } from '@/lib/auth-jwt';
import { getGeoFromIP, getClientIP } from '@/lib/geolocation';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { emitAdminAlert } from '@/lib/socket-server';

export async function POST(request: Request) {
  try {
    await connectDB();

    const decoded = await getUserFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      page,
      previousPage,
      timestamp,
      action = 'page',
      sessionId,
    } = body || {};
    const ip = getClientIP(request);
    const now = new Date(timestamp || Date.now());
    const normalizedAction =
      action === 'login' || action === 'start'
        ? 'start'
        : action === 'logout' || action === 'end'
          ? 'end'
          : action === 'heartbeat'
            ? 'heartbeat'
            : 'page';

    // Find active session. Prefer explicit client sessionId first to avoid duplicates.
    let session = null as any;
    if (sessionId) {
      session = await UserSession.findOne({
        userId: decoded.id,
        sessionId: String(sessionId),
      });
    }
    if (!session) {
      session = await UserSession.findOne({
        userId: decoded.id,
        isActive: true
      }).sort({ lastSeen: -1 });
    }

    if (!session && (normalizedAction === 'start' || normalizedAction === 'page' || normalizedAction === 'heartbeat')) {
      // Create a session if missing
      const geo = await getGeoFromIP(ip);
      const resolvedSessionId = String(sessionId || uuidv4());
      try {
        session = await UserSession.create({
          userId: decoded.id,
          sessionId: resolvedSessionId,
          loginTime: now,
          lastSeen: now,
          currentPage: page || '/',
          currentPageSince: now,
          ipAddress: ip,
          isActive: true,
          ...(geo && {
            country: geo.country,
            state: geo.state,
            city: geo.city,
            latitude: geo.latitude,
            longitude: geo.longitude,
            distanceFromAdmin: geo.distanceFromAdmin,
          }),
        });
      } catch (err: any) {
        // Handle race condition: same sessionId created by a parallel tracking request.
        if (err?.code === 11000 && resolvedSessionId) {
          session = await UserSession.findOne({ userId: decoded.id, sessionId: resolvedSessionId });
        } else {
          throw err;
        }
      }
    }

    if (session) {
      const nextPage = page || session.currentPage;
      const didPageChange = !!nextPage && nextPage !== session.currentPage;
      session.lastSeen = now;
      session.currentPage = nextPage;
      if (didPageChange) {
        session.currentPageSince = now;
      }
      if (normalizedAction === 'end') {
        session.isActive = false;
        session.logoutTime = now;
        session.durationSeconds = Math.round((now.getTime() - new Date(session.loginTime).getTime()) / 1000);
      }
      await session.save();
    }

    const activeSessionId = session?.sessionId || sessionId || 'unknown';

    // Log to TrackingLog
    await TrackingLog.create({
      userId: decoded.id,
      sessionId: activeSessionId,
      page: page || '/',
      ipAddress: ip,
      timestamp: now,
      country: session?.country,
      city: session?.city,
    });

    // Record to ActivityTimeline (richer per-user history)
    await ActivityTimeline.create({
      userId: decoded.id,
      sessionId: activeSessionId,
      action: normalizedAction === 'start' ? 'session_start' : normalizedAction === 'end' ? 'session_end' : 'page_visit',
      page: page || '/',
      previousPage: previousPage || undefined,
      timestamp: now,
    });

    // Legacy ActivityLog for compatibility
    await ActivityLog.create({
      userId: decoded.id,
      sessionId: activeSessionId,
      page: page || '/',
      ipAddress: ip,
      timestamp: now,
    }).catch(() => {});

    // Emit real-time event to admin room via Socket.io
    try {
      const { emitLiveUsersUpdate } = await import('@/lib/socket-server');
      // Lightweight ping — the admin live page will re-query the DB on receipt
      emitLiveUsersUpdate([]);
    } catch { /* socket not running in dev without server.ts */ }

    return NextResponse.json({ success: true, sessionId: activeSessionId });
  } catch (error) {
    console.error('[Tracking Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
