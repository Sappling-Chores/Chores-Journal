import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MarkdownRenderer from '@/components/MarkdownRenderer';

describe('MarkdownRenderer — KaTeX equations & sanitization', () => {
  it('preserves KaTeX positioning styles and MathML tags for fraction equations in headings', async () => {
    const md = [
      '## $b = \\frac{raw_{\\text{up}} - raw_{\\text{down}}}{2}$',
      '',
      '## $s = \\frac{raw_{\\text{up}} + raw_{\\text{down}}}{2}$',
    ].join('\n');

    const element = await MarkdownRenderer({ content: md });
    const html = renderToStaticMarkup(element);

    // KaTeX HTML + MathML markup must remain intact
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="frac-line"');
    expect(html).toContain('border-bottom-width:0.04em');
    expect(html).toContain('style="top:-');
    expect(html).toContain('style="height:');
    expect(html).toContain('<mfrac>');
    expect(html).toContain('<msub>');
    expect(html).toContain('<mtext>up</mtext>');
    expect(html).toContain('<mtext>down</mtext>');
  });

  it('matches katex CSS classes emitted by rehype-katex', async () => {
    const cssPath = path.resolve(
      process.cwd(),
      'node_modules/katex/dist/katex.min.css'
    );
    const katexCss = fs.readFileSync(cssPath, 'utf8');

    const element = await MarkdownRenderer({
      content: '$$\n\\frac{a_{\\text{up}} + b}{2}\n$$',
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('class="katex-display"');
    expect(html).toContain('class="base"');
    expect(html).toContain('class="strut"');
    expect(html).toContain('class="sizing ');

    // Top-level katex CSS must target the exact classes emitted by rehype-katex
    expect(katexCss).toContain('.base');
    expect(katexCss).toContain('.strut');
    expect(katexCss).toContain('.sizing');
  });

  it('still sanitizes dangerous HTML tags and inline styles outside math', async () => {
    const md = [
      '<script>alert("xss")</script>',
      '<div style="color:red" onclick="alert(1)">Hello</div>',
      '',
      'Inline math: $x^2 + y^2$',
    ].join('\n');

    const element = await MarkdownRenderer({ content: md });
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('color:red');
    expect(html).toContain('Hello');
    expect(html).toContain('class="katex"');
  });
});
