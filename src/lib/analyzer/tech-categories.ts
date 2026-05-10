/**
 * Tech categorization — groups detected `technologies[]` strings into
 * meaningful buckets so the UI can show them as "Analytics", "Embeds",
 * etc. instead of one undifferentiated "tech stack" list.
 *
 * Why this matters: the previous flat list lumped GTM + YouTube +
 * Tailwind + Cloudflare together under "Stack technique", which was
 * misleading (e.g. YouTube is an embed, not part of the stack). Users
 * couldn't tell at a glance whether a flagged tech was load-bearing
 * (React, GA) or incidental (an embedded video).
 *
 * Categories are deliberately coarse (5 buckets) — finer granularity
 * adds noise without informing decisions. Unknown techs fall back to
 * `'other'` so the UI never silently drops anything.
 */

export type TechCategory = 'framework' | 'analytics' | 'embed' | 'library' | 'other';

const CATEGORY_MAP: Record<string, TechCategory> = {
  // Framework JS (front-end libraries that drive the app shell)
  React: 'framework',
  'Vue.js': 'framework',
  Angular: 'framework',

  // Analytics & tracking (data collection, heatmaps, A/B)
  'Google Analytics': 'analytics',
  GTM: 'analytics',
  'Meta Pixel': 'analytics',
  'LinkedIn Insight': 'analytics',
  Hotjar: 'analytics',
  Plausible: 'analytics',
  Matomo: 'analytics',
  'Microsoft Clarity': 'analytics',

  // Embeds, widgets, marketing CRM (third-party content/widgets injected
  // into the page; not part of the site's own stack)
  YouTube: 'embed',
  Vimeo: 'embed',
  'Google Maps': 'embed',
  Intercom: 'embed',
  Crisp: 'embed',
  Zendesk: 'embed',
  Drift: 'embed',
  HubSpot: 'embed',
  Salesforce: 'embed',
  Mailchimp: 'embed',

  // UI / JS libraries (utilities, animation, lazy loading, polyfills)
  jQuery: 'library',
  Bootstrap: 'library',
  'Tailwind CSS': 'library',
  Swiper: 'library',
  GSAP: 'library',
  'Lazy Loading Lib': 'library',
  'CDN Libraries': 'library',
  'Polyfill.io': 'library',

  // Other (security, fonts, semantic standards, infra)
  reCAPTCHA: 'other',
  Cloudflare: 'other',
  'Cookie Consent': 'other',
  'Schema.org': 'other',
  'Google Fonts': 'other',
  'Adobe Fonts': 'other',
};

export function categorizeTech(tech: string): TechCategory {
  return CATEGORY_MAP[tech] ?? 'other';
}

export const CATEGORY_LABELS: Record<TechCategory, { fr: string; en: string }> = {
  framework: { fr: 'Framework JS', en: 'JS Framework' },
  analytics: { fr: 'Analytics & tracking', en: 'Analytics & tracking' },
  embed:     { fr: 'Embeds & widgets',    en: 'Embeds & widgets' },
  library:   { fr: 'Bibliothèques',       en: 'Libraries' },
  other:     { fr: 'Sécurité, polices, standards', en: 'Security, fonts, standards' },
};

/** Display order of categories — most "stack-defining" first. */
export const CATEGORY_ORDER: TechCategory[] = ['framework', 'library', 'analytics', 'embed', 'other'];

/**
 * Group a flat technology list into ordered buckets, preserving order
 * within each bucket. Empty buckets are omitted from the result.
 */
export function groupTechsByCategory(techs: string[]): Array<{ category: TechCategory; techs: string[] }> {
  const buckets = new Map<TechCategory, string[]>();
  for (const t of techs) {
    const cat = categorizeTech(t);
    const arr = buckets.get(cat) ?? [];
    arr.push(t);
    buckets.set(cat, arr);
  }
  return CATEGORY_ORDER.flatMap((cat) => {
    const techs = buckets.get(cat);
    return techs && techs.length > 0 ? [{ category: cat, techs }] : [];
  });
}
