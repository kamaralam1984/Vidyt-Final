/**
 * Socket.io server singleton + event handler initialization.
 * Import getIO() in API routes to emit events server-side.
 */
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/lib/auth-jwt';

// Global singleton so API routes can access the io instance
declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer {
  if (!global.__io) {
    throw new Error('Socket.io server not initialized. Make sure server.ts starts first.');
  }
  return global.__io;
}

export function initSocketServer(io: SocketIOServer) {
  global.__io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = await verifyToken(token);
      if (!decoded?.id) {
        return next(new Error('Unauthorized'));
      }

      (socket.data as any).userId = decoded.id;
      (socket.data as any).role = decoded.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as any).userId as string | undefined;
    const role = (socket.data as any).role as string | undefined;

    // Admins join the admin room to receive all live updates
    if (role && ['admin', 'super-admin', 'superadmin'].includes(role)) {
      socket.join('admin-room');
      console.log(`[Socket] Admin connected: ${userId} (${socket.id})`);
    } else if (userId) {
      // Regular users join their own room so the server can target them
      socket.join(`user-${userId}`);
    }

    // ── Client events ─────────────────────────────────────────────
    // page_visit: fired by useTracker on every route change
    socket.on('page_visit', (data: { userId?: string; page: string; previousPage?: string; sessionId?: string }) => {
      // Re-emit enriched event to admin room
      io.to('admin-room').emit('activity_update', {
        type: 'page_change',
        ...data,
        userId: data.userId || userId,
        ts: new Date().toISOString(),
      });
    });

    // session_ping: fired every 30s to keep session alive & update timer
    socket.on('session_ping', (data: { userId?: string; sessionId?: string }) => {
      io.to('admin-room').emit('session_update', {
        type: 'ping',
        ...data,
        userId: data.userId || userId,
        ts: new Date().toISOString(),
      });
    });

    // user_active: fired on login / tab focus
    socket.on('user_active', (data: { userId?: string; page: string }) => {
      io.to('admin-room').emit('activity_update', {
        type: 'user_online',
        ...data,
        userId: data.userId || userId,
        ts: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      if (userId) {
        io.to('admin-room').emit('activity_update', {
          type: 'user_offline',
          userId,
          ts: new Date().toISOString(),
        });
      }
    });
  });

  console.log('[Socket] Server initialized and ready');
}

// ── Server-side emit helpers (called from API routes) ───────────────────────

export function emitAdminAlert(
  type: 'new_subscription' | 'payment_failed' | 'user_spike',
  payload: Record<string, unknown>
) {
  try {
    const io = getIO();
    io.to('admin-room').emit('admin_alert', { type, ...payload, ts: new Date().toISOString() });
  } catch {
    // Socket not initialized in test environments; ignore silently
  }
}

export function emitLiveUsersUpdate(users: unknown[]) {
  try {
    const io = getIO();
    io.to('admin-room').emit('live_users_update', { users, count: users.length, ts: new Date().toISOString() });
  } catch { /* ignore */ }
}

export function emitRevenueUpdate(revenue: Record<string, unknown>) {
  try {
    const io = getIO();
    io.to('admin-room').emit('revenue_update', revenue);
  } catch { /* ignore */ }
}
