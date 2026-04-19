# Swapping the storage backend

The app ships with an **in-memory repository** (`InMemoryReportsRepository`).
Everything works end-to-end — reports are saved, share tokens resolve, dedup
works — but data is lost on server restart.

To move to a real database, you only need to **implement one interface** and
**change one line**. No API, UI, or business logic needs to change.

---

## 1. The interface

File: [`repository.ts`](./repository.ts)

```ts
export interface ReportsRepository {
  save(report: StoredReport): Promise<void>;
  getById(id: string): Promise<StoredReport | null>;
  getByShareToken(token: string): Promise<StoredReport | null>;
  setShareToken(id: string, token: string, expiresAt: number): Promise<StoredReport | null>;
  clearShareToken(id: string): Promise<StoredReport | null>;
  findRecent(url: string, lang: Lang, maxAgeMs: number): Promise<StoredReport | null>;
  purge(olderThanMs: number): Promise<number>;
  listRecent(limit: number): Promise<ReportSummary[]>;
}
```

The `StoredReport` shape is in [`types.ts`](./types.ts):

```ts
interface StoredReport {
  id: string;                 // 12-char URL-safe id
  url: string;
  lang: 'fr' | 'en';
  score: number;
  createdAt: number;          // unix ms
  crawlMs: number;
  shareToken: string | null;  // 32-char token (nullable)
  shareExpiresAt: number | null;
  data: AnalysisReport;       // the full JSON blob — store as JSONB
}
```

---

## 2. The swap point

File: [`repositoryInstance.ts`](./repositoryInstance.ts)

```ts
function createRepo(): ReportsRepository {
  // To swap to SQLite/Postgres, replace this line with your own impl:
  //   return new SqliteReportsRepository(process.env.DATABASE_URL!);
  return new InMemoryReportsRepository();
}
```

Change the one `return` and you're done. Everything else — API routes, UI,
caches, rate-limit — stays as is.

---

## 3. Recommended schema (SQLite)

Best bet for a single-instance Next.js on Infomaniak. Uses `better-sqlite3`.

```sql
CREATE TABLE IF NOT EXISTS reports (
  id                TEXT PRIMARY KEY,
  url               TEXT NOT NULL,
  lang              TEXT NOT NULL CHECK (lang IN ('fr','en')),
  score             INTEGER NOT NULL,
  created_at        INTEGER NOT NULL,     -- unix ms
  crawl_ms          INTEGER NOT NULL,
  share_token       TEXT UNIQUE,          -- nullable
  share_expires_at  INTEGER,              -- unix ms, nullable
  data              TEXT NOT NULL         -- JSON blob of AnalysisReport
);

CREATE INDEX IF NOT EXISTS idx_reports_url_lang_created
  ON reports(url, lang, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_share_token
  ON reports(share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_created_at
  ON reports(created_at);
```

### Install

```bash
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3
```

### Example adapter skeleton

```ts
// src/lib/engine/sqliteRepository.ts
import Database from 'better-sqlite3';
import type { ReportsRepository } from './repository';
import type { Lang, ReportSummary, StoredReport } from './types';

export class SqliteReportsRepository implements ReportsRepository {
  private db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    // Run migrations here (apply the CREATE TABLE above)
  }

  async save(r: StoredReport): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO reports (id, url, lang, score, created_at, crawl_ms,
           share_token, share_expires_at, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        r.id, r.url, r.lang, r.score, r.createdAt, r.crawlMs,
        r.shareToken, r.shareExpiresAt, JSON.stringify(r.data),
      );
  }

  async getById(id: string): Promise<StoredReport | null> {
    const row = this.db
      .prepare(`SELECT * FROM reports WHERE id = ?`)
      .get(id) as any;
    return row ? rowToStored(row) : null;
  }

  async getByShareToken(token: string): Promise<StoredReport | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM reports
         WHERE share_token = ?
           AND (share_expires_at IS NULL OR share_expires_at > ?)`,
      )
      .get(token, Date.now()) as any;
    return row ? rowToStored(row) : null;
  }

  async setShareToken(id: string, token: string, expiresAt: number) {
    this.db
      .prepare(
        `UPDATE reports SET share_token = ?, share_expires_at = ?
         WHERE id = ?`,
      )
      .run(token, expiresAt, id);
    return this.getById(id);
  }

  async clearShareToken(id: string) {
    this.db
      .prepare(
        `UPDATE reports SET share_token = NULL, share_expires_at = NULL
         WHERE id = ?`,
      )
      .run(id);
    return this.getById(id);
  }

  async findRecent(url: string, lang: Lang, maxAgeMs: number) {
    const row = this.db
      .prepare(
        `SELECT * FROM reports
         WHERE url = ? AND lang = ? AND created_at >= ?
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .get(url, lang, Date.now() - maxAgeMs) as any;
    return row ? rowToStored(row) : null;
  }

  async purge(olderThanMs: number): Promise<number> {
    const cutoff = Date.now() - olderThanMs;
    const res = this.db
      .prepare(`DELETE FROM reports WHERE created_at < ?`)
      .run(cutoff);
    // Also clear expired share tokens on kept rows
    this.db
      .prepare(
        `UPDATE reports
         SET share_token = NULL, share_expires_at = NULL
         WHERE share_expires_at IS NOT NULL AND share_expires_at < ?`,
      )
      .run(Date.now());
    return Number(res.changes);
  }

  async listRecent(limit: number): Promise<ReportSummary[]> {
    const rows = this.db
      .prepare(
        `SELECT id, url, lang, score, created_at, share_token, share_expires_at
         FROM reports ORDER BY created_at DESC LIMIT ?`,
      )
      .all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      lang: r.lang,
      score: r.score,
      createdAt: r.created_at,
      shareToken: r.share_token,
      shareExpiresAt: r.share_expires_at,
    }));
  }
}

function rowToStored(row: any): StoredReport {
  return {
    id: row.id,
    url: row.url,
    lang: row.lang,
    score: row.score,
    createdAt: row.created_at,
    crawlMs: row.crawl_ms,
    shareToken: row.share_token,
    shareExpiresAt: row.share_expires_at,
    data: JSON.parse(row.data),
  };
}
```

Then in `repositoryInstance.ts`:

```ts
import { SqliteReportsRepository } from './sqliteRepository';

function createRepo(): ReportsRepository {
  const path = process.env.SQLITE_PATH ?? './data/swissalytics.sqlite';
  return new SqliteReportsRepository(path);
}
```

Add `./data` to `.gitignore`.

---

## 4. Recommended schema (Postgres / Drizzle)

```sql
CREATE TABLE reports (
  id                 VARCHAR(12) PRIMARY KEY,
  url                TEXT NOT NULL,
  lang               CHAR(2) NOT NULL,
  score              INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crawl_ms           INTEGER NOT NULL,
  share_token        VARCHAR(32) UNIQUE,
  share_expires_at   TIMESTAMPTZ,
  data               JSONB NOT NULL
);

CREATE INDEX reports_url_lang_created_idx
  ON reports(url, lang, created_at DESC);

CREATE INDEX reports_share_token_idx
  ON reports(share_token)
  WHERE share_token IS NOT NULL;
```

The adapter pattern is identical — swap `better-sqlite3` for your driver
(`pg`, `postgres`, `drizzle-orm`, etc.). Remember to convert `TIMESTAMPTZ`
columns ↔ unix ms at the adapter boundary; the rest of the code expects
unix ms.

---

## 5. Policies (already centralized)

In `repositoryInstance.ts`:

```ts
export const REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
export const SHARE_TOKEN_TTL_MS  =  30 * 24 * 60 * 60 * 1000; //  30 days
export const DEDUP_WINDOW_MS     =  60 * 60 * 1000;           //   1 hour
```

The purge cron (in `purge.ts`) runs once a day and calls `repo.purge(REPORT_RETENTION_MS)`.
If you want to expose these as env vars, thread them through the same module
so the interface stays pure.

---

## 6. What NOT to change when swapping

- API route files (`src/app/api/**`) — they only import from `repositoryInstance.ts`
- `src/components/report/ReportView.tsx` — consumes in-memory objects via JSON
- `src/lib/engine/cache.ts` — pure in-memory LRU, independent of storage
- `src/lib/security/rateLimit.ts` — pure in-memory, can later move to Redis
- The `AnalysisReport` / `StoredReport` types — keep them stable; add optional
  fields only
