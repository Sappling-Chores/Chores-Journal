import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { getAllJournals } from '@/lib/fetcher';

export const metadata: Metadata = {
  title: 'Project Journals',
  description: 'Browse build journals for Sappling Chores open-source projects.',
};

/**
 * Format a date string (YYYY-MM-DD) for display.
 * e.g. "2026-09-20" → "Sep 20, 2026"
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

import SyncButton from '@/components/SyncButton';

/**
 * / — Project list page.
 * Fetches all configured journals and displays them as rows.
 */
export default async function IndexPage() {
  const results = await getAllJournals();

  return (
    <>
      <div className="container">
        <div className="index-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h1>Project Journals</h1>
            <SyncButton />
          </div>
          <hr className="index-hr" />
          <p className="index-intro">
            A running log of what I&apos;m building — one entry per work session, with hours, decisions, and progress notes.
          </p>

          {results.map((result) => {
            const journal = result.journal;
            const slug = journal?.slug;

            // Error state: show a message instead of a link
            if (result.error && !journal) {
              return (
                <div key={result.error} className="project-row">
                  <div className="project-row-left">
                    <span className="project-row-title" style={{ color: 'var(--text-secondary)' }}>
                      {result.isPlaceholder ? '⚠ Placeholder project' : '⚠ Error'}
                    </span>
                    <span className="project-row-date">{result.error}</span>
                  </div>
                </div>
              );
            }

            if (!journal || !slug) return null;

            return (
              <div key={slug} className="project-row">
                <div className="project-row-left">
                  <Link href={`/${slug}`} className="project-row-title">
                    {journal.metadata.title}
                  </Link>
                  <span className="project-row-date">
                    Created {formatDate(journal.createdDate)}
                  </span>
                </div>
                <div className="project-row-pills">
                  <span className="pill">
                    {journal.entryCount} {journal.entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                  <span className="pill">
                    {journal.totalHours} hrs
                  </span>
                  <span className="pill">
                    last entry {formatDate(journal.lastEntryDate)}
                  </span>
                </div>
              </div>
            );
          })}

          {results.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No projects configured yet. Add an entry to projects.config.json.
            </p>
          )}
        </div>
      </div>

      <Footer
        lastSyncedAt={
          results.find((r) => r.lastSyncedAt)?.lastSyncedAt ?? null
        }
      />
    </>
  );
}
