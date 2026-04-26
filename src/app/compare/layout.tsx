import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Comparatifs — Swissalytics face aux autres outils SEO/GEO',
  description:
    "Tous les comparatifs Swissalytics : prix, fonctionnalités, cas d'usage face à Semrush, Otterly et autres outils d'analyse SEO et GEO.",
  keywords: [
    'Swissalytics alternatives',
    'GEO tools comparison',
    'SEO tool comparison',
    'AI search analyzer comparison',
    'Semrush alternative',
    'Otterly alternative',
  ],
  alternates: { canonical: 'https://swissalytics.com/compare' },
  openGraph: {
    type: 'website',
    url: 'https://swissalytics.com/compare',
    siteName: 'Swissalytics',
    title: 'Comparatifs — Swissalytics face aux autres outils SEO/GEO',
    description:
      "Comparatifs honnêtes de Swissalytics face aux principaux outils d'analyse SEO et de visibilité IA.",
    locale: 'fr_CH',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Swissalytics — Comparatifs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comparatifs — Swissalytics',
    description:
      "Swissalytics face aux autres outils d'analyse SEO et GEO.",
    images: ['/og-image.png'],
  },
};

export default function CompareLayout({ children }: { children: ReactNode }) {
  return children;
}
