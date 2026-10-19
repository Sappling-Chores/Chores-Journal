import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import ThemeProvider from '@/components/ThemeProvider';
import Header from '@/components/Header';

// ── Fonts ──────────────────────────────────────────────────────────────────
// Inter — via Google Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Intel One Mono is declared via @font-face in globals.css.
// Download the woff2 files from https://github.com/intel/intel-one-mono and
// place them in public/fonts/. The site falls back to system monospace until
// those files are present. We use CSS rather than next/font/local so the
// build does not crash when the binary font files are absent.

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Sappling Journals',
    template: '%s · Sappling Journals',
  },
  description:
    'Build journals for Sappling Chores projects — tracking progress, hours, and milestones.',
  metadataBase: new URL('https://journal.ayysappling.com'),
  openGraph: {
    siteName: 'Sappling Journals',
    type: 'website',
  },
};

// ── Inline theme script ────────────────────────────────────────────────────
// Runs synchronously before paint to prevent flash of wrong theme.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    var theme = (stored === 'light' || stored === 'dark') ? stored : preferred;
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(theme + '-mode');
  } catch(e) {}
})();
`;

import { OwnerProvider } from '@/components/OwnerProvider';

// ── Layout ─────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        id="top"
        className={`${inter.variable} dark-mode`}
        suppressHydrationWarning
      >
        {/* Inline script sets the correct theme class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        <ThemeProvider>
          <OwnerProvider>
            <Header />
            <main>{children}</main>
          </OwnerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
