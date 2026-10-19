'use client';

import { useState, useEffect } from 'react';
import { useOwner } from './OwnerProvider';

interface FooterProps {
  lastSyncedAt?: string | null;
  isStale?: boolean;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Footer({ lastSyncedAt, isStale = false }: FooterProps) {
  const [year, setYear] = useState<number | null>(null);
  const { isOwner, openModal, lastSyncedAtOverride } = useOwner();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const effectiveSyncTime = lastSyncedAtOverride || lastSyncedAt;

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Left: copyright + sync status */}
        <div className="footer-left">
          <span>© {year ?? '——'} Sappling Chores</span>
          {effectiveSyncTime && (
            <>
              <span
                className={`status-dot${isStale ? ' stale' : ''}`}
                aria-label={isStale ? 'Serving cached data' : 'Data is fresh'}
              />
              <span style={{ fontSize: '0.8rem' }}>
                {isStale ? 'Showing last synced data · ' : ''}
                Last synced {formatRelativeTime(effectiveSyncTime)}
              </span>
            </>
          )}
        </div>

        {/* Right: back to top + lock icon */}
        <div className="footer-right">
          <a href="#top" className="footer-back-top" aria-label="Back to top">
            Back to top ^
          </a>

          {/* Small unobtrusive lock icon — opens owner auth */}
          <button
            type="button"
            className="lock-btn"
            onClick={openModal}
            aria-label={isOwner ? 'Owner mode active (click to lock)' : 'Owner authentication'}
            title={isOwner ? 'Owner mode active' : 'Owner access'}
            style={{ color: isOwner ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            {isOwner ? (
              // Unlocked icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            ) : (
              // Locked icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
