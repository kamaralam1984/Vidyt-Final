'use client';

/**
 * Singleton Socket.io client hook.
 * Provides one socket instance per browser session, authenticated with the user's JWT.
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthHeaders } from '@/utils/auth';

let socketInstance: Socket | null = null;

function getToken(): string {
  try {
    // getAuthHeaders returns { Authorization: 'Bearer <token>' }
    const headers = getAuthHeaders();
    return (headers.Authorization as string)?.replace('Bearer ', '') || '';
  } catch {
    return '';
  }
}

function getUserPayload(token: string): { id?: string; role?: string } {
  if (!token) return {};
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id || payload.sub, role: payload.role };
  } catch {
    return {};
  }
}

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socketInstance || !socketInstance.connected) {
    const token = getToken();
    if (!token) return null;

    const { id: userId, role } = getUserPayload(token);

    socketInstance = io({
      path: '/api/socket',
      auth: { token, userId, role },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });
  }

  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    return () => {
      // Don't disconnect on unmount — keep the singleton alive
    };
  }, []);

  return socketRef.current;
}
