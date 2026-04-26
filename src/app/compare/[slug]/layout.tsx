import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getCompareBySlug, COMPARE_PAGES } from '@/lib/compare/pages';

export async function generateStaticParams() {
  return COMPARE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getCompareBySlug(slug);

  if (!page) {
    return {
      title: 'Comparatif introuvable | Swissalytics',
      description:
        "Ce comparatif n'existe pas ou a été retiré. Voir tous les comparatifs Swissalytics.",
      robots: { index: false, follow: true },
    };
  }

  const url = `https://swissalytics.com/compare/${page.slug}`;

  return {
    title: `${page.metaTitle} | Swissalytics`,
    description: page.metaDescription,
    keywords: [
      `Swissalytics vs ${page.competitor}`,
      `${page.competitor} alternative`,
      `${page.competitor} comparison`,
      `${page.competitor} vs Swissalytics`,
      'GEO analyzer',
      'AI search optimization',
      'SEO comparison',
    ],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: 'Swissalytics',
      title: page.metaTitle,
      description: page.metaDescription,
      locale: 'fr_CH',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `Swissalytics vs ${page.competitor}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function CompareSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
