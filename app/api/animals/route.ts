import { NextRequest, NextResponse } from 'next/server';
import { listPublicAnimals } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const animals = await listPublicAnimals({
      species: sp.get('species') || undefined,
      sex: sp.get('sex') || undefined,
      size: sp.get('size') || undefined,
      age: sp.get('age') || undefined,
      kids: sp.get('kids') === '1' || sp.get('kids') === 'true',
      pets: sp.get('pets') === '1' || sp.get('pets') === 'true',
      apartment: sp.get('apartment') === '1' || sp.get('apartment') === 'true',
      has_3d: sp.get('has_3d') === '1' || sp.get('has_3d') === 'true',
      status: sp.get('status') || undefined,
      q: sp.get('q') || undefined,
      sort: sp.get('sort') || undefined,
      shelter_city: sp.get('city') || undefined,
      shelter_district: sp.get('district') || undefined,
    });
    return NextResponse.json({ animals, count: animals.length });
  } catch (err) {
    console.error('[GET /api/animals]', err);
    return NextResponse.json({ error: 'Can dostları yüklenemedi.' }, { status: 500 });
  }
}
