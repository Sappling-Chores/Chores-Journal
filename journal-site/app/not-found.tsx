import Link from 'next/link';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <div className="container" style={{ paddingTop: '3rem', minHeight: '60vh' }}>
        <div className="nav-top">
          <Link href="/" className="back-link">
            ← Back to Journals
          </Link>
        </div>

        <div className="error-box" style={{ maxWidth: '600px', margin: '2rem auto', padding: '3rem 2rem' }}>
          <p className="eyebrow" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            404 · NOT FOUND
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '2rem',
              color: 'var(--accent)',
              marginBottom: '1rem',
            }}
          >
            Journal Not Found
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '2rem',
            }}
          >
            The project journal you are looking for does not exist, has been moved, or has not been configured yet.
          </p>
          <Link
            href="/"
            className="btn-primary"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              padding: '0.5rem 1.25rem',
            }}
          >
            Return to Journals
          </Link>
        </div>
      </div>
      <Footer lastSyncedAt={null} />
    </>
  );
}
