export interface ProjectConfig {
  slug: string;
  repo: string;
  branch: string;
  path: string;
}

export interface ProjectMetadata {
  title: string;
  author?: string;
  description?: string;
  created_at?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  rawHeading: string;
  dateString?: string;
  resolvedDate?: string; // YYYY-MM-DD
  hours?: number;
  content: string;
}

export interface Journal {
  slug: string;
  metadata: ProjectMetadata;
  entries: JournalEntry[];
  totalHours: number;
  entryCount: number;
  createdDate?: string;
  lastEntryDate?: string;
}

export interface JournalResult {
  journal?: Journal;
  source: 'live' | 'fallback';
  lastSyncedAt?: string;
  error?: string;
  isPlaceholder?: boolean;
}
