import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbGet, dbRun, listApplicationsAdmin, logAudit } from '@/lib/db';
import type { ApplicationRecord } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const applications = await listApplicationsAdmin();
  return NextResponse.json({ applications });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const id = typeof body.id === 'string' ? body.id : '';
  const existing = await dbGet<ApplicationRecord>('SELECT * FROM applications WHERE id = ?', [id]);
  if (!existing) {
    return NextResponse.json({ error: 'Başvuru bulunamadı.' }, { status: 404 });
  }

  const validStatuses = [
    'yeni',
    'bakimevine_iletildi',
    'gorusme',
    'yuvaya_kavustu',
    'sonuclanmadi',
    'vazgecti',
  ];
  const nextStatus =
    typeof body.status === 'string' && validStatuses.includes(body.status)
      ? body.status
      : existing.status;
  const note =
    typeof body.internal_note === 'string'
      ? body.internal_note.trim().slice(0, 500)
      : existing.internal_note;

  await dbRun('UPDATE applications SET status = ?, internal_note = ? WHERE id = ?', [
    nextStatus,
    note,
    id,
  ]);

  if (nextStatus === 'yuvaya_kavustu') {
    await dbRun(`UPDATE animals SET status = 'yuvaya_kavustu', updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      existing.animal_id,
    ]);
  }

  await logAudit(auth.user.uid, 'application_updated', 'application', id, `Durum: ${nextStatus}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Başvuru kimliği gerekli.' }, { status: 400 });
  }
  await dbRun('DELETE FROM applications WHERE id = ?', [id]);
  await logAudit(auth.user.uid, 'application_kvkk_deleted', 'application', id, 'Kişisel veriler silindi');
  return NextResponse.json({ ok: true });
}
