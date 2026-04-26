/**
 * Compare — static comparison pages.
 *
 * Comparison pages live at /compare/[slug]. They are conversion-oriented
 * (not editorial) and follow the SEO playbook of one page per competitor.
 *
 * FR-first; `*En` fields are the English fallbacks.
 * Slugs follow the pattern `swissalytics-vs-<competitor>`.
 */

export type CompareBlock =
  | { type: 'p'; html: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string };

export type CompareRow = {
  /** Dimension being compared (e.g. "Prix", "Couverture LLM") */
  dimension: string;
  dimensionEn?: string;
  /** What Swissalytics offers on this dimension */
  swissalytics: string;
  swissalyticsEn?: string;
  /** What the competitor offers on this dimension */
  competitor: string;
  competitorEn?: string;
  /** Optional verdict pill: 'sa-wins' | 'tie' | 'competitor-wins' */
  verdict?: 'sa-wins' | 'tie' | 'competitor-wins';
};

export type CompareWhenItem = {
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
};

export type CompareFaq = {
  q: string;
  qEn?: string;
  a: string;
  aEn?: string;
};

export type ComparePage = {
  slug: string;
  /** Display name of the competitor (e.g. "Semrush") */
  competitor: string;
  /** Two-letter monogram for the brutalist competitor card */
  competitorMonogram: string;
  /** Category hint shown in kicker */
  competitorCategory: string;
  competitorCategoryEn?: string;
  /** Canonical homepage of the competitor (for citation honesty) */
  competitorUrl: string;
  /** Where the competitor company is headquartered */
  competitorHq: string;

  /** "See how X compares to Y" — used in <title> and OG */
  metaTitle: string;
  metaTitleEn?: string;
  /** Meta description — used in <meta name="description"> and OG */
  metaDescription: string;
  metaDescriptionEn?: string;
  /** H1 — "Swissalytics vs Y" */
  h1: string;
  h1En?: string;
  /** Lead paragraph (HTML allowed) — sets up the comparison */
  lead: string;
  leadEn?: string;
  /** TL;DR — one-sentence verdict shown in a black box */
  tldr: string;
  tldrEn?: string;

  /** Comparison table rows */
  rows: CompareRow[];

  /** "Choose Swissalytics if…" bullets */
  whenSwissalytics: CompareWhenItem[];
  /** "Choose [Competitor] if…" bullets */
  whenCompetitor: CompareWhenItem[];

  /** Free-form analysis sections (HTML in p.html) */
  body: CompareBlock[];
  bodyEn?: CompareBlock[];

  /** FAQ — extracted by AI Overviews */
  faq: CompareFaq[];

  /** ISO date — first published */
  date: string;
  /** ISO date — last reviewed (shown to user as "mis à jour") */
  updated: string;
};

// ─────────────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────────────

export const COMPARE_PAGES: ComparePage[] = [
  // ═══════════════════════════════════════════════════════════════════
  // Swissalytics vs Semrush
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'swissalytics-vs-semrush',
    competitor: 'Semrush',
    competitorMonogram: 'SE',
    competitorCategory: 'Suite SEO classique',
    competitorCategoryEn: 'Classic SEO suite',
    competitorUrl: 'https://www.semrush.com',
    competitorHq: 'Boston, US',

    metaTitle:
      'Swissalytics vs Semrush — comparatif honnête (2026)',
    metaTitleEn:
      'Swissalytics vs Semrush — an honest comparison (2026)',
    metaDescription:
      "Semrush domine le SEO classique, Swissalytics se concentre sur la visibilité IA (GEO). Prix, fonctionnalités, cas d'usage : on tranche sans détour.",
    metaDescriptionEn:
      'Semrush leads classic SEO, Swissalytics focuses on AI search visibility (GEO). Pricing, features, use cases — a no-spin breakdown.',

    h1: 'Swissalytics vs Semrush',
    h1En: 'Swissalytics vs Semrush',

    lead:
      "Semrush est la <b>référence du SEO classique</b> depuis 2008 : recherche de mots-clés, suivi de positions, analyse de backlinks. Swissalytics est un <b>outil gratuit d'analyse GEO</b> (visibilité dans ChatGPT, Perplexity, Gemini) édité depuis Genève. <i>Les deux outils ne font pas le même métier</i> — et c'est exactement pour ça qu'on les compare ici.",
    leadEn:
      'Semrush has been the <b>classic SEO benchmark</b> since 2008: keyword research, rank tracking, backlink analysis. Swissalytics is a <b>free GEO analyser</b> (visibility in ChatGPT, Perplexity, Gemini) built out of Geneva. <i>The two tools do not do the same job</i> — and that is precisely why this comparison exists.',

    tldr:
      "Semrush gagne sur la profondeur SEO classique. Swissalytics gagne sur le GEO, le prix (gratuit), et la rapidité d'audit. Si vous démarrez en GEO, commencez ici.",
    tldrEn:
      'Semrush wins on classic SEO depth. Swissalytics wins on GEO, pricing (free), and audit speed. If you are starting with GEO, start here.',

    rows: [
      {
        dimension: 'Prix de départ',
        dimensionEn: 'Entry pricing',
        swissalytics: 'Gratuit, sans compte, sans CB',
        swissalyticsEn: 'Free, no account, no card',
        competitor: 'À partir de 139,95 $/mois (plan Pro)',
        competitorEn: 'From $139.95/month (Pro plan)',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Audit en un clic',
        dimensionEn: 'One-click audit',
        swissalytics: 'Oui — URL en entrée, rapport en 30 secondes',
        swissalyticsEn: 'Yes — paste URL, full report in 30 seconds',
        competitor:
          'Oui via Site Audit, mais nécessite un projet et une configuration',
        competitorEn:
          'Yes via Site Audit, but requires a project and setup',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Visibilité IA / GEO',
        dimensionEn: 'AI search / GEO visibility',
        swissalytics:
          'Cœur du produit. Détection sur 12 LLM (ChatGPT, Claude, Perplexity, Gemini, Mistral…)',
        swissalyticsEn:
          'Core product. Tracks 12 LLMs (ChatGPT, Claude, Perplexity, Gemini, Mistral…)',
        competitor:
          'AI Toolkit ajouté en 2024, encore en évolution — couverture LLM partielle',
        competitorEn:
          'AI Toolkit added in 2024, still maturing — partial LLM coverage',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Recherche de mots-clés',
        dimensionEn: 'Keyword research',
        swissalytics: 'Hors scope — outil non couvert',
        swissalyticsEn: 'Out of scope — not covered',
        competitor:
          'Base de 25 milliards de mots-clés, données historiques, intent SERP',
        competitorEn:
          '25-billion-keyword database, historical data, SERP intent',
        verdict: 'competitor-wins',
      },
      {
        dimension: 'Analyse de backlinks',
        dimensionEn: 'Backlink analysis',
        swissalytics: 'Hors scope',
        swissalyticsEn: 'Out of scope',
        competitor:
          '43 000 milliards de backlinks indexés, scores d\'autorité, alertes',
        competitorEn:
          '43-trillion backlink index, authority scoring, alerts',
        verdict: 'competitor-wins',
      },
      {
        dimension: 'Audit technique on-page',
        dimensionEn: 'Technical on-page audit',
        swissalytics:
          'Core Web Vitals, headings, JSON-LD, images, alt, liens — analyse multi-pages',
        swissalyticsEn:
          'Core Web Vitals, headings, JSON-LD, images, alt, links — multi-page analysis',
        competitor:
          'Site Audit complet (140+ checks), mais limité par plan',
        competitorEn:
          'Full Site Audit (140+ checks), but limited per plan',
        verdict: 'tie',
      },
      {
        dimension: 'Plan d\'action priorisé',
        dimensionEn: 'Prioritized action plan',
        swissalytics:
          'Oui — critique / amélioration / suggestion, en français comme en anglais',
        swissalyticsEn:
          'Yes — critical / recommended / suggestion, in French and English',
        competitor:
          'Oui via Site Audit, plus long à parcourir, vocabulaire technique',
        competitorEn:
          'Yes via Site Audit, longer to navigate, more technical vocabulary',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Export PDF',
        dimensionEn: 'PDF export',
        swissalytics: 'Inclus, gratuit',
        swissalyticsEn: 'Included, free',
        competitor: 'Inclus dans tous les plans payants',
        competitorEn: 'Included on all paid plans',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Multilingue (interface)',
        dimensionEn: 'Multilingual (UI)',
        swissalytics: 'FR + EN nativement',
        swissalyticsEn: 'FR + EN natively',
        competitor: 'EN uniquement (UI)',
        competitorEn: 'EN only (UI)',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Compte / friction',
        dimensionEn: 'Account / friction',
        swissalytics: 'Aucun compte, aucun email demandé',
        swissalyticsEn: 'No account, no email collected',
        competitor: 'Compte requis dès l\'essai gratuit (limité à 10 audits)',
        competitorEn: 'Account required even for trial (capped at 10 audits)',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Hébergement',
        dimensionEn: 'Hosting',
        swissalytics: 'Hébergé à Genève (Infomaniak)',
        swissalyticsEn: 'Hosted in Geneva (Infomaniak)',
        competitor: 'Hébergé aux US (AWS)',
        competitorEn: 'Hosted in the US (AWS)',
        verdict: 'tie',
      },
      {
        dimension: 'Édité par',
        dimensionEn: 'Operated by',
        swissalytics: 'Pixelab — agence web suisse, Genève',
        swissalyticsEn: 'Pixelab — Swiss web agency, Geneva',
        competitor: 'Semrush Inc. — entreprise cotée Nasdaq (SEMR)',
        competitorEn: 'Semrush Inc. — Nasdaq-listed (SEMR)',
        verdict: 'tie',
      },
    ],

    whenSwissalytics: [
      {
        title: 'Vous voulez savoir si ChatGPT cite votre site',
        titleEn: 'You want to know if ChatGPT cites your site',
        body:
          "C'est exactement le métier de Swissalytics. Semrush ne couvre cette dimension qu'à la marge.",
        bodyEn:
          'That is exactly what Swissalytics is built for. Semrush only covers this dimension at the edges.',
      },
      {
        title: 'Vous avez un budget marketing limité',
        titleEn: 'You have a limited marketing budget',
        body:
          'Swissalytics est gratuit. Semrush démarre à 139 $/mois soit ~1 700 $/an pour le plan d\'entrée.',
        bodyEn:
          'Swissalytics is free. Semrush starts at $139/mo, roughly $1,700/year for the entry tier.',
      },
      {
        title: 'Vous voulez un audit ponctuel, pas une plateforme',
        titleEn: 'You want a one-off audit, not a platform',
        body:
          "Swissalytics se rentabilise en 30 secondes. Semrush demande un investissement temps pour configurer projet, suivis, alertes.",
        bodyEn:
          'Swissalytics pays off in 30 seconds. Semrush demands time to set up projects, tracking, and alerts.',
      },
      {
        title: 'Vous travaillez sur le marché suisse ou francophone',
        titleEn: 'You work on the Swiss or French-speaking market',
        body:
          "Interface FR native, signaux locaux pris en compte (Schema.org Organization avec adresse CH, etc.).",
        bodyEn:
          'Native FR interface, local signals taken into account (Schema.org Organization with CH address, etc.).',
      },
    ],

    whenCompetitor: [
      {
        title: 'Vous faites du SEO classique à temps plein',
        titleEn: 'You do classic SEO full-time',
        body:
          "Semrush reste imbattable sur la recherche de mots-clés, le suivi de positions multi-pays, l'analyse de backlinks à grande échelle.",
        bodyEn:
          'Semrush remains unmatched for keyword research, multi-country rank tracking, and large-scale backlink analysis.',
      },
      {
        title: 'Vous gérez plusieurs gros sites en parallèle',
        titleEn: 'You manage several large sites in parallel',
        body:
          "La gestion multi-projets, alertes, partage d'équipe est centrale chez Semrush. Swissalytics fait des audits ponctuels.",
        bodyEn:
          'Multi-project management, alerts, and team sharing are central to Semrush. Swissalytics does one-off audits.',
      },
      {
        title: "Vous avez besoin d'analyse concurrentielle SEO poussée",
        titleEn: 'You need deep SEO competitive analysis',
        body:
          "Le module Competitive Research de Semrush (parts de voix, mots-clés communs, écarts) n'a pas d'équivalent gratuit.",
        bodyEn:
          'Semrush Competitive Research (share of voice, common keywords, gaps) has no free equivalent.',
      },
    ],

    body: [
      {
        type: 'h2',
        text: 'Pourquoi le GEO change la donne',
      },
      {
        type: 'p',
        html:
          "En 2024, Google a intégré les <b>AI Overviews</b>. En 2025, ChatGPT a dépassé 400 millions d'utilisateurs hebdomadaires. Résultat : sur de plus en plus de requêtes, les internautes lisent une <i>réponse synthétique</i> qui cite quelques sources — et ne cliquent jamais sur la liste de liens bleus en dessous.",
      },
      {
        type: 'p',
        html:
          "Pour une marque, être <b>cité</b> dans cette réponse vaut désormais plus qu'être en première position sur une requête longue traîne. Et les facteurs qui font qu'un LLM cite votre site ne sont <i>pas</i> les mêmes que ceux qui font monter votre Authority Score Semrush.",
      },
      {
        type: 'quote',
        text:
          "« Semrush vous dit comment ranker sur Google. Swissalytics vous dit comment être cité par ChatGPT. Les deux comptent en 2026. »",
      },
      {
        type: 'h2',
        text: 'Le prix : 0 € vs 1 700 $/an',
      },
      {
        type: 'p',
        html:
          "Semrush facture en USD : <b>139,95 $/mois</b> sur le plan Pro (le seul utilisable en agence), soit <b>1 679 $/an</b>. Le plan Guru démarre à 249,95 $/mois. Le plan Business à 499,95 $/mois. C'est cohérent pour une agence SEO qui passe ses journées dans l'outil — pas pour un dirigeant qui veut savoir une fois par trimestre où en est son site.",
      },
      {
        type: 'p',
        html:
          "Swissalytics est <b>gratuit</b>, sans compte, sans email demandé. Le modèle : Pixelab édite l'outil pour démontrer son expertise et générer des audits commerciaux qualifiés. Vous ne payez rien — vous voyez ce qui ne va pas, vous corrigez vous-même, ou vous nous contactez pour de l'accompagnement.",
      },
      {
        type: 'h2',
        text: "L'honnêteté sur ce que Swissalytics ne fait pas",
      },
      {
        type: 'p',
        html:
          "Swissalytics <b>ne remplace pas Semrush</b> sur trois dimensions : la recherche de mots-clés à grande échelle, l'analyse de backlinks, et le suivi de positions multi-pays sur des milliers de mots-clés. Si c'est votre métier au quotidien, gardez Semrush.",
      },
      {
        type: 'p',
        html:
          "Mais si vous voulez savoir <b>comment votre site est perçu par les moteurs IA</b> et obtenir un <b>plan d'action immédiat</b>, c'est exactement ce que Swissalytics fait — et que Semrush ne fait pas (encore) bien.",
      },
    ],

    bodyEn: [
      {
        type: 'h2',
        text: 'Why GEO changes the game',
      },
      {
        type: 'p',
        html:
          'In 2024, Google rolled out <b>AI Overviews</b>. In 2025, ChatGPT crossed 400 million weekly users. The result: on more and more queries, people read a <i>synthesised answer</i> that cites a handful of sources — and never click the list of blue links below.',
      },
      {
        type: 'p',
        html:
          "For a brand, being <b>cited</b> in that answer is now worth more than ranking first on a long-tail query. And the factors that make an LLM cite your site are <i>not</i> the same as the ones that grow your Semrush Authority Score.",
      },
      {
        type: 'quote',
        text:
          '"Semrush tells you how to rank on Google. Swissalytics tells you how to get cited by ChatGPT. Both matter in 2026."',
      },
      {
        type: 'h2',
        text: 'Pricing: 0 € vs $1,700/year',
      },
      {
        type: 'p',
        html:
          "Semrush bills in USD: <b>$139.95/month</b> on the Pro plan (the only one usable inside an agency), i.e. <b>$1,679/year</b>. Guru starts at $249.95/mo, Business at $499.95/mo. That makes sense for an SEO agency living in the tool — not for a founder who wants a quarterly health check on their site.",
      },
      {
        type: 'p',
        html:
          'Swissalytics is <b>free</b>, no account, no email. The model: Pixelab operates the tool to demonstrate expertise and generate qualified leads for custom audits. You pay nothing — you see what is wrong, you fix it yourself, or you reach out for a hands-on engagement.',
      },
      {
        type: 'h2',
        text: 'Honest about what Swissalytics does not do',
      },
      {
        type: 'p',
        html:
          'Swissalytics <b>does not replace Semrush</b> on three dimensions: large-scale keyword research, backlink analysis, and multi-country rank tracking on thousands of keywords. If that is your daily job, keep Semrush.',
      },
      {
        type: 'p',
        html:
          "But if you want to know <b>how AI engines perceive your site</b> and get an <b>immediate action plan</b>, that is exactly what Swissalytics does — and what Semrush does not (yet) do well.",
      },
    ],

    faq: [
      {
        q: 'Swissalytics remplace-t-il Semrush ?',
        qEn: 'Does Swissalytics replace Semrush?',
        a:
          "Non. Semrush est une suite SEO complète (keywords, backlinks, suivi de positions). Swissalytics se concentre sur l'audit GEO (visibilité IA) et l'audit technique on-page. Les deux outils sont complémentaires — Swissalytics couvre une dimension que Semrush ne couvre que partiellement.",
        aEn:
          'No. Semrush is a full SEO suite (keywords, backlinks, rank tracking). Swissalytics focuses on GEO audits (AI visibility) and on-page technical audits. The two tools are complementary — Swissalytics covers a dimension Semrush only partially addresses.',
      },
      {
        q: 'Swissalytics est-il vraiment gratuit ?',
        qEn: 'Is Swissalytics really free?',
        a:
          "Oui, totalement. Pas de compte, pas de carte bancaire, pas de limite de crédit cachée. Pixelab édite Swissalytics pour démontrer son expertise GEO et obtenir des contacts pour des audits sur mesure.",
        aEn:
          'Yes, fully. No account, no credit card, no hidden credit limits. Pixelab operates Swissalytics to demonstrate its GEO expertise and generate leads for custom audits.',
      },
      {
        q: 'Combien coûte Semrush ?',
        qEn: 'How much does Semrush cost?',
        a:
          "Trois plans payants : Pro à 139,95 $/mois, Guru à 249,95 $/mois, Business à 499,95 $/mois. Un essai gratuit de 14 jours est disponible mais limite le nombre d'audits.",
        aEn:
          'Three paid plans: Pro at $139.95/mo, Guru at $249.95/mo, Business at $499.95/mo. A 14-day free trial is available but caps the number of audits.',
      },
      {
        q: 'Swissalytics analyse-t-il la visibilité dans ChatGPT ?',
        qEn: 'Does Swissalytics analyse ChatGPT visibility?',
        a:
          "Oui — c'est sa fonction principale. Swissalytics évalue la visibilité d'un site sur 12 moteurs IA dont ChatGPT, Claude, Perplexity, Gemini, Bing Copilot, Mistral, Grok, et adapte le test à votre zone géographique.",
        aEn:
          'Yes — it is its primary function. Swissalytics evaluates a site\'s visibility across 12 AI engines including ChatGPT, Claude, Perplexity, Gemini, Bing Copilot, Mistral, Grok, and adapts the test to your geography.',
      },
      {
        q: 'Quel outil choisir si je débute en SEO ?',
        qEn: 'Which tool should I pick if I am new to SEO?',
        a:
          "Commencez par Swissalytics : c'est gratuit, ça donne un diagnostic en 30 secondes et un plan d'action lisible. Si vos besoins évoluent vers du suivi de mots-clés à grande échelle, Semrush devient pertinent.",
        aEn:
          'Start with Swissalytics: free, 30-second diagnosis, readable action plan. If your needs grow toward large-scale keyword tracking, Semrush becomes relevant.',
      },
    ],

    date: '2026-04-26',
    updated: '2026-04-26',
  },

  // ═══════════════════════════════════════════════════════════════════
  // Swissalytics vs Otterly
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'swissalytics-vs-otterly',
    competitor: 'Otterly.AI',
    competitorMonogram: 'OT',
    competitorCategory: 'Suivi de visibilité IA',
    competitorCategoryEn: 'AI visibility tracker',
    competitorUrl: 'https://otterly.ai',
    competitorHq: 'Vienne, AT',

    metaTitle:
      'Swissalytics vs Otterly.AI — comparatif honnête (2026)',
    metaTitleEn:
      'Swissalytics vs Otterly.AI — an honest comparison (2026)',
    metaDescription:
      "Deux outils GEO comparés : Otterly suit vos prompts dans le temps, Swissalytics audite votre site et donne un plan d'action. Prix, fonctionnalités, cas d'usage.",
    metaDescriptionEn:
      'Two GEO tools compared: Otterly tracks your prompts over time, Swissalytics audits your site and ships an action plan. Pricing, features, use cases.',

    h1: 'Swissalytics vs Otterly.AI',
    h1En: 'Swissalytics vs Otterly.AI',

    lead:
      "Otterly.AI est un <b>tracker de visibilité IA</b> autrichien qui surveille comment votre marque apparaît dans les réponses de ChatGPT, Perplexity et Google AI Overviews <i>au fil du temps</i>. Swissalytics est un <b>auditeur GEO</b> suisse qui analyse votre site et vous dit comment le rendre citable. <i>Les deux sont GEO, mais ils résolvent deux problèmes différents.</i>",
    leadEn:
      'Otterly.AI is an Austrian <b>AI visibility tracker</b> that monitors how your brand appears in ChatGPT, Perplexity, and Google AI Overviews <i>over time</i>. Swissalytics is a Swiss <b>GEO auditor</b> that analyses your site and tells you how to make it citable. <i>Both are GEO, but they solve two different problems.</i>',

    tldr:
      "Otterly suit l'extérieur (« suis-je cité ? »). Swissalytics répare l'intérieur (« pourquoi je ne suis pas cité »). Les deux sont complémentaires ; Swissalytics est gratuit, Otterly démarre à 29 €/mois.",
    tldrEn:
      'Otterly tracks the outside ("am I cited?"). Swissalytics fixes the inside ("why am I not cited?"). The two complement each other; Swissalytics is free, Otterly starts at €29/month.',

    rows: [
      {
        dimension: 'Prix de départ',
        dimensionEn: 'Entry pricing',
        swissalytics: 'Gratuit',
        swissalyticsEn: 'Free',
        competitor: '29 €/mois (plan Lite, 10 prompts trackés)',
        competitorEn: '€29/month (Lite plan, 10 tracked prompts)',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Audit on-page du site',
        dimensionEn: 'On-page site audit',
        swissalytics:
          'Cœur du produit — Core Web Vitals, headings, JSON-LD, images, multi-pages',
        swissalyticsEn:
          'Core product — Core Web Vitals, headings, JSON-LD, images, multi-page',
        competitor: 'Non — Otterly ne crawle pas votre site',
        competitorEn: 'No — Otterly does not crawl your site',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Suivi de prompts dans le temps',
        dimensionEn: 'Prompt tracking over time',
        swissalytics:
          'Non — Swissalytics fait des audits ponctuels, pas du monitoring',
        swissalyticsEn:
          'No — Swissalytics does one-off audits, not monitoring',
        competitor:
          'Cœur du produit — vous configurez vos prompts, Otterly les rejoue chaque semaine',
        competitorEn:
          'Core product — you configure prompts, Otterly replays them weekly',
        verdict: 'competitor-wins',
      },
      {
        dimension: 'Couverture LLM',
        dimensionEn: 'LLM coverage',
        swissalytics:
          '12 moteurs IA détectés (ChatGPT, Claude, Perplexity, Gemini, Bing Copilot, Mistral, Grok…)',
        swissalyticsEn:
          '12 AI engines detected (ChatGPT, Claude, Perplexity, Gemini, Bing Copilot, Mistral, Grok…)',
        competitor:
          'ChatGPT, Perplexity, Google AI Overviews (3 moteurs principaux)',
        competitorEn:
          'ChatGPT, Perplexity, Google AI Overviews (3 main engines)',
        verdict: 'sa-wins',
      },
      {
        dimension: "Plan d'action priorisé",
        dimensionEn: 'Prioritized action plan',
        swissalytics:
          'Oui — critique / amélioration / suggestion par catégorie',
        swissalyticsEn:
          'Yes — critical / recommended / suggestion per category',
        competitor:
          'Recommandations contextuelles, mais centrées sur les prompts plutôt que sur le site',
        competitorEn:
          'Contextual recommendations, but centred on prompts rather than the site',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Multilingue (interface)',
        dimensionEn: 'Multilingual (UI)',
        swissalytics: 'FR + EN nativement',
        swissalyticsEn: 'FR + EN natively',
        competitor: 'EN uniquement',
        competitorEn: 'EN only',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Compte requis',
        dimensionEn: 'Account required',
        swissalytics: 'Non — paste URL, get report',
        swissalyticsEn: 'No — paste URL, get report',
        competitor: 'Oui — essai gratuit 14 jours',
        competitorEn: 'Yes — 14-day free trial',
        verdict: 'sa-wins',
      },
      {
        dimension: 'Export PDF',
        dimensionEn: 'PDF export',
        swissalytics: 'Inclus, gratuit',
        swissalyticsEn: 'Included, free',
        competitor: 'Inclus dans les plans payants',
        competitorEn: 'Included on paid plans',
        verdict: 'tie',
      },
      {
        dimension: 'Couverture géographique',
        dimensionEn: 'Geographic coverage',
        swissalytics:
          '18+ régions/pays — adapté au marché suisse, francophone, européen',
        swissalyticsEn:
          '18+ regions/countries — tuned for Swiss, French-speaking, European markets',
        competitor:
          'Multi-pays via configuration de prompts, focus DACH/EU/US',
        competitorEn:
          'Multi-country via prompt configuration, DACH/EU/US focus',
        verdict: 'tie',
      },
      {
        dimension: 'Édité par',
        dimensionEn: 'Operated by',
        swissalytics: 'Pixelab — agence web suisse, Genève',
        swissalyticsEn: 'Pixelab — Swiss web agency, Geneva',
        competitor: 'Otterly.AI GmbH — startup autrichienne, Vienne',
        competitorEn: 'Otterly.AI GmbH — Austrian startup, Vienna',
        verdict: 'tie',
      },
    ],

    whenSwissalytics: [
      {
        title: 'Vous voulez savoir pourquoi vous n\'êtes pas cité',
        titleEn: 'You want to know why you are not cited',
        body:
          "Swissalytics audite votre HTML, votre Schema.org, vos entités nommées — les facteurs qu'un LLM utilise pour décider de vous citer.",
        bodyEn:
          'Swissalytics audits your HTML, Schema.org, named entities — the factors an LLM uses when deciding whether to cite you.',
      },
      {
        title: 'Vous voulez un plan d\'action concret tout de suite',
        titleEn: 'You want a concrete action plan right now',
        body:
          "Otterly vous dit où vous en êtes. Swissalytics vous dit quoi corriger, dans quel ordre, et avec quels indices d'effort.",
        bodyEn:
          'Otterly tells you where you stand. Swissalytics tells you what to fix, in what order, with effort hints.',
      },
      {
        title: 'Vous démarrez en GEO sans budget',
        titleEn: 'You are starting GEO without a budget',
        body:
          "Swissalytics est gratuit. Otterly démarre à 29 €/mois et vous facture par prompt suivi.",
        bodyEn:
          'Swissalytics is free. Otterly starts at €29/month and bills per tracked prompt.',
      },
    ],

    whenCompetitor: [
      {
        title: 'Vous voulez monitorer dans la durée',
        titleEn: 'You want to monitor over time',
        body:
          "Otterly rejoue vos prompts chaque semaine et vous montre les variations de citations. Swissalytics fait des audits ponctuels.",
        bodyEn:
          'Otterly replays your prompts weekly and shows citation variations. Swissalytics does one-off audits.',
      },
      {
        title: 'Vous gérez une marque visible avec une stratégie GEO mature',
        titleEn: 'You manage a visible brand with a mature GEO strategy',
        body:
          "Quand le travail on-page est fait, le suivi prompt-by-prompt devient utile. Otterly est conçu pour cette étape.",
        bodyEn:
          'Once the on-page work is done, prompt-by-prompt tracking becomes useful. Otterly is built for that stage.',
      },
      {
        title: 'Vous voulez alerter sur des concurrents nommés',
        titleEn: 'You want alerts on named competitors',
        body:
          "Otterly track les mentions de vos concurrents dans les mêmes prompts — utile en intelligence économique.",
        bodyEn:
          'Otterly tracks competitor mentions in the same prompts — useful for competitive intelligence.',
      },
    ],

    body: [
      {
        type: 'h2',
        text: 'Tracker vs auditeur : la vraie différence',
      },
      {
        type: 'p',
        html:
          "Otterly et Swissalytics sont tous les deux des outils <b>GEO</b>, mais ils attaquent le problème par des bouts opposés. Otterly mesure votre <b>visibilité externe</b> : est-ce que ChatGPT vous cite quand on lui pose telle question ? Swissalytics audite votre <b>citabilité interne</b> : est-ce que votre site donne à un LLM de quoi vous citer ?",
      },
      {
        type: 'quote',
        text:
          "« Otterly mesure le résultat. Swissalytics répare la cause. Les deux ensemble forment un cycle complet. »",
      },
      {
        type: 'h2',
        text: 'Quand utiliser les deux',
      },
      {
        type: 'p',
        html:
          "Le <b>workflow naturel</b> est : <i>Swissalytics d'abord</i> (corriger l'on-page), <i>Otterly ensuite</i> (mesurer l'effet sur les citations). Démarrer par Otterly sans avoir audité son site, c'est mesurer un thermomètre cassé : le score sera bas, vous saurez que c'est bas, mais vous ne saurez pas pourquoi.",
      },
      {
        type: 'h2',
        text: "Le prix : 0 € vs 29 €+/mois",
      },
      {
        type: 'p',
        html:
          "Otterly facture par <b>prompt suivi</b> : 29 €/mois pour 10 prompts (Lite), 69 €/mois pour 30 prompts (Standard), 189 €/mois pour 100 prompts (Pro). Si vous voulez suivre 50 questions où votre marque devrait apparaître, comptez 69 €/mois minimum.",
      },
      {
        type: 'p',
        html:
          "Swissalytics est gratuit, sans plafond d'audits. La contrepartie : pas de monitoring continu — chaque audit est une photo à un instant T.",
      },
    ],

    bodyEn: [
      {
        type: 'h2',
        text: 'Tracker vs auditor: the real difference',
      },
      {
        type: 'p',
        html:
          'Otterly and Swissalytics are both <b>GEO</b> tools, but they attack the problem from opposite ends. Otterly measures your <b>external visibility</b>: does ChatGPT cite you when asked a given question? Swissalytics audits your <b>internal citability</b>: does your site give an LLM enough to cite you?',
      },
      {
        type: 'quote',
        text:
          '"Otterly measures the outcome. Swissalytics fixes the cause. Together they form a complete loop."',
      },
      {
        type: 'h2',
        text: 'When to use both',
      },
      {
        type: 'p',
        html:
          'The <b>natural workflow</b> is: <i>Swissalytics first</i> (fix the on-page), <i>Otterly next</i> (measure the effect on citations). Starting with Otterly without auditing your site is reading a broken thermometer: the score will be low, you will know it is low, but you will not know why.',
      },
      {
        type: 'h2',
        text: 'Pricing: 0 € vs 29 €+/month',
      },
      {
        type: 'p',
        html:
          'Otterly bills per <b>tracked prompt</b>: €29/mo for 10 prompts (Lite), €69/mo for 30 prompts (Standard), €189/mo for 100 prompts (Pro). If you want to track 50 questions where your brand should appear, count on €69/mo minimum.',
      },
      {
        type: 'p',
        html:
          'Swissalytics is free, with no cap on audits. The trade-off: no continuous monitoring — each audit is a snapshot at a point in time.',
      },
    ],

    faq: [
      {
        q: 'Swissalytics et Otterly font-ils la même chose ?',
        qEn: 'Do Swissalytics and Otterly do the same thing?',
        a:
          "Non. Otterly suit la visibilité de votre marque dans les réponses IA au fil du temps (monitoring). Swissalytics audite votre site et vous indique pourquoi vous n'êtes pas cité (diagnostic). Les deux sont complémentaires.",
        aEn:
          'No. Otterly tracks your brand visibility in AI answers over time (monitoring). Swissalytics audits your site and tells you why you are not cited (diagnostic). The two are complementary.',
      },
      {
        q: 'Swissalytics fait-il du monitoring continu ?',
        qEn: 'Does Swissalytics do continuous monitoring?',
        a:
          "Non — chaque audit Swissalytics est une analyse ponctuelle. Pour suivre l'évolution dans le temps, vous pouvez relancer un audit à intervalles réguliers (gratuit) ou utiliser un outil de monitoring comme Otterly en complément.",
        aEn:
          'No — each Swissalytics audit is a one-off analysis. To track changes over time you can rerun an audit at regular intervals (free) or pair it with a monitoring tool like Otterly.',
      },
      {
        q: 'Combien coûte Otterly ?',
        qEn: 'How much does Otterly cost?',
        a:
          "Trois plans : Lite à 29 €/mois (10 prompts), Standard à 69 €/mois (30 prompts), Pro à 189 €/mois (100 prompts). Essai gratuit de 14 jours.",
        aEn:
          'Three plans: Lite at €29/mo (10 prompts), Standard at €69/mo (30 prompts), Pro at €189/mo (100 prompts). 14-day free trial.',
      },
      {
        q: 'Quel outil choisir pour démarrer en GEO ?',
        qEn: 'Which tool should I pick to start with GEO?',
        a:
          "Commencez par Swissalytics : c'est gratuit, ça vous dit en 30 secondes ce qui empêche les LLM de vous citer. Une fois ces fondations corrigées, Otterly devient pertinent pour suivre l'effet dans le temps.",
        aEn:
          'Start with Swissalytics: free, 30-second diagnosis of what blocks LLMs from citing you. Once those foundations are fixed, Otterly becomes relevant to monitor the effect over time.',
      },
      {
        q: 'Swissalytics surveille-t-il aussi mes concurrents ?',
        qEn: 'Does Swissalytics also monitor competitors?',
        a:
          "Vous pouvez auditer n'importe quelle URL publique avec Swissalytics, y compris celle d'un concurrent. Mais il n'y a pas (encore) de fonction native de comparaison side-by-side comme dans Otterly.",
        aEn:
          'You can audit any public URL with Swissalytics, including a competitor\'s. But there is no native side-by-side comparison feature (yet) like Otterly offers.',
      },
    ],

    date: '2026-04-26',
    updated: '2026-04-26',
  },
];

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

/** Find a compare page by slug. Returns undefined if not found. */
export function getCompareBySlug(slug: string): ComparePage | undefined {
  return COMPARE_PAGES.find((p) => p.slug === slug);
}

/** All compare pages, sorted by most recently updated first. */
export function listCompare(): ComparePage[] {
  return [...COMPARE_PAGES].sort((a, b) =>
    a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0,
  );
}

/** Format an ISO date for display in the requested language. */
export function formatCompareDate(iso: string, lang: 'fr' | 'en'): string {
  const d = new Date(iso + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'fr' ? 'fr-CH' : 'en-GB', {
    year: 'numeric',
    month: lang === 'fr' ? 'long' : 'short',
    day: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────
// LOCALISATION HELPERS
// ─────────────────────────────────────────────────────────────────────

export function pickMetaTitle(p: ComparePage, isFr: boolean): string {
  return isFr ? p.metaTitle : p.metaTitleEn ?? p.metaTitle;
}
export function pickMetaDescription(p: ComparePage, isFr: boolean): string {
  return isFr ? p.metaDescription : p.metaDescriptionEn ?? p.metaDescription;
}
export function pickH1(p: ComparePage, isFr: boolean): string {
  return isFr ? p.h1 : p.h1En ?? p.h1;
}
export function pickLead(p: ComparePage, isFr: boolean): string {
  return isFr ? p.lead : p.leadEn ?? p.lead;
}
export function pickTldr(p: ComparePage, isFr: boolean): string {
  return isFr ? p.tldr : p.tldrEn ?? p.tldr;
}
export function pickCategory(p: ComparePage, isFr: boolean): string {
  return isFr
    ? p.competitorCategory
    : p.competitorCategoryEn ?? p.competitorCategory;
}
export function pickBody(p: ComparePage, isFr: boolean): CompareBlock[] {
  return isFr ? p.body : p.bodyEn ?? p.body;
}
export function pickRowDimension(r: CompareRow, isFr: boolean): string {
  return isFr ? r.dimension : r.dimensionEn ?? r.dimension;
}
export function pickRowSwissalytics(r: CompareRow, isFr: boolean): string {
  return isFr ? r.swissalytics : r.swissalyticsEn ?? r.swissalytics;
}
export function pickRowCompetitor(r: CompareRow, isFr: boolean): string {
  return isFr ? r.competitor : r.competitorEn ?? r.competitor;
}
export function pickWhenItemTitle(
  it: CompareWhenItem,
  isFr: boolean,
): string {
  return isFr ? it.title : it.titleEn ?? it.title;
}
export function pickWhenItemBody(
  it: CompareWhenItem,
  isFr: boolean,
): string {
  return isFr ? it.body : it.bodyEn ?? it.body;
}
export function pickFaqQ(f: CompareFaq, isFr: boolean): string {
  return isFr ? f.q : f.qEn ?? f.q;
}
export function pickFaqA(f: CompareFaq, isFr: boolean): string {
  return isFr ? f.a : f.aEn ?? f.a;
}
