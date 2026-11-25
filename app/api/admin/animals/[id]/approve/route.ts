import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbGet, dbRun, logAudit } from '@/lib/db';
import { notifyIndexNow } from '@/lib/indexnow';
import type { Animal } from '@/lib/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['approver', 'admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const { id } = await context.params;
  const animal = await dbGet<Animal>('SELECT * FROM animals WHERE id = ?', [id]);
  if (!animal) {
    return NextResponse.json({ error: 'Hayvan kaydı bulunamadı.' }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const decision = body.decision === 'reject' ? 'reject' : 'approve';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  const now = new Date().toISOString();

  if (decision === 'reject') {
    await dbRun(
      `UPDATE animals SET status = 'taslak', updated_at = ? WHERE id = ?`,
      [now, id]
    );
    await logAudit(
      auth.user.uid,
      'vet_revision_requested',
      'animal',
      id,
      note || 'Düzeltme istendi'
    );
    return NextResponse.json({ ok: true, status: 'taslak' });
  }

  await dbRun(
    `UPDATE animals
     SET status = 'yayinda',
         vet_approved_by = ?,
         vet_approved_at = ?,
         published_at = COALESCE(published_at, ?),
         updated_at = ?
     WHERE id = ?`,
    [auth.user.name, now, now, now, id]
  );

  // Also activate any pending 3D model for this animal
  await dbRun(
    `UPDATE animal_models SET status = 'aktif', updated_at = ? WHERE animal_id = ? AND status = 'onay_bekliyor'`,
    [now, id]
  );

  const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
  let indexNowNote = '';
  if (appUrl) {
    const idx = await notifyIndexNow([`${appUrl}/can-dostlari/${animal.slug}`]);
    indexNowNote = idx.sent ? ' · IndexNow bildirildi' : '';
  }

  await logAudit(
    auth.user.uid,
    'vet_approved',
    'animal',
    id,
    `${animal.name} onaylandı (${auth.user.name})${indexNowNote}`
  );

  return NextResponse.json({ ok: true, status: 'yayinda', vet_approved_at: now });
}
