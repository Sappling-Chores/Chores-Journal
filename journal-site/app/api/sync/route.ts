import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getJournal, getProjectConfigs, getProjectConfig } from '@/lib/fetcher';
import { checkRateLimit } from '@/lib/storage';

/**
 * Constant-time string comparison to prevent timing attacks.
 * Never logs the token.
 */
function timingSafeTokenCompare(candidate: string, secret: string): boolean {
  const bufA = Buffer.from(candidate, 'utf8');
  const bufB = Buffer.from(secret, 'utf8');

  if (bufA.length !== bufB.length) {
    // Dummy check with equal buffers to mitigate timing leak on string length
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/sync
 * Owner-only endpoint to re-fetch journals bypassing cache.
 * Requires: Authorization: Bearer <SYNC_TOKEN>
 * Rate limit: 1 request per 10 seconds.
 */
export async function POST(req: NextRequest) {
  // 1. Authenticate owner token
  const authHeader = req.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());

  const syncSecret = process.env.SYNC_TOKEN;
  if (!syncSecret || !match) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing authentication token.' },
      { status: 401 }
    );
  }

  const token = match[1];
  if (!timingSafeTokenCompare(token, syncSecret)) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid token.' },
      { status: 401 }
    );
  }

  // 2. Check rate limit (1 request per 10 seconds)
  const rateLimit = await checkRateLimit('sync-api');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds}s before syncing again.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  // 3. Parse optional target slug from request body
  let targetSlug: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.slug === 'string' && body.slug.trim()) {
      targetSlug = body.slug.trim();
    }
  } catch {
    // Empty body is acceptable
  }

  const now = new Date().toISOString();

  // 4. Perform Sync
  if (targetSlug) {
    // Sync specific project (from project page)
    const config = getProjectConfig(targetSlug);
    if (!config) {
      return NextResponse.json(
        { error: `Project slug "${targetSlug}" not found in projects.config.json.` },
        { status: 404 }
      );
    }

    const result = await getJournal(targetSlug, true); // bypassCache = true

    if (result.error && !result.journal) {
      return NextResponse.json(
        {
          error: `Sync failed for ${targetSlug}: ${result.error}`,
          lastSyncedAt: result.lastSyncedAt || now,
        },
        { status: 502 }
      );
    }

    // Revalidate Next.js cache tags and paths
    try {
      revalidateTag(`journal-${targetSlug}`, 'max-age=0' as any);
      revalidatePath(`/${targetSlug}`);
      revalidatePath('/');
    } catch (err) {
      console.warn('[sync] Revalidation notice:', err);
    }

    return NextResponse.json({
      success: true,
      lastSyncedAt: result.lastSyncedAt || now,
      synced: [targetSlug],
      failed: [],
    });
  } else {
    // Sync all configured projects (from index page)
    const configs = getProjectConfigs();
    const synced: string[] = [];
    const failed: { slug: string; reason: string }[] = [];

    await Promise.all(
      configs.map(async (cfg) => {
        try {
          const res = await getJournal(cfg.slug, true); // bypassCache = true
          if (res.error && !res.journal) {
            failed.push({ slug: cfg.slug, reason: res.error });
          } else {
            synced.push(cfg.slug);
            try {
              revalidateTag(`journal-${cfg.slug}`, 'max-age=0' as any);
              revalidatePath(`/${cfg.slug}`);
            } catch {}
          }
        } catch (err) {
          failed.push({
            slug: cfg.slug,
            reason: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      })
    );

    try {
      revalidatePath('/');
    } catch {}

    if (synced.length === 0 && failed.length > 0) {
      return NextResponse.json(
        {
          error: `All projects failed to sync: ${failed.map((f) => `${f.slug} (${f.reason})`).join(', ')}`,
          synced,
          failed,
          lastSyncedAt: now,
        },
        { status: 502 }
      );
    }

    const message =
      failed.length > 0
        ? `Synced ${synced.join(', ')}. Failed: ${failed.map((f) => `${f.slug} (${f.reason})`).join(', ')}`
        : undefined;

    return NextResponse.json({
      success: true,
      lastSyncedAt: now,
      synced,
      failed,
      message,
    });
  }
}
