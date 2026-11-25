import { NextResponse } from 'next/server';
import { listPublicAnimals } from '@/lib/db';

export const dynamic = 'force-dynamic';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const animals = await listPublicAnimals();

  const items = animals
    .map((a) => {
      const ogImg = `${baseUrl}/api/og/${a.slug}`;
      const caption = escapeXml(a.photos[0]?.alt_text || `${a.name} — Satın alma, sahiplen.`);
      return `  <url>
    <loc>${baseUrl}/can-dostlari/${a.slug}</loc>
    <image:image>
      <image:loc>${ogImg}</image:loc>
      <image:title>${escapeXml(a.name)} — Pati Kalbi</image:title>
      <image:caption>${caption}</image:caption>
    </image:image>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
