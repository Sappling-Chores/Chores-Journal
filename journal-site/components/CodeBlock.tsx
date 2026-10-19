'use client';

import CopyButton from './CopyButton';

interface CodeBlockProps {
  html: string;
  code: string;
  language: string;
}

export default function CodeBlock({ html, code, language }: CodeBlockProps) {
  const displayLang = language && language !== 'text' ? language : '';

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        {displayLang && <span className="code-block-lang">{displayLang}</span>}
        <CopyButton code={code} />
      </div>
      <div
        className="code-block-html"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
