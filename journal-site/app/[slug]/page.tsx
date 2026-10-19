import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import { getJournal, getProjectConfig, getProjectConfigs } from '@/lib/fetcher';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import JournalView, { RenderedJournalEntry } from '@/components/JournalView';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getProjectConfigs().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getJournal(slug);
  const title = result.journal?.metadata.title ?? slug;
  const description =
    result.journal?.metadata.description ??
    `Build journal for ${title}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · Sappling Journals`,
      description,
    },
  };
}

/**
 * /[slug] — Project journal page.
 * Fetches and displays the full journal with GitHub-flavored Markdown rendering,
 * Shiki dual-theme syntax highlighting, Lightbox images, and newest/oldest toggle.
 */
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const result = await getJournal(slug);
  const config = getProjectConfig(slug);

  // Unknown slug → 404
  if (
    result.error &&
    !result.journal &&
    result.error.startsWith('Unknown project slug')
  ) {
    notFound();
  }

  const journal = result.journal;

  // Placeholder repo or general fetch error without cached journal
  if (!journal) {
    return (
      <>
        <div className="container" style={{ paddingTop: '3rem' }}>
          <div className="nav-top">
            <Link href="/" className="back-link">
              ← Back to Journals
            </Link>
          </div>
          <div className="error-box">
            <h2 style={{ marginBottom: '0.75rem', color: 'var(--text-heading)' }}>
              {result.isPlaceholder ? 'Project Under Setup' : 'Unable to Load Journal'}
            </h2>
            <p>{result.error}</p>
          </div>
        </div>
        <Footer lastSyncedAt={null} />
      </>
    );
  }

  // Pre-render markdown entries on the server with Shiki and GitHub URL rewriting
  const renderedEntries: RenderedJournalEntry[] = await Promise.all(
    journal.entries.map(async (entry) => ({
      ...entry,
      renderedContent: (
        <MarkdownRenderer content={entry.content} config={config} />
      ),
    }))
  );

  return (
    <>
      <JournalView
        journal={journal}
        entries={renderedEntries}
        lastSyncedAt={result.lastSyncedAt}
        isStale={result.source === 'fallback'}
      />
      <Footer
        lastSyncedAt={result.lastSyncedAt ?? null}
        isStale={result.source === 'fallback'}
      />
    </>
  );
}
