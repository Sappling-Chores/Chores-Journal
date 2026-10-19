import { defaultSchema, type Options } from 'rehype-sanitize';

/**
 * Extended sanitize schema:
 * Allows: details, summary, kbd, sub, sup, br, and img with width/height/align,
 * KaTeX math markup and classes, and GitHub alert callouts with inline SVG icons.
 * Strictly disallows: script, iframe, style, or event-handler attributes.
 */
export const customSanitizeSchema: Options = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'details',
    'summary',
    'kbd',
    'sub',
    'sup',
    'br',
    'mark',
    'span',
    'div',
    'figure',
    'figcaption',
    // KaTeX MathML tags
    'math',
    'semantics',
    'mrow',
    'mi',
    'mo',
    'mn',
    'annotation',
    // SVG icons for GitHub alerts
    'svg',
    'path',
    'circle',
    'rect',
    'line',
    'polyline',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] || []),
      'className',
      'id',
      'aria-hidden',
      'aria-label',
      'aria-expanded',
      'role',
      'tabIndex',
      'dir',
    ],
    img: [
      ...(defaultSchema.attributes?.img || []),
      'width',
      'height',
      'align',
      'loading',
    ],
    details: ['open'],
    summary: [],
    svg: [
      'className',
      'viewBox',
      'width',
      'height',
      'fill',
      'stroke',
      'strokeWidth',
      'strokeLinecap',
      'strokeLinejoin',
      'aria-hidden',
    ],
    path: [
      'd',
      'fill',
      'stroke',
      'strokeWidth',
      'strokeLinecap',
      'strokeLinejoin',
      'fillRule',
    ],
    circle: ['cx', 'cy', 'r'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
    line: ['x1', 'y1', 'x2', 'y2'],
    polyline: ['points'],
    annotation: ['encoding'],
  },
  // Ensure disallowed tags cannot pass through
  strip: ['script', 'iframe', 'style', 'object', 'embed'],
};
