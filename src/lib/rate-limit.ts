import "server-only";

/**
 * Rate limiting com Redis (quando REDIS_URL está configurado) e fallback em memória.
 * O fallback serve apenas para instâncias únicas; em produção com vários processos, usar Redis.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

type RedisClient = {
  multi: () => {
    zremrangebyscore: (key: string, min: number, max: number) => void;
    zcard: (key: string) => void;
    zadd: (key: string, score: number, member: string) => void;
    expire: (key: string, seconds: number) => void;
    exec: () => Promise<Array<[Error | null, unknown]> | null>;
  };
  quit: () => Promise<unknown>;
};

let redis: RedisClient | null = null;
let redisAttempted = false;

async function getRedis(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return null;
  if (redisAttempted) return redis;
  redisAttempted = true;
  try {
    const { Redis } = await import("ioredis");
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    }) as unknown as RedisClient;
    return redis;
  } catch {
    return null;
  }
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const client = await getRedis();
  if (client) {
    try {
      const now = Date.now();
      const member = `${now}-${Math.random().toString(36).slice(2)}`;
      const tx = client.multi();
      tx.zremrangebyscore(key, 0, now - windowMs);
      tx.zcard(key);
      tx.zadd(key, now, member);
      tx.expire(key, Math.ceil(windowMs / 1000));
      const results = await tx.exec();
      const count = Number(results?.[1]?.[1] ?? 0);
      return count < limit;
    } catch {
      // Se o Redis falhar, usa o fallback em memória.
    }
  }

  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientKey(prefix: string, headers?: Headers): string {
  let ip = "local";
  if (headers) {
    ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      "local";
  }
  return `${prefix}:${ip}`;
}

if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  timer.unref?.();
}
