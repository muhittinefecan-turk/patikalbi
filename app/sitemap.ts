import type { MetadataRoute } from 'next';
import { listPublicAnimals, listPublishedSeoPages } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/can-dostlari`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/nasil-sahiplenilir`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/rehber`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/hakkinda`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/sss`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/kvkk`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/gizlilik`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  const [animals, seoPages] = await Promise.all([
    listPublicAnimals(),
    listPublishedSeoPages(),
  ]);

  const animalRoutes: MetadataRoute.Sitemap = animals.map((a) => ({
    url: `${baseUrl}/can-dostlari/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly',
    priority: a.status === 'yuvaya_kavustu' ? 0.5 : 0.9,
  }));

  const seoRoutes: MetadataRoute.Sitemap = seoPages.map((p) => ({
    url: p.page_type === 'guide' ? `${baseUrl}/rehber/${p.slug}` : `${baseUrl}/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...seoRoutes, ...animalRoutes];
}
