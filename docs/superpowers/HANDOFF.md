# Handoff — Phase 1 Supabase Storage (interrompu pour MCP setup)

**Date** : 2026-05-03
**Branche active** : `feat/supabase-storage` (basée sur `main`)
**Dernière tâche complétée** : Task 5
**Prochaine tâche** : Task 6 — `SupabaseReportsRepository`

## Contexte rapide

On exécute le plan d'implémentation Phase 1 stockage Supabase. Mode : **subagent-driven development** sur la branche `feat/supabase-storage`. La session a été interrompue pour permettre l'installation du Supabase MCP dans Claude Code.

## Documents de référence (à relire)

| Document | Chemin | Pourquoi |
|---|---|---|
| **Spec** | `docs/superpowers/specs/2026-05-03-supabase-search-storage-design.md` | Décisions architecturales validées |
| **Plan** | `docs/superpowers/plans/2026-05-03-supabase-search-storage.md` | 17 tâches détaillées avec code inline |
| **Ce handoff** | `docs/superpowers/HANDOFF.md` | État actuel + reprise |

## État du repo

**Commits sur `feat/supabase-storage` (du plus ancien au plus récent)** :

```
df103f4 chore: add supabase sdk + vitest + initial migration
fdd90bb fix(task-1): score CHECK constraint + engines.node bumped to 20
9ae06c1 feat: human-readable permalink slug (domain + 4-char suffix)
82687b8 feat: HMAC-SHA-256 IP hashing for retargeting metadata
a5dc8e6 fix(task-3): drop unused dynamic-import cache-bust + salt validation tests
f70eaf2 feat: extend StoredReport with retargeting metadata fields
6d0c101 feat: supabase service-role singleton client
```

**Working tree** : clean (sauf `public/pixelab-logo.svg` untracked, hors scope).

**Tests** : 12 tests passent (`pnpm test`). Type-check OK.

## Ce qui est fait

### ✅ Task 1 — Setup
- `@supabase/supabase-js@^2.105.1` (dep) + `vitest@^4.1.5` (devDep) installés
- Scripts `test` + `test:watch` ajoutés dans `package.json`
- `vitest.config.ts` créé (alias `@` → `./src`, env node)
- `.env.example` étendu avec `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`
- `supabase/migrations/20260503000000_init.sql` créé (table `reports` + 4 indexes + CHECK score 0-100)
- `engines.node` bumpé à `>=20.0.0` (aligné avec Dockerfile `node:20-alpine`)

### ✅ Task 2 — `src/lib/engine/slug.ts`
- `newReportSlug(url): string` génère slug `<domaine>-<4chars>`
- 7 tests Vitest, tous passent
- **Déviation du plan** : la ligne `.replace(/-+/g, '-')` du snippet plan a été retirée car elle cassait les hostnames punycode IDN (`xn--rksmrgs-5wao1o` → `xn-rksmrgs-5wao1o`). Test IDN est l'autorité.

### ✅ Task 3 — `src/lib/security/ipHash.ts`
- `hashIp(ip): string` HMAC-SHA-256, lit `IP_HASH_SALT` au runtime, throw si <16 chars
- 5 tests Vitest (déterminisme, IPs différentes, sels différents, sel manquant, sel court)
- **Déviation du plan** : retrait du trick `import('../ipHash?v=1')` (cassait type-check, et inutile vu que `getSalt()` lit env à chaque appel)

### ✅ Task 4 — `src/lib/engine/types.ts`
- `StoredReport` étendu avec champs optionnels `ipHash?`, `country?`, `userAgent?`, `referrer?` (tous `string | null`)
- Rétro-compat préservée (existant continue à compiler)

### ✅ Task 5 — `src/lib/engine/supabaseClient.ts`
- Singleton `getSupabaseClient()` avec `service_role` key
- Pattern `globalThis.__saSupabase` pour survivre au hot-reload Next.js
- `auth: { persistSession: false, autoRefreshToken: false }`

## Ce qui reste à faire (10 tâches)

| # | Tâche | Fichiers | Note |
|---|---|---|---|
| **6** | `SupabaseReportsRepository` | `src/lib/engine/supabaseRepository.ts` + tests mapping | TDD sur `rowToStored`/`storedToRow` |
| 7 | Swap repo + delete in-memory | `repositoryInstance.ts` + delete `inMemoryRepository.ts` | |
| 8 | `/api/health` endpoint | `src/app/api/health/route.ts` | Timeout 3s |
| 9 | Refonte `/api/analyze` | `src/app/api/analyze/route.ts` | Slug + métadonnées + fail-open 3s + flag `degraded` |
| 10 | `DegradedBanner.tsx` | `src/components/report/DegradedBanner.tsx` | Brutalist v2 style |
| 11 | Wire banner dans `ReportView` | `src/components/report/ReportView.tsx` | Prop `degraded?: boolean` |
| 12 | Propager `degraded` flag | `src/app/page.tsx` | Lire `data.degraded` de la response |
| 13 | RGPD pages | `mentions-legales/page.tsx` + `a-propos/page.tsx` | Section "Données collectées" |
| 14 | `deploy.sh` env vars | `deploy.sh` | 3 vars docker run |
| **15** | Vérif build/lint/test | — | `pnpm test && pnpm build && pnpm lint && pnpm type-check` |

Tâches **manuelles** (utilisateur Dardan) :
- **16** — Tests intégration manuels (suite checklist plan)
- **17** — Deploy prod

## Setup Supabase (côté utilisateur)

### Projet créé
- **Project ref** : `bjhykyofcsehnfffwrly`
- **Dashboard** : https://supabase.com/dashboard/project/bjhykyofcsehnfffwrly
- **Region** : à vérifier — recommandé `eu-central-1` (Frankfurt) pour latence depuis Suisse

### MCP Server (pour la prochaine session)
- Configuré dans `.mcp.json` :
  ```json
  {
    "mcpServers": {
      "supabase": {
        "type": "http",
        "url": "https://mcp.supabase.com/mcp?project_ref=bjhykyofcsehnfffwrly"
      }
    }
  }
  ```
- **À faire après restart Claude Code** : taper `/mcp` puis authentifier le serveur Supabase (flow OAuth)

### Migration SQL (à lancer dans Supabase)
- Coller le contenu de `supabase/migrations/20260503000000_init.sql` dans Supabase SQL Editor → Run
- Ou utiliser le MCP Supabase une fois authentifié

### `.env.local` à créer (PAS .env)
À la racine du repo : `/Users/dardan/Desktop/pixelab/Repo/swissalytics/.env.local`

```bash
SUPABASE_URL=https://bjhykyofcsehnfffwrly.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<récupérer dans Supabase Dashboard → Settings → API → service_role secret>
IP_HASH_SALT=<générer via "openssl rand -hex 32">
```

`.env.local` est gitignored (vérifié dans `.gitignore`).

## Comment reprendre

Dans la nouvelle session Claude Code :

1. **Ouvrir** : `cd /Users/dardan/Desktop/pixelab/Repo/swissalytics && claude`
2. **Vérifier qu'on est sur la bonne branche** : `git status` doit montrer `On branch feat/supabase-storage`
3. **Authentifier le MCP Supabase** : `/mcp` → sélectionner `supabase` → suivre le flow OAuth
4. **Donner ce prompt à Claude** :

   > Lis `docs/superpowers/HANDOFF.md`, `docs/superpowers/specs/2026-05-03-supabase-search-storage-design.md` et `docs/superpowers/plans/2026-05-03-supabase-search-storage.md`. On est en mode subagent-driven development sur la branche `feat/supabase-storage`. Tasks 1-5 sont fait. Reprends à Task 6 (`SupabaseReportsRepository`). Pour les permissions : pnpm install OK, commits locaux OK sur la branche, suppression `inMemoryRepository.ts` OK, mais PAS de git push.

5. **Quand on arrive à Task 16 (tests manuels)** :
   - Le MCP Supabase peut être utilisé pour confirmer que la table `reports` existe bien et inspecter les rows insérés
   - Ou via dashboard Supabase Table Editor

## Permissions explicites (utilisateur Dardan)

- ✅ `pnpm add` / `pnpm install`
- ✅ Suppression de fichiers (ex: `inMemoryRepository.ts`)
- ✅ Commits locaux sur `feat/supabase-storage`
- ❌ `git push` → **toujours interdit**, l'utilisateur push manuellement quand prêt

## Conventions à respecter (rappel)

- Pas de `git push` automatique
- Mémo "stick to brief" : pas d'ajouts non demandés
- Mémo "spatial directions literally" : "above/below" = exactement ça
- Site Swissalytics est un service gratuit, **Supabase EU/US OK** (la mention "Swiss-hosted" est branding, pas contrainte backend)

## Déviations du plan déjà appliquées (à ne pas annuler)

1. **Task 2 / `slug.ts`** : pas de `.replace(/-+/g, '-')` — préserve `xn--` punycode
2. **Task 3 / `ipHash.test.ts`** : import statique (pas de `?v=1`/`?v=2`) ; `getSalt()` lit env à chaque appel donc cache-bust inutile
3. **Task 1 / migration** : `score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100)` ajouté
4. **Task 1 / `package.json`** : `engines.node` bumpé à `>=20.0.0` (aligné Dockerfile)

Ces 4 changements sont des **améliorations validées par code review**, pas des bugs.
