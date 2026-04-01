/**
 * Rate Limiting Middleware for API Routes
 * Applies rate limiting, bot detection, and abuse tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  RATE_LIMITS,
  getClientIP,
  getUserAgent,
  isIPBlocked,
  detectBotBehavior,
  trackFailure,
  recordSuspiciousActivity,
} from '@/lib/rateLimiter';
import { AbuseLog } from '@/models/AbuseLog';
import dbConnect from '@/lib/mongodb';

export interface RateLimitMiddlewareOptions {
  endpoint: string;
  limit?: number;
  windowMs?: number;
  preset?: keyof typeof RATE_LIMITS;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  checkBot?: boolean;
  blockSuspicious?: boolean;
  logAbuse?: boolean;
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  options: RateLimitMiddlewareOptions
): Promise<{ allowed: boolean; response?: NextResponse; retryAfter?: number }> {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  const endpoint = options.endpoint;

  // Check if IP is blocked
  if (isIPBlocked(ip)) {
    logAbuseEvent(
      {
        ipAddress: ip,
        endpoint,
        method: request.method as any,
        violationType: 'blocked_ip',
        severity: 'high',
        description: `Request from blocked IP: ${ip}`,
        userAgent: userAgent || undefined,
      },
      options.logAbuse !== false
    );

    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Access denied. IP is blocked.' },
        { status: 403 }
      ),
    };
  }

  // Get rate limit config
  let limiter = options.preset ? RATE_LIMITS[options.preset] : null;
  if (!limiter) {
    limiter = {
      limit: options.limit || RATE_LIMITS.api.limit,
      windowMs: options.windowMs || RATE_LIMITS.api.windowMs,
    };
  }

  // Apply rate limit with dual keys (IP + endpoint, userId if available)
  const identifiers = [
    `rl:${ip}:${endpoint}`,
    `rl:${ip}:general`,
  ];

  for (const identifier of identifiers) {
    const result = rateLimit(identifier, limiter);

    if (!result.allowed) {
      logAbuseEvent(
        {
          ipAddress: ip,
          endpoint,
          method: request.method as any,
          violationType: 'rate_limit_exceeded',
          severity: 'medium',
          description: `Rate limit exceeded: ${limiter.limit} requests per ${limiter.windowMs / 1000}s`,
          userAgent: userAgent || undefined,
        },
        options.logAbuse !== false
      );

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.retryAfter || 60),
            },
          }
        ),
        retryAfter: result.retryAfter,
      };
    }
  }

  // Bot detection
  if (options.checkBot !== false) {
    const botDetection = detectBotBehavior(ip, userAgent, endpoint);

    if (botDetection.isBot) {
      recordSuspiciousActivity(ip, `bot_detected:${endpoint}`, 'high');

      logAbuseEvent(
        {
          ipAddress: ip,
          endpoint,
          method: request.method as any,
          violationType: 'bot_detected',
          severity: 'high',
          description: `Bot-like behavior detected`,
          botScore: botDetection.score,
          botReasons: botDetection.reasons,
          userAgent: userAgent || undefined,
        },
        options.logAbuse !== false
      );

      if (options.blockSuspicious !== false) {
        return {
          allowed: false,
          response: NextResponse.json(
            { error: 'Suspicious activity detected.' },
            { status: 403 }
          ),
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Log abuse event to database
 */
async function logAbuseEvent(
  event: {
    ipAddress: string;
    endpoint: string;
    method: string;
    violationType: string;
    severity: string;
    description: string;
    botScore?: number;
    botReasons?: string[];
    userAgent?: string;
  },
  shouldLog: boolean = true
) {
  if (!shouldLog) return;

  try {
    await dbConnect();
    await AbuseLog.create(event);
  } catch (error) {
    console.error('Failed to log abuse event:', error);
  }
}

/**
 * Create a wrapped route handler with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitMiddlewareOptions
) {
  return async (req: NextRequest) => {
    const rateLimitCheck = await applyRateLimit(req, options);

    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response;
    }

    try {
      return await handler(req);
    } catch (error) {
      const ip = getClientIP(req);
      trackFailure(ip);
      throw error;
    }
  };
}

/**
 * Middleware for verifying admin access and logging administrative actions
 */
export function withAdminRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<RateLimitMiddlewareOptions> = {}
) {
  return withRateLimit(handler, {
    endpoint: options.endpoint || '/api/admin',
    preset: 'admin',
    ...options,
  });
}

/**
 * Middleware for auth endpoints (stricter limits)
 */
export function withAuthRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<RateLimitMiddlewareOptions> = {}
) {
  return withRateLimit(handler, {
    endpoint: options.endpoint || '/api/auth',
    preset: 'login',
    checkBot: true,
    blockSuspicious: true,
    ...options,
  });
}

/**
 * Middleware for upload endpoints
 */
export function withUploadRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<RateLimitMiddlewareOptions> = {}
) {
  return withRateLimit(handler, {
    endpoint: options.endpoint || '/api/user/upload',
    preset: 'upload',
    checkBot: true,
    ...options,
  });
}

/**
 * Middleware for AI analysis endpoints
 */
export function withAnalysisRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<RateLimitMiddlewareOptions> = {}
) {
  return withRateLimit(handler, {
    endpoint: options.endpoint || '/api/ai',
    preset: 'analysis',
    checkBot: true,
    ...options,
  });
}

/**
 * Comprehensive abuse check
 */
export async function checkAbuse(
  ip: string,
  userId?: string
): Promise<{ isAbuse: boolean; severity?: string; message?: string }> {
  try {
    await dbConnect();

    // Check if IP is high-risk
    const isHighRisk = await AbuseLog.isHighRisk(ip, userId);

    if (isHighRisk) {
      return {
        isAbuse: true,
        severity: 'high',
        message: 'Your IP has recent suspicious activity. Please try again later.',
      };
    }

    // Check recent abuse count
    const recentAbuse = await AbuseLog.countDocuments({
      $or: [{ ipAddress: ip }, ...(userId ? [{ userId }] : [])],
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    });

    if (recentAbuse > 20) {
      return {
        isAbuse: true,
        severity: 'medium',
        message: 'Too many requests. Please try again later.',
      };
    }

    return { isAbuse: false };
  } catch (error) {
    console.error('Error checking abuse:', error);
    return { isAbuse: false }; // Fail open
  }
}
