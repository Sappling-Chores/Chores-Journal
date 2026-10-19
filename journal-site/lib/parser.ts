import { parse as parseYaml } from 'yaml';
import { Journal, JournalEntry, ProjectMetadata } from './types';

// Map of month names and abbreviations to 1-indexed month number
const MONTH_MAP: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const FULL_MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Normalizes slug string for anchor IDs.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parses created_at string to extract base year and month.
 * Supports DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, or ISO strings.
 */
function parseCreatedDate(rawCreatedAt?: string): {
  year: number;
  month: number;
  day: number;
  formatted?: string;
} {
  const currentYear = new Date().getFullYear();
  if (!rawCreatedAt || typeof rawCreatedAt !== 'string') {
    return { year: currentYear, month: 1, day: 1 };
  }

  // Strip trailing comments if any (e.g., "# DD-MM-YYYY")
  const cleaned = rawCreatedAt.split('#')[0].trim().replace(/['"]/g, '');

  // 1. Try DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    return { year, month, day, formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }

  // 2. Try YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return { year, month, day, formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }

  // Fallback to Date parser
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = parsed.getUTCMonth() + 1;
    const day = parsed.getUTCDate();
    return { year, month, day, formatted: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }

  return { year: currentYear, month: 1, day: 1 };
}

/**
 * Trims stray horizontal rules (---, ----, -----) from the very end of an entry's body.
 * Horizontal rules in the middle of an entry are preserved.
 */
function trimTrailingSeparators(content: string): string {
  const lines = content.split(/\r?\n/);
  // Trim empty lines and stray separator lines from the end
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (last === '') {
      lines.pop();
    } else if (/^-{3,}$/.test(last)) {
      lines.pop();
    } else {
      break;
    }
  }
  return lines.join('\n').trim();
}

/**
 * Parses frontmatter and body from a markdown string.
 * Tolerates blank lines inside or after the frontmatter fences.
 */
export function extractFrontmatter(
  rawContent: string,
  fallbackSlug: string
): { metadata: ProjectMetadata; body: string } {
  // Regex to match frontmatter fences --- ... ---
  // Tolerates optional leading whitespace/blank lines
  const fmRegex = /^\s*---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
  const match = rawContent.match(fmRegex);

  let metadata: ProjectMetadata = {
    title: fallbackSlug,
  };
  let body = rawContent;

  if (match) {
    const yamlContent = match[1];
    body = rawContent.slice(match[0].length);

    try {
      const parsed = parseYaml(yamlContent);
      if (parsed && typeof parsed === 'object') {
        metadata = {
          title: parsed.title ? String(parsed.title).trim() : fallbackSlug,
          author: parsed.author ? String(parsed.author).trim() : undefined,
          description: parsed.description ? String(parsed.description).trim() : undefined,
          created_at: parsed.created_at !== undefined ? String(parsed.created_at).trim() : undefined,
        };
      }
    } catch {
      // Tolerate parsing errors, fallback to default metadata with fallback title
      metadata = { title: fallbackSlug };
    }
  }

  return { metadata, body };
}

interface RawParsedEntry {
  originalIndex: number;
  rawHeading: string;
  hasMatch: boolean;
  title: string;
  dateString?: string;
  monthIndex?: number;
  day?: number;
  lines: string[];
}

/**
 * Parses raw JOURNAL.md content into a structured Journal object according to
 * specification rules in Section 3 of Antigravity-AI.md.
 */
export function parseJournal(rawContent: string, slug: string): Journal {
  const { metadata, body } = extractFrontmatter(rawContent, slug);
  const createdDateInfo = parseCreatedDate(metadata.created_at);

  const lines = body.split(/\r?\n/);

  let inCodeFence = false;
  let currentFenceChar = '';
  let fenceLength = 0;

  const rawEntries: RawParsedEntry[] = [];
  let currentEntry: RawParsedEntry | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code fences (``` or ~~~)
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (fenceMatch) {
      const fenceStr = fenceMatch[2];
      const char = fenceStr[0];
      const len = fenceStr.length;

      if (!inCodeFence) {
        inCodeFence = true;
        currentFenceChar = char;
        fenceLength = len;
      } else if (char === currentFenceChar && len >= fenceLength) {
        inCodeFence = false;
        currentFenceChar = '';
        fenceLength = 0;
      }
    }

    // Top-level H1 heading check (only outside code fences)
    const h1Match = !inCodeFence ? line.match(/^#\s+(.+)$/) : null;

    if (h1Match) {
      if (currentEntry) {
        rawEntries.push(currentEntry);
      }

      const rawHeading = h1Match[1].trim();

      // Heading format: Month Day: Title
      // Split on the FIRST colon only
      const colonIndex = rawHeading.indexOf(':');

      if (colonIndex !== -1) {
        const left = rawHeading.slice(0, colonIndex).trim();
        const right = rawHeading.slice(colonIndex + 1).trim();

        // Check if left matches "Month Day"
        const dateMatch = left.match(
          /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?$/
        );

        if (dateMatch) {
          const rawMonth = dateMatch[1].toLowerCase();
          const dayNum = parseInt(dateMatch[2], 10);
          const monthNum = MONTH_MAP[rawMonth];

          if (monthNum !== undefined && dayNum >= 1 && dayNum <= 31) {
            const normalizedMonth = FULL_MONTH_NAMES[monthNum];
            currentEntry = {
              originalIndex: rawEntries.length,
              rawHeading,
              hasMatch: true,
              title: right,
              dateString: `${normalizedMonth} ${dayNum}`,
              monthIndex: monthNum,
              day: dayNum,
              lines: [],
            };
            continue;
          }
        }
      }

      // If heading doesn't match Month Day: Title, show raw heading and keep file order
      currentEntry = {
        originalIndex: rawEntries.length,
        rawHeading,
        hasMatch: false,
        title: rawHeading,
        lines: [],
      };
    } else {
      if (currentEntry) {
        currentEntry.lines.push(line);
      }
    }
  }

  if (currentEntry) {
    rawEntries.push(currentEntry);
  }

  // Infer years for entries:
  // Year starts at base year from created_at.
  // Increment year when month sequence wraps past December (e.g., December then January).
  let currentYear = createdDateInfo.year;
  let prevMonth = createdDateInfo.month;
  let hasEncounteredFirstDate = false;

  interface ProcessedEntry extends JournalEntry {
    originalIndex: number;
    sortKey: number; // timestamp or synthetic sequence key for sorting
  }

  const processedEntries: ProcessedEntry[] = [];
  const anchorCountMap = new Map<string, number>();
  let totalHours = 0;

  for (const raw of rawEntries) {
    let resolvedDate: string | undefined;
    let anchorBase = '';
    let sortKey = 0;

    if (raw.hasMatch && raw.monthIndex !== undefined && raw.day !== undefined) {
      if (!hasEncounteredFirstDate) {
        hasEncounteredFirstDate = true;
        // If first entry month is lower than created_at month, it might already be next year
        if (raw.monthIndex < prevMonth) {
          currentYear++;
        }
      } else {
        // Month wrapped past December (e.g. prev was 12, current is 1)
        if (raw.monthIndex < prevMonth) {
          currentYear++;
        }
      }
      prevMonth = raw.monthIndex;

      const yyyy = currentYear;
      const mm = String(raw.monthIndex).padStart(2, '0');
      const dd = String(raw.day).padStart(2, '0');
      resolvedDate = `${yyyy}-${mm}-${dd}`;
      anchorBase = slugify(`${FULL_MONTH_NAMES[raw.monthIndex]}-${raw.day}`);
      sortKey = new Date(`${resolvedDate}T00:00:00Z`).getTime();
    } else {
      // Unmatched heading: fallback anchor from title or original index
      anchorBase = slugify(raw.title) || `entry-${raw.originalIndex + 1}`;
      // Sort key tied to previous resolved date or created date + small increment
      sortKey = processedEntries.length > 0
        ? processedEntries[processedEntries.length - 1].sortKey + 1
        : new Date(createdDateInfo.year, createdDateInfo.month - 1, createdDateInfo.day).getTime();
    }

    // Stable anchor ID with duplicate disambiguation (-2, -3)
    const count = (anchorCountMap.get(anchorBase) || 0) + 1;
    anchorCountMap.set(anchorBase, count);
    const id = count === 1 ? anchorBase : `${anchorBase}-${count}`;

    // Extract hours and filter out the "**Total time spent: X hours**" line
    let entryHours: number | undefined;
    const filteredContentLines: string[] = [];

    const hoursRegex = /^\s*\*\*Total time spent:\s*([0-9.]+)\s*(?:hours|hour|hrs|hr)?\*\*\s*$/i;

    for (const line of raw.lines) {
      const match = line.match(hoursRegex);
      if (match) {
        const parsedHours = parseFloat(match[1]);
        if (!isNaN(parsedHours)) {
          entryHours = parsedHours;
          totalHours += parsedHours;
        }
        // Do not push to filteredContentLines (removes duplicate)
      } else {
        filteredContentLines.push(line);
      }
    }

    // Trim trailing separator lines (---, ----, -----) from the end of the entry
    const cleanedContent = trimTrailingSeparators(filteredContentLines.join('\n'));

    processedEntries.push({
      originalIndex: raw.originalIndex,
      id,
      title: raw.title,
      rawHeading: raw.rawHeading,
      dateString: raw.dateString,
      resolvedDate,
      hours: entryHours,
      content: cleanedContent,
      sortKey,
    });
  }

  // Sort entries:
  // "Entries sort by their resolved date, not file order; ties keep file order."
  // For entries with resolvedDate, sort by resolvedDate. Ties or unmatched keep originalIndex order.
  const sorted = [...processedEntries].sort((a, b) => {
    if (a.resolvedDate && b.resolvedDate) {
      if (a.resolvedDate !== b.resolvedDate) {
        return a.resolvedDate.localeCompare(b.resolvedDate);
      }
      return a.originalIndex - b.originalIndex;
    }
    if (a.resolvedDate && !b.resolvedDate) {
      return a.sortKey - b.sortKey || a.originalIndex - b.originalIndex;
    }
    if (!a.resolvedDate && b.resolvedDate) {
      return a.sortKey - b.sortKey || a.originalIndex - b.originalIndex;
    }
    return a.originalIndex - b.originalIndex;
  });

  const finalEntries: JournalEntry[] = sorted.map(({ originalIndex, sortKey, ...rest }) => rest);

  // Find last entry date (latest resolved date)
  let lastEntryDate: string | undefined;
  for (let i = finalEntries.length - 1; i >= 0; i--) {
    if (finalEntries[i].resolvedDate) {
      lastEntryDate = finalEntries[i].resolvedDate;
      break;
    }
  }

  return {
    slug,
    metadata,
    entries: finalEntries,
    totalHours: Math.round(totalHours * 10) / 10,
    entryCount: finalEntries.length,
    createdDate: createdDateInfo.formatted,
    lastEntryDate,
  };
}

/**
 * Sorts journal entries for display:
 * 'newest': latest date first (descending), ties keep original entry order
 * 'oldest': earliest date first (ascending), ties keep original entry order
 */
export function sortEntries(
  entries: JournalEntry[],
  order: 'newest' | 'oldest' = 'newest'
): JournalEntry[] {
  return [...entries].sort((a, b) => {
    if (a.resolvedDate && b.resolvedDate) {
      const cmp = a.resolvedDate.localeCompare(b.resolvedDate);
      return order === 'newest' ? -cmp : cmp;
    }
    return 0;
  });
}
