/**
 * Rate Limiting for API Protection
 */

import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limiter middleware
 */
export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;

  if (!store[key] || now > store[key].resetTime) {
    // Reset or create new window
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: store[key].resetTime,
    };
  }

  store[key].count++;

  if (store[key].count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: store[key].resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - store[key].count,
    resetAt: store[key].resetTime,
  };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}
