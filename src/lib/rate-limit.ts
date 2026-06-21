const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    const { prisma } = await import("@/lib/prisma");
    const existing = await prisma.rateLimitBucket.findUnique({
      where: { bucketKey: key },
    });

    if (!existing || existing.resetAt.getTime() <= now) {
      await prisma.rateLimitBucket.upsert({
        where: { bucketKey: key },
        create: { bucketKey: key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { ok: true };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        retryAfterSec: Math.ceil((existing.resetAt.getTime() - now) / 1000),
      };
    }

    await prisma.rateLimitBucket.update({
      where: { bucketKey: key },
      data: { count: existing.count + 1 },
    });
    return { ok: true };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}
