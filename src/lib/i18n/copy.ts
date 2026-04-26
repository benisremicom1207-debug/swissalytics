import type { FragmentNode } from '@/components/design-system/primitives';

export type Lang = 'fr' | 'en';

export interface Copy {
  nav: string[];
  cta: string;
  hero: {
    badges: string[];
    title: FragmentNode[];
    sub: string;
    placeholder: string;
    btnIdle: string;
    btnRun: string;
    proofs: string[];
    reportTitle: string;
    live: string;
  };
  loadingCaption: string;
  loadingFooter: string;
  steps: { id: number; label: string; desc: string }[];
  tabs: string[];
  tabsMono: string[];
  states: Record<'clean' | 'mixed' | 'failing', string>;
  scorecards: string[];
  issuesH: string;
  planTitle: string;
  planSub: string;
  planBucketCrit: string;
  planBucketWarn: string;
  planBucketInfo: string;
  ctaBannerCaption: string;
  ctaBannerKicker: string;
  ctaBannerTitle: FragmentNode[];
  ctaBannerSub: string;
  ctaBannerPrimary: string;
  ctaBannerSecondary: string;
  footerProduit: string[];
  footerRessources: string[];
  footerAgence: string[];
  footerMeta: string[];
  poweredBy: string;
}

export const COPY: Record<Lang, Copy> = {
  fr: {
    nav: ['Méthode', 'Exemples', 'Journal', 'À propos'],
    cta: 'Analyser un site →',
    hero: {
      badges: ['CH · Genève', '100 % gratuit', 'Sans compte'],
      title: [
        'Votre site,',
        ['vu par ', { i: 'les humains' }],
        ['et par ', { red: "l'IA" }, { red: '.' }],
      ],
      sub: "Un audit qui lit votre site comme Google — et comme ChatGPT, Claude, Gemini. Hébergé à Genève. Résultats en 30 secondes. Pas de compte.",
      placeholder: 'votre-site.com',
      btnIdle: 'ANALYSER →',
      btnRun: 'ANALYSE...',
      proofs: ['Pas de CB', 'Pas de spam', 'Export PDF inclus'],
      reportTitle: 'Rapport — exemple.ch',
      live: '● LIVE',
    },
    loadingCaption: '§0x — Analyse en cours',
    loadingFooter: 'Hébergé à Genève · aucune donnée stockée',
    steps: [
      { id: 1, label: 'Performance & Architecture', desc: 'Core Web Vitals · TTFB · LCP' },
      { id: 2, label: 'Structure sémantique',      desc: 'Headings · ARIA · balises' },
      { id: 3, label: 'Images & médias',           desc: 'Attributs alt · formats · poids' },
      { id: 4, label: 'Liens & navigation',        desc: 'Internes · externes · ancres' },
      { id: 5, label: 'Contenu & lisibilité',      desc: 'Flesch · densité · métadonnées' },
    ],
    tabs: ['Tableau de bord', 'Détails', "Plan d'action"],
    tabsMono: ['TABLEAU DE BORD', 'DÉTAILS', "PLAN D'ACTION"],
    states: { clean: 'Excellent', mixed: 'Moyen', failing: 'À corriger' },
    scorecards: ['SEO Technique', 'Contenu', 'IA-Ready', 'Visibilité locale'],
    issuesH: 'Problèmes détectés',
    planTitle: "Votre plan d'optimisation",
    planSub: "Étapes classées par priorité. Corrigez les critiques d'abord.",
    planBucketCrit: 'Critiques — à corriger immédiatement',
    planBucketWarn: 'Améliorations recommandées',
    planBucketInfo: 'Suggestions',
    ctaBannerCaption: '§99 — Prochaine étape',
    ctaBannerKicker: '● Audit complet sur mesure',
    ctaBannerTitle: ['Cet audit gratuit couvre', ['les ', { i: 'fondamentaux' }, '.']],
    ctaBannerSub:
      "Pour un diagnostic approfondi — avec recommandations, priorisation et un plan d'action sur 3–6 mois — notre équipe vous accompagne.",
    ctaBannerPrimary: 'Demander un audit complet',
    ctaBannerSecondary: 'Exporter ce rapport',
    footerProduit: ['Méthode', 'Exemples', 'Comparatifs', 'API', 'Changelog'],
    footerRessources: ['Journal', 'Glossaire SEO', 'Guide GEO', 'Mentions légales'],
    footerAgence: ['Pixelab ↗', 'Audit sur mesure', 'hello@swissalytics.com'],
    footerMeta: ['© 2026 Swissalytics', 'CH — Genève', '100 % hébergé en Suisse'],
    poweredBy: 'Propulsé par',
  },
  en: {
    nav: ['Method', 'Examples', 'Journal', 'About'],
    cta: 'Analyze a site →',
    hero: {
      badges: ['CH · Geneva', '100 % free', 'No account'],
      title: [
        'Your site,',
        ['seen by ', { i: 'humans' }],
        ['and by ', { red: 'AI' }, { red: '.' }],
      ],
      sub: 'An audit that reads your site like Google — and like ChatGPT, Claude, Gemini. Hosted in Geneva. Results in 30 seconds. No account.',
      placeholder: 'your-site.com',
      btnIdle: 'ANALYZE →',
      btnRun: 'RUNNING...',
      proofs: ['No card', 'No spam', 'PDF export included'],
      reportTitle: 'Report — example.ch',
      live: '● LIVE',
    },
    loadingCaption: '§0x — Audit in progress',
    loadingFooter: 'Hosted in Geneva · no data stored',
    steps: [
      { id: 1, label: 'Performance & Architecture', desc: 'Core Web Vitals · TTFB · LCP' },
      { id: 2, label: 'Semantic structure',         desc: 'Headings · ARIA · tags' },
      { id: 3, label: 'Images & media',             desc: 'Alt attributes · formats · weight' },
      { id: 4, label: 'Links & navigation',         desc: 'Internal · external · anchors' },
      { id: 5, label: 'Content & readability',      desc: 'Flesch · density · metadata' },
    ],
    tabs: ['Overview', 'Details', 'Action plan'],
    tabsMono: ['OVERVIEW', 'DETAILS', 'ACTION PLAN'],
    states: { clean: 'Excellent', mixed: 'Mixed', failing: 'Failing' },
    scorecards: ['Technical SEO', 'Content', 'AI-Ready', 'Local visibility'],
    issuesH: 'Detected issues',
    planTitle: 'Your optimization plan',
    planSub: 'Steps sorted by priority. Fix critical issues first.',
    planBucketCrit: 'Critical — fix immediately',
    planBucketWarn: 'Recommended improvements',
    planBucketInfo: 'Suggestions',
    ctaBannerCaption: '§99 — Next step',
    ctaBannerKicker: '● Full custom audit',
    ctaBannerTitle: ['This free audit covers', ['the ', { i: 'fundamentals' }, '.']],
    ctaBannerSub:
      'For a deep diagnosis — with recommendations, prioritization and a 3–6 month action plan — our team has you covered.',
    ctaBannerPrimary: 'Request a full audit',
    ctaBannerSecondary: 'Export this report',
    footerProduit: ['Method', 'Examples', 'Comparisons', 'API', 'Changelog'],
    footerRessources: ['Journal', 'SEO glossary', 'GEO guide', 'Legal notice'],
    footerAgence: ['Pixelab ↗', 'Custom audit', 'hello@swissalytics.com'],
    footerMeta: ['© 2026 Swissalytics', 'CH — Geneva', '100 % hosted in Switzerland'],
    poweredBy: 'Powered by',
  },
};

export function useCopy(lang: Lang): Copy {
  return COPY[lang];
}
