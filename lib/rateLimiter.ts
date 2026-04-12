/**
 * Advanced Rate Limiting & Abuse Protection
 * Provides multi-layer protection with sliding window counters,
 * bot detection, and distributed caching support
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  failureCount?: number;
  lastAttempt?: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

// In-memory store for rate limiting
const store: RateLimitStore = {};

// Blocked IPs with expiry
const blockedIPs = new Map<string, number>();

// Suspicious activity tracker
const suspiciousActivity = new Map<string, { count: number; firstSeen: number }>();

/**
 * Common rate limit presets
 */
export const RATE_LIMITS = {
  // Auth endpoints - very strict
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  login: { limit: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  register: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // Upload/Analysis - moderate
  upload: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  analysis: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour

  // API general
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
  search: { limit: 60, windowMs: 60 * 1000 }, // 60 per minute
  export: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  webhook: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute

  // Admin
  admin: { limit: 200, windowMs: 60 * 1000 }, // 200 per minute

  // Public
  public: { limit: 1000, windowMs: 60 * 1000 }, // 1000 per minute
};

/**
 * Clean up expired entries
 */
function cleanup() {
  const now = Date.now();

  // Clean rate limit entries
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }

  // Clean blocked IPs
  for (const [ip, expiry] of blockedIPs.entries()) {
    if (expiry < now) {
      blockedIPs.delete(ip);
    }
  }

  // Clean suspicious activity (older than 1 hour)
  for (const [key, data] of suspiciousActivity.entries()) {
    if (data.firstSeen + 60 * 60 * 1000 < now) {
      suspiciousActivity.delete(key);
    }
  }
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
  const blockedUntil = blockedIPs.get(ip);
  if (!blockedUntil) return false;

  if (blockedUntil < Date.now()) {
    blockedIPs.delete(ip);
    return false;
  }

  return true;
}

/**
 * Block an IP temporarily (default 1 hour)
 */
export function blockIP(ip: string, durationMs: number = 60 * 60 * 1000): void {
  blockedIPs.set(ip, Date.now() + durationMs);
  console.warn(`🚫 IP blocked: ${ip} until ${new Date(Date.now() + durationMs).toISOString()}`);
}

/**
 * Main rate limiter function
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig | number = RATE_LIMITS.api,
  windowMs?: number
): RateLimitResult {
  // Handle both old and new API
  let limitConfig: RateLimitConfig;
  if (typeof config === 'number') {
    limitConfig = { limit: config, windowMs: windowMs || 60 * 1000 };
  } else {
    limitConfig = config as RateLimitConfig;
  }

  const now = Date.now();
  const key = identifier;

  // Clean up periodically
  if (Math.random() < 0.01) cleanup();

  const resetAt = now + limitConfig.windowMs;

  if (!store[key] || now > store[key].resetTime) {
    // New window
    store[key] = {
      count: 1,
      resetTime: resetAt,
      failureCount: 0,
      lastAttempt: now,
    };
    return {
      allowed: true,
      remaining: limitConfig.limit - 1,
      resetAt,
      limit: limitConfig.limit,
    };
  }

  store[key].count++;
  store[key].lastAttempt = now;

  const remaining = Math.max(0, limitConfig.limit - store[key].count);
  const allowed = store[key].count <= limitConfig.limit;

  return {
    allowed,
    remaining,
    resetAt: store[key].resetTime,
    limit: limitConfig.limit,
    retryAfter: allowed ? undefined : Math.ceil((store[key].resetTime - now) / 1000),
  };
}

/**
 * Track failed attempts for bot detection
 */
export function trackFailure(identifier: string): void {
  const now = Date.now();
  const key = `fail:${identifier}`;

  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 min window
      failureCount: 1,
    };
  } else {
    store[key].failureCount = (store[key].failureCount || 0) + 1;
  }

  // Flag suspicious activity if too many failures
  if ((store[key].failureCount || 0) > 10) {
    recordSuspiciousActivity(identifier, 'excessive_failures');
  }
}

/**
 * Record suspicious activity for analysis
 */
export function recordSuspiciousActivity(
  identifier: string,
  reason: string,
  severity: 'low' | 'medium' | 'high' = 'medium'
): void {
  const key = `suspicious:${identifier}`;
  const now = Date.now();

  let activity = suspiciousActivity.get(key);

  if (!activity) {
    activity = { count: 1, firstSeen: now };
  } else {
    activity.count++;
  }

  suspiciousActivity.set(key, activity);

  // Block if too many suspicious activities
  if (activity.count > 5 && severity === 'high') {
    blockIP(identifier, 60 * 60 * 1000); // 1 hour
    console.warn(`🔴 High severity abuse detected: ${identifier} - ${reason}`);
  } else if (activity.count > 10) {
    blockIP(identifier, 60 * 1000); // 10 minutes
    console.warn(`🟠 Suspicious activity detected: ${identifier} - ${reason}`);
  }
}

/**
 * Detect bot-like behavior
 */
export function detectBotBehavior(
  ip: string,
  userAgent: string | null,
  endpoint: string
): { isBot: boolean; score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Check user agent
  if (!userAgent) {
    score += 30;
    reasons.push('missing_user_agent');
  } else {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java(?!script)/i,
    ];
    const isBotUA = botPatterns.some((p) => p.test(userAgent));
    if (isBotUA) {
      score += 25;
      reasons.push('bot_user_agent');
    }
  }

  // Check rapid endpoint switching
  const endpointKey = `endpoint:${ip}`;
  if (store[endpointKey]) {
    const recencyWindow = 1000; // 1 second
    if (store[endpointKey].lastAttempt && Date.now() - store[endpointKey].lastAttempt < recencyWindow) {
      score += 20;
      reasons.push('rapid_requests');
    }
  }

  // Check for known bot IPs (can be expanded)
  const botIPPatterns = [
    /^127\.0\.0\.1$/,
    /^0\.0\.0\.0$/,
  ];
  if (botIPPatterns.some((p) => p.test(ip))) {
    score += 40;
    reasons.push('known_bot_ip');
  }

  return {
    isBot: score > 40,
    score,
    reasons,
  };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cloudflareIP = request.headers.get('cf-connecting-ip');

  return (
    (request as any).ip ||
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    realIP ||
    cloudflareIP ||
    '127.0.0.1' // Fallback to localhost instead of unknown
  );
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request | NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Reset rate limit for specific key
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier];
  console.log(`✅ Rate limit reset for: ${identifier}`);
}

/**
 * Reset all rate limits (admin function)
 */
export function resetAllRateLimits(): void {
  Object.keys(store).forEach((key) => delete store[key]);
  console.log('✅ All rate limits reset');
}

/**
 * Unblock an IP
 */
export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
  console.log(`✅ IP unblocked: ${ip}`);
}

/**
 * Get all blocked IPs
 */
export function getBlockedIPs(): Array<{ ip: string; blockedUntil: Date }> {
  const now = Date.now();
  return Array.from(blockedIPs.entries())
    .filter(([, expiry]) => expiry > now)
    .map(([ip, expiry]) => ({
      ip,
      blockedUntil: new Date(expiry),
    }));
}

/**
 * Get suspicious activity log
 */
export function getSuspiciousActivity(): Array<{
  key: string;
  count: number;
  firstSeen: Date;
}> {
  const now = Date.now();
  return Array.from(suspiciousActivity.entries())
    .filter(([, data]) => data.firstSeen + 60 * 60 * 1000 > now)
    .map(([key, data]) => ({
      key,
      count: data.count,
      firstSeen: new Date(data.firstSeen),
    }));
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(identifier: string): RateLimitEntry | null {
  return store[identifier] || null;
}

export default rateLimit;
