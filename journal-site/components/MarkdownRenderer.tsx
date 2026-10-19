import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkGemoji from 'remark-gemoji';
import remarkAlert from 'remark-github-blockquote-alert';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';

import { ProjectConfig } from '@/lib/types';
import { resolveGitHubUrl } from '@/lib/fetcher';
import { getHighlighter, highlightCodeSync } from '@/lib/shiki';
import { customSanitizeSchema } from '@/lib/sanitizeSchema';
import CodeBlock from './CodeBlock';
import LightboxImage from './LightboxImage';
import MermaidBlock from './MermaidBlock';

interface MarkdownRendererProps {
  content: string;
  config?: ProjectConfig;
}

/**
 * Checks if a URL points to an image file based on extension.
 */
function isImageHref(url: string): boolean {
  return /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)($|\?)/i.test(url);
}

/**
 * Server Component that parses and renders GitHub-flavored Markdown
 * with Shiki dual-theme syntax highlighting, client-side Mermaid diagrams,
 * image lightbox, KaTeX math, and relative URL rewriting.
 */
export default async function MarkdownRenderer({
  content,
  config,
}: MarkdownRendererProps) {
  // Pre-initialize Shiki highlighter on the server
  const highlighter = await getHighlighter();

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          remarkGemoji,
          remarkAlert,
        ]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          rehypeKatex,
          [rehypeSanitize, customSanitizeSchema],
        ]}
        components={{
          // ── Code blocks and inline code ─────────────────────────────────
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-([a-zA-Z0-9_-]+)/.exec(className || '');
            const rawCode = String(children).replace(/\n$/, '');

            // Mermaid diagram block
            if (match && match[1] === 'mermaid') {
              return <MermaidBlock code={rawCode} />;
            }

            // Fenced block code (has language class or contains line breaks)
            if (match || rawCode.includes('\n')) {
              const lang = match ? match[1] : 'text';
              const { html, language } = highlightCodeSync(
                highlighter,
                rawCode,
                lang
              );
              return (
                <CodeBlock
                  html={html}
                  code={rawCode}
                  language={language}
                />
              );
            }

            // Standard inline code
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          },

          // ── Images with Lightbox ────────────────────────────────────────
          img(props) {
            const rawSrc = typeof props.src === 'string' ? props.src : '';
            const resolvedSrc = config && rawSrc
              ? resolveGitHubUrl(rawSrc, config, true)
              : rawSrc;

            return (
              <LightboxImage
                src={resolvedSrc}
                alt={props.alt || ''}
                width={props.width}
                height={props.height}
                align={(props as any).align}
                className={props.className}
              />
            );
          },

          // ── Links ───────────────────────────────────────────────────────
          a(props) {
            const rawHref = props.href || '';
            const isImage = isImageHref(rawHref);
            const resolvedHref = config
              ? resolveGitHubUrl(rawHref, config, isImage)
              : rawHref;

            const isExternal =
              resolvedHref.startsWith('http://') ||
              resolvedHref.startsWith('https://');

            return (
              <a
                href={resolvedHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={props.className}
                id={props.id}
              >
                {props.children}
              </a>
            );
          },

          // ── Headings with hover anchor links ────────────────────────────
          h1: ({ node, id, children, ...props }) => (
            <h1 id={id} className="markdown-heading" {...props}>
              {id && (
                <a href={`#${id}`} className="heading-anchor" aria-label={`Anchor link to ${children}`}>
                  #
                </a>
              )}
              {children}
            </h1>
          ),
          h2: ({ node, id, children, ...props }) => (
            <h2 id={id} className="markdown-heading" {...props}>
              {id && (
                <a href={`#${id}`} className="heading-anchor" aria-label={`Anchor link to ${children}`}>
                  #
                </a>
              )}
              {children}
            </h2>
          ),
          h3: ({ node, id, children, ...props }) => (
            <h3 id={id} className="markdown-heading" {...props}>
              {id && (
                <a href={`#${id}`} className="heading-anchor" aria-label={`Anchor link to ${children}`}>
                  #
                </a>
              )}
              {children}
            </h3>
          ),
          h4: ({ node, id, children, ...props }) => (
            <h4 id={id} className="markdown-heading" {...props}>
              {id && (
                <a href={`#${id}`} className="heading-anchor" aria-label={`Anchor link to ${children}`}>
                  #
                </a>
              )}
              {children}
            </h4>
          ),
          h5: ({ node, id, children, ...props }) => (
            <h5 id={id} className="markdown-heading" {...props}>
              {id && (
                <a href={`#${id}`} className="heading-anchor" aria-label={`Anchor link to ${children}`}>
                  #
                </a>
              )}
              {children}
            </h5>
          ),
          h6: ({ node, id, children, ...props }) => (
            <h6 id={id} className="markdown-heading" {...props}>
              {id && (
                <a href={`#${id}`} className="heading-anchor" aria-label={`Anchor link to ${children}`}>
                  #
                </a>
              )}
              {children}
            </h6>
          ),

          // ── Tables ──────────────────────────────────────────────────────
          table(props) {
            return (
              <div className="table-wrapper">
                <table {...props} />
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
