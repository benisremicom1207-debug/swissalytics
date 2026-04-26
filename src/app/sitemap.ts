import type { MetadataRoute } from 'next';
import { JOURNAL_POSTS } from '@/lib/journal/posts';
import { COMPARE_PAGES } from '@/lib/compare/pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://swissalytics.com';
  const now = new Date();

  // ── Static editorial / product pages ──
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/methode`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/exemples`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/a-propos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ── Journal articles ──
  const journalEntries: MetadataRoute.Sitemap = JOURNAL_POSTS.map((post) => ({
    url: `${baseUrl}/journal/${post.slug}`,
    lastModified: new Date(post.date + 'T12:00:00Z'),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ── Compare pages ──
  const compareEntries: MetadataRoute.Sitemap = COMPARE_PAGES.map((page) => ({
    url: `${baseUrl}/compare/${page.slug}`,
    lastModified: new Date(page.updated + 'T12:00:00Z'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...staticEntries, ...journalEntries, ...compareEntries];
}
