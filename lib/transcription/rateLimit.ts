// Simple token bucket / sliding window rate limiter
const rateLimits = new Map<string, number[]>();

export const MAX_REQUESTS_PER_MINUTE = 5;

/**
 * Checks if the identifier (IP or User ID) has exceeded the rate limit.
 * @param identifier The unique key representing the user/IP
 * @returns boolean `true` if they are explicitly rate limited and should be denied.
 */
export function isRateLimited(identifier: string): boolean {
  if (!identifier) return false;

  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Cleanup old stamps
  let stamps = rateLimits.get(identifier) || [];
  stamps = stamps.filter(t => t > oneMinuteAgo);

  if (stamps.length >= MAX_REQUESTS_PER_MINUTE) {
    rateLimits.set(identifier, stamps);
    return true;
  }

  // Record this attempt
  stamps.push(now);
  rateLimits.set(identifier, stamps);
  
  return false;
}
