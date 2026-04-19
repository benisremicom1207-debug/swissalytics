/**
 * Journal — static mock posts.
 * FR-first; `titleEn`/`excerptEn`/`contentEn` optional bilingual fallbacks.
 * Slugs are url-safe (lowercase, hyphens).
 */

export type JournalBlock =
  | { type: 'p'; html: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | {
      type: 'numbered';
      items: { n: string; title: string; body: string }[];
    };

export type JournalPost = {
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  category: string;
  categoryEn?: string;
  /** ISO date string — used for sorting + formatted on render */
  date: string;
  /** Reading time in minutes */
  readTime: number;
  author: string;
  /** FR lead paragraph (first paragraph gets the red drop-cap on the article page) */
  lead: string;
  leadEn?: string;
  /** Structured body blocks (FR) */
  content: JournalBlock[];
  contentEn?: JournalBlock[];
  /** Whether this post headlines the journal index */
  featured?: boolean;
  /** Large numeral shown in the black featured-article card */
  featuredNumeral?: string;
  /** Sublabel below the big numeral on the featured card */
  featuredNumeralLabel?: string;
  featuredNumeralLabelEn?: string;
};

export const JOURNAL_POSTS: JournalPost[] = [
  {
    slug: 'comment-chatgpt-choisit-ses-sources',
    title: 'Comment ChatGPT choisit ses sources',
    titleEn: 'How ChatGPT picks its sources',
    excerpt:
      "On a analysé 400 réponses de ChatGPT pour comprendre pourquoi certains sites sont cités et d'autres non. La réponse n'est pas celle qu'on croyait.",
    excerptEn:
      "We analysed 400 ChatGPT answers to understand why some sites get cited and others don't. The answer wasn't what we thought.",
    category: 'Analyse',
    categoryEn: 'Analysis',
    date: '2025-11-12',
    readTime: 6,
    author: 'Équipe Pixelab',
    featured: true,
    featuredNumeral: '400',
    featuredNumeralLabel: 'réponses analysées',
    featuredNumeralLabelEn: 'answers analysed',
    lead:
      "En septembre 2025, on a posé <b>400 questions à ChatGPT</b> sur des sujets où nos clients auraient pu être cités : horlogerie genevoise, agences web suisses, assurances privées, restaurants étoilés. Pour chaque réponse, on a listé les sources citées et on a regardé ce qu'elles avaient en commun. <i>Ce qui est sorti de l'analyse est surprenant.</i>",
    leadEn:
      'In September 2025, we asked ChatGPT <b>400 questions</b> about topics where our clients could have been cited: Geneva watchmaking, Swiss web agencies, private banking, Michelin-starred restaurants. For each answer, we listed the cited sources and looked at what they had in common. <i>What came out was surprising.</i>',
    content: [
      { type: 'h2', text: 'Ce qui ne compte presque pas' },
      {
        type: 'p',
        html:
          "D'abord, ce qu'on pensait compter et qui ne compte quasiment pas : le <b>PageRank</b>, la position Google, le nombre de backlinks, l'ancienneté du domaine. Sur les 400 réponses, le site cité n°1 n'était <b>presque jamais</b> le premier résultat Google. Parfois il était même en page 3.",
      },
      {
        type: 'quote',
        text:
          "« Le site cité n°1 par ChatGPT n'était presque jamais le premier résultat Google. Parfois il était en page 3. »",
      },
      { type: 'h2', text: 'Les trois signaux qui comptent' },
      {
        type: 'p',
        html:
          "En recoupant les 400 réponses, trois facteurs ressortent systématiquement. On les a classés par ordre d'importance empirique :",
      },
      {
        type: 'numbered',
        items: [
          {
            n: '01',
            title: 'Des entités nommées explicites',
            body:
              "Le site dit clairement <i>qui</i> il est (nom de marque, fondateurs, année, localisation) dans le HTML — titres, intertitres, JSON-LD. Sans ça, ChatGPT ne sait pas vous identifier.",
          },
          {
            n: '02',
            title: 'Un balisage Schema.org complet',
            body:
              "Les sites cités avaient <b>2,3× plus</b> de blocs JSON-LD que la moyenne. <span class=\"mono\">Organization</span>, <span class=\"mono\">LocalBusiness</span>, <span class=\"mono\">FAQPage</span>. C'est quasi linéaire.",
          },
          {
            n: '03',
            title: 'Un ton déclaratif, pas marketing',
            body:
              "« Nous sommes une agence web à Genève fondée en 2020 » se fait citer. « Donnons vie à vos ambitions digitales » ne se fait jamais citer. ChatGPT cherche des faits, pas des slogans.",
          },
        ],
      },
      { type: 'h2', text: 'La leçon' },
      {
        type: 'p',
        html:
          "Pour se faire citer par ChatGPT, il faut <b>écrire comme une encyclopédie</b>, pas comme une plaquette commerciale. Les sites qui ressortent gagnants sont ceux qui disent platement, en HTML propre, qui ils sont et ce qu'ils font.",
      },
      {
        type: 'p',
        html:
          "C'est exactement ce que Swissalytics audite. Collez votre URL : on vous dit, en 40 secondes, si un LLM peut vous identifier clairement ou pas.",
      },
    ],
  },
  {
    slug: 'schema-org-le-detail-qui-change-tout',
    title: 'Schema.org : le détail qui change tout',
    titleEn: 'Schema.org: the detail that changes everything',
    excerpt:
      "Un bloc JSON-LD de 15 lignes peut doubler la visibilité d'un site dans les moteurs IA. On détaille pourquoi et comment le poser correctement.",
    excerptEn:
      "A 15-line JSON-LD block can double a site's visibility in AI engines. We break down the why and the how.",
    category: 'Technique',
    categoryEn: 'Technical',
    date: '2025-11-05',
    readTime: 4,
    author: 'Équipe Pixelab',
    lead:
      "Tout le monde parle de Schema.org, peu de sites le posent correctement. Et encore moins savent <b>quoi</b> baliser en priorité. Voici la hiérarchie qu'on recommande après 200 audits.",
    content: [
      { type: 'h2', text: "Pourquoi ça compte maintenant" },
      {
        type: 'p',
        html:
          "Les moteurs IA — ChatGPT, Perplexity, Gemini — lisent le HTML brut, pas votre JavaScript. Le JSON-LD est le seul format qu'ils comprennent de manière fiable pour savoir <b>qui</b> vous êtes.",
      },
      {
        type: 'quote',
        text:
          '« Sans JSON-LD, votre site ressemble à un inconnu qui prétend être quelqu\'un. Avec, il ressemble à une entité identifiable. »',
      },
      { type: 'h2', text: 'Les trois blocs à poser en priorité' },
      {
        type: 'numbered',
        items: [
          {
            n: '01',
            title: 'Organization',
            body:
              "Qui vous êtes. Nom légal, logo, adresse, contact, réseaux sociaux. C'est votre carte d'identité machine.",
          },
          {
            n: '02',
            title: 'LocalBusiness (si pertinent)',
            body:
              "Horaires, coordonnées, zone desservie. Obligatoire si vous avez un lieu physique ou une zone géographique précise.",
          },
          {
            n: '03',
            title: 'FAQPage',
            body:
              'Les questions que posent vos clients, avec vos réponses. Les LLM adorent récupérer des paires question/réponse structurées.',
          },
        ],
      },
    ],
  },
  {
    slug: 'le-seo-n-est-pas-mort',
    title: "Le SEO n'est pas mort, il a juste muté",
    titleEn: "SEO isn't dead, it just mutated",
    excerpt:
      "Non, Google ne disparaît pas. Oui, les règles ont changé. Explication en 2000 mots, sans jargon inutile.",
    excerptEn:
      "No, Google isn't going away. Yes, the rules have changed. A 2000-word explanation, without jargon.",
    category: 'Opinion',
    categoryEn: 'Opinion',
    date: '2025-10-28',
    readTime: 8,
    author: 'Équipe Pixelab',
    lead:
      "On lit partout que <b>le SEO est mort</b>. C'est faux, mais c'est une demi-vérité utile. Ce qui est mort, c'est le SEO comme optimisation de mots-clés. Ce qui commence, c'est quelque chose d'un peu plus exigeant.",
    content: [
      { type: 'h2', text: 'La vraie bascule' },
      {
        type: 'p',
        html:
          "En 2024, Google a intégré les AI Overviews. En 2025, ChatGPT a dépassé 400 millions d'utilisateurs hebdomadaires. Le point commun : les gens ne cliquent plus sur dix liens bleus, ils lisent une réponse synthétique qui <i>cite</i> des sources.",
      },
      { type: 'h2', text: 'Ce qui change concrètement' },
      {
        type: 'numbered',
        items: [
          {
            n: '01',
            title: "L'intention a remplacé le mot-clé",
            body:
              "On ne vise plus une requête exacte, on vise un <i>besoin</i>. Les LLM reformulent, synonymisent, élargissent.",
          },
          {
            n: '02',
            title: 'Les citations ont remplacé les clics',
            body:
              'Être cité dans une réponse IA, même sans clic, vaut désormais plus qu\'un trafic froid de 30 secondes.',
          },
          {
            n: '03',
            title: 'La structure a remplacé le volume',
            body:
              "Un article de 500 mots bien structuré bat un article de 3000 mots mal organisé. Les LLM extraient par section.",
          },
        ],
      },
    ],
  },
  {
    slug: 'entites-nommees-pourquoi-chatgpt-vous-confond',
    title: 'Entités nommées : pourquoi ChatGPT vous confond avec un concurrent',
    titleEn: 'Named entities: why ChatGPT confuses you with a competitor',
    excerpt:
      "Si votre nom de marque est générique, les LLM vous mélangent avec d'autres entreprises. Voici comment s'en sortir sans changer de nom.",
    excerptEn:
      "If your brand name is generic, LLMs mix you up with other companies. Here's how to fix it without a rebrand.",
    category: 'Technique',
    categoryEn: 'Technical',
    date: '2025-10-14',
    readTime: 5,
    author: 'Équipe Pixelab',
    lead:
      "Imaginez deux agences web qui s'appellent toutes les deux <b>« Atelier Web »</b>. L'une à Genève, l'autre à Montréal. Pour ChatGPT, sans contexte explicite, elles se fondent en une seule entité floue. Résultat : les deux perdent.",
    content: [
      { type: 'h2', text: 'Le problème' },
      {
        type: 'p',
        html:
          "Les LLM apprennent à partir de grandes quantités de texte. Quand deux entités partagent un nom, elles se <b>fusionnent</b> statistiquement sauf si des signaux distinctifs sont posés explicitement.",
      },
      {
        type: 'quote',
        text:
          '« Un nom générique sans contexte, c\'est un visage dans une foule. Un nom générique avec contexte, c\'est une personne identifiable. »',
      },
      { type: 'h2', text: 'Les signaux distinctifs à poser' },
      {
        type: 'numbered',
        items: [
          {
            n: '01',
            title: 'Localisation systématique',
            body:
              "Dites « Atelier Web Genève » plutôt qu'« Atelier Web ». Dans le <span class=\"mono\">title</span>, le <span class=\"mono\">h1</span>, le JSON-LD, le footer.",
          },
          {
            n: '02',
            title: 'Année de fondation',
            body:
              "« Fondé en 2020 » dans le balisage Organization. Ça distingue de manière mécanique.",
          },
          {
            n: '03',
            title: 'Fondateurs nommés',
            body:
              "Les noms propres des personnes sont des ancres fortes pour les LLM. Mettez-les dans l\\'À propos et dans le JSON-LD.",
          },
        ],
      },
    ],
  },
  {
    slug: 'cas-client-terre-des-hommes',
    title: 'Cas client : Terre des hommes, +42 % de citations IA',
    titleEn: 'Case study: Terre des hommes, +42% AI citations',
    excerpt:
      "Avant / après d'un audit complet. Trois mois, huit corrections, résultats mesurés. Sans rebranding, sans refonte.",
    excerptEn:
      'Before/after of a full audit. Three months, eight fixes, measured outcomes. No rebrand, no redesign.',
    category: 'Cas client',
    categoryEn: 'Case study',
    date: '2025-10-02',
    readTime: 7,
    author: 'Équipe Pixelab',
    lead:
      "En juin 2025, <b>Terre des hommes</b> nous contacte : elles apparaissent rarement dans les réponses ChatGPT sur l'aide à l'enfance en Suisse. En octobre, elles sont citées sur <b>42 %</b> de requêtes pertinentes en plus.",
    content: [
      { type: 'h2', text: 'Point de départ' },
      {
        type: 'p',
        html:
          "Le site était techniquement propre mais <b>silencieux</b> pour un LLM : pas de JSON-LD Organization, pas de FAQPage, entités nommées rares dans le corps des pages. Score Swissalytics de départ : 58/100.",
      },
      { type: 'h2', text: 'Les huit corrections posées' },
      {
        type: 'numbered',
        items: [
          {
            n: '01',
            title: 'JSON-LD Organization complet',
            body:
              'Avec logo, fondation, mission, zone d\'action, contact. Passage en 48 h.',
          },
          {
            n: '02',
            title: 'FAQPage sur les pages-clés',
            body:
              'Sept questions récurrentes des donateurs, posées en JSON-LD et répétées en texte dans la page.',
          },
          {
            n: '03',
            title: 'Réécriture des <span class="mono">h1</span> et des méta-descriptions',
            body:
              "Avec entités nommées (nom, année de fondation, pays d'action) plutôt que slogans.",
          },
        ],
      },
      {
        type: 'quote',
        text:
          '« Huit corrections, zéro refonte. Le site paraît le même pour un humain, il est méconnaissable pour un LLM. »',
      },
      { type: 'h2', text: 'Résultat mesuré' },
      {
        type: 'p',
        html:
          "Suivi sur 80 requêtes-tests (aide à l'enfance, protection, Suisse, Lausanne). Avant : cité dans 19 réponses. Après : cité dans 27. <b>+42 %</b>. Score Swissalytics : 58 → 84.",
      },
    ],
  },
  {
    slug: 'llms-txt-mode-d-emploi',
    title: 'llms.txt : le mode d\'emploi honnête',
    titleEn: 'llms.txt: the honest manual',
    excerpt:
      "Un petit fichier texte, beaucoup de bruit marketing. On explique ce que c'est, ce que ça fait vraiment, et quand le poser.",
    excerptEn:
      "A tiny text file, a lot of marketing noise. We explain what it is, what it actually does, and when to deploy it.",
    category: 'Technique',
    categoryEn: 'Technical',
    date: '2025-09-22',
    readTime: 5,
    author: 'Équipe Pixelab',
    lead:
      "Depuis début 2025, tout le monde vous dit de poser un fichier <span class=\"mono\">/llms.txt</span> à la racine de votre site. <b>Faut-il le faire ?</b> Oui, mais pas pour les raisons qu'on vous raconte.",
    content: [
      { type: 'h2', text: "Ce que c'est vraiment" },
      {
        type: 'p',
        html:
          "Un fichier texte au format Markdown, à la racine du domaine. Il liste — pour un LLM — les pages qui comptent vraiment, avec une courte description. <b>C'est un sommaire lisible machine.</b>",
      },
      { type: 'h2', text: "Ce que ça ne fait pas" },
      {
        type: 'p',
        html:
          "Ça ne force aucun LLM à citer votre site. Aucun moteur IA majeur ne s'engage publiquement à le lire en 2025. Mais plusieurs études indiquent qu'il <i>est</i> lu, au moins par certains crawlers.",
      },
    ],
  },
  {
    slug: 'geo-vs-seo-definitions',
    title: 'GEO vs SEO : des définitions qui tiennent la route',
    titleEn: 'GEO vs SEO: definitions that hold up',
    excerpt:
      "GEO, AEO, AIO, LLMO. Quatre acronymes pour une même réalité. On tranche avec des définitions qui ne vieilliront pas dans six mois.",
    excerptEn:
      'GEO, AEO, AIO, LLMO. Four acronyms for the same thing. We pin down definitions that won\'t age out in six months.',
    category: 'Opinion',
    categoryEn: 'Opinion',
    date: '2025-09-08',
    readTime: 4,
    author: 'Équipe Pixelab',
    lead:
      "On nous demande en réunion : « c'est quoi la différence entre GEO et SEO ? ». Réponse courte : <b>le SEO vise les moteurs de recherche, le GEO vise les moteurs génératifs</b>. Réponse longue : ça se recoupe beaucoup plus qu'on le dit.",
    content: [
      { type: 'h2', text: 'Les quatre acronymes' },
      {
        type: 'numbered',
        items: [
          {
            n: '01',
            title: 'SEO — Search Engine Optimization',
            body:
              "Optimiser pour un moteur qui renvoie des liens. L'objectif : être cliqué.",
          },
          {
            n: '02',
            title: 'GEO — Generative Engine Optimization',
            body:
              "Optimiser pour un moteur qui renvoie une réponse générée. L'objectif : être cité.",
          },
          {
            n: '03',
            title: 'AEO / AIO / LLMO',
            body:
              'Synonymes commerciaux de GEO. Pas de différence technique, juste des marques de vendeurs.',
          },
        ],
      },
      { type: 'h2', text: 'Ce qui se recoupe' },
      {
        type: 'p',
        html:
          "Un site bien structuré pour Google est <i>déjà</i> 70 % optimisé pour ChatGPT. HTML propre, balisage Schema.org, contenu dense et factuel, <span class=\"mono\">h1</span> clair. Les 30 % restants sont ce qui fait la spécificité du GEO.",
      },
    ],
  },
];

/** Find a post by its slug. Returns undefined if not found. */
export function getPostBySlug(slug: string): JournalPost | undefined {
  return JOURNAL_POSTS.find((p) => p.slug === slug);
}

/** Return up to `limit` related posts (same category first, then recent). */
export function getRelatedPosts(slug: string, limit = 3): JournalPost[] {
  const current = getPostBySlug(slug);
  if (!current) return JOURNAL_POSTS.slice(0, limit);
  const sameCat = JOURNAL_POSTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  );
  const rest = JOURNAL_POSTS.filter(
    (p) => p.slug !== slug && p.category !== current.category,
  );
  return [...sameCat, ...rest].slice(0, limit);
}

/** Format an ISO date for display in the requested language. */
export function formatJournalDate(iso: string, lang: 'fr' | 'en'): string {
  const d = new Date(iso + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'fr' ? 'fr-CH' : 'en-GB', {
    year: 'numeric',
    month: lang === 'fr' ? 'long' : 'short',
    day: 'numeric',
  });
}
