# Frontend & Engine Overhaul — Tracker

**Branche en cours** : `feat/p9-keyword-v2` (P0/P1/P2/P3/P6/P11/P12 mergées sur `main`)
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
**1 PR · 2026-05-09 · 🎨 Validation visuelle**

- ✅ **3.1** 4ᵉ tab `INDEXATION IA / GEO` ajoutée à `ReportView.tsx` + i18n FR/EN dans `copy.ts` (`tabs[3]` + `tabsMono[3]`). URL sync via `?tab=geo`.
- ✅ **3.2** Panneau **Indexation IA** : grille de cards par moteur (✓/×, badge confidence, mentions count). Header avec score + "X/Y moteurs IA vous indexent · {région}". Empty state si aucun moteur configuré.
- ✅ **3.3** Panneau **Schema.org** : checklist des 6 types détectés par le code (Organization, WebSite, BreadcrumbList, Article, Author, FAQPage). Chaque ligne avec hint expliquant l'impact SEO/IA.
- ✅ **3.4** Panneau **E-E-A-T** : 4 signal cards (page équipe, mentions légales, contact, témoignages avec compteur). Hint par signal.
- ✅ **3.5** Panneau **Lighthouse** : 4 cards (perf/accessibility/bestPractices/SEO) avec score color (vert/orange/rouge selon seuils 80/60). Header avec moyenne des 4 scores.
- ✅ **3.6** Bandeau orange "⚠️ Scores estimés — clé Google PageSpeed non configurée" affiché en tête du panneau Lighthouse quand `isEstimated === true`.
- ✅ **3.7** Empty state avec **animation** quand `geoAnalysis === undefined` (loading async ou rapport pré-P2) : skeleton des 4 panneaux + scanner bars + bandeau "Analyse IA en cours — interroge ChatGPT, Claude, Gemini, Mistral…" avec `sa-flash` infinite. Réutilise les keyframes existantes de globals.css.
- ✅ **3.8** **Bonus fix** Gemini : `gemini-1.5-flash` → `gemini-2.5-flash`. Découvert pendant le smoke test live : 1.5-flash refusait de reconnaître les marques suisses (sunrise.ch, pixelab.ch). 2.0-flash retournait 404 ("no longer available to new users"). 2.5-flash est le free-tier actuel pour les nouvelles clés. Test unitaire mis à jour.

**Smoke test live** : sur `https://www.sunrise.ch/`, score indexation **100/100, 4/4 moteurs reconnaissent la marque** (vs 50/100 avant le fix Gemini).

**Note tests** : pas de test unitaire des composants React (le projet n'a pas `@testing-library/react`, pattern existant = pure-function tests + smoke validation manuelle, comme les 7 fichiers extraits en P6.3). Smoke test live + validation visuelle utilisateur servent de validation.

**PR** : 🟡 (en cours d'ouverture)

### Phase 4 — Plan unifié + Quality fixes ✅
**1 PR · 2026-05-10 · dépend P2**

**P4 (cœur)** :
- ✅ **4.1** `buildPlan()` absorbe désormais `geoAnalysis.recommendations` via un nouveau collector `collectGeoRecs()` (catégories `SEO IA` / `GEO IA`)
- ✅ **4.2** Mapping priority → severity : `critical|high → error/crit`, `medium → warning/warn`, `low → info/info` ; difficulty `low|medium|high → S|M|L`
- ✅ **4.3** `sortWeight()` unifié : geo `impact × 5` (25..150) vs natif `nativeImpactScore` (10..115), sort dans chaque bucket par poids desc

**Quality fixes bundlés (déclenchés par smoke tests P4)** :
- ✅ **EEAT multilingue** : regex étendue DE (`kontakt`, `hilfe`, `impressum`, `datenschutz`, `agb`…), IT (`contatti`, `aiuto`, `note-legali`…), FR (`aide`, `support`), EN (`help`, `customer-service`) + détection `tel:`/`mailto:` comme signal contact + boundary regex tolère `data-privacy`, `customer-contact`. **Fix Swisscom** (faux positifs "no contact / no legal").
- ✅ **Détection SPA tri-état** : `verdict: 'spa-shell' | 'styled-divs' | 'normal'`. Pure helper `detectSpa()` dans `src/lib/analyzer/spa-detection.ts` ; bandeau `SpaWarning` (FR/EN) intégré en haut de `HeadingsTab` + `GeoTabContent`. Explique pédagogiquement pourquoi 0 H1 = vrai problème GEO/IA même si Google rend JS au second crawl. **Fix GoMo** (semantic-HTML failure : div stylisés au lieu de h1).
- ✅ **Stopwords pronoms 4 langues** : DE (`du`/`dich`/`dir`/`er`/`es`/`sie`…), FR (`je`/`tu`/`te`/`moi`/`toi`), EN (`mine`/`yours`/`myself`/`themselves`…), IT (corpus complet, langue 100% manquante avant). **Fix go-mo** (`dir` sortait en target).

**Tests** : +59 nouveaux tests (19 plan + 33 EEAT + 14 SPA + 6 stopwords pronouns). Total : **209/209 ✅**, tsc + lint clean.

**PR** : 🟡 #10 (en cours de finalisation)

### Phase 5 — Porter onglets en brutalist v2 ✅
**1 PR · 2026-05-10 · 🎨 Validé visuellement**

**P5 (cœur)** :
- ✅ **5.1** `HeadingsTab` porté (5 sections §01-§05 + IssuesList) — gauges plats, top-3 keywords avec carte principale 2px
- ✅ **5.2** `ImagesTab` porté (4 sections + thumbnails directs sans proxy)
- ✅ **5.3** `LinksTab` porté (6 sections + ratio 2-tons + tables hairline)
- ✅ **5.4** `TechnicalTab` porté (13 sections, toggle CWV mobile/desktop, technologies catégorisées) + InfoBoxes ajoutées sur §10/§11/§12 (resource hints, headers HTTP, PWA)
- ✅ **5.5** `MetadataTab` porté (7 sections, previews FB/Twitter intacts en couleurs natives, EEAT retiré au profit du panneau unifié GEO)
- ✅ **5.6** `ReadabilityTab` porté (6 sections + Flesch gauge avec marker + distribution barres)
- ✅ **5.7** `IssuesList` + `InfoBox` portés. `CTABanner` déjà v2 via Tailwind extensions (border-ink, bg-cream-2, bg-sa-red).

**Primitives partagées** : nouveau `src/components/tabs/_v2.tsx` avec `TabFrame`, `SectionHeader`, `CheckPill`, `MonoCard` — réutilisés sur les 6 tabs.

**Quality fixes bundlés (déclenchés par smoke tests P5)** :
- ✅ **GEO chargement infini sur `/r/<id>`** : helper partagé `src/lib/client/enrichment.ts` (`fetchGeo`/`fetchCwv`/`persistEnrichment`). `/r/[id]/page.tsx` déclenche conditionnellement geo+cwv si manquants au load. Une fois persisté, plus jamais re-fetch.
- ✅ **OG images** : `/api/image-proxy?url=…` (route fantôme jamais créée) remplacé par `<img src={...}>` direct dans MetadataTab + ImagesTab (les og:image sont publiques par design).
- ✅ **Magento faux positif** : regex `mage-` (matchait classes Vue obfusquées de sunrise) remplacée par marqueurs spécifiques (data-mage-init, Mage_Catalog, /static/version/frontend/Magento, generator meta).
- ✅ **Tech stack catégorisé** : nouveau `src/lib/analyzer/tech-categories.ts` qui regroupe les ~30 technologies détectées en 5 buckets (framework / library / analytics / embed / other). Affiché dans TechnicalTab §05 avec dot couleur par bucket.
- ✅ **EEAT dédupliqué** : panneau unique enrichi dans GeoTabContent §09 (10 signaux groupés en 5 catégories : Identité · Récence · Contact · Légal · Preuves sociales). Retiré de MetadataTab.
- ✅ **GEO panel reorder** : Indexation §06 → **Lighthouse §07** (remonté) → Schema §08 → E-E-A-T §09 (plus actionnable visuellement).

**Tests** : +47 nouveaux tests (12 enrichment + 7 technical-cms + 28 tech-categories). Total : **255/255 ✅**, tsc + lint clean.

**PR** : 🟡 #11 (en cours de finalisation)

### Phase 7 — UX polish ✅
**1 PR · 2026-05-10**

- ✅ **7.1** `AnalyzerLoading` re-pensé : tous les 5 analyzers affichés en parallèle (vrai état), scanner CSS indéterminé (`sa-scorecard-scan`), suppression du faux compteur %, suppression du `stepInterval` 3s. Plus aucune fausse séquentialité.
- ✅ **7.2** Ligne verdict serif italique retirée de `ReportView.tsx` (était redondante avec le score badge + scorecards déjà visibles dans MetricStrip).
- ✅ **7.3** Rate limiter unifié : nouveau helper `hasRecentAdmission(ip)` dans `rateLimit.ts`. `/api/analyze` consomme 1 crédit (5/h, 50/jour). `/api/geo-analyze` + `/api/analyze/cwv` vérifient l'admission récente sans consommer — un user analysis = 1 crédit malgré 3 endpoints. Anciennes `RateLimiter`/`analyzeRateLimiter`/`proxyRateLimiter` retirées de `security.ts`.
- ✅ **7.4** Déjà OK : `showShare = !!reportId && !readOnly` dans `ReportView` masque déjà le bouton si `reportId` est null (cas degraded). Aucun changement nécessaire.
- ✅ **7.5** Client PageSpeed unifié : nouveau `src/lib/pagespeed/client.ts` avec `fetchPageSpeed(url, strategy)` + cache 5min globalThis-keyed. Lighthouse + CWV partagent désormais le même appel API quand strategy=mobile. **2 appels Google PageSpeed → 1** par user analysis.

**Tests** : 11 nouveaux dans `pagespeed/__tests__/client.test.ts` (happy path + 4 caching cases + 5 fallback/error cases). Total : **296/296 ✅**

**PR** : 🟡 #14 (en cours d'ouverture)

### Phase 8 — Backend resilience ✅
**1 PR · 2026-05-10**

- ✅ **8.1** `/api/geo-analyze` : `Promise.allSettled` au lieu de `Promise.all`. Une rejection ne 500 plus la requête entière — fail-open par analyzer via `withTimeout` + `resolveOrFallback`.
- ✅ **8.2** Timeouts par analyzer : Lighthouse 15s (PageSpeed externe), autres 5s (cheerio + fetches locaux). `withTimeout()` rejette avec `{ isTimeout: true, label, ms }` pour différencier vs erreur réelle, et `clearTimeout` pour éviter les handles fuyants.
- ✅ **8.3** Réponse partielle : `degraded: { lighthouse, seo, geo, schema, eeat }` (optionnel, présent uniquement quand un ou + analyzers ont échoué). Composite calculé avec fallbacks zéro-score. Console.warn avec les raisons. Composant UI `<GeoDegradedBanner>` rendu en haut de `GeoTabContent` quand `geo.degraded` est défini — liste les analyzers manquants.

**Tests** : 21 nouveaux dans `resilience.test.ts` (withTimeout resolve/reject/cleanup + resolveOrFallback + 5 fallbacks + isAnyDegraded). Total : **285/285 ✅**

**PR** : 🟡 #13 (en cours d'ouverture)

### Phase 14 — Schema-first keyword extraction + LLM SEO suggestions ✅
**1 PR · 2026-05-10**

Statistical extraction (P9 + P13) est descriptif (ce qui EST sur la page). P14 ajoute le prescriptif (ce que la page DEVRAIT viser) via 2 sources complémentaires.

- ✅ **14.A — Schema.org-first** : nouveau `src/lib/analyzer/schema-keywords.ts` qui parse les blocks JSON-LD (Service, Product, Article, Organization, WebSite, LocalBusiness…) pour extraire `canonicalName` + `canonicalDescription` + `category` + `keywords` + `brand`. Ajouté à `KeywordsAnalysis.schemaKeywords`. Affiché en chip group dans HeadingsTab "§ Annoncés via Schema.org".
- ✅ **14.D — LLM suggestions** : nouveau `src/lib/analyzers/keyword-suggestions.ts` qui appelle gpt-4o-mini avec page context (title + meta + h1 + schemaKeywords) et demande "3 mots-clés SEO actionnables". Coût réel ~$0.0002/call. Intégré comme 6ᵉ tâche allSettled dans `/api/geo-analyze`. Affiché dans HeadingsTab "★ Suggestions SEO actionnables · IA" (cartes rouges 2px, distinct des targets statistiques).
- ✅ **Frontend** : nouveau helper `buildPageContext(report)` dans `enrichment.ts`. `fetchGeo` accepte un 2ᵉ argument `pageContext`. Page.tsx + r/[id]/page.tsx passent le contexte automatiquement.

**Tests** : +26 nouveaux (15 schema-keywords + 11 keyword-suggestions). Total : **311/311 ✅**

**PR** : 🟡 #15 (en cours d'ouverture)

### Phase 13 — Multi-keyword targets (top 3) ☐
**Bundlée dans la PR #9 · 2026-05-09**

Découvert immédiatement après P9 : les sites réels (salt.ch fait internet + mobile + abonnement) ont **plusieurs thèmes business**, pas un seul. Le primary unique masque cette réalité.

- ✅ **13.1** Type `KeywordTarget` + helper `selectTopTargets(keywords, n)` qui dédoublonne par chevauchement lexical (skip si partage un mot avec un déjà sélectionné). Ainsi "internet" ⇒ "internet at maximum" droppé, "mobile" ⇒ "mobile subscription" droppé.
- ✅ **13.2** `KeywordsAnalysis` gagne `targets: KeywordTarget[]`. Chaque target porte ses 4 placement booleans (`inTitle`, `inH1`, `inMetaDescription`, `inFirst100Words`).
- ✅ **13.3** UI : 3 chips au-dessus du card "Placement" existant. Primary tint vert, secondaires neutres. Chaque chip = nom + score + 4 mini-badges T/H1/M/100 verts si présents.
- ✅ **13.4 Bonus** Stopwords allemands (60+ mots : der/die/das, und/oder, mit/für/von, ist/sind…) découverts en testant upc.ch (site germanophone) — `und`/`die`/`mit`/`bis` polluaient le top-12.

**Smoke** sur upc.ch : top 3 = `sunrise`, `internet`, `tv entertainment` (UPC est rebrand Sunrise, contenu allemand). Avant : top 3 = `sunrise`, `und`, `internet` (`und` étant pollutant).

### Phase 9 — Keyword extraction v2 ☐
**Bundlée dans la PR #9 · 2026-05-09**

Découvert pendant le smoke test P3 : sunrise.ch détectait "sunrise" comme mot-clé principal, avec issues absurdes ("brand absent du H1", "densité trop élevée 3.2%"). Refonte complète du moteur d'extraction.

- ✅ **9.1** Brand exclusion + display séparé. Helpers `getBrandVariants(url)` (Set de mots dérivés du hostname à filtrer) + `getBrandPrincipal(url)` (label à afficher). `KeywordPlacement` gagne `brand?` + `brandMentions?`. UI : chip mono `§ marque détectée : sunrise (33×) — exclue du calcul SEO` sous le mot-clé principal dans `HeadingsTab`. 12 tests.
- ✅ **9.2** Bigrammes + trigrammes. `extractNGrams(tokens, n, brandVariants)` glisse une fenêtre, exige que **first ET last token** soient candidats (rejette "à très haut" mais tolère "carte de fidélité" — internal stops OK). Boost ×1.5 bigrammes, ×2 trigrammes pour compenser leur rareté naturelle. 3 tests.
- ✅ **9.3** Stopwords étendus (75+ mots) : CTA/nav (accueil, voir, lire, découvrir…), apostrophe artifacts (jusqu, aujourd, lorsqu…), social networks (linkedin, facebook, twitter, instagram…), time (maintenant, hier, demain…), English equivalents. **PAS de géographie** (suisse/paris/genève peuvent être de vrais targets — test pinne cette décision). 4 tests.
- ✅ **9.4** Refactor pondération `Array(N).fill()` → somme pondérée explicite. `SECTION_WEIGHTS = { title: 10, h1: 8, h2: 4, meta: 4, h3: 2, body: 1 }` dans une const tunable. Tokenisation extraite dans helper réutilisable. 2 tests.

**Smoke test live** sur `salt.ch` (fresh URL) :
- Primary : `internet` (au lieu de `salt`)
- Marque détectée : `salt (28×)` — exposée à part, exclue du calcul
- Top 12 inclut bigrammes (`unlimited calls`, `mobile subscription`) et trigrammes (`internet at maximum`, `unlimited calls sms`)
- Aucun CTA/social/time pollutant

**Total tests** : 129/129 verts (+9 nouveaux fichier `keywords.test.ts`).

**PR** : 🟡 (en cours d'ouverture)

### Phase 12 — Add Claude (Anthropic) provider ☐
**1 PR · 2026-05-09 · indépendant · étend l'OQ1**

Claude (Anthropic) manquait totalement du registry des 12 providers. Omission notable vu sa part de marché significative en finance/tech (publics Pixelab cibles).

- ✅ **12.1** Nouveau `src/lib/analyzers/llm-providers/claude.ts` — modèle `claude-haiku-4-5` (le moins cher d'Anthropic, ~$1/1M input + $5/1M output, ~$0.0026/analyse). Header `x-api-key` (pas Bearer), `anthropic-version: 2023-06-01`, body avec `system` top-level, parsing `data.content[0].text`.
- ✅ **12.2** `ClaudeProvider` enregistré dans le Tier 1 du registry. Ajouté aux régions **CH** (6%), **FR** (4%), **BE** (4%), **LU** (5%), **DE** (5%), **AT** (4%), **GB** (7%), **IE** (6%), **US** (10%), **CA** (7%), **GLOBAL** (5%). Exclu des régions asiatiques (CN/KR/JP — pas d'adoption notable).
- ✅ **12.3** 5 tests unitaires : pin du modèle (interdit `sonnet`/`opus` accidentellement), header `x-api-key` (vérifie absence de `Authorization: Bearer`), header `anthropic-version`, parsing `content[0].text`, branche missing-key.
- ✅ **12.4** 11 tests dans `geo-config.test.ts` qui vérifient que `claude` est dans toutes les régions occidentales et absent des asiatiques. L'invariant structurel existant (chaque `llmPriority` a un `marketShare`) couvre les 22 régions.

**Smoke test live** : avec `ANTHROPIC_API_KEY` ajoutée à `.env.local`, `/api/geo-analyze` sur `pixelab.ch` retourne **4 moteurs testés** au lieu de 3 (Gemini + Mistral + ChatGPT + Claude). Claude détecte pixelab avec `confidence: high`, 6 mentions.

**Couverture marché CH** : ~73% (chatgpt 42 + gemini 18 + claude 6 + mistral 3 + autres marginaux non testés). Avant P11+P12 : 0%.

**PR** : 🟡 (en cours d'ouverture)

### Phase 11 — Fixes LLM providers ☐
**1 PR · 2026-05-09 · indépendant · débloque l'OQ1 partiellement**

Découvert au moment de configurer Gemini + Mistral : deux bugs latents bloquent l'indexation IA même quand les clés sont configurées correctement.

- ✅ **11.1** `gemini.ts` : `gemini-pro` (déprécié par Google en 2024, retourne 404) → `gemini-1.5-flash` (free tier actuel). 5 tests unitaires (mock fetch, assert URL, branches indexed/not-indexed/error/missing-key).
- ✅ **11.2** `mistral.ts` : `mistral-large-latest` (payant uniquement) → `mistral-small-latest` (meilleur modèle free tier). 5 tests unitaires.
- ✅ **11.3** `geo-config.ts` : Mistral ajouté aux priorités régionales **CH**, **BE**, **LU**, **GLOBAL** (existait que pour FR). 5 tests dont 1 vérif round-trip que chaque `llmPriority` a son `marketShare` associé sur les 22 régions configurées.
- ✅ **11.4** `chatgpt.ts` : modèle `gpt-4o` → `gpt-4o-mini`. ~50× moins cher (~$0.0001 vs ~$0.005 par analyse) pour une qualité équivalente sur la tâche de reconnaissance de marque. $5 de crédit OpenAI ≈ 50 000 analyses au lieu de ~1 000. 5 tests dont un pin du modèle pour éviter qu'un edit careless ne 50× la facture.

**Smoke test live** : avec `GEMINI_API_KEY` + `MISTRAL_API_KEY` + `OPENAI_API_KEY` dans `.env.local`, `/api/geo-analyze` sur `pixelab.ch` retourne **3 moteurs testés** (Gemini + Mistral + ChatGPT) au lieu de 0 avant la PR. Score indexation : 67/100 (Mistral + ChatGPT connaissent pixelab avec `confidence: high`, Gemini non — vrai signal).

**Note** : OQ1 partiellement résolue — Perplexity/Bing restent non testés faute de clés. Avec Gemini (gratuit) + Mistral (gratuit) + ChatGPT (~$5 dure des dizaines de milliers d'analyses), on couvre **environ 70% du marché IA en Suisse** (42% ChatGPT + 18% Gemini + 3% Mistral + petites diff selon adoption).

**PR** : 🟡 (en cours d'ouverture)

### Phase 10 — Dédupliquer l'affichage des liens internes ✅
**1 PR · 2026-05-10**

- ✅ **10.1** Nouveau helper `src/lib/analyzer/dedup-links.ts` (`groupLinksByHref`) qui groupe par href canonique, collecte les textes d'ancrage uniques en ordre d'apparition, OR-merge les attributs nofollow/sponsored/ugc (pessimiste), préserve l'ordre d'insertion
- ✅ **10.2** `LinksTab` utilise le helper pour les **deux** tables (internes + externes) — affichage : `URL · ×N badge si >1 · texts joined " · " · attrs OR-merged`
- ✅ **10.3** Titre de section adapté : `N URL uniques (M liens DOM)` pour conserver la transparence sur le total brut. Backend `links.ts` inchangé.

**Tests** : 9 nouveaux dans `dedup-links.test.ts` (regression empty / single / dup count / unique texts / insertion order / OR merge attrs / fixture sunrise-shaped). Total : **264/264 ✅**

**PR** : 🟡 #12 (en cours d'ouverture)

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
