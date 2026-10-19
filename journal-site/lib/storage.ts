import { Redis } from '@upstash/redis';
import { Journal } from './types';

// In-memory fallback cache for local development when Redis credentials are not configured
const memoryStore = new Map<string, { journal: Journal; lastSyncedAt: string }>();
let memoryLastSyncTimestamp = 0;

/**
 * Returns an Upstash Redis client instance if credentials exist in the environment,
 * or null if not configured (e.g. during offline local development).
 */
export function getRedisClient(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Saves a successful copy of the parsed journal and its sync timestamp
 * into persistent storage (Upstash Redis) and in-memory cache.
 */
export async function saveLastGoodCopy(
  slug: string,
  journal: Journal,
  lastSyncedAt: string = new Date().toISOString()
): Promise<void> {
  // Always update in-memory cache
  memoryStore.set(slug, { journal, lastSyncedAt });

  const redis = getRedisClient();
  if (redis) {
    try {
      await Promise.all([
        redis.set(`journal:data:${slug}`, JSON.stringify(journal)),
        redis.set(`journal:synced:${slug}`, lastSyncedAt),
      ]);
    } catch (err) {
      console.warn(`[storage] Failed to write to Redis for ${slug}:`, err);
    }
  }
}

/**
 * Retrieves the last successful copy of a parsed journal and its sync timestamp
 * from persistent storage (Upstash Redis) or in-memory fallback.
 */
export async function getLastGoodCopy(
  slug: string
): Promise<{ journal: Journal; lastSyncedAt: string } | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const [rawJournal, lastSyncedAt] = await Promise.all([
        redis.get<string | object>(`journal:data:${slug}`),
        redis.get<string>(`journal:synced:${slug}`),
      ]);

      if (rawJournal) {
        const parsed: Journal =
          typeof rawJournal === 'string'
            ? JSON.parse(rawJournal)
            : (rawJournal as Journal);

        const synced = lastSyncedAt || new Date().toISOString();
        // Update in-memory cache as well
        memoryStore.set(slug, { journal: parsed, lastSyncedAt: synced });
        return { journal: parsed, lastSyncedAt: synced };
      }
    } catch (err) {
      console.warn(`[storage] Failed to read from Redis for ${slug}:`, err);
    }
  }

  // Fallback to in-memory store
  return memoryStore.get(slug) || null;
}

/**
 * Checks and updates rate limit for /api/sync (1 request per 10 seconds).
 * Stores the counter / TTL in Redis (or in-memory if Redis not configured).
 */
export async function checkRateLimit(
  identifier: string = 'global'
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const RATE_LIMIT_SECONDS = 10;
  const redis = getRedisClient();

  if (redis) {
    const key = `ratelimit:sync:${identifier}`;
    try {
      // Use set with NX (set only if Not eXists) and EX (expire seconds)
      const acquired = await redis.set(key, '1', {
        nx: true,
        ex: RATE_LIMIT_SECONDS,
      });

      if (!acquired) {
        const ttl = await redis.ttl(key);
        return {
          allowed: false,
          retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_SECONDS,
        };
      }

      return { allowed: true, retryAfterSeconds: 0 };
    } catch (err) {
      console.warn('[storage] Rate limit check failed on Redis:', err);
    }
  }

  // In-memory rate limiting fallback
  const now = Date.now();
  const elapsed = (now - memoryLastSyncTimestamp) / 1000;
  if (elapsed < RATE_LIMIT_SECONDS) {
    const remaining = Math.ceil(RATE_LIMIT_SECONDS - elapsed);
    return { allowed: false, retryAfterSeconds: remaining };
  }

  memoryLastSyncTimestamp = now;
  return { allowed: true, retryAfterSeconds: 0 };
}
