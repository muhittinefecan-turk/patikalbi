import { NextRequest, NextResponse } from 'next/server';
import { getPublicAnimalBySlug } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const animal = await getPublicAnimalBySlug(slug);
    if (!animal) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ animal });
  } catch (err) {
    console.error('[GET /api/animals/[slug]]', err);
    return NextResponse.json({ error: 'Profil yüklenemedi.' }, { status: 500 });
  }
}
