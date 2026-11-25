import { NextResponse } from 'next/server';
import { listPublicAnimals } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const animals = await listPublicAnimals();

  const items = animals
    .map(
      (a) => `  <url>
    <loc>${baseUrl}/can-dostlari/${a.slug}</loc>
    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${a.status === 'yuvaya_kavustu' ? '0.5' : '0.9'}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
