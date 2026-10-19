'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Journal, JournalEntry } from '@/lib/types';
import SyncButton from './SyncButton';

export interface RenderedJournalEntry extends JournalEntry {
  renderedContent: React.ReactNode;
}

interface JournalViewProps {
  journal: Journal;
  entries: RenderedJournalEntry[];
  lastSyncedAt?: string | null;
  isStale?: boolean;
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function JournalView({
  journal,
  entries,
  lastSyncedAt,
  isStale = false,
}: JournalViewProps) {
  // Sort order state: default 'newest'
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Sorted entries according to current toggle
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.resolvedDate && b.resolvedDate) {
        const cmp = a.resolvedDate.localeCompare(b.resolvedDate);
        return sortOrder === 'newest' ? -cmp : cmp;
      }
      return 0;
    });
  }, [entries, sortOrder]);

  const meta = journal.metadata;

  return (
    <div className="journal-layout">
      {/* ── Sticky Table of Contents (desktop >1100px) ─────────────── */}
      {sortedEntries.length > 0 && (
        <aside className="toc-sidebar" aria-label="Table of contents">
          <h3>Entries</h3>
          <ol>
            {sortedEntries.map((entry) => (
              <li key={entry.id}>
                <a href={`#${entry.id}`}>
                  {entry.dateString ?? entry.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>
      )}

      {/* ── Main Article Card ───────────────────────────────────────── */}
      <article className="post-card">
        {/* Top navigation */}
        <div className="nav-top">
          <Link href="/" className="back-link">
            ← Back to Journals
          </Link>
        </div>

        {/* Eyebrow */}
        <p className="eyebrow">SAPPLING JOURNALS</p>

        {/* Fallback notice if serving cached copy */}
        {isStale && (
          <div className="notice-fallback">
            <span className="status-dot stale" />
            Showing last synced data — live fetch failed.
          </div>
        )}

        {/* Project Title */}
        <h1 className="post-title">{meta.title}</h1>

        {/* Meta row */}
        <div className="post-meta">
          <span>Created {formatDate(journal.createdDate)}</span>
          <span className="pill">
            {journal.entryCount} {journal.entryCount === 1 ? 'entry' : 'entries'}
          </span>
          <span className="pill">{journal.totalHours} hrs</span>
          {meta.author && <span className="pill">by {meta.author}</span>}
        </div>

        {/* Description in blog's note style */}
        {meta.description && (
          <p className="post-description">{meta.description}</p>
        )}

        {/* Controls row: Newest/Oldest toggle + Owner Sync button */}
        <div className="controls-row">
          <div className="sort-toggle" role="group" aria-label="Sort order">
            <button
              type="button"
              aria-pressed={sortOrder === 'newest'}
              onClick={() => setSortOrder('newest')}
            >
              Newest first
            </button>
            <button
              type="button"
              aria-pressed={sortOrder === 'oldest'}
              onClick={() => setSortOrder('oldest')}
            >
              Oldest first
            </button>
          </div>
          <SyncButton slug={journal.slug} />
        </div>

        {/* Collapsible TOC dropdown for mobile/narrow screens (<1100px) */}
        {sortedEntries.length > 0 && (
          <details className="toc-dropdown">
            <summary>
              <span>▾</span> Entries ({sortedEntries.length})
            </summary>
            <ol>
              {sortedEntries.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`}>
                    {entry.dateString ?? entry.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* ── Entry sections ─────────────────────────────────────────── */}
        {sortedEntries.map((entry) => (
          <section key={entry.id} className="journal-entry" id={entry.id}>
            <div className="entry-header">
              <h2 className="entry-title">
                {entry.title}
                <a
                  href={`#${entry.id}`}
                  className="entry-anchor-link"
                  aria-label={`Link to ${entry.title}`}
                  title="Copy link to this entry"
                >
                  #
                </a>
              </h2>
              {entry.dateString && (
                <span className="entry-date">
                  {entry.dateString}
                  {entry.resolvedDate &&
                    `, ${new Date(entry.resolvedDate + 'T00:00:00Z').getFullYear()}`}
                </span>
              )}
              {entry.hours !== undefined && (
                <span className="pill">{entry.hours} hrs</span>
              )}
            </div>

            {/* Rendered Markdown Body */}
            {entry.renderedContent}
          </section>
        ))}

        {sortedEntries.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', padding: '2rem 0' }}>
            No journal entries recorded for this project yet.
          </p>
        )}
      </article>
    </div>
  );
}
