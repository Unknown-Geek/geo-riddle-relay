const counters = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple client-side rate limiter.
 * Returns true if the action is allowed, false if rate-limited.
 */
export function checkRateLimit(key: string, maxCalls: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = counters.get(key);

  if (!entry || now > entry.resetAt) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxCalls) {
    return false;
  }

  entry.count++;
  return true;
}
