# Sappling Journals (`journal.ayysappling.com`)

A high-performance Next.js (App Router, TypeScript) site deployed on Vercel that renders project build journals written in a `JOURNAL.md` file inside public GitHub repositories under the `Sappling-Chores` organization.

---

## 🌟 Key Features

- **GitHub-Flavored Markdown (Primer)**: Full support for tables, task lists, blockquotes, footnotes, keyboard input (`<kbd>`), collapsible `<details>`, and math formulas via KaTeX ($E=mc^2$).
- **Shiki Dual-Theme Highlighting**: Code blocks with `github-light-default` and `github-dark-default` syntax highlighting switched seamlessly via CSS variables—no flash and zero client re-render. Diff blocks with GitHub red/green line backgrounds.
- **Client-Side Mermaid Diagrams**: Fenced ` ```mermaid ` blocks dynamically rendered with client-side theme synchronization and graceful fallback.
- **Click-to-Zoom Lightbox**: Accessible, keyboard-navigable image modal with <kbd>Esc</kbd> closure, focus trap & restoration, and smart caption filtering.
- **Persistent Cache & Fallback**: Upstash Redis stores a "last successful copy" of every parsed journal. The site serves fresh data when available, and gracefully falls back to the last-good copy if GitHub is unreachable or rate-limited.
- **Owner-Only Sync**: Unobtrusive footer lock opens an authentication modal. Unlocks a manual **Sync** button protected by `SYNC_TOKEN` and a 10-second rate limiter.
- **Sortable Entries**: Instant toggle between **Newest first** (default) and **Oldest first** sorting with sticky Table of Contents.
- **Design Alignment**: Built with Vanilla CSS design tokens matching `blog.ayysappling.com`.

---

## ⚙️ Configuration (`projects.config.json`)

To add a project to the journal site, add an entry to [`projects.config.json`](projects.config.json):

```json
[
  {
    "slug": "gemote",
    "repo": "Sappling-Chores/gemote",
    "branch": "main",
    "path": "JOURNAL.md"
  }
]
```

- `slug`: URL slug for the project (`/[slug]`).
- `repo`: GitHub repository in the format `Sappling-Chores/<REPO_NAME>`.
- `branch`: Branch name containing the journal (typically `main`).
- `path`: Path to the markdown journal file within the repository (defaults to `JOURNAL.md`).

---

## 🔐 Environment Variables

Create a `.env.local` file based on `.env.example`:

| Variable | Description |
|---|---|
| `SYNC_TOKEN` | Secret random token required for owner manual sync via `/api/sync`. |
| `KV_REST_API_URL` | Upstash Redis REST endpoint (auto-injected by Vercel Marketplace). |
| `KV_REST_API_TOKEN` | Upstash Redis REST token (auto-injected by Vercel Marketplace). |

*Note: For local development without Redis, the app automatically falls back to an in-memory cache.*

---

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the index page.

3. **Run Unit Tests**:
   ```bash
   npm test
   ```
   Runs the 35 Vitest unit tests covering date parsing, heading splits, year roll-over inference, hours calculation, and rate limiting.

4. **Explore the Markdown Styleguide**:
   Navigate to [http://localhost:3000/_styleguide](http://localhost:3000/_styleguide) to inspect the complete GitHub-flavored Markdown kitchen sink fixture with all styling in both light and dark themes.

5. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to Vercel

1. **Push to GitHub**:
   Commit and push this repository to GitHub.

2. **Import Project into Vercel**:
   - Set the Root Directory to `journal-site` (if deploying from a monorepo).
   - Framework preset: **Next.js**.

3. **Attach Upstash Redis**:
   - In the Vercel Project Dashboard, navigate to the **Storage** tab.
   - Click **Connect Store** -> select **Upstash Redis**.
   - Vercel automatically populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

4. **Add Environment Variables**:
   - In Project Settings -> **Environment Variables**, add `SYNC_TOKEN` with your chosen secret string.

5. **Configure Subdomain**:
   - Under Project Settings -> **Domains**, add `journal.ayysappling.com` and follow DNS CNAME instructions for your domain.
