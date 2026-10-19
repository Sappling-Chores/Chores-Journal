'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface OwnerContextValue {
  isOwner: boolean;
  token: string | null;
  unlock: (token: string) => void;
  lock: () => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  isSyncing: boolean;
  triggerSync: (slug?: string) => Promise<{ success: boolean; lastSyncedAt?: string }>;
  showToast: (message: string, type: 'success' | 'error') => void;
  lastSyncedAtOverride: string | null;
}

const OwnerContext = createContext<OwnerContextValue | null>(null);

const STORAGE_KEY = 'sappling_owner_token';

export function OwnerProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastSyncedAtOverride, setLastSyncedAtOverride] = useState<string | null>(null);

  // Load token from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        setToken(stored.trim());
      }
    } catch {}
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const unlock = useCallback((newToken: string) => {
    const clean = newToken.trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY, clean);
      setToken(clean);
      setIsModalOpen(false);
      showToast('Owner mode unlocked.', 'success');
    }
  }, [showToast]);

  const lock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setIsModalOpen(false);
    showToast('Owner mode locked.', 'success');
  }, [showToast]);

  const triggerSync = useCallback(
    async (slug?: string): Promise<{ success: boolean; lastSyncedAt?: string }> => {
      if (!token) {
        showToast('You must unlock owner mode to sync.', 'error');
        setIsModalOpen(true);
        return { success: false };
      }

      setIsSyncing(true);
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slug }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMsg = data.error || `Sync failed with status ${response.status}`;
          showToast(errorMsg, 'error');
          if (response.status === 401) {
            // Token is invalid/expired
            lock();
          }
          return { success: false };
        }

        const newSyncTime = data.lastSyncedAt || new Date().toISOString();
        setLastSyncedAtOverride(newSyncTime);

        if (data.message) {
          showToast(data.message, 'error');
        } else {
          showToast(
            slug
              ? `Synced ${slug} successfully!`
              : `All project journals synced!`,
            'success'
          );
        }

        return { success: true, lastSyncedAt: newSyncTime };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error during sync.';
        showToast(msg, 'error');
        return { success: false };
      } finally {
        setIsSyncing(false);
      }
    },
    [token, lock, showToast]
  );

  return (
    <OwnerContext.Provider
      value={{
        isOwner: Boolean(token),
        token,
        unlock,
        lock,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        isSyncing,
        triggerSync,
        showToast,
        lastSyncedAtOverride,
      }}
    >
      {children}

      {/* ── Toast Container ────────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" role="region">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Owner Authentication Modal ─────────────────────────────── */}
      {isModalOpen && (
        <AuthModal
          isOwner={Boolean(token)}
          onUnlock={unlock}
          onLock={lock}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  const ctx = useContext(OwnerContext);
  if (!ctx) {
    throw new Error('useOwner must be used within an OwnerProvider');
  }
  return ctx;
}

// ── AuthModal Component ──────────────────────────────────────────────────
function AuthModal({
  isOwner,
  onUnlock,
  onLock,
  onClose,
}: {
  isOwner: boolean;
  onUnlock: (token: string) => void;
  onLock: () => void;
  onClose: () => void;
}) {
  const [inputVal, setInputVal] = useState('');

  return (
    <div
      className="auth-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="auth-modal-title">
          {isOwner ? 'Owner Mode Active' : 'Unlock Owner Mode'}
        </h2>
        {isOwner ? (
          <>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Owner mode is currently unlocked on this device. You can trigger syncs anytime.
            </p>
            <div className="auth-modal-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn-primary" onClick={onLock}>
                Lock
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUnlock(inputVal);
            }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Enter your SYNC_TOKEN to unlock manual sync buttons.
            </p>
            <input
              type="password"
              placeholder="Paste secret token..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              autoFocus
              required
              aria-label="Secret sync token"
            />
            <div className="auth-modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Unlock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
