import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveLastGoodCopy, getLastGoodCopy, checkRateLimit } from '../storage';
import { Journal } from '../types';

const sampleJournal: Journal = {
  slug: 'test-project',
  metadata: {
    title: 'Test Project',
    author: 'Tester',
    description: 'A test project journal',
    created_at: '20-09-2026',
  },
  entries: [
    {
      id: 'september-20',
      title: 'Initial Entry',
      rawHeading: 'September 20: Initial Entry',
      dateString: 'September 20',
      resolvedDate: '2026-09-20',
      hours: 1.5,
      content: 'Started testing',
    },
  ],
  totalHours: 1.5,
  entryCount: 1,
  createdDate: '2026-09-20',
  lastEntryDate: '2026-09-20',
};

describe('Storage & Last-Good Copy', () => {
  it('saves and retrieves the last-good copy', async () => {
    const timestamp = '2026-10-19T00:00:00.000Z';
    await saveLastGoodCopy('test-project', sampleJournal, timestamp);

    const result = await getLastGoodCopy('test-project');
    expect(result).not.toBeNull();
    expect(result?.journal.slug).toBe('test-project');
    expect(result?.journal.metadata.title).toBe('Test Project');
    expect(result?.lastSyncedAt).toBe(timestamp);
  });

  it('returns null for un-cached projects', async () => {
    const result = await getLastGoodCopy('non-existent-project');
    expect(result).toBeNull();
  });
});

describe('Rate Limiter', () => {
  it('allows the first request and enforces 10-second cooldown on consecutive requests', async () => {
    // Unique identifier to avoid collision with other tests
    const id = `test-runner-${Date.now()}`;

    const first = await checkRateLimit(id);
    expect(first.allowed).toBe(true);

    const second = await checkRateLimit(id);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
    expect(second.retryAfterSeconds).toBeLessThanOrEqual(10);
  });
});
