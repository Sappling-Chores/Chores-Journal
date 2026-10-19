# AI Use Disclosure

This entire project (**Sappling Journals / Chores-Journal**) was designed, developed, and implemented using **AI** (via Google Antigravity and Gemini).

---

## Scope of AI Implementation

Everything in this project was built with AI assistance, including:

1. **Architecture & Design**:
   - System design for multi-project hub syncing directly from GitHub repositories without database migrations.
   - Redis caching and fallback strategy for resilient uptime.
   - Owner authentication mode (`SYNC_TOKEN`) and instant revalidation workflow.

2. **Full-Stack Next.js Application**:
   - Next.js 16 App Router application (`journal-site`) using React 19 and TypeScript.
   - Custom GitHub-Flavored Markdown renderer with Shiki syntax highlighting and Mermaid diagram support.
   - Responsive design system with desktop table of contents, mobile collapsible navigation, and click-to-zoom image lightboxes.

3. **Core Engine & Parsing**:
   - Resilient YAML frontmatter and journal entry parsing engine (`lib/parser.ts`) supporting diverse date formats and time tracking.
   - Dynamic asset URL rewriting from relative paths to GitHub raw CDN links.

4. **Testing & Quality Assurance**:
   - Comprehensive test suite covering parser edge cases, storage fallback, and synchronization logic.
