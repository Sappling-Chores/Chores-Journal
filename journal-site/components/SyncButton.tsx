'use client';

import { useOwner } from './OwnerProvider';

interface SyncButtonProps {
  slug?: string;
  className?: string;
}

export default function SyncButton({ slug, className }: SyncButtonProps) {
  const { isOwner, isSyncing, triggerSync } = useOwner();

  // Button ONLY appears after owner mode is unlocked
  if (!isOwner) {
    return null;
  }

  const handleSync = async () => {
    await triggerSync(slug);
  };

  return (
    <button
      type="button"
      className={`sync-btn ${className || ''}`}
      onClick={handleSync}
      disabled={isSyncing}
      aria-label={slug ? `Sync ${slug} journal` : 'Sync all project journals'}
      title={slug ? `Sync ${slug} journal now` : 'Sync all journals now'}
    >
      {isSyncing ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg
            style={{ animation: 'spin 1s linear infinite' }}
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Syncing...
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Sync
        </span>
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
