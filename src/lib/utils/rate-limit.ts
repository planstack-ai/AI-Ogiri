const rateMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export function checkRateLimit(
  key: string,
  { max, windowMs }: RateLimitOptions
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: max - entry.count };
}
