import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * Shared site header — present on every page.
 * Brand links to /. Nav links: home, blog (external), journals (active).
 */
export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        {/* Brand */}
        <Link href="/" className="header-brand" aria-label="Sappling Journals home">
          <span className="header-brand-main">Sappling</span>
          <span className="header-brand-sub">/ Journals</span>
        </Link>

        {/* Right side: nav + theme toggle */}
        <div className="header-right">
          <nav aria-label="Site navigation">
            <ul className="header-nav">
              <li>
                <a
                  href="https://ayysappling.com"
                  rel="noopener noreferrer"
                >
                  home
                </a>
              </li>
              <li>
                <a
                  href="https://blog.ayysappling.com"
                  rel="noopener noreferrer"
                >
                  blog
                </a>
              </li>
              <li>
                <Link href="/" className="active" aria-current="page">
                  journals
                </Link>
              </li>
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
