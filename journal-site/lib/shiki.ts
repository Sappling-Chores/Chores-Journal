import { createHighlighter, type Highlighter, type ShikiTransformer } from 'shiki';

// Cache singleton instance of Shiki highlighter
let highlighterPromise: Promise<Highlighter> | null = null;

const SUPPORTED_LANGUAGES = [
  'c',
  'cpp',
  'python',
  'json',
  'yaml',
  'bash',
  'ini',
  'markdown',
  'diff',
  'text',
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'html',
  'css',
] as const;

/**
 * Shiki transformer that marks lines in diff code blocks with
 * `diff-add` or `diff-remove` CSS classes.
 */
const diffLineTransformer: ShikiTransformer = {
  name: 'diff-line-backgrounds',
  line(node) {
    // Extract raw text from the line AST nodes
    const lineText = node.children
      .map((child: any) => child.value || (child.children && child.children[0]?.value) || '')
      .join('');

    if (lineText.startsWith('+')) {
      this.addClassToHast(node, 'diff-add');
    } else if (lineText.startsWith('-')) {
      this.addClassToHast(node, 'diff-remove');
    }
  },
};

/**
 * Returns or initializes the Shiki highlighter singleton.
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light-default', 'github-dark-default'],
      langs: SUPPORTED_LANGUAGES as unknown as string[],
    });
  }
  return highlighterPromise;
}

/**
 * Normalizes a language string to a supported Shiki language.
 * Unknown languages fall back to 'text' with no errors.
 */
export function normalizeLanguage(rawLang?: string): string {
  if (!rawLang) return 'text';
  const clean = rawLang.toLowerCase().trim().replace(/^language-/, '');

  const aliases: Record<string, string> = {
    py: 'python',
    cplusplus: 'cpp',
    'c++': 'cpp',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    md: 'markdown',
    js: 'javascript',
    ts: 'typescript',
    plaintext: 'text',
    txt: 'text',
  };

  const target = aliases[clean] || clean;
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(target)) {
    return target;
  }
  return 'text';
}

/**
 * Highlights code using Shiki dual themes:
 * 'github-light-default' and 'github-dark-default'.
 *
 * Theme switching is handled purely via CSS variables and the
 * `body.dark-mode` / `body.light-mode` classes without any re-rendering.
 */
export async function highlightCode(
  code: string,
  rawLanguage?: string
): Promise<{ html: string; language: string }> {
  const language = normalizeLanguage(rawLanguage);
  const highlighter = await getHighlighter();

  const transformers: ShikiTransformer[] = [];
  if (language === 'diff') {
    transformers.push(diffLineTransformer);
  }

  const html = highlighter.codeToHtml(code, {
    lang: language,
    themes: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    defaultColor: false,
    transformers,
  });

  return { html, language };
}

/**
 * Synchronous version of highlightCode when the highlighter is already resolved.
 */
export function highlightCodeSync(
  highlighter: Highlighter,
  code: string,
  rawLanguage?: string
): { html: string; language: string } {
  const language = normalizeLanguage(rawLanguage);
  const transformers: ShikiTransformer[] = [];
  if (language === 'diff') {
    transformers.push(diffLineTransformer);
  }

  const html = highlighter.codeToHtml(code, {
    lang: language,
    themes: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    defaultColor: false,
    transformers,
  });

  return { html, language };
}
