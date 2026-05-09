# Frontend & Engine Overhaul — Tracker

**Branche en cours** : `feat/p2-async-enrich` (P0/P1/P6 mergées sur `main`)
**Démarré** : 2026-05-04
**Dernière maj** : 2026-05-09

## Légende
- ☐ TODO
- 🚧 EN COURS
- ✅ DONE
- ⏸ BLOQUÉ
- 🟢 PR mergée

---

## Décisions actées (validées avec utilisateur, 2026-05-04)

| # | Question | Décision |
|---|---|---|
| Q1 | Scorecard IA-Ready affiche | `geoAnalysis.geo.score` (pilier GEO seul) |
| Q2 | Persistance enrichie | Async — endpoint `PATCH /api/report/[id]/enrich` |
| Q3 | Design system 6 onglets | Porter en brutalist v2 |
| Q4 | Backend resilience (P8) | Inclus dans le chantier |
| Q5 | Ordre des PRs | P0 → P1 → P6 (parallèle) → P2 → P3 → P4 → P5 → P7 → P8 |
| Q6 | Keyword fix | v1 complète (brand exclusion + n-grams + stopwords + pondération) |
| Q7 | PageSpeed key | Utilisateur ajoute manuellement au VPS, je fixe Bug A en P0 |
| Q8 | Branche | `feat/analyzer-overhaul` depuis main (supabase-storage déjà merged) |
| Q9 | Format tracker | Statut + checkboxes + PR + décisions + open questions + blocages |
| Q10 | Cadence | Phase par phase, validation visuelle pour P3/P5/P7 |

---

## Open questions à résoudre AVANT démarrage de la phase concernée

### OQ1 (bloque P3 — Visualiser GEO)
**Quelles clés API LLM tu fournis pour l'indexation IA ?**

Aujourd'hui aucune clé n'est configurée → indexation = 0 partout, scorecards GEO inutiles.

- **Critiques** (sans elles, P3 affiche "0 indexed" pour tous les sites) :
  - `OPENAI_API_KEY` (ChatGPT, ~45% du marché)
  - `GEMINI_API_KEY` (Google, ~25%)
  - `PERPLEXITY_API_KEY` (~15%)
- **Recommandées Europe FR** : `MISTRAL_API_KEY`, `BING_API_KEY`
- **Optionnelle** : `MOZ_API_KEY` (Domain Authority pour E-E-A-T)

**Choix utilisateur** :
- (a) Fournir les 3 critiques avant P3
- (b) Lancer P3 sans clés, ajouter plus tard (panneaux montreront "non testé")
- (c) Fournir tout le set Europe FR (3 critiques + 2 recommandées)

→ **À répondre avant démarrage P3.**

### OQ2 ✅ RÉSOLUE (2026-05-07)
**Clé `GOOGLE_PAGESPEED_API_KEY` installée sur le VPS** dans `/var/www/swissalytics/app/.env.production`.
Restriction Google Cloud Console : IPv4 `91.214.191.103` + IPv6 `2001:1600:13:101::/64`.
Vérifié : `lighthouse.performance` retourne du score réel (pas estimé). Voir `docs/pagespeed-setup.md`.

---

## Phases

### Phase 0 — Hotfix prod ✅
**1 PR · sans dépendance · mergée 2026-05-07**
**But** : arrêter le sang qui coule en prod.

- ✅ **0.1** Fix `aiReadyScore` lit `geoAnalysis.geo.score` + loading state (animation `sa-flash` + scanner bar) pour éviter le flash 0→36 pendant le fetch async
- ✅ **0.2** Fix Bug A : `technical.ts:56` lit `GOOGLE_PAGESPEED_API_KEY` (cohérent avec `lighthouse.ts`)
- ✅ **0.3** Faux bouton "Exporter ce rapport →" retiré
- ✅ **0.4** Smoke test prod : `/api/health` ok, `/api/analyze` pixelab.ch ok (score 84), `/api/analyze/cwv` swissinfo.ch retourne CWV mobile (perf=30, lcp=7s)

**PR** : 🟢 #2 (squash-merged)

### Phase 1 — Typer geoAnalysis ✅
**1 PR · mergée 2026-05-07 · débloque P2, P3**

- ✅ **1.1** `GeoAnalysisResult` créé dans `lib/analyzers/types.ts` avec sous-types complets (Lighthouse, GeoIndexation, GeoSchema, GeoEeat, recos, projection). Ancien fichier `components/geo-analyzer/types.ts` reste comme shim deprecated jusqu'à P6.
- ✅ **1.2** `geoAnalysis?: unknown` → `geoAnalysis?: GeoAnalysisResult`
- ✅ **1.3** Cast défensif `as { geo?: { score?: number } } | undefined` retiré de `ReportView.tsx`
- ✅ **1.4** tsc --noEmit clean, lint clean, 16/16 tests pass. Smoke prod : `geo.score: 36` pour pixelab.ch via /api/geo-analyze.

**PR** : 🟢 #3 (squash-merged)

### Phase 6 — Cleanup ✅
**1 PR · mergée 2026-05-09**

- ✅ **6.1** Code mort supprimé (1207 lignes) : `components/AnalyzerResults.tsx`, dossier `geo-analyzer/` entier (AnalyzerHero, AnalyzerLoading, AnalyzerResults, types.ts shim deprecated de P1)
- ✅ **6.2** `deploy.sh` + `Dockerfile` supprimés (fossiles Docker/Jelastic, plus utilisés depuis le passage à systemd). Pas de README à nettoyer.
- ✅ **6.3** `ReportView.tsx` 1302 → 381 L (-71%). 7 fichiers extraits : `Gauge.tsx`, `Scorecard.tsx`, `ShareButton.tsx`, `PlanBucket.tsx`, `OverviewContent.tsx`, `DetailsContent.tsx`, `PlanContent.tsx`. `StripCaptionBar` reste inline (30 L, utilisé seulement dans ReportView).

**PR** : 🟢 #4 (squash-merged)

### Phase 2 — Persister geoAnalysis + CWV en async ☐
**1 PR · 2026-05-09 · dépend P1, bloque P3 et P4**

- ✅ **2.1** Migration Supabase appliquée sur prod : `ALTER TABLE reports ADD COLUMN geo_analysis JSONB, ADD COLUMN cwv JSONB` (fichier `20260509000000_add_enrichment_columns.sql`)
- ✅ **2.2** `StoredReport` étendu (`geoAnalysis?`, `cwv?`), `ReportRow` + `storedToRow`/`rowToStored` mis à jour, méthode `enrich(id, patch)` ajoutée à l'interface `ReportsRepository` + impl Supabase. 3 nouveaux tests (19/19 pass).
- ✅ **2.3** `PATCH /api/report/[id]/enrich` — accepte `{ geoAnalysis?, cwv? }`, validation shallow (objet non null), trust boundary identique à `/share`.
- ✅ **2.4** `page.tsx` : helper `persistEnrichment(reportId, patch)` fire-and-forget, appelé après chaque `.then()` des fetches geo + cwv. Skip si `reportId === null` (mode degraded).
- ✅ **2.5** `mergeEnrichment(stored)` dans `lib/engine/enrich.ts` — applique geoAnalysis + pénalité CWV sur `data` brut. Utilisé par `/api/report/[id]` GET et `/api/share/[slug]` GET.

**PR** : 🟡 (en cours d'ouverture)

### Phase 3 — Visualiser le moteur GEO ☐
**1 PR · ~8 h · dépend P1+P2 · bloqué par OQ1 · 🎨 Validation visuelle requise**

- ☐ **3.1** Ajouter une 4ᵉ tab `IA / GEO` dans `ReportView.tsx`
- ☐ **3.2** Panneau **Indexation IA** : grille des moteurs testés (statut indexed + confidence)
- ☐ **3.3** Panneau **Schema.org** : checklist des types (Organization, Article, FAQ, BreadcrumbList, ProfilePage, Review, Service)
- ☐ **3.4** Panneau **E-E-A-T** : 4 signaux (équipe, mentions légales, contact, témoignages)
- ☐ **3.5** Panneau **Lighthouse** : 4 cartes perf/a11y/best practices/SEO
- ☐ **3.6** Avertissement quand `lighthouse.isEstimated === true`

**PR** : —

### Phase 4 — Plan unifié ☐
**1 PR · ~3 h · dépend P2**

- ☐ **4.1** Étendre `buildPlan()` (`lib/engine/plan.ts`) pour absorber `geoAnalysis.recommendations`
- ☐ **4.2** Mapping priority `critical|high|medium|low` → buckets crit/warn/info
- ☐ **4.3** Tri par `impact` desc dans chaque bucket

**PR** : —

### Phase 5 — Porter onglets en brutalist v2 ☐
**1 PR · ~10 h · 🎨 Validation visuelle requise**

- ☐ **5.1** Ré-écrire `HeadingsTab` avec tokens `--sa-*`
- ☐ **5.2** Ré-écrire `ImagesTab`
- ☐ **5.3** Ré-écrire `LinksTab`
- ☐ **5.4** Ré-écrire `TechnicalTab`
- ☐ **5.5** Ré-écrire `MetadataTab`
- ☐ **5.6** Ré-écrire `ReadabilityTab`
- ☐ **5.7** Ré-écrire `IssuesList`, `CTABanner`, `InfoBox` (ou remplacer par primitives DS)

**PR** : —

### Phase 7 — UX polish ☐
**1 PR · ~5 h · 🎨 Validation visuelle requise**

- ☐ **7.1** Remplacer le faux loader 5-étapes (`page.tsx:71-73`) par un loader honnête (SSE ou indéterminé propre)
- ☐ **7.2** Retirer la ligne verdict serif italique entre MetricStrip et tabs (redondante)
- ☐ **7.3** Unifier le ratelimit : `/api/analyze`, `/api/geo-analyze`, `/api/analyze/cwv` partagent compteur
- ☐ **7.4** Comportement Share button en mode `degraded` (cacher si `reportId === null`)
- ☐ **7.5** **Dédupliquer les appels PageSpeed** : Lighthouse vs CWV appellent la même URL — fusionner en un seul appel et extraire les métriques détaillées en plus des scores agrégés

**PR** : —

### Phase 8 — Backend resilience ☐
**1 PR · ~3 h**

- ☐ **8.1** `/api/geo-analyze` : `Promise.allSettled` au lieu de `Promise.all`, fail-open par analyzer
- ☐ **8.2** Timeout individuel : Lighthouse 15s, autres 5s
- ☐ **8.3** Réponse partielle avec flags `degraded: { lighthouse: false, ... }` côté API + bandeau côté UI

**PR** : —

### Phase 9 — Keyword extraction v2 ☐
**1 PR · ~4 h · indépendant — peut s'insérer après P0**

- ☐ **9.1** Brand exclusion : extraire domaine racine + variantes (`pixelab`, `pixelab-ch`, `pixelabch`), exclure des candidats
- ☐ **9.2** Bigrammes/trigrammes : générer + scorer en parallèle (boost ×1.5 pour bigrammes, ×2 pour trigrammes)
- ☐ **9.3** Stopwords étendus : noms réseaux/villes/pays/CTA génériques (linkedin, facebook, suisse, genève, contact, accueil, etc.)
- ☐ **9.4** Pondération par position renforcée : remplacer la répétition `Array(N).fill()` par somme pondérée propre (title=10, h1=8, h2=4, meta=4, alt=3, body=1)

**PR** : —

### Phase 10 — Dédupliquer l'affichage des liens internes ☐
**1 PR · ~1 h · indépendant**

Dans l'onglet "Liens & navigation" (`LinksTab.tsx`), les URLs identiques apparaissent plusieurs fois (ex : `/services/`, `/contact/` listés 2-3× quand la page a header + footer + sous-nav). Le moteur compte correctement les occurrences DOM, mais l'affichage gagne en lisibilité avec dédup.

- ☐ **10.1** Dans `LinksTab.tsx`, grouper par `href` (URL canonique). Afficher chaque URL une seule fois, avec :
  - Liste des textes d'ancrage uniques (`Set<string>`) si plusieurs
  - Compteur d'occurrences (`× 3`)
  - Attributs (dofollow / nofollow / sponsored) — afficher l'union si conflit
- ☐ **10.2** Same dédup pour les liens externes
- ☐ **10.3** Backend (`lib/analyzer/links.ts`) reste inchangé — le total brut reste correct pour le score, c'est juste l'affichage qui change

**Note** : naturellement intégré dans P5 si on rewrite `LinksTab` en brutalist v2 à ce moment-là. Si P5 vient avant P10, fusionner les deux. Si P10 arrive avant, garder isolé.

**PR** : —

---

## Estimation totale
~**44 h** de travail réparties sur **9 PRs**.

## État actuel — contexte
- **Branche actuelle** : `main` (feat/supabase-storage merged via PR #1, commit `d0f048c`)
- **Production** : https://swissalytics.com (systemd `swissalytics.service` sur VPS Infomaniak `91.214.191.103`)
- **DB** : Supabase Postgres Zurich (eu-central-2)
- **Env vars en prod** : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`
- **Env vars manquantes en prod** : `GOOGLE_PAGESPEED_API_KEY` + toutes les `*_API_KEY` LLM
- **Bugs visibles aujourd'hui** :
  - IA-Ready = 0/100 sur tous les rapports (bug aiReadyScore + indexation 0)
  - Lighthouse en mode estimation (clé absente)
  - CWV en mode estimation (bug double-nom env var)
  - Recommandations GEO jetées (jamais affichées)
  - Rapports partagés (`/s/<slug>`) affichent toujours `geoAnalysis = undefined`

## Notes / blocages
- (rien pour l'instant)
