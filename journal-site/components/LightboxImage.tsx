'use client';

import { useState, useEffect, useRef } from 'react';

interface LightboxImageProps {
  src?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  align?: string;
  className?: string;
  isInsideLink?: boolean;
}

export default function LightboxImage({
  src,
  alt = '',
  width,
  height,
  align,
  className,
  isInsideLink = false,
}: LightboxImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Default placeholder check: ignore "alt text", "alt", or empty string
  const hasMeaningfulCaption =
    Boolean(alt) &&
    alt.trim().toLowerCase() !== 'alt text' &&
    alt.trim().toLowerCase() !== 'alt';

  // If inside an <a> link, the link wins: render a plain <img> without lightbox
  if (isInsideLink) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={className}
        style={{ verticalAlign: align as any }}
      />
    );
  }

  // Handle Escape key and focus trap when lightbox is open
  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when opened
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'Tab') {
        // Trap focus inside modal
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to trigger button
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <figure className="image-figure">
      <button
        ref={triggerRef}
        type="button"
        className="image-lightbox-trigger"
        onClick={() => setIsOpen(true)}
        aria-label={alt ? `Enlarge image: ${alt}` : 'Enlarge image'}
        title="Click to zoom image"
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className={className}
          style={{ verticalAlign: align as any }}
        />
      </button>

      {hasMeaningfulCaption && (
        <figcaption className="image-caption">{alt}</figcaption>
      )}

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          ref={modalRef}
          className="lightbox-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt || 'Enlarged image view'}
        >
          <button
            ref={closeBtnRef}
            type="button"
            className="lightbox-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close enlarged image (Esc)"
            title="Close (Esc)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={src} alt={alt} className="lightbox-image" />
            {hasMeaningfulCaption && (
              <p className="lightbox-caption">{alt}</p>
            )}
          </div>
        </div>
      )}
    </figure>
  );
}
