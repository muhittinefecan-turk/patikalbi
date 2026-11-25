import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ error: 'İstatistikler alınamadı.' }, { status: 500 });
  }
}
