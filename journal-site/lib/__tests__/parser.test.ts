import { describe, it, expect } from 'vitest';
import { extractFrontmatter, parseJournal, sortEntries } from '../parser';

// ── extractFrontmatter ─────────────────────────────────────────────────────

describe('extractFrontmatter', () => {
  it('parses standard YAML frontmatter', () => {
    const raw = `---
title: "Gemote"
author: "Mohammad Sarfaraz"
description: "Its a hand gesture remote"
created_at: "20-09-2026"
---

# September 20: First Entry
Hello world`;

    const { metadata, body } = extractFrontmatter(raw, 'gemote');
    expect(metadata.title).toBe('Gemote');
    expect(metadata.author).toBe('Mohammad Sarfaraz');
    expect(metadata.description).toBe('Its a hand gesture remote');
    expect(metadata.created_at).toBe('20-09-2026');
    expect(body).toContain('# September 20: First Entry');
  });

  it('falls back to slug as title when frontmatter is missing', () => {
    const raw = `# September 20: First Entry
Some content`;

    const { metadata, body } = extractFrontmatter(raw, 'my-project');
    expect(metadata.title).toBe('my-project');
    expect(body).toContain('# September 20: First Entry');
  });

  it('falls back to slug when title is missing from frontmatter', () => {
    const raw = `---
author: "Jane"
---

# Entry 1: Something`;

    const { metadata } = extractFrontmatter(raw, 'fallback-slug');
    expect(metadata.title).toBe('fallback-slug');
    expect(metadata.author).toBe('Jane');
  });

  it('tolerates blank lines after frontmatter fences', () => {
    const raw = `---
title: "Test"
---


# September 1: After blanks
Content`;

    const { metadata, body } = extractFrontmatter(raw, 'test');
    expect(metadata.title).toBe('Test');
    expect(body.trim()).toContain('# September 1: After blanks');
  });

  it('handles malformed YAML gracefully', () => {
    const raw = `---
title: [unclosed bracket
---

# Entry: Stuff`;

    const { metadata } = extractFrontmatter(raw, 'recovery');
    // Should fall back, not crash
    expect(metadata.title).toBe('recovery');
  });
});

// ── parseJournal: basic heading parsing ────────────────────────────────────

describe('parseJournal — heading parsing', () => {
  it('splits entries on top-level H1 headings', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: First
Content of first entry

# January 2: Second
Content of second entry`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entryCount).toBe(2);
    expect(journal.entries[0].title).toBe('First');
    expect(journal.entries[1].title).toBe('Second');
  });

  it('splits on the FIRST colon only (titles may contain colons/punctuation)', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Got the board's symbol: version 2.0
Some content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].title).toBe("Got the board's symbol: version 2.0");
  });

  it('shows raw heading if format does not match "Month Day: Title"', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# Random heading without a date
Some content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].title).toBe('Random heading without a date');
    expect(journal.entries[0].dateString).toBeUndefined();
  });
});

// ── parseJournal: # inside code fences ─────────────────────────────────────

describe('parseJournal — code fences', () => {
  it('does NOT treat # lines inside fenced code blocks as headings', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Real Entry

\`\`\`python
# This is a comment, not a heading
def foo():
    pass
\`\`\`

Some more content after code block

# January 2: Second Entry
More content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entryCount).toBe(2);
    expect(journal.entries[0].title).toBe('Real Entry');
    expect(journal.entries[0].content).toContain('# This is a comment');
    expect(journal.entries[1].title).toBe('Second Entry');
  });

  it('handles nested/tilded code fences', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Entry

~~~bash
# another comment
echo hello
~~~

# January 2: Next
Content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entryCount).toBe(2);
  });
});

// ── parseJournal: year inference ───────────────────────────────────────────

describe('parseJournal — year inference', () => {
  it('uses created_at year as the base year', () => {
    const raw = `---
title: "Test"
created_at: "15-09-2026"
---

# September 15: Start
Content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].resolvedDate).toBe('2026-09-15');
  });

  it('increments year when month wraps past December', () => {
    const raw = `---
title: "Test"
created_at: "01-11-2026"
---

# November 1: Late Year Start
Content A

# December 5: December Entry
Content B

# January 10: New Year Entry
Content C

# February 3: February
Content D`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].resolvedDate).toBe('2026-11-01');
    expect(journal.entries[1].resolvedDate).toBe('2026-12-05');
    // Year should have incremented
    expect(journal.entries[2].resolvedDate).toBe('2027-01-10');
    expect(journal.entries[3].resolvedDate).toBe('2027-02-03');
  });

  it('handles multiple year wraps', () => {
    const raw = `---
title: "Test"
created_at: "01-11-2025"
---

# December 1: Dec 2025
A

# January 1: Jan 2026
B

# December 1: Dec 2026
C

# January 1: Jan 2027
D`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].resolvedDate).toBe('2025-12-01');
    expect(journal.entries[1].resolvedDate).toBe('2026-01-01');
    expect(journal.entries[2].resolvedDate).toBe('2026-12-01');
    expect(journal.entries[3].resolvedDate).toBe('2027-01-01');
  });

  it('handles DD-MM-YYYY format for created_at', () => {
    const raw = `---
title: "Test"
created_at: "20-09-2026"
---

# September 20: Entry
Content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.createdDate).toBe('2026-09-20');
    expect(journal.entries[0].resolvedDate).toBe('2026-09-20');
  });

  it('handles YYYY-MM-DD format for created_at', () => {
    const raw = `---
title: "Test"
created_at: "2026-09-20"
---

# September 20: Entry
Content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.createdDate).toBe('2026-09-20');
  });
});

// ── parseJournal: hours extraction ─────────────────────────────────────────

describe('parseJournal — hours extraction', () => {
  it('extracts hours from "**Total time spent: X hours**"', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: First
Some content
**Total time spent: 2.5 hours**

# January 2: Second
More content
**Total time spent: 1 hours**`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].hours).toBe(2.5);
    expect(journal.entries[1].hours).toBe(1);
    // Hours line should be removed from content
    expect(journal.entries[0].content).not.toContain('Total time spent');
    expect(journal.entries[1].content).not.toContain('Total time spent');
  });

  it('sums total hours across entries (rounded to 1 decimal)', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: A
**Total time spent: 0.3 hours**

# January 2: B
**Total time spent: 0.4 hours**

# January 3: C
**Total time spent: 0.1 hours**`;

    const journal = parseJournal(raw, 'test');
    expect(journal.totalHours).toBe(0.8);
  });

  it('handles entries without hours', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: No Hours
Just some content without a time line`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].hours).toBeUndefined();
    expect(journal.totalHours).toBe(0);
  });

  it('handles "hr" and "hrs" abbreviations', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Abbreviated
Content
**Total time spent: 3 hr**`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].hours).toBe(3);
  });
});

// ── parseJournal: stray separator handling ─────────────────────────────────

describe('parseJournal — stray separator trimming', () => {
  it('trims trailing --- at the end of an entry (before next heading)', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: First Entry
Some content here
---
# January 2: Second Entry
More content`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].content.trim()).not.toMatch(/-{3,}$/);
    expect(journal.entries[0].content).toContain('Some content here');
  });

  it('trims trailing ---- and ----- at end of file', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Only Entry
Content
-----`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].content.trim()).not.toMatch(/-{3,}$/);
  });

  it('preserves --- in the middle of an entry body (real HR)', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Has HR
Content before

---

Content after`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].content).toContain('---');
    expect(journal.entries[0].content).toContain('Content before');
    expect(journal.entries[0].content).toContain('Content after');
  });
});

// ── parseJournal: duplicate dates ──────────────────────────────────────────

describe('parseJournal — duplicate date anchors', () => {
  it('appends -2, -3 for entries sharing the same date', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1: Morning Work
Content A

# January 1: Evening Work
Content B

# January 1: Late Night
Content C`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].id).toBe('january-1');
    expect(journal.entries[1].id).toBe('january-1-2');
    expect(journal.entries[2].id).toBe('january-1-3');
  });
});

// ── parseJournal: month abbreviations ──────────────────────────────────────

describe('parseJournal — month name handling', () => {
  it('handles abbreviated month names (Sep, Oct, etc.)', () => {
    const raw = `---
title: "Test"
created_at: "01-09-2026"
---

# Sep 20: Abbreviated
Content A

# Oct 7: Also abbreviated
Content B`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entries[0].dateString).toBe('September 20');
    expect(journal.entries[1].dateString).toBe('October 7');
  });
});

// ── parseJournal: missing/optional frontmatter fields ──────────────────────

describe('parseJournal — missing frontmatter fields', () => {
  it('handles completely missing frontmatter', () => {
    const raw = `# January 1: No Frontmatter
Content here`;

    const journal = parseJournal(raw, 'no-fm');
    expect(journal.metadata.title).toBe('no-fm');
    expect(journal.metadata.author).toBeUndefined();
    expect(journal.metadata.description).toBeUndefined();
    expect(journal.entryCount).toBe(1);
  });

  it('handles frontmatter with only title', () => {
    const raw = `---
title: "Minimal"
---

# March 1: Entry
Content`;

    const journal = parseJournal(raw, 'minimal');
    expect(journal.metadata.title).toBe('Minimal');
    expect(journal.metadata.author).toBeUndefined();
    expect(journal.metadata.created_at).toBeUndefined();
  });
});

// ── parseJournal: sorting ──────────────────────────────────────────────────

describe('parseJournal — entry sorting', () => {
  it('sorts entries by resolved date (not file order)', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 5: Later
Content A

# January 2: Earlier
Content B`;

    const journal = parseJournal(raw, 'test');
    // Earlier date should come first in default (oldest) order
    expect(journal.entries[0].resolvedDate).toBe('2026-01-02');
    expect(journal.entries[1].resolvedDate).toBe('2026-01-05');
  });
});

// ── sortEntries ────────────────────────────────────────────────────────────

describe('sortEntries', () => {
  it('returns newest first when order is "newest"', () => {
    const entries = [
      { id: 'a', title: 'A', rawHeading: 'A', resolvedDate: '2026-01-01', content: '' },
      { id: 'b', title: 'B', rawHeading: 'B', resolvedDate: '2026-03-01', content: '' },
      { id: 'c', title: 'C', rawHeading: 'C', resolvedDate: '2026-02-01', content: '' },
    ];

    const sorted = sortEntries(entries, 'newest');
    expect(sorted[0].id).toBe('b'); // March
    expect(sorted[1].id).toBe('c'); // February
    expect(sorted[2].id).toBe('a'); // January
  });

  it('returns oldest first when order is "oldest"', () => {
    const entries = [
      { id: 'b', title: 'B', rawHeading: 'B', resolvedDate: '2026-03-01', content: '' },
      { id: 'a', title: 'A', rawHeading: 'A', resolvedDate: '2026-01-01', content: '' },
    ];

    const sorted = sortEntries(entries, 'oldest');
    expect(sorted[0].id).toBe('a');
    expect(sorted[1].id).toBe('b');
  });
});

// ── parseJournal: edge case — empty file ───────────────────────────────────

describe('parseJournal — edge cases', () => {
  it('handles empty content', () => {
    const journal = parseJournal('', 'empty');
    expect(journal.entryCount).toBe(0);
    expect(journal.totalHours).toBe(0);
    expect(journal.metadata.title).toBe('empty');
  });

  it('handles frontmatter only (no entries)', () => {
    const raw = `---
title: "Empty Journal"
created_at: "01-01-2026"
---`;

    const journal = parseJournal(raw, 'empty-journal');
    expect(journal.entryCount).toBe(0);
    expect(journal.metadata.title).toBe('Empty Journal');
  });

  it('handles ordinal suffixes in day numbers (1st, 2nd, 3rd, 4th)', () => {
    const raw = `---
title: "Test"
created_at: "01-01-2026"
---

# January 1st: With Ordinal
Content A

# January 2nd: Also Ordinal
Content B

# January 3rd: Third
Content C

# January 4th: Fourth
Content D`;

    const journal = parseJournal(raw, 'test');
    expect(journal.entryCount).toBe(4);
    expect(journal.entries[0].resolvedDate).toBe('2026-01-01');
    expect(journal.entries[1].resolvedDate).toBe('2026-01-02');
    expect(journal.entries[2].resolvedDate).toBe('2026-01-03');
    expect(journal.entries[3].resolvedDate).toBe('2026-01-04');
  });
});
