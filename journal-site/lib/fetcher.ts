import { parseJournal } from './parser';
import { Journal, JournalResult, ProjectConfig } from './types';
import projectsConfig from '../projects.config.json';

// ── Constants ──────────────────────────────────────────────────────────────

/** How long (seconds) the Next.js data-cache considers a fetch fresh. */
export const REVALIDATE_SECONDS = 300;

/**
 * The list of projects from projects.config.json.
 * Each entry defines a slug, GitHub repo, branch, and path to JOURNAL.md.
 */
export function getProjectConfigs(): ProjectConfig[] {
  return projectsConfig as ProjectConfig[];
}

/**
 * Returns the ProjectConfig for a given slug, or undefined if not found.
 */
export function getProjectConfig(slug: string): ProjectConfig | undefined {
  return getProjectConfigs().find((p) => p.slug === slug);
}

/**
 * Checks whether the repo name is still the placeholder.
 */
function isPlaceholderRepo(repo: string): boolean {
  return repo.includes('<REPO_NAME>');
}

// ── GitHub raw-content fetching ────────────────────────────────────────────

/**
 * Fetches the raw JOURNAL.md from GitHub's raw.githubusercontent.com.
 * This avoids the rate-limited GitHub API.
 *
 * @param config  - The project config (repo, branch, path).
 * @param bypassCache - When true, adds a cache-busting header (used by /api/sync).
 *
 * Returns the raw markdown string, or throws on network/HTTP errors.
 */
export async function fetchJournalRaw(
  config: ProjectConfig,
  bypassCache = false
): Promise<string> {
  // Build the URL: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
  const url = `https://raw.githubusercontent.com/${config.repo}/${config.branch}/${config.path}`;

  const fetchOptions: RequestInit = {
    next: bypassCache
      ? { revalidate: 0 }                    // force re-fetch
      : { revalidate: REVALIDATE_SECONDS, tags: [`journal-${config.slug}`] },
  };

  if (bypassCache) {
    // Add cache: 'no-store' to bypass any caching layer entirely
    fetchOptions.cache = 'no-store';
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch JOURNAL.md for "${config.slug}" (HTTP ${response.status})`
    );
  }

  return response.text();
}

// ── getJournal — primary data-fetching function ────────────────────────────

/**
 * Fetches and parses the journal for a given slug.
 *
 * Data flow (per spec section 5):
 * 1. Try GitHub (cached) → parse
 * 2. On success → return { data, source: "live" }
 * 3. On failure → return a clear error message
 *
 * Note: The full "last-good copy" fallback via Redis is added in Milestone 4.
 * For now, we fetch directly and return errors on failure.
 */
import { saveLastGoodCopy, getLastGoodCopy } from './storage';

/**
 * Fetches and parses the journal for a given slug.
 *
 * Data flow (per spec section 5):
 * 1. Try GitHub (cached with REVALIDATE_SECONDS = 300)
 * 2. Parse markdown → on success (with > 0 entries), save as last-good copy in
 *    persistent storage (Upstash Redis) with fresh lastSyncedAt, return { journal, source: "live" }
 * 3. On ANY failure (network, 404, parse error, or 0 entries from non-empty file),
 *    return the last-good copy from storage with source: "fallback" and its original lastSyncedAt.
 * 4. If there is no last-good copy either, return a clear friendly error for that project only.
 * 5. Never wipe existing content because a fetch failed.
 */
export async function getJournal(
  slug: string,
  bypassCache = false
): Promise<JournalResult> {
  const config = getProjectConfig(slug);

  if (!config) {
    return {
      source: 'live',
      error: `Unknown project slug: "${slug}". No matching entry in projects.config.json.`,
    };
  }

  if (isPlaceholderRepo(config.repo)) {
    return {
      source: 'live',
      error: `The repo for "${slug}" is still set to a placeholder (<REPO_NAME>). Update projects.config.json with the real repo name.`,
      isPlaceholder: true,
    };
  }

  try {
    const raw = await fetchJournalRaw(config, bypassCache);

    if (!raw || raw.trim().length === 0) {
      throw new Error(`JOURNAL.md for "${slug}" is empty.`);
    }

    const journal = parseJournal(raw, slug);

    // Treat zero entries from a non-empty file as a parse failure and fall back
    if (journal.entryCount === 0) {
      throw new Error(
        `JOURNAL.md for "${slug}" contained no parsable entries. Format issue.`
      );
    }

    // Success! Save fresh copy in persistent storage
    const now = new Date().toISOString();
    await saveLastGoodCopy(slug, journal, now);

    return {
      journal,
      source: 'live',
      lastSyncedAt: now,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred.';

    // Attempt to serve the last successful copy from persistent storage
    const fallback = await getLastGoodCopy(slug);
    if (fallback) {
      return {
        journal: fallback.journal,
        source: 'fallback',
        lastSyncedAt: fallback.lastSyncedAt,
      };
    }

    // No last-good copy available: return friendly error
    return {
      source: 'live',
      error: message,
    };
  }
}

// ── getAllJournals — fetch all projects (for the index page) ────────────────

/**
 * Fetches and parses all configured journals.
 * Returns an array of results (one per project config).
 */
export async function getAllJournals(): Promise<JournalResult[]> {
  const configs = getProjectConfigs();
  const results = await Promise.all(
    configs.map((config) => getJournal(config.slug))
  );
  return results;
}

// ── Image/link URL resolution ──────────────────────────────────────────────

/**
 * Resolves a relative path from JOURNAL.md against the GitHub repo.
 * - Images → raw.githubusercontent.com (for direct rendering)
 * - Other files → github.com/blob (for viewing on GitHub)
 *
 * Absolute URLs, #anchors, and mailto: are returned untouched.
 */
export function resolveGitHubUrl(
  href: string,
  config: ProjectConfig,
  isImage: boolean
): string {
  // Leave absolute URLs, anchors, and mailto: untouched
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('#') ||
    href.startsWith('mailto:')
  ) {
    return href;
  }

  // Resolve relative path against the JOURNAL.md directory
  const journalDir = config.path.includes('/')
    ? config.path.substring(0, config.path.lastIndexOf('/'))
    : '';

  const resolvedPath = journalDir
    ? `${journalDir}/${href}`
    : href;

  if (isImage) {
    // Images: raw.githubusercontent.com for direct rendering
    return `https://raw.githubusercontent.com/${config.repo}/${config.branch}/${resolvedPath}`;
  }

  // Other files: github.com/blob for viewing
  return `https://github.com/${config.repo}/blob/${config.branch}/${resolvedPath}`;
}
