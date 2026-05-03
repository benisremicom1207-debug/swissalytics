# Phase 1 — Stockage Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le stockage in-memory par Supabase (full DB swap), introduire des slugs lisibles `/r/<domain>-<4chars>`, capturer les métadonnées de retargeting (`ip_hash`, `country`, `user_agent`, `referrer`), et exposer un mode dégradé "fail-open" si Supabase est indisponible.

**Architecture:** Le code consomme déjà l'interface `ReportsRepository` (`src/lib/engine/repository.ts`). On crée une nouvelle implémentation `SupabaseReportsRepository` qui parle à Supabase via `@supabase/supabase-js`, et on swap l'instance dans `repositoryInstance.ts`. Le cache LRU `cache.ts` reste en place comme couche d'optimisation. La route `/api/analyze` capture les métadonnées et passe en fail-open (3s timeout) côté écriture. Un endpoint `/api/health` expose le statut Supabase pour monitoring externe.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Supabase Postgres · `@supabase/supabase-js` · Vitest · nanoid (déjà présent) · Node.js `crypto` (HMAC-SHA-256)

**Spec source:** `docs/superpowers/specs/2026-05-03-supabase-search-storage-design.md`

---

## File Structure

**Created:**
- `supabase/migrations/20260503000000_init.sql` — schéma Postgres
- `src/lib/engine/slug.ts` — génération de slug depuis hostname
- `src/lib/security/ipHash.ts` — HMAC-SHA-256 d'IP avec sel
- `src/lib/engine/supabaseClient.ts` — singleton client Supabase
- `src/lib/engine/supabaseRepository.ts` — implémentation `ReportsRepository`
- `src/app/api/health/route.ts` — endpoint `/api/health`
- `src/components/report/DegradedBanner.tsx` — banner UX mode dégradé
- `src/lib/engine/__tests__/slug.test.ts` — tests unit slug
- `src/lib/security/__tests__/ipHash.test.ts` — tests unit ipHash
- `src/lib/engine/__tests__/supabaseRepository.test.ts` — tests mapping row↔StoredReport
- `vitest.config.ts` — config vitest

**Modified:**
- `package.json` — ajoute `@supabase/supabase-js`, `vitest`, `@types/node` (déjà), script `test`
- `.env.example` — ajoute SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IP_HASH_SALT
- `src/lib/engine/types.ts` — étend `StoredReport` avec champs optionnels (`ipHash`, `country`, `userAgent`, `referrer`)
- `src/lib/engine/repositoryInstance.ts` — swap `InMemoryReportsRepository` → `SupabaseReportsRepository`
- `src/app/api/analyze/route.ts` — capture métadonnées + fail-open + slug
- `src/components/report/ReportView.tsx` — accepte prop `degraded`, rend `DegradedBanner`
- `src/app/page.tsx` — propage `degraded` depuis la réponse API
- `src/app/r/[id]/page.tsx` — pas de modif fonctionnelle (le 404 existant gère le mode dégradé)
- `src/app/mentions-legales/page.tsx` — section RGPD nouvelle collecte
- `src/app/a-propos/page.tsx` — mention privacy
- `deploy.sh` — env vars Supabase + IP_HASH_SALT

**Deleted:**
- `src/lib/engine/inMemoryRepository.ts` — remplacé par Supabase

**Untouched (reference only):**
- `src/lib/engine/repository.ts` (interface)
- `src/lib/engine/cache.ts` (LRU optimisation)
- `src/lib/engine/purge.ts` (utilise déjà le repo via interface)
- `src/lib/engine/ids.ts` (gardé pour `newShareToken()`)

---

## Task 1: Setup outils & dépendances

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Create: `vitest.config.ts`
- Create: `supabase/migrations/20260503000000_init.sql`

- [ ] **Step 1: Installer les dépendances**

```bash
cd /Users/dardan/Desktop/pixelab/Repo/swissalytics
pnpm add @supabase/supabase-js
pnpm add -D vitest @types/node
```

Expected: les paquets s'ajoutent à `package.json`, pas d'erreur.

- [ ] **Step 2: Ajouter le script `test` dans `package.json`**

Modifie la section `scripts` :

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Créer `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Étendre `.env.example`**

Ajouter en bas du fichier existant :

```bash

# Supabase (Phase 1 — stockage des recherches)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
IP_HASH_SALT=
```

- [ ] **Step 5: Créer la migration SQL**

```bash
mkdir -p supabase/migrations
```

Crée `supabase/migrations/20260503000000_init.sql` :

```sql
-- Phase 1: Stockage des recherches utilisateurs
-- Migration: 20260503000000_init.sql

CREATE TABLE reports (
  id                  VARCHAR(64) PRIMARY KEY,            -- slug "pixelab-ch-a8x4"
  url                 TEXT NOT NULL,
  lang                CHAR(2) NOT NULL CHECK (lang IN ('fr','en')),
  score               INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crawl_ms            INTEGER NOT NULL,
  share_token         VARCHAR(32) UNIQUE,
  share_expires_at    TIMESTAMPTZ,
  data                JSONB NOT NULL,

  -- Métadonnées retargeting (Phase 1)
  ip_hash             CHAR(64),                           -- HMAC-SHA-256 hex
  country             CHAR(2),                            -- ISO code
  user_agent          TEXT,
  referrer            TEXT
);

CREATE INDEX reports_url_lang_created_idx
  ON reports(url, lang, created_at DESC);

CREATE INDEX reports_share_token_idx
  ON reports(share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX reports_created_at_idx
  ON reports(created_at);

CREATE INDEX reports_country_created_idx
  ON reports(country, created_at DESC)
  WHERE country IS NOT NULL;

-- RLS désactivée : tous les accès passent par service_role côté serveur.
-- (Pas de SQL nécessaire ici — RLS est OFF par défaut sur les tables nouvelles.)
```

- [ ] **Step 6: Vérifier que le projet compile toujours**

```bash
pnpm type-check
```

Expected: aucune erreur (les nouveaux fichiers ne touchent pas encore le code existant).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts .env.example supabase/migrations/20260503000000_init.sql
git commit -m "chore: add supabase sdk + vitest + initial migration"
```

---

## Task 2: Slug generation (TDD)

**Files:**
- Create: `src/lib/engine/slug.ts`
- Create: `src/lib/engine/__tests__/slug.test.ts`

- [ ] **Step 1: Écrire le test échouant**

Crée `src/lib/engine/__tests__/slug.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { newReportSlug } from '../slug';

describe('newReportSlug', () => {
  it('returns slug from hostname with 4-char suffix', () => {
    const slug = newReportSlug('https://pixelab.ch/about');
    expect(slug).toMatch(/^pixelab-ch-[a-z2-9]{4}$/);
  });

  it('strips www prefix', () => {
    const slug = newReportSlug('https://www.example.com');
    expect(slug.startsWith('example-com-')).toBe(true);
    expect(slug).not.toMatch(/^www-/);
  });

  it('handles subdomains', () => {
    const slug = newReportSlug('https://shop.example.com/');
    expect(slug.startsWith('shop-example-com-')).toBe(true);
  });

  it('caps slug body at 40 chars', () => {
    const longHost = 'a'.repeat(60) + '.com';
    const slug = newReportSlug(`https://${longHost}/`);
    const body = slug.split('-').slice(0, -1).join('-');
    expect(body.length).toBeLessThanOrEqual(40);
  });

  it('handles IDN by punycode (URL normalises)', () => {
    const slug = newReportSlug('https://xn--rksmrgs-5wao1o.com/');
    expect(slug).toMatch(/^xn--rksmrgs-5wao1o-com-[a-z2-9]{4}$/);
  });

  it('produces different suffixes on repeated calls (collision-free)', () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      slugs.add(newReportSlug('https://pixelab.ch/'));
    }
    expect(slugs.size).toBeGreaterThan(45); // tolerate <5% collision in 50 calls
  });

  it('strips disallowed characters from hostname', () => {
    const slug = newReportSlug('https://example_foo.com/');
    expect(slug.startsWith('examplefoo-com-')).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

```bash
pnpm test src/lib/engine/__tests__/slug.test.ts
```

Expected: FAIL avec "Cannot find module '../slug'".

- [ ] **Step 3: Implémenter `slug.ts`**

Crée `src/lib/engine/slug.ts` :

```ts
/**
 * Permalink slug generation — human-readable, collision-resistant.
 *
 * Format: <hostname-slugified>-<4-char-suffix>
 * Examples:
 *   "https://pixelab.ch/about"        → "pixelab-ch-a8x4"
 *   "https://www.shop.example.com"    → "shop-example-com-x9k2"
 */

import { customAlphabet } from 'nanoid';

const suffixAlphabet = '23456789abcdefghijkmnpqrstuvwxyz';
const nanoSuffix = customAlphabet(suffixAlphabet, 4);

const HOSTNAME_MAX = 40;

export function newReportSlug(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  const body = hostname
    .replace(/[^a-z0-9.-]/g, '')   // strip non-allowed
    .replace(/\./g, '-')           // dots → dashes
    .replace(/-+/g, '-')           // collapse dashes
    .replace(/^-|-$/g, '')         // trim leading/trailing dash
    .substring(0, HOSTNAME_MAX);
  return `${body}-${nanoSuffix()}`;
}
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

```bash
pnpm test src/lib/engine/__tests__/slug.test.ts
```

Expected: PASS, 7 tests réussis.

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/slug.ts src/lib/engine/__tests__/slug.test.ts
git commit -m "feat: human-readable permalink slug (domain + 4-char suffix)"
```

---

## Task 3: IP hashing (TDD)

**Files:**
- Create: `src/lib/security/ipHash.ts`
- Create: `src/lib/security/__tests__/ipHash.test.ts`

- [ ] **Step 1: Écrire le test échouant**

Crée `src/lib/security/__tests__/ipHash.test.ts` :

```ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('hashIp', () => {
  beforeEach(() => {
    process.env.IP_HASH_SALT = 'test-salt-32-chars-deadbeefcafe00';
  });

  it('returns deterministic 64-char hex for same IP', async () => {
    const { hashIp } = await import('../ipHash');
    const a = hashIp('192.0.2.1');
    const b = hashIp('192.0.2.1');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns different hash for different IPs', async () => {
    const { hashIp } = await import('../ipHash');
    expect(hashIp('192.0.2.1')).not.toBe(hashIp('192.0.2.2'));
  });

  it('returns different hash with different salt', async () => {
    process.env.IP_HASH_SALT = 'first-salt-XXXXXXXXXXXXXXXXXXXXX';
    const mod1 = await import('../ipHash?v=1');
    const a = mod1.hashIp('192.0.2.1');

    process.env.IP_HASH_SALT = 'second-salt-YYYYYYYYYYYYYYYYYYYY';
    const mod2 = await import('../ipHash?v=2');
    const b = mod2.hashIp('192.0.2.1');

    expect(a).not.toBe(b);
  });
});
```

Note : le test du sel utilise `import('../ipHash?v=...')` pour bypass le cache module. C'est une astuce vitest.

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

```bash
pnpm test src/lib/security/__tests__/ipHash.test.ts
```

Expected: FAIL avec "Cannot find module '../ipHash'".

- [ ] **Step 3: Implémenter `ipHash.ts`**

Crée `src/lib/security/ipHash.ts` :

```ts
/**
 * IP hashing — HMAC-SHA-256 with a server-side salt.
 *
 * The salt MUST be stable across deploys (else retargeting cohorts break)
 * and MUST be secret (else a rainbow table reverses the hash for known IPs).
 * Set IP_HASH_SALT at deploy time. Use a different salt per environment.
 */

import { createHmac } from 'crypto';

function getSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt || salt.length < 16) {
    throw new Error(
      'IP_HASH_SALT not configured (must be ≥16 chars). Set it in env vars.',
    );
  }
  return salt;
}

export function hashIp(ip: string): string {
  return createHmac('sha256', getSalt()).update(ip).digest('hex');
}
```

- [ ] **Step 4: Lancer le test, vérifier qu'il passe**

```bash
pnpm test src/lib/security/__tests__/ipHash.test.ts
```

Expected: PASS, 3 tests réussis.

- [ ] **Step 5: Commit**

```bash
git add src/lib/security/ipHash.ts src/lib/security/__tests__/ipHash.test.ts
git commit -m "feat: HMAC-SHA-256 IP hashing for retargeting metadata"
```

---

## Task 4: Étendre les types `StoredReport`

**Files:**
- Modify: `src/lib/engine/types.ts`

- [ ] **Step 1: Lire le fichier avant édition**

```bash
# Le fichier complet est dans le spec — pas besoin de cat ici
```

- [ ] **Step 2: Ajouter les champs optionnels dans `StoredReport`**

Modifie `src/lib/engine/types.ts`. Remplace la définition de `StoredReport` :

```ts
/**
 * Shape persisted by the repository.
 * Plain fields are indexable columns; the full report lives in `data`.
 *
 * The retargeting metadata fields (ipHash, country, userAgent, referrer)
 * are optional — older reports created before Phase 1 may lack them.
 */
export interface StoredReport {
  id: string;
  url: string;
  lang: Lang;
  score: number;
  createdAt: number; // unix ms
  crawlMs: number;
  shareToken: string | null;
  shareExpiresAt: number | null; // unix ms
  data: AnalysisReport;

  // Métadonnées retargeting (Phase 1) — optionnelles pour rétro-compat
  ipHash?: string | null;
  country?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}
```

- [ ] **Step 3: Vérifier que le projet compile**

```bash
pnpm type-check
```

Expected: aucune erreur (les champs sont optionnels, le code existant ne casse pas).

- [ ] **Step 4: Commit**

```bash
git add src/lib/engine/types.ts
git commit -m "feat: extend StoredReport with retargeting metadata fields"
```

---

## Task 5: Singleton client Supabase

**Files:**
- Create: `src/lib/engine/supabaseClient.ts`

- [ ] **Step 1: Implémenter le singleton client**

Crée `src/lib/engine/supabaseClient.ts` :

```ts
/**
 * Supabase client singleton.
 *
 * Uses the SERVICE_ROLE key (full DB access, bypasses RLS).
 * Only safe to import from server-side code (API routes, lib code
 * called from server). Never expose this client to the browser.
 *
 * Guarded against Next.js hot-reload by attaching to globalThis.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var __saSupabase: SupabaseClient | undefined;
}

export function getSupabaseClient(): SupabaseClient {
  if (globalThis.__saSupabase) return globalThis.__saSupabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.',
    );
  }

  globalThis.__saSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
  return globalThis.__saSupabase;
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/supabaseClient.ts
git commit -m "feat: supabase service-role singleton client"
```

---

## Task 6: SupabaseReportsRepository (avec tests sur le mapping)

**Files:**
- Create: `src/lib/engine/supabaseRepository.ts`
- Create: `src/lib/engine/__tests__/supabaseRepository.test.ts`

- [ ] **Step 1: Écrire les tests sur le mapping pur (TDD)**

Crée `src/lib/engine/__tests__/supabaseRepository.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { rowToStored, storedToRow } from '../supabaseRepository';
import type { StoredReport } from '../types';

const sampleStored: StoredReport = {
  id: 'pixelab-ch-a8x4',
  url: 'https://pixelab.ch/',
  lang: 'fr',
  score: 72,
  createdAt: 1746273600000, // 2026-05-03T12:00:00Z
  crawlMs: 18234,
  shareToken: null,
  shareExpiresAt: null,
  data: { score: 72, url: 'https://pixelab.ch/' } as any,
  ipHash: 'a'.repeat(64),
  country: 'CH',
  userAgent: 'Mozilla/5.0',
  referrer: 'https://google.com/',
};

describe('storedToRow', () => {
  it('maps snake_case columns and converts unix-ms to ISO', () => {
    const row = storedToRow(sampleStored);
    expect(row.id).toBe('pixelab-ch-a8x4');
    expect(row.created_at).toBe(new Date(1746273600000).toISOString());
    expect(row.ip_hash).toBe('a'.repeat(64));
    expect(row.country).toBe('CH');
    expect(row.user_agent).toBe('Mozilla/5.0');
    expect(row.share_expires_at).toBeNull();
  });

  it('handles share_token + share_expires_at when present', () => {
    const stored = { ...sampleStored, shareToken: 'abc123', shareExpiresAt: 1746360000000 };
    const row = storedToRow(stored);
    expect(row.share_token).toBe('abc123');
    expect(row.share_expires_at).toBe(new Date(1746360000000).toISOString());
  });
});

describe('rowToStored', () => {
  it('maps camelCase fields and converts ISO timestamps to unix-ms', () => {
    const row = {
      id: 'pixelab-ch-a8x4',
      url: 'https://pixelab.ch/',
      lang: 'fr',
      score: 72,
      created_at: '2026-05-03T12:00:00.000Z',
      crawl_ms: 18234,
      share_token: null,
      share_expires_at: null,
      data: { score: 72 },
      ip_hash: 'a'.repeat(64),
      country: 'CH',
      user_agent: 'Mozilla/5.0',
      referrer: 'https://google.com/',
    };
    const stored = rowToStored(row);
    expect(stored.id).toBe('pixelab-ch-a8x4');
    expect(stored.createdAt).toBe(1746273600000);
    expect(stored.ipHash).toBe('a'.repeat(64));
    expect(stored.country).toBe('CH');
  });

  it('preserves null share fields', () => {
    const row = {
      id: 'x', url: 'u', lang: 'fr', score: 0,
      created_at: '2026-05-03T12:00:00.000Z',
      crawl_ms: 0, share_token: null, share_expires_at: null,
      data: {},
      ip_hash: null, country: null, user_agent: null, referrer: null,
    };
    const stored = rowToStored(row);
    expect(stored.shareToken).toBeNull();
    expect(stored.shareExpiresAt).toBeNull();
    expect(stored.ipHash).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

```bash
pnpm test src/lib/engine/__tests__/supabaseRepository.test.ts
```

Expected: FAIL avec "Cannot find module '../supabaseRepository'".

- [ ] **Step 3: Implémenter `supabaseRepository.ts`**

Crée `src/lib/engine/supabaseRepository.ts` :

```ts
/**
 * SupabaseReportsRepository — Postgres-backed implementation.
 *
 * Speaks to the `reports` table via the Supabase JS client. All reads/writes
 * use the service_role key (bypasses RLS). On any DB error, methods throw —
 * callers (e.g. /api/analyze) decide how to handle (fail-open or fail-hard).
 *
 * Timestamps in the DB are TIMESTAMPTZ (ISO strings); StoredReport uses
 * unix milliseconds. Conversion happens at the boundary — see rowToStored
 * and storedToRow below.
 */

import type { ReportsRepository } from './repository';
import type { Lang, ReportSummary, StoredReport } from './types';
import { getSupabaseClient } from './supabaseClient';

interface ReportRow {
  id: string;
  url: string;
  lang: Lang;
  score: number;
  created_at: string;
  crawl_ms: number;
  share_token: string | null;
  share_expires_at: string | null;
  data: any;
  ip_hash: string | null;
  country: string | null;
  user_agent: string | null;
  referrer: string | null;
}

export function storedToRow(r: StoredReport): ReportRow {
  return {
    id: r.id,
    url: r.url,
    lang: r.lang,
    score: r.score,
    created_at: new Date(r.createdAt).toISOString(),
    crawl_ms: r.crawlMs,
    share_token: r.shareToken,
    share_expires_at: r.shareExpiresAt
      ? new Date(r.shareExpiresAt).toISOString()
      : null,
    data: r.data,
    ip_hash: r.ipHash ?? null,
    country: r.country ?? null,
    user_agent: r.userAgent ?? null,
    referrer: r.referrer ?? null,
  };
}

export function rowToStored(row: ReportRow): StoredReport {
  return {
    id: row.id,
    url: row.url,
    lang: row.lang,
    score: row.score,
    createdAt: new Date(row.created_at).getTime(),
    crawlMs: row.crawl_ms,
    shareToken: row.share_token,
    shareExpiresAt: row.share_expires_at
      ? new Date(row.share_expires_at).getTime()
      : null,
    data: row.data,
    ipHash: row.ip_hash,
    country: row.country,
    userAgent: row.user_agent,
    referrer: row.referrer,
  };
}

export class SupabaseReportsRepository implements ReportsRepository {
  private get client() {
    return getSupabaseClient();
  }

  async save(report: StoredReport): Promise<void> {
    const { error } = await this.client
      .from('reports')
      .insert(storedToRow(report));
    if (error) throw new Error(`supabase save: ${error.message}`);
  }

  async getById(id: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`supabase getById: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async getByShareToken(token: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();
    if (error) throw new Error(`supabase getByShareToken: ${error.message}`);
    if (!data) return null;
    const stored = rowToStored(data as ReportRow);
    if (stored.shareExpiresAt && stored.shareExpiresAt < Date.now()) {
      return null;
    }
    return stored;
  }

  async setShareToken(
    id: string,
    token: string,
    expiresAt: number,
  ): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .update({
        share_token: token,
        share_expires_at: new Date(expiresAt).toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(`supabase setShareToken: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async clearShareToken(id: string): Promise<StoredReport | null> {
    const { data, error } = await this.client
      .from('reports')
      .update({ share_token: null, share_expires_at: null })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(`supabase clearShareToken: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async findRecent(
    url: string,
    lang: Lang,
    maxAgeMs: number,
  ): Promise<StoredReport | null> {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('url', url)
      .eq('lang', lang)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`supabase findRecent: ${error.message}`);
    return data ? rowToStored(data as ReportRow) : null;
  }

  async purge(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();

    // Delete reports older than cutoff
    const { count, error } = await this.client
      .from('reports')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);
    if (error) throw new Error(`supabase purge delete: ${error.message}`);

    // Clear expired share tokens on remaining rows
    const now = new Date().toISOString();
    const { error: clearError } = await this.client
      .from('reports')
      .update({ share_token: null, share_expires_at: null })
      .lt('share_expires_at', now);
    if (clearError) {
      throw new Error(`supabase purge clear-tokens: ${clearError.message}`);
    }

    return count ?? 0;
  }

  async listRecent(limit: number): Promise<ReportSummary[]> {
    const { data, error } = await this.client
      .from('reports')
      .select('id,url,lang,score,created_at,share_token,share_expires_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`supabase listRecent: ${error.message}`);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      url: r.url,
      lang: r.lang,
      score: r.score,
      createdAt: new Date(r.created_at).getTime(),
      shareToken: r.share_token,
      shareExpiresAt: r.share_expires_at
        ? new Date(r.share_expires_at).getTime()
        : null,
    }));
  }
}
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

```bash
pnpm test src/lib/engine/__tests__/supabaseRepository.test.ts
```

Expected: PASS, 4 tests réussis (les tests testent uniquement `rowToStored` / `storedToRow`, pas les méthodes I/O).

- [ ] **Step 5: Vérifier que tout compile**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/lib/engine/supabaseRepository.ts src/lib/engine/__tests__/supabaseRepository.test.ts
git commit -m "feat: SupabaseReportsRepository implementing the storage interface"
```

---

## Task 7: Swap repository instance + suppression in-memory

**Files:**
- Modify: `src/lib/engine/repositoryInstance.ts`
- Delete: `src/lib/engine/inMemoryRepository.ts`

- [ ] **Step 1: Modifier `repositoryInstance.ts`**

Remplace tout le contenu de `src/lib/engine/repositoryInstance.ts` par :

```ts
/**
 * The single repository instance used by API routes.
 *
 * Swappable through the ReportsRepository interface — see DB_SWAP.md.
 * Phase 1: Supabase-backed. The in-memory implementation has been removed.
 */

import type { ReportsRepository } from './repository';
import { SupabaseReportsRepository } from './supabaseRepository';
import { startPurgeCron } from './purge';

declare global {
  // eslint-disable-next-line no-var
  var __saReportsRepo: ReportsRepository | undefined;
}

function createRepo(): ReportsRepository {
  return new SupabaseReportsRepository();
}

export function getReportsRepo(): ReportsRepository {
  if (!globalThis.__saReportsRepo) {
    globalThis.__saReportsRepo = createRepo();
    startPurgeCron();
  }
  return globalThis.__saReportsRepo;
}

/** Policies — keep these constants near the repo so they're DB-aware */
export const REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
export const SHARE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days
export const DEDUP_WINDOW_MS    = 60 * 60 * 1000;             // 1 hour
```

- [ ] **Step 2: Supprimer le fichier in-memory**

```bash
rm /Users/dardan/Desktop/pixelab/Repo/swissalytics/src/lib/engine/inMemoryRepository.ts
```

- [ ] **Step 3: Vérifier qu'aucun import résiduel ne casse**

```bash
grep -rn "inMemoryRepository\|InMemoryReportsRepository" src/
```

Expected: aucune occurrence (sauf éventuellement DB_SWAP.md qui est de la doc).

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/lib/engine/repositoryInstance.ts
git rm src/lib/engine/inMemoryRepository.ts
git commit -m "refactor: swap to SupabaseReportsRepository, remove in-memory impl"
```

---

## Task 8: Endpoint `/api/health`

**Files:**
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Implémenter le endpoint**

Crée `src/app/api/health/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { getReportsRepo } from '@/lib/engine/repositoryInstance';

export const dynamic = 'force-dynamic'; // never cache

const HEALTH_TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();
  let supabase: 'up' | 'down' = 'down';
  let detail: string | undefined;

  try {
    await Promise.race([
      getReportsRepo().listRecent(1),
      new Promise<never>((_, rej) =>
        setTimeout(
          () => rej(new Error(`timeout after ${HEALTH_TIMEOUT_MS}ms`)),
          HEALTH_TIMEOUT_MS,
        ),
      ),
    ]);
    supabase = 'up';
  } catch (err) {
    supabase = 'down';
    detail = err instanceof Error ? err.message : 'unknown error';
  }

  const ok = supabase === 'up';
  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      supabase,
      latencyMs: Date.now() - startedAt,
      detail,
    },
    { status: ok ? 200 : 503 },
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: GET /api/health exposes Supabase status for external monitoring"
```

---

## Task 9: Mise à jour de `/api/analyze` (slug + métadonnées + fail-open)

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Lire le fichier actuel**

Le fichier existant est dans le spec. On va remplacer la zone qui va de la ligne ~95 (après le rate-limit/dedup) à la ligne ~140 (return réussi).

- [ ] **Step 2: Modifier les imports en haut du fichier**

Remplace les lignes d'import par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzePage } from '@/lib/analyzer';
import { validateUrl } from '@/lib/security';
import { checkRateLimit, getClientIp, RATE_LIMIT } from '@/lib/security/rateLimit';
import { newReportSlug } from '@/lib/engine/slug';
import { getReportsRepo, DEDUP_WINDOW_MS } from '@/lib/engine/repositoryInstance';
import { cacheGet, cacheSet } from '@/lib/engine/cache';
import { hashIp } from '@/lib/security/ipHash';
import type { AnalysisReport, Lang, StoredReport } from '@/lib/engine/types';
```

(`newReportId` n'est plus utilisé ici → retiré.)

- [ ] **Step 3: Ajouter une constante de timeout**

Sous les imports, ajoute :

```ts
const SUPABASE_WRITE_TIMEOUT_MS = 3000;
```

- [ ] **Step 4: Wrapper le `repo.findRecent` en fail-open**

Dans le `POST` handler, remplace le bloc `// Repo-level dedup` (lignes ~88-95) par :

```ts
    // Repo-level dedup — fail-open: if Supabase fails, treat as cache-miss
    let recent: StoredReport | null = null;
    try {
      recent = await repo.findRecent(canonicalUrl, lang, DEDUP_WINDOW_MS);
    } catch (err) {
      console.error('[CRITICAL] Supabase findRecent failed, fail-open mode:', err);
    }
    if (recent) {
      cacheSet(canonicalUrl, lang, recent.id);
      return NextResponse.json(
        { reportId: recent.id, report: recent.data, cached: true },
        { headers: CORS },
      );
    }
```

- [ ] **Step 5: Modifier la zone de stockage (slug + métadonnées + fail-open)**

Remplace le bloc qui suit le `Crawl` et la construction de `report` (lignes ~106-139) par :

```ts
    const id = newReportSlug(canonicalUrl);
    const createdAt = Date.now();
    const report: AnalysisReport = {
      ...(result as AnalysisReport),
      id,
      createdAt: new Date(createdAt).toISOString(),
      lang,
      crawlMs,
    };

    const userAgent = request.headers.get('user-agent') ?? null;
    const referrer = request.headers.get('referer') ?? null;
    const country =
      request.headers.get('cf-ipcountry') ??
      request.headers.get('x-vercel-ip-country') ??
      null;

    const stored: StoredReport = {
      id,
      url: canonicalUrl,
      lang,
      score: report.score,
      createdAt,
      crawlMs,
      shareToken: null,
      shareExpiresAt: null,
      data: report,
      ipHash: ip !== 'unknown' ? hashIp(ip) : null,
      country,
      userAgent,
      referrer,
    };

    let persistedId: string | null = id;
    try {
      await Promise.race([
        repo.save(stored),
        new Promise<never>((_, rej) =>
          setTimeout(
            () => rej(new Error(`supabase write timeout after ${SUPABASE_WRITE_TIMEOUT_MS}ms`)),
            SUPABASE_WRITE_TIMEOUT_MS,
          ),
        ),
      ]);
      cacheSet(canonicalUrl, lang, id);
    } catch (err) {
      console.error('[CRITICAL] Supabase write failed, fail-open mode:', err);
      persistedId = null;
    }

    return NextResponse.json(
      {
        reportId: persistedId,
        report,
        degraded: persistedId === null,
      },
      {
        headers: {
          ...CORS,
          'X-RateLimit-Hourly-Remaining': String(rl.hourlyRemaining),
          'X-RateLimit-Daily-Remaining': String(rl.dailyRemaining),
        },
      },
    );
```

- [ ] **Step 6: Wrapper le `repo.getById` du chemin cache (fail-open)**

Dans le bloc `// Cache-level dedup` (lignes ~76-85), remplace par :

```ts
    // Cache-level dedup
    const cachedId = cacheGet(canonicalUrl, lang, DEDUP_WINDOW_MS);
    if (cachedId) {
      try {
        const stored = await repo.getById(cachedId);
        if (stored) {
          return NextResponse.json(
            { reportId: stored.id, report: stored.data, cached: true },
            { headers: CORS },
          );
        }
      } catch (err) {
        console.error('[CRITICAL] Supabase getById failed during cache lookup:', err);
        // fall through to crawl path
      }
    }
```

- [ ] **Step 7: Vérifier la compilation**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 8: Build full pour vérifier**

```bash
pnpm build
```

Expected: build OK.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: analyze route — slug ids, retargeting metadata, fail-open writes"
```

---

## Task 10: Composant `DegradedBanner`

**Files:**
- Create: `src/components/report/DegradedBanner.tsx`

- [ ] **Step 1: Créer le composant**

Crée `src/components/report/DegradedBanner.tsx` :

```tsx
'use client';

interface DegradedBannerProps {
  isFr: boolean;
}

export default function DegradedBanner({ isFr }: DegradedBannerProps) {
  return (
    <div
      role="status"
      style={{
        border: '2px solid var(--sa-red)',
        background: 'var(--sa-cream)',
        padding: '16px 20px',
        margin: '0 0 24px 0',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 16,
          lineHeight: 1.4,
          color: 'var(--sa-red)',
          fontWeight: 700,
        }}
      >
        ⚠
      </span>
      <div style={{ flex: 1 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-red)',
            marginBottom: 6,
          }}
        >
          {isFr ? 'Sauvegarde indisponible' : 'Storage unavailable'}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sa-ink)', margin: 0 }}>
          {isFr
            ? "Votre rapport est affiché ici, mais ne pourra pas être consulté à nouveau plus tard ou partagé. Téléchargez le PDF si vous voulez le garder."
            : 'Your report is displayed here, but cannot be revisited later or shared. Download the PDF to keep it.'}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/report/DegradedBanner.tsx
git commit -m "feat: DegradedBanner component for storage-unavailable mode"
```

---

## Task 11: Intégrer `DegradedBanner` dans `ReportView`

**Files:**
- Modify: `src/components/report/ReportView.tsx`

- [ ] **Step 1: Lire la zone à modifier**

Ouvrir `src/components/report/ReportView.tsx`. Trouver l'`interface` des props (autour ligne 1-30) et la fonction principale (qui retourne `<div>...`).

- [ ] **Step 2: Ajouter la prop `degraded` à l'interface props**

Trouve l'interface des props (signature `ReportView`). Ajoute le flag :

```ts
interface ReportViewProps {
  // ... champs existants ...
  reportId?: string;
  readOnly?: boolean;
  degraded?: boolean;   // ← AJOUT
}
```

(Adapter au nom réel de l'interface en place.)

- [ ] **Step 3: Importer le composant**

En haut de `ReportView.tsx`, ajoute l'import :

```ts
import DegradedBanner from './DegradedBanner';
```

- [ ] **Step 4: Récupérer la prop dans le destructuring**

Là où le composant fait `function ReportView({ report, reportId, readOnly })`, ajoute `degraded` :

```ts
function ReportView({ report, reportId, readOnly, degraded = false }) {
```

- [ ] **Step 5: Rendre le banner conditionnellement**

Au début du JSX retourné (juste après l'ouverture du conteneur principal `<div style={{ maxWidth: 1280, ... }}>`), ajoute :

```tsx
{degraded && <DegradedBanner isFr={isFr} />}
```

- [ ] **Step 6: Vérifier la compilation**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add src/components/report/ReportView.tsx
git commit -m "feat: ReportView renders DegradedBanner when degraded prop is set"
```

---

## Task 12: Propager le flag `degraded` depuis `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Ajouter un state `degraded`**

Trouve la liste des `useState` au début du composant (`const [reportId, setReportId] = useState<string | null>(null);`). Ajoute juste après :

```ts
  const [degraded, setDegraded] = useState<boolean>(false);
```

- [ ] **Step 2: Lire le flag depuis la réponse**

Dans le bloc `try` de l'analyse (autour ligne 90), trouver :

```ts
const data = await response.json();
const report: AnalysisResult = data.report ?? data;
const id: string | undefined = data.reportId;
setResult(report);
if (id) setReportId(id);
```

Remplace par :

```ts
const data = await response.json();
const report: AnalysisResult = data.report ?? data;
const id: string | null | undefined = data.reportId;
setResult(report);
setReportId(id ?? null);
setDegraded(Boolean(data.degraded));
```

- [ ] **Step 3: Reset le flag en début de nouvelle recherche**

Dans la fonction qui reset au début de l'analyse (autour `setLoading(true); setError(''); setResult(null); setReportId(null);`), ajoute :

```ts
setDegraded(false);
```

- [ ] **Step 4: Passer la prop à `ReportView`**

Trouver la prop `<ReportView ... reportId={reportId ?? undefined} />` et ajouter `degraded` :

```tsx
<ReportView
  report={result}
  reportId={reportId ?? undefined}
  degraded={degraded}
/>
```

- [ ] **Step 5: Vérifier la compilation**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: home page propagates degraded flag from analyze response"
```

---

## Task 13: Mises à jour RGPD (mentions-légales + à-propos)

**Files:**
- Modify: `src/app/mentions-legales/page.tsx`
- Modify: `src/app/a-propos/page.tsx`

- [ ] **Step 1: Lire `mentions-legales/page.tsx`**

```bash
# Repérer la dernière section et l'endroit logique pour insérer la nouvelle.
```

- [ ] **Step 2: Ajouter une section "Données collectées" dans `mentions-legales`**

Repère la dernière section du fichier (probablement avant le footer). Juste avant elle, ajoute (en respectant le pattern de section existant — adapter aux composants utilisés dans le fichier) :

```tsx
<section>
  <h2>Données collectées lors d'une analyse</h2>
  <p>
    Lorsque vous analysez un site avec Swissalytics, nous enregistrons :
  </p>
  <ul>
    <li>L'URL analysée et la langue de l'interface</li>
    <li>Le score d'analyse et les détails techniques de la page (rapport)</li>
    <li>
      Une empreinte cryptographique de votre adresse IP (HMAC-SHA-256, non
      réversible) à des fins de sécurité et de mesure d'usage agrégée
    </li>
    <li>
      Votre pays (déduit de l'IP), navigateur (user-agent) et page d'origine
      (referrer)
    </li>
  </ul>
  <p>
    Ces données sont conservées 180 jours puis automatiquement supprimées.
    Elles servent à améliorer le service et, le cas échéant, à proposer nos
    services SEO Pixelab aux propriétaires de sites analysés. Aucune donnée
    nominative (email, nom) n'est collectée à cette étape.
  </p>
  <p>Hébergement : Supabase (UE — Francfort).</p>
</section>
```

(**Important** : adapter la syntaxe — composants `Section`, `H2`, etc. — à ce que le fichier utilise déjà. Si c'est du JSX brut comme ci-dessus, garder. Si ce sont des composants design-system, utiliser ceux-là.)

- [ ] **Step 3: Ajouter une mention dans `a-propos/page.tsx`**

Repère une zone "À propos" / "Notre approche". Ajoute en bas une mini-section :

```tsx
<section>
  <h3>Vie privée</h3>
  <p>
    Swissalytics est anonyme par défaut : vous n'avez pas besoin de compte
    pour analyser un site. Nous enregistrons l'URL analysée et quelques
    métadonnées techniques (pays, navigateur, IP hashée) pour améliorer
    le service et identifier des opportunités de retargeting B2B. Aucun
    email ni nom n'est collecté à cette étape.
  </p>
  <p>
    Détails complets dans nos{' '}
    <a href="/mentions-legales">mentions légales</a>.
  </p>
</section>
```

(Adapter syntaxe et composants au fichier réel.)

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: aucune erreur.

- [ ] **Step 5: Build pour s'assurer que les pages rendent**

```bash
pnpm build
```

Expected: build OK, pages mentions-légales et à-propos compilent.

- [ ] **Step 6: Commit**

```bash
git add src/app/mentions-legales/page.tsx src/app/a-propos/page.tsx
git commit -m "docs: privacy update — declare retargeting metadata collection"
```

---

## Task 14: Mise à jour `deploy.sh`

**Files:**
- Modify: `deploy.sh`

- [ ] **Step 1: Ajouter les env vars Supabase au `docker run`**

Ouvre `deploy.sh`. Dans le bloc `docker run`, ajoute après la ligne `-e GOOGLE_PAGESPEED_API_KEY=...` :

```bash
  -e SUPABASE_URL="${SUPABASE_URL:-}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}" \
  -e IP_HASH_SALT="${IP_HASH_SALT:-}" \
```

Le bloc complet ressemble alors à :

```bash
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 80:3000 \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGIN=https://swissalytics.com \
  -e GOOGLE_PAGESPEED_API_KEY="${GOOGLE_PAGESPEED_API_KEY:-}" \
  -e SUPABASE_URL="${SUPABASE_URL:-}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}" \
  -e IP_HASH_SALT="${IP_HASH_SALT:-}" \
  "$IMAGE"
```

- [ ] **Step 2: Commit**

```bash
git add deploy.sh
git commit -m "ops: pass supabase + ip-hash-salt env vars to docker container"
```

---

## Task 15: Vérification full build + tests

**Files:** none (validation seulement)

- [ ] **Step 1: Lancer tous les tests**

```bash
pnpm test
```

Expected: PASS sur slug.test.ts, ipHash.test.ts, supabaseRepository.test.ts (tests pure mapping).

- [ ] **Step 2: Lancer le build production**

```bash
pnpm build
```

Expected: build OK, sans erreur ni warning bloquant.

- [ ] **Step 3: Lancer le linter**

```bash
pnpm lint
```

Expected: 0 errors, warnings tolérés.

- [ ] **Step 4: Type-check final**

```bash
pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 5: Si tout passe, passer aux tests manuels (Task 16). Sinon, fixer.**

---

## Task 16: Tests d'intégration manuels (avant deploy prod)

**Pré-requis :**

1. Projet Supabase free tier créé en region `eu-central-1`
2. Migration SQL `supabase/migrations/20260503000000_init.sql` exécutée dans Supabase SQL Editor
3. Fichier `.env.local` créé avec `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT` (générer par `openssl rand -hex 32`)

**Files:** none

- [ ] **Step 1: Lancer le serveur en dev**

```bash
pnpm dev
```

Expected: serveur démarre sur `http://localhost:3000`.

- [ ] **Step 2: Tester `/api/health`**

```bash
curl -s http://localhost:3000/api/health | jq
```

Expected: `{ "status": "ok", "supabase": "up", "latencyMs": <small> }`, HTTP 200.

- [ ] **Step 3: Analyser pixelab.ch via UI**

Ouvre `http://localhost:3000`, tape `pixelab.ch`, lance l'analyse.

Expected:
- Rapport s'affiche
- L'URL `/r/pixelab-ch-XXXX` (avec slug) apparaît dans le bouton de partage / le state
- Pas de banner dégradé

- [ ] **Step 4: Vérifier la ligne dans Supabase Studio**

Dans Supabase → Table Editor → reports : voir une ligne avec :
- `id` = `pixelab-ch-XXXX`
- `url` = `https://pixelab.ch/`
- `score`, `created_at`, `crawl_ms` cohérents
- `ip_hash` = chaîne hex 64 chars
- `country` = `CH` ou `null` (selon hosting local)
- `user_agent` = chaîne du navigateur
- `referrer` = peut être null en dev local

- [ ] **Step 5: Re-analyser pixelab.ch immédiatement → cache hit**

Relance la même analyse. Expected: rapport revient en < 1s, message "cached: true" dans la response (visible via DevTools → Network).

- [ ] **Step 6: Vérifier le permalink**

Va sur `http://localhost:3000/r/pixelab-ch-XXXX` (l'id reçu). Expected: rapport se charge depuis Supabase.

- [ ] **Step 7: Tester le mode dégradé**

Stoppe le serveur, modifie `.env.local` : `SUPABASE_URL=https://does-not-exist.supabase.co`. Relance `pnpm dev`.

Lance une analyse d'un site différent (ex. `example.com`).

Expected:
- Le rapport s'affiche
- Banner rouge ⚠ "Sauvegarde indisponible" apparaît
- Pas de bouton Partager / Permalien
- Console serveur log `[CRITICAL] Supabase write failed, fail-open mode: ...`

- [ ] **Step 8: Tester `/api/health` en mode dégradé**

```bash
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3000/api/health | jq
```

Expected: `{ "status": "degraded", "supabase": "down", ... }`, HTTP 503.

- [ ] **Step 9: Restaurer la config**

Remettre les vraies valeurs Supabase dans `.env.local`. Relancer `pnpm dev`. Refaire test step 2 → 200 OK.

- [ ] **Step 10: Si tous les tests manuels passent, le plan est complet.**

Pas de commit pour cette tâche (validation seulement).

---

## Task 17: Plan de deploy (manuel, par Pixelab)

**Cette tâche ne contient pas de code à exécuter. C'est la checklist de mise en prod.**

- [ ] Créer le projet Supabase free tier (region `eu-central-1` Frankfurt)
- [ ] Récupérer `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` depuis Supabase Dashboard → Settings → API
- [ ] Générer `IP_HASH_SALT` : `openssl rand -hex 32` → noter la valeur
- [ ] Lancer la migration SQL dans Supabase SQL Editor (copier-coller `supabase/migrations/20260503000000_init.sql`)
- [ ] Vérifier la table `reports` créée + indexes
- [ ] Configurer les env vars sur le node Docker Jelastic / Infomaniak :
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `IP_HASH_SALT`
- [ ] Push branche → CI build l'image Docker
- [ ] SSH sur le node Docker → `./deploy.sh`
- [ ] Vérifier : `curl https://swissalytics.com/api/health` → `{ status: 'ok' }`
- [ ] Faire une analyse test depuis le site → vérifier ligne en base
- [ ] Connecter Uptime Robot (ou équivalent) à `https://swissalytics.com/api/health` (alerte si HTTP != 200)
- [ ] Surveiller les logs container 24h pour repérer d'éventuels `[CRITICAL] Supabase write failed`

---

## Self-Review

**1. Spec coverage** — chaque section du spec correspond à une (ou plusieurs) tâches :

| Section spec | Tâches |
|---|---|
| 4.2 Composants modifiés/créés/supprimés | Tasks 1-14 |
| 4.3 Schema Supabase | Task 1 (migration SQL) |
| 4.4 Slug generation | Task 2 |
| 4.5 IP hashing | Task 3 |
| 4.6 Failure mode (fail-open) | Task 9 |
| 4.7 Health endpoint | Task 8 |
| 5 UX dégradée | Tasks 10, 11, 12 |
| 6 RGPD | Task 13 |
| 7 Migration / rollout | Task 17 |
| 8 Tests | Tasks 2, 3, 6 (auto), 16 (manuel) |
| 9 Observabilité | Logs critiques inclus dans Tasks 8, 9 |
| 10 Annexes (env vars) | Tasks 1, 14 |

✅ Tout couvert.

**2. Placeholder scan** : aucun "TBD", "TODO", "implement later", "similar to Task N", "add appropriate error handling" — tout le code est inline et complet.

**3. Type consistency** :
- `StoredReport.ipHash`, `country`, `userAgent`, `referrer` (Task 4) → utilisés dans Task 6 (`storedToRow` / `rowToStored`) et Task 9 (analyze route) avec les mêmes noms.
- `newReportSlug(url: string): string` (Task 2) → consommé dans Task 9 sous le même nom.
- `hashIp(ip: string): string` (Task 3) → consommé dans Task 9 sous le même nom.
- `getSupabaseClient(): SupabaseClient` (Task 5) → consommé dans Task 6.
- `SupabaseReportsRepository` (Task 6) → instancié dans Task 7.
- `DegradedBanner` (Task 10) → importé dans Task 11.
- Interface `ReportsRepository` (référencée mais non modifiée) — méthodes utilisées dans Task 6 (`save`, `getById`, `getByShareToken`, `setShareToken`, `clearShareToken`, `findRecent`, `purge`, `listRecent`) correspondent exactement à l'interface existante (`src/lib/engine/repository.ts`).

✅ Pas d'incohérence.
