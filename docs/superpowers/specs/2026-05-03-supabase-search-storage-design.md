# Phase 1 — Stockage Supabase des recherches utilisateurs

**Date** : 2026-05-03
**Auteur** : Pixelab (Dardan Tushi)
**Statut** : Spec validée, prête à plan d'implémentation

---

## 1. Contexte & objectif

Aujourd'hui Swissalytics stocke les rapports d'analyse en mémoire (`InMemoryReportsRepository`, `src/lib/engine/inMemoryRepository.ts`). Conséquences :

- Tout est perdu au reboot du container Docker
- Aucune persistance des recherches → impossible de retargeter les utilisateurs / propriétaires de sites pour des services SEO Pixelab
- Permalinks `/r/<id>` cassés après chaque deploy

**Objectif Phase 1** : remplacer le stockage in-memory par Supabase (free tier, projet existant) pour :

1. **Persister chaque recherche utilisateur** (URL analysée + métadonnées) → base de prospects pour retargeting Pixelab
2. **Permalinks et liens de partage qui survivent aux deploys**
3. **Donner du sens au cron de purge** (rétention 180j devient réelle)
4. **Améliorer la lisibilité des permalinks** : passer de nanoid 12 chars → slug human-readable basé sur le domaine analysé

## 2. Non-goals (Phase 2+)

Hors scope de cette itération :

- Capture d'email utilisateur (formulaire "recevoir le PDF par email")
- Envoi d'email avec PDF en pièce jointe (Resend/SMTP)
- Dashboard admin pour visualiser les leads
- Workflow de retargeting automatisé
- Migration vers Redis pour le rate limiter
- Mise en place du multi-instance (charge balanceur)

Ces sujets seront traités en Phase 2 ou plus tard.

## 3. Décisions architecturales (validées)

| Décision | Choix | Raison |
|---|---|---|
| **Stockage** | Full DB swap : `InMemoryRepo` → `SupabaseRepo` | Code déjà prêt (interface `ReportsRepository`, `DB_SWAP.md`). Supprime tout l'in-memory. |
| **Permalinks** | Slug `/r/<domain-slug>-<4chars>` | Lisible, SEO-friendly, unique sans race condition |
| **Métadonnées additionnelles** | `ip_hash`, `country`, `user_agent`, `referrer` | Qualification lead (filtrer .ch, mobile/desktop, source) |
| **Mode dégradé** | Best effort, fail open | L'analyse reste le produit ; storage est bonus |
| **Timeout Supabase** | 3s | Couvre cold starts free tier sans bloquer user |
| **Region Supabase** | `eu-central-1` (Frankfurt) | ~15 ms RTT depuis Suisse |
| **Hashing IP** | HMAC-SHA-256 + sel serveur | Pseudonymisation RGPD |
| **Health monitoring** | Endpoint `GET /api/health` | Permet alerting externe (Uptime Robot, Better Stack) |
| **RGPD** | Mise à jour mentions-légales + privacy policy | Mentionner collecte IP hashée, country, UA, referrer |
| **Rate limiting** | Existing suffit (5/h + 50/jour sur écritures) | Déjà protectif contre génération en masse |

## 4. Architecture

### 4.1 Vue d'ensemble

```
┌────────────────────┐
│   POST /api/analyze│  (utilisateur clique "Analyser")
└──────────┬─────────┘
           │
           ▼
┌──────────────────────────────────┐
│ 1. Crawl + score (10-30s)        │
│    indépendant de Supabase       │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ 2. Try INSERT Supabase (3s max)  │
│    avec slug généré              │
└──────────┬──────────────┬────────┘
           │              │
       success           timeout/error
           │              │
           ▼              ▼
┌─────────────────┐  ┌──────────────────────┐
│ Response:       │  │ Response:            │
│ {reportId,      │  │ {reportId: null,     │
│  report,        │  │  report,             │
│  cached: false} │  │  degraded: true}     │
└─────────────────┘  └──────────────────────┘
```

### 4.2 Composants modifiés / créés

**Nouveau** :

- `src/lib/engine/supabaseRepository.ts` — implémentation `ReportsRepository` qui parle à Supabase
- `src/lib/engine/slug.ts` — génération de slug depuis hostname
- `src/lib/security/ipHash.ts` — HMAC-SHA-256 d'IP avec sel serveur
- `src/app/api/health/route.ts` — endpoint santé (vérifie connexion Supabase)
- Migration SQL : `supabase/migrations/20260503_init.sql`

**Modifié** :

- `src/lib/engine/repositoryInstance.ts` — un seul `return new SupabaseReportsRepository(...)` à la place de l'in-memory
- `src/lib/engine/ids.ts` — `newReportId()` accepte un hostname et renvoie `<slug>-<4chars>`
- `src/app/api/analyze/route.ts` — capture `ip_hash`, `country`, `user_agent`, `referrer` ; gère le cas `reportId: null` (fail-open)
- `src/components/report/ReportView.tsx` — affiche un banner discret si `reportId` est null
- `src/app/page.tsx` — propage le flag `degraded` dans le state
- `src/app/mentions-legales/page.tsx` — ajoute mention de la collecte
- `src/app/a-propos/page.tsx` — section privacy à compléter
- `deploy.sh` — ajoute env vars Supabase (URL, service_role_key, ip_hash_salt)

**Supprimé** :

- `src/lib/engine/inMemoryRepository.ts` — plus utilisé

**Conservé tel quel** :

- `src/lib/engine/cache.ts` — cache LRU `(url, lang) → reportId` reste comme couche d'optimisation devant Supabase. Réduit la charge en lecture (dedup hit dans la fenêtre de 1h n'aller que jusqu'à la RAM). Côté logique : avant `repo.findRecent()`, on tente `cacheGet()` ; après un `repo.save()` réussi, on appelle `cacheSet()`.

### 4.3 Schema Supabase (Postgres)

```sql
-- Migration: 20260503_init.sql

CREATE TABLE reports (
  id                  VARCHAR(64) PRIMARY KEY,           -- slug "pixelab-ch-a8x4"
  url                 TEXT NOT NULL,
  lang                CHAR(2) NOT NULL CHECK (lang IN ('fr','en')),
  score               INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crawl_ms            INTEGER NOT NULL,
  share_token         VARCHAR(32) UNIQUE,
  share_expires_at    TIMESTAMPTZ,
  data                JSONB NOT NULL,                    -- AnalysisReport JSON

  -- Métadonnées retargeting
  ip_hash             CHAR(64),                          -- HMAC-SHA-256 hex
  country             CHAR(2),                           -- ISO code (CH, FR, ...)
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

-- Pour analytics/retargeting Pixelab plus tard
CREATE INDEX reports_country_created_idx
  ON reports(country, created_at DESC)
  WHERE country IS NOT NULL;
```

**Row Level Security (RLS)** : on **désactive** RLS sur cette table car toutes les opérations passent côté serveur via la `service_role_key`. Pas d'accès direct depuis le navigateur.

### 4.4 Génération de slug (`src/lib/engine/slug.ts`)

```ts
import { customAlphabet } from 'nanoid';

const suffixAlphabet = '23456789abcdefghijkmnpqrstuvwxyz';
const nanoSuffix = customAlphabet(suffixAlphabet, 4);

/**
 * Build a permalink slug from an analyzed URL.
 *   "https://pixelab.ch/about" → "pixelab-ch-a8x4"
 *   "https://www.shop.example.com" → "shop-example-com-x9k2"
 */
export function newReportSlug(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  const slug = hostname
    .replace(/[^a-z0-9.-]/g, '')   // strip non-allowed
    .replace(/\./g, '-')           // dots → dashes
    .replace(/-+/g, '-')           // collapse dashes
    .replace(/^-|-$/g, '')         // trim
    .substring(0, 40);              // cap length
  return `${slug}-${nanoSuffix()}`;
}
```

**Cas limites couverts** :
- IDN (domaines accentués) : `URL` les normalise déjà en punycode → ASCII safe
- Domaine très long : tronqué à 40 chars
- Caractères spéciaux (port, path) : ignorés (on prend juste hostname)
- Collisions : 28^4 = 614 656 combinaisons par domaine → infinitésimal

### 4.5 Hashing IP (`src/lib/security/ipHash.ts`)

```ts
import { createHmac } from 'crypto';

const SALT = process.env.IP_HASH_SALT;
if (!SALT) throw new Error('IP_HASH_SALT not configured');

export function hashIp(ip: string): string {
  return createHmac('sha256', SALT).update(ip).digest('hex');
}
```

Le sel doit être **stable** (sinon les hash changent entre deploys et on perd la cohérence retargeting), **secret** (sinon rainbow table possible), et **différent par environnement** (dev vs prod).

### 4.6 Failure mode (fail-open)

Dans `src/app/api/analyze/route.ts`, le flow d'écriture devient :

```ts
const stored: StoredReport = {
  id: newReportSlug(canonicalUrl),
  url: canonicalUrl,
  lang,
  score: report.score,
  createdAt: Date.now(),
  crawlMs: durationMs,
  shareToken: null,
  shareExpiresAt: null,
  data: report,
  ipHash: hashIp(clientIp),
  country: req.headers.get('cf-ipcountry') ?? null,
  userAgent: req.headers.get('user-agent') ?? null,
  referrer: req.headers.get('referer') ?? null,
};

let persistedId: string | null = stored.id;
try {
  await Promise.race([
    repo.save(stored),
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('Supabase timeout')), 3000),
    ),
  ]);
} catch (err) {
  console.error('[CRITICAL] Supabase write failed, fail-open mode:', err);
  persistedId = null;
}

return NextResponse.json({
  reportId: persistedId,
  report: stored.data,
  degraded: persistedId === null,
});
```

L'utilisateur reçoit toujours son rapport. Si `persistedId === null`, le frontend cache les boutons "Partager" / "Copier permalink" et affiche un banner.

**Comportement de la dedup en mode dégradé** : si `repo.findRecent()` échoue (Supabase down), on traite ça comme "cache miss" et on relance un crawl complet. Pas de blocage. Le cache LRU en RAM (`cache.ts`) sert toujours de première ligne de défense — il reste valide même si Supabase est inaccessible, jusqu'au prochain reboot du container.

### 4.7 Endpoint santé

`GET /api/health` :

```ts
export async function GET() {
  const startedAt = Date.now();
  let supabase: 'up' | 'down' = 'down';
  try {
    await Promise.race([
      getReportsRepo().listRecent(1),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('timeout')), 3000),
      ),
    ]);
    supabase = 'up';
  } catch {
    supabase = 'down';
  }
  return NextResponse.json({
    status: supabase === 'up' ? 'ok' : 'degraded',
    supabase,
    latencyMs: Date.now() - startedAt,
    version: process.env.npm_package_version,
  }, {
    status: supabase === 'up' ? 200 : 503,
  });
}
```

Sortie : Uptime Robot peut pinger ce endpoint toutes les 5 min et alerter Pixelab si `status !== 'ok'`.

## 5. UX en mode dégradé

Quand `reportId === null`, on affiche un banner en haut du rapport (sous le `MetricStrip`) :

> ⚠️ **Sauvegarde temporairement indisponible.** Votre rapport est affiché ici mais ne pourra pas être consulté à nouveau plus tard. Téléchargez le PDF si vous voulez le garder.

Composants affectés :

- `ReportView.tsx` — un nouveau bloc conditionnel `{degraded && <DegradedBanner />}` juste après le titre
- Boutons "Partager" et "Copier permalink" cachés (`reportId === null` les bloque déjà naturellement)

Style : aligné avec le brutalist v2 — `border: 2px solid var(--sa-red); padding: 16px; background: var(--sa-cream);`

## 6. RGPD / Privacy

### 6.1 Données collectées

| Champ | Type | Pseudonymisé | Légal sans consent |
|---|---|---|---|
| `url` | URL analysée | Public | ✅ |
| `lang` | fr/en | Préférence | ✅ |
| `score` | int | Calculé | ✅ |
| `data` | JSONB | Analyse de page publique | ✅ |
| `ip_hash` | HMAC-SHA-256 | Pseudonymisé | ✅ (intérêt légitime, anti-abuse) |
| `country` | ISO code | Agrégat | ✅ |
| `user_agent` | string | Préférence appareil | ✅ |
| `referrer` | URL | Source de visite | ✅ |

**Base légale** : intérêt légitime (analytics produit + sécurité anti-abus). Pas de cookie banner nécessaire (pas de cookie stocké côté client).

### 6.2 Mises à jour pages

- **`mentions-legales/page.tsx`** : ajouter section "Données collectées lors d'une analyse"
- **`a-propos/page.tsx`** : section privacy expliquant la collecte et son usage
- **`/llms.txt`** : à laisser tel quel (déjà publié)

Texte type pour `mentions-legales` :

> **Données collectées lors d'une analyse**
>
> Lorsque vous analysez un site avec Swissalytics, nous enregistrons :
> - L'URL analysée et la langue de l'interface
> - Le score d'analyse et les détails techniques de la page (rapport)
> - Une empreinte cryptographique de votre adresse IP (HMAC-SHA-256, non réversible) à des fins de sécurité et de mesure d'usage agrégée
> - Votre pays (déduit de l'IP), navigateur (user-agent) et page d'origine (referrer)
>
> Ces données sont conservées 180 jours puis automatiquement supprimées. Elles servent à améliorer le service et, le cas échéant, à proposer nos services SEO Pixelab aux propriétaires de sites analysés. Aucune donnée nominative (email, nom) n'est collectée à cette étape.
>
> Hébergement : Supabase (UE — Francfort).

## 7. Migration / rollout

### 7.1 Pas de backfill

L'`InMemoryRepo` actuel est… vide à chaque restart. Donc rien à migrer. Le nouveau repo démarre de zéro.

### 7.2 Plan de deploy

1. Créer le projet Supabase (free tier, region eu-central-1) — *user action*
2. Récupérer URL + service_role_key — *user action*
3. Lancer la migration SQL `20260503_init.sql` — Supabase SQL Editor
4. Ajouter env vars dans `deploy.sh` :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `IP_HASH_SALT` (générer 32 bytes random)
5. Implémenter le code (suit le plan d'implémentation, pas dans cette spec)
6. Tester en local avec une instance Supabase de dev
7. Deploy en prod
8. Vérifier `/api/health` retourne `{ status: 'ok' }`
9. Faire une analyse test, vérifier que la ligne apparaît dans Supabase
10. Monitoring : connecter Uptime Robot sur `/api/health`

### 7.3 Rollback

Si Supabase pose problème sévère en prod :

- Quick fix : revert le commit qui swap le repo + redeploy → retour in-memory
- L'historique des recherches Supabase est conservé (pas de perte de données)
- Re-tenter le swap quand le problème est diagnostiqué

## 8. Tests

### 8.1 Tests unitaires (Phase 1.5, optionnel)

- `slug.ts` : cas WWW, IDN, port, longs domaines, dashes multiples
- `ipHash.ts` : déterminisme avec même sel, divergence avec sel différent
- `SupabaseRepository` : mocked client, vérifie le mapping row ↔ StoredReport

### 8.2 Tests manuels obligatoires

- [ ] Analyser pixelab.ch : rapport apparaît, slug = `pixelab-ch-XXXX`
- [ ] Refresh `/r/pixelab-ch-XXXX` : rapport se charge depuis Supabase
- [ ] Vérifier dans Supabase Studio que la ligne contient `ip_hash`, `country`, `user_agent`, `referrer`
- [ ] Re-analyser pixelab.ch dans la même heure → cache hit (1 nouvelle ligne en base, pas de re-crawl)
- [ ] `GET /api/health` → `{ status: 'ok' }`
- [ ] Couper la connexion Supabase (env var malformée) → analyse fonctionne, banner dégradé apparaît, `reportId: null`
- [ ] `GET /api/health` en mode coupé → `{ status: 'degraded', supabase: 'down' }`, statut HTTP 503
- [ ] Rétablir Supabase → analyse stocke à nouveau

## 9. Observabilité

Logs critiques à émettre côté serveur :

- `[CRITICAL] Supabase write failed, fail-open mode: <err>` — chaque écriture échouée
- `[INFO] Supabase write OK in <X>ms id=<slug>` — chaque écriture réussie (debug only, pas en prod par défaut)
- `[CRITICAL] Supabase health check failed: <err>` — chaque check santé échoué

À surveiller en prod après deploy :

- Taux d'écriture réussie > 99% sur 24h
- Latence p99 < 1s
- Pas de spike de mode dégradé corrélé à un trafic normal

## 10. Annexes

### 10.1 Variables d'environnement

```bash
# .env.production / deploy.sh
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...        # JAMAIS exposer côté client
IP_HASH_SALT=<32 bytes hex random>          # ex: openssl rand -hex 32
```

### 10.2 Coût Supabase free tier

- DB : 500 MB inclus
- Bandwidth : 5 GB / mois
- Avec ~200 KB par rapport, on peut stocker ~2500 rapports avant d'atteindre la limite.
- Le cron de purge à 180j devrait largement maintenir sous la limite tant que le trafic reste < 14 rapports/jour en moyenne.
- Au-dessus, soit upgrade vers Pro ($25/mo, 8 GB), soit raccourcir la rétention.

### 10.3 Références dans le codebase

- Interface persistance : `src/lib/engine/repository.ts:10-57`
- Swap point : `src/lib/engine/repositoryInstance.ts:21-25`
- Schéma SQL Postgres préliminaire : `src/lib/engine/DB_SWAP.md:248-266`
- ID generation actuel : `src/lib/engine/ids.ts:15-21`
- Rate limiting : `src/lib/security/rateLimit.ts:47-50`
- Génération PDF (côté client, intact) : `src/lib/pdf/generateReport.ts`
- Banner UX (à créer) : `src/components/report/DegradedBanner.tsx`
