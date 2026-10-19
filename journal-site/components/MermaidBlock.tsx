'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { useTheme } from './ThemeProvider';

interface MermaidBlockProps {
  code: string;
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const rawId = useId();
  const uniqueId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { theme } = useTheme();

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      try {
        setHasError(false);
        const mermaid = (await import('mermaid')).default;

        const isDark = document.body.classList.contains('dark-mode');
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'var(--font-sans)',
        });

        const { svg } = await mermaid.render(`${uniqueId}-svg`, code);
        if (!isCancelled) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid rendering error:', err);
        if (!isCancelled) {
          setHasError(true);
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [code, theme, uniqueId]);

  if (hasError) {
    return (
      <div className="mermaid-fallback">
        <pre className="mermaid-fallback-code">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="mermaid-loading" aria-label="Loading diagram">
        <div className="skeleton" style={{ height: '140px', width: '100%' }} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrapper"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
