import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/auth';
import { dbGet, dbRun, logAudit } from '@/lib/db';
import { sendNotificationEmail, verifyTurnstileToken } from '@/lib/indexnow';
import { validateTurkishPhone } from '@/lib/turkish';
import type { Animal } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(req, 'applications', 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          error:
            'Saatlik ön başvuru sınırına ulaştınız. Lütfen biraz sonra tekrar deneyin.',
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    // Invisible honeypot check
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ ok: true, id: 'accepted' });
    }

    // Optional Cloudflare Turnstile verification
    const turnstileOk = await verifyTurnstileToken(
      typeof body.turnstile_token === 'string' ? body.turnstile_token : null
    );
    if (!turnstileOk) {
      return NextResponse.json(
        { error: 'Bot doğrulaması tamamlanamadı. Lütfen tekrar deneyin.' },
        { status: 400 }
      );
    }

    const animalId = typeof body.animal_id === 'string' ? body.animal_id.trim() : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const housingType =
      typeof body.housing_type === 'string' ? body.housing_type.trim() : 'apartman';
    const hasChildren = body.has_children ? 1 : 0;
    const hasPets = body.has_pets ? 1 : 0;
    const experience =
      typeof body.experience === 'string' ? body.experience.trim().slice(0, 300) : '';
    const motivation =
      typeof body.motivation === 'string' ? body.motivation.trim().slice(0, 500) : '';
    const consent = Boolean(body.consent);

    const fieldErrors: Record<string, string> = {};
    if (!fullName || fullName.length < 3 || fullName.length > 100) {
      fieldErrors.full_name = 'Lütfen adınızı ve soyadınızı eksiksiz yazın.';
    }
    const phoneCheck = validateTurkishPhone(phoneRaw);
    if (!phoneCheck.valid) {
      fieldErrors.phone =
        'Telefon numarası eksik görünüyor. Başında 0 olmadan 10 hane yaz.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = 'Geçerli bir e-posta adresi yazın.';
    }
    if (!city || city.length < 2 || city.length > 60) {
      fieldErrors.city = 'Yaşadığınız şehir veya ilçeyi yazın.';
    }
    if (!motivation || motivation.length < 10) {
      fieldErrors.motivation =
        'Bu can dostunu neden sahiplenmek istediğinizi kısaca anlatın.';
    }
    if (!consent) {
      fieldErrors.consent =
        'Devam etmek için KVKK aydınlatma metnini okuyup onaylamanız gerekir.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: 'Lütfen işaretli alanları kontrol edin.', fieldErrors },
        { status: 400 }
      );
    }

    const animal = await dbGet<Animal>('SELECT * FROM animals WHERE id = ?', [animalId]);
    if (!animal || (animal.status !== 'yayinda' && animal.status !== 'ilgi_var')) {
      return NextResponse.json(
        { error: 'Bu can dostu şu an ön başvuruya açık değil.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const deleteAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const appId = `app-${crypto.randomUUID().slice(0, 10)}`;

    await dbRun(
      `INSERT INTO applications (
        id, animal_id, full_name, phone, email, city, housing_type,
        has_children, has_pets, experience, motivation, consent_at,
        status, internal_note, created_at, forwarded_at, delete_after
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'yeni', NULL, ?, NULL, ?)`,
      [
        appId,
        animal.id,
        fullName,
        phoneCheck.normalized,
        email,
        city,
        ['apartman', 'mustakil', 'bahceli'].includes(housingType) ? housingType : 'apartman',
        hasChildren,
        hasPets,
        experience,
        motivation,
        now.toISOString(),
        now.toISOString(),
        deleteAfter,
      ]
    );

    if (animal.status === 'yayinda') {
      await dbRun(`UPDATE animals SET status = 'ilgi_var', updated_at = ? WHERE id = ?`, [
        now.toISOString(),
        animal.id,
      ]);
    }

    const mailRes = await sendNotificationEmail({
      to: email,
      subject: `${animal.name} için ön başvurunuz alındı — Pati Kalbi`,
      text: `Merhaba ${fullName},\n\n${animal.name} için ön başvurunuz kaydedildi. Proje koordinatörümüz başvurunuzu Gerze Belediyesi Bakımevine iletecek ve bakımevi yetkilileri sizinle iletişime geçecektir.\n\nSatın alma, sahiplen.\nPati Kalbi`,
    });

    await logAudit(null, 'application_created', 'application', appId, mailRes.note);

    return NextResponse.json({
      ok: true,
      id: appId,
      message: 'Ön başvurun gönderildi. Bakımevi seninle iletişime geçecek.',
    });
  } catch (err) {
    console.error('[POST /api/applications]', err);
    return NextResponse.json(
      {
        error:
          'Başvuru gönderilemedi. İnternetini kontrol edip tekrar dene; sorun sürerse bize yaz.',
      },
      { status: 500 }
    );
  }
}
