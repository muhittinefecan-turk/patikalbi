import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbAll, dbGet, dbRun, logAudit } from '@/lib/db';
import type { Animal } from '@/lib/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['editor', 'admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const { id } = await context.params;
  const animal = await dbGet<Animal>('SELECT * FROM animals WHERE id = ?', [id]);
  if (!animal) {
    return NextResponse.json({ error: 'Hayvan kaydı bulunamadı.' }, { status: 404 });
  }
  const photos = await dbAll<{ id: string; alt_text: string }>(
    'SELECT id, alt_text FROM photos WHERE animal_id = ?',
    [id]
  );
  if (photos.length === 0 || photos.some((p) => !p.alt_text.trim())) {
    return NextResponse.json(
      { error: 'Onaya göndermek için en az 1 fotoğraf ve eksiksiz alt metni gerekir.' },
      { status: 400 }
    );
  }
  await dbRun(
    `UPDATE animals SET status = 'onay_bekliyor', updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), id]
  );
  await logAudit(auth.user.uid, 'animal_submitted_for_approval', 'animal', id, animal.name);
  return NextResponse.json({ ok: true, status: 'onay_bekliyor' });
}
