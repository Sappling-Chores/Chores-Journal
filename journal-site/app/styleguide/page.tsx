import fs from 'fs/promises';
import path from 'path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import JournalView, { RenderedJournalEntry } from '@/components/JournalView';
import { parseJournal } from '@/lib/parser';
import { ProjectConfig } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Markdown Kitchen Sink · Styleguide',
  description: 'Styleguide fixture verifying GitHub-flavored markdown styling.',
};

const DUMMY_CONFIG: ProjectConfig = {
  slug: 'gemote',
  repo: 'Sappling-Chores/gemote',
  branch: 'main',
  path: 'JOURNAL.md',
};

/**
 * /_styleguide (rewritten to /styleguide)
 * Development-only route that renders fixtures/markdown-kitchen-sink.md
 * allowing side-by-side comparison against GitHub in both light and dark themes.
 */
export default async function StyleguidePage() {
  // Development-only route: return 404 in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const fixturePath = path.join(
    process.cwd(),
    'fixtures',
    'markdown-kitchen-sink.md'
  );

  let rawFixture = '';
  try {
    rawFixture = await fs.readFile(fixturePath, 'utf8');
  } catch (err) {
    return (
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="error-box">
          <h2>Fixture file not found</h2>
          <p>Could not read fixture at {fixturePath}</p>
        </div>
      </div>
    );
  }

  const journal = parseJournal(rawFixture, 'styleguide');

  // Pre-render markdown entries on server
  const renderedEntries: RenderedJournalEntry[] = await Promise.all(
    journal.entries.map(async (entry) => ({
      ...entry,
      renderedContent: (
        <MarkdownRenderer content={entry.content} config={DUMMY_CONFIG} />
      ),
    }))
  );

  return (
    <>
      <JournalView
        journal={journal}
        entries={renderedEntries}
        lastSyncedAt={new Date().toISOString()}
      />
      <Footer lastSyncedAt={new Date().toISOString()} />
    </>
  );
}
