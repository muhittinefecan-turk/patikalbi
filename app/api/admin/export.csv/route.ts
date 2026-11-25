import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const rows = await dbAll<{
    slug: string;
    name: string;
    species: string;
    status: string;
    has_3d: number;
    application_count: number;
  }>(
    `SELECT
      a.slug,
      a.name,
      a.species,
      a.status,
      CASE WHEN m.status = 'aktif' THEN 1 ELSE 0 END as has_3d,
      (SELECT COUNT(*) FROM applications ap WHERE ap.animal_id = a.id) as application_count
     FROM animals a
     LEFT JOIN animal_models m ON m.animal_id = a.id
     ORDER BY a.name ASC`
  );

  const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const lines = [
    'slug,ad,tur,durum,3d_aktif,on_basvuru_sayisi',
    ...rows.map((r) =>
      [r.slug, r.name, r.species, r.status, r.has_3d, r.application_count]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  return new NextResponse(`\uFEFF${lines.join('\n')}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pati-kalbi-anonim-rapor.csv"',
    },
  });
}
