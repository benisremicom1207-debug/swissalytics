'use client';

import React from 'react';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';

type Section = {
  n: string;
  h: string;
  body: string;
  aside: string;
};

export default function MethodePage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const sections: Section[] = isFr
    ? [
        {
          n: '01',
          h: 'Ce que nous analysons',
          body: "Sept piliers : structure HTML, images, liens, performance technique, métadonnées, lisibilité et densité sémantique. Chacun est noté sur 100, puis pondéré pour former le score global.",
          aside: 'CWV · TTFB · LCP · CLS · INP',
        },
        {
          n: '02',
          h: 'Comment nous lisons la page',
          body: "Chargement serveur via Puppeteer headless — exactement ce que voit Googlebot. Pas de JavaScript exécuté côté client qui pourrait masquer le vrai contenu. Aucune donnée n'est conservée après la réponse.",
          aside: 'Puppeteer · headless · IP CH',
        },
        {
          n: '03',
          h: 'Les scores sont calculés comment',
          body: "Chaque catégorie a sa grille. Pour les images : poids de l'attribut alt (60 %) + optimisation du format (40 %). Pour la lisibilité : Flesch-Kincaid adapté au français. Pour l'IA-Ready : présence JSON-LD, llms.txt, schéma Organization, et lisibilité machine.",
          aside: 'Pondération ouverte',
        },
        {
          n: '04',
          h: 'Comparaison aux concurrents',
          body: "Benchmark contre les 20 % supérieurs de votre secteur. On ne compare pas une clinique de Genève à Stripe — les bases changent selon la catégorie.",
          aside: '> P80 sectoriel',
        },
        {
          n: '05',
          h: 'Les biais que nous assumons',
          body: "Un bon audit n'est pas neutre. Nous pénalisons les sites lents, les architectures opaques, les sites non accessibles. Nous récompensons la clarté éditoriale, la structure sémantique et la transparence technique.",
          aside: 'Swissalytics est éditorial',
        },
        {
          n: '06',
          h: "Le cas particulier de l'IA (GEO)",
          body: "Les moteurs comme ChatGPT, Perplexity et Gemini ne lisent pas comme Google. Ils préfèrent les listes, les définitions explicites, les citations sourcées. Notre score IA-Ready mesure précisément cette lisibilité machine.",
          aside: 'Generative Engine Optimization',
        },
        {
          n: '07',
          h: 'Limites et honnêteté',
          body: "Nous ne remplaçons pas un audit manuel approfondi. Nous ne voyons pas vos Google Analytics. Nous ne jugeons pas votre stratégie commerciale. Pour un diagnostic complet — avec recommandations priorisées et plan d'action 3–6 mois — demandez un audit sur mesure chez Pixelab.",
          aside: 'Audit complet ↗',
        },
      ]
    : [
        {
          n: '01',
          h: 'What we analyze',
          body: "Seven pillars: HTML structure, images, links, technical performance, metadata, readability, and semantic density. Each is scored out of 100, then weighted into a global score.",
          aside: 'CWV · TTFB · LCP · CLS · INP',
        },
        {
          n: '02',
          h: 'How we read the page',
          body: "Server-side fetch via headless Puppeteer — exactly what Googlebot sees. No client-side JS that could hide real content. No data kept after the response.",
          aside: 'Puppeteer · headless · CH IP',
        },
        {
          n: '03',
          h: 'How scores are computed',
          body: "Each category has its own grid. Images: alt weight (60%) + format optimization (40%). Readability: Flesch-Kincaid, French-adapted. AI-Ready: JSON-LD presence, llms.txt, Organization schema, machine readability.",
          aside: 'Open weights',
        },
        {
          n: '04',
          h: 'Competitor benchmarking',
          body: "We compare against the top 20% of your sector. A Geneva clinic isn't benchmarked against Stripe — the baseline shifts by category.",
          aside: '> P80 sector',
        },
        {
          n: '05',
          h: 'The biases we own',
          body: "A good audit isn't neutral. We penalize slow sites, opaque architectures, inaccessible sites. We reward editorial clarity, semantic structure, technical transparency.",
          aside: 'Swissalytics is editorial',
        },
        {
          n: '06',
          h: 'The AI edge case (GEO)',
          body: "Engines like ChatGPT, Perplexity and Gemini don't read like Google. They prefer lists, explicit definitions, sourced quotes. Our AI-Ready score measures exactly that machine readability.",
          aside: 'Generative Engine Optimization',
        },
        {
          n: '07',
          h: 'Limits and honesty',
          body: "We don't replace a deep manual audit. We don't see your Google Analytics. We don't judge your business strategy. For a full diagnosis — prioritized recommendations, 3–6 month action plan — request a custom audit at Pixelab.",
          aside: 'Full audit ↗',
        },
      ];

  return (
    <Shell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        <div
          className="mono caption-red"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-red)',
            marginBottom: 20,
          }}
        >
          § {isFr ? 'Méthode' : 'Method'}
        </div>

        <DisplayTitle
          parts={
            isFr
              ? ['Comment on', ['note, vraiment', { red: '.' }]]
              : ['How we score', [', honestly', { red: '.' }]]
          }
          size="page"
        />

        <p
          style={{
            fontSize: 20,
            color: 'var(--sa-ink-2)',
            marginTop: 28,
            maxWidth: 720,
            lineHeight: 1.5,
          }}
        >
          {isFr
            ? "Un audit SEO sans méthode est une opinion. Voici la nôtre — assumée, pondérée, reproductible. Sept sections, pas de magie."
            : "An SEO audit without a method is an opinion. Here's ours — stated, weighted, reproducible. Seven sections, no magic."}
        </p>

        <div
          style={{
            marginTop: 72,
            display: 'grid',
            gridTemplateColumns: '120px 1fr 280px',
            gap: 0,
          }}
        >
          {sections.map((s) => (
            <React.Fragment key={s.n}>
              <div
                style={{
                  padding: '40px 0',
                  borderTop: '2px solid var(--sa-ink)',
                  borderRight: '1px solid var(--sa-rule)',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--sa-red)',
                  }}
                >
                  §{s.n}
                </span>
              </div>
              <div
                style={{
                  padding: '40px 40px 40px 32px',
                  borderTop: '2px solid var(--sa-ink)',
                  borderRight: '1px solid var(--sa-rule)',
                }}
              >
                <h2
                  className="h2"
                  style={{ fontSize: 32, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}
                >
                  {s.h}
                </h2>
                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.6,
                    color: 'var(--sa-ink-2)',
                    margin: 0,
                    maxWidth: 620,
                  }}
                >
                  {s.body}
                </p>
              </div>
              <div
                style={{
                  padding: '40px 0 40px 32px',
                  borderTop: '2px solid var(--sa-ink)',
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--sa-ink-4)',
                    marginBottom: 8,
                  }}
                >
                  {isFr ? 'Note' : 'Note'}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 13, color: 'var(--sa-ink-3)', lineHeight: 1.6 }}
                >
                  {s.aside}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Shell>
  );
}
