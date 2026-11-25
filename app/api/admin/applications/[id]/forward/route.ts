import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbGet, dbRun, logAudit } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/indexnow';
import type { Animal, ApplicationRecord, Shelter } from '@/lib/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { id } = await context.params;
  const application = await dbGet<ApplicationRecord>('SELECT * FROM applications WHERE id = ?', [id]);
  if (!application) {
    return NextResponse.json({ error: 'Başvuru bulunamadı.' }, { status: 404 });
  }

  const animal = await dbGet<Animal>('SELECT * FROM animals WHERE id = ?', [application.animal_id]);
  const shelter = animal
    ? await dbGet<Shelter>('SELECT * FROM shelters WHERE id = ?', [animal.shelter_id])
    : null;

  const targetEmail = shelter?.contact_email || 'bakimevi@gerze.bel.tr';
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const animalUrl = animal ? `${appUrl}/can-dostlari/${animal.slug}` : appUrl;

  const mailRes = await sendNotificationEmail({
    to: targetEmail,
    subject: `Yeni Ön Başvuru: ${animal?.name ?? 'Can Dostu'} — Pati Kalbi`,
    text: [
      `Can Dostu: ${animal?.name ?? '-'} (${animalUrl})`,
      `Başvuran: ${application.full_name}`,
      `Telefon: ${application.phone}`,
      `E-posta: ${application.email}`,
      `Şehir: ${application.city} · Konut: ${application.housing_type || '-'}`,
      `Evde çocuk: ${application.has_children ? 'Evet' : 'Hayır'} · Başka hayvan: ${application.has_pets ? 'Evet' : 'Hayır'}`,
      `Deneyim: ${application.experience || '-'}`,
      `Motivasyon: ${application.motivation || '-'}`,
      `KVKK Onay Zamanı: ${application.consent_at}`,
    ].join('\n'),
  });

  const now = new Date().toISOString();
  await dbRun(
    `UPDATE applications SET status = 'bakimevine_iletildi', forwarded_at = ? WHERE id = ?`,
    [now, id]
  );
  await logAudit(auth.user.uid, 'application_forwarded', 'application', id, mailRes.note);

  return NextResponse.json({ ok: true, forwarded_at: now, mailNote: mailRes.note });
}
