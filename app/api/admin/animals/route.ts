import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  dbGet,
  dbRun,
  listAllAnimalsAdmin,
  listAuditLogsAdmin,
  listShelters,
  logAudit,
} from '@/lib/db';
import { slugifyTr } from '@/lib/turkish';
import type { Animal } from '@/lib/types';

function clampScore(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function clampTriBool(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return null;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugifyTr(name) || `can-dostu-${Date.now()}`;
  let candidate = base;
  let idx = 2;
  while (await dbGet<{ id: string }>('SELECT id FROM animals WHERE slug = ?', [candidate])) {
    candidate = `${base}-${idx}`;
    idx += 1;
  }
  return candidate;
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['editor', 'approver', 'admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const [animals, shelters, auditLogs] = await Promise.all([
    listAllAnimalsAdmin(),
    listShelters(),
    listAuditLogsAdmin(30),
  ]);
  return NextResponse.json({ animals, shelters, auditLogs });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['editor', 'admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    // Optional CSV bulk temperament import
    if (body.mode === 'csv_bulk' && Array.isArray(body.rows)) {
      const shelters = await listShelters();
      const defaultShelterId = shelters[0]?.id ?? 'shelter-gerze';
      const createdIds: string[] = [];
      const now = new Date().toISOString();

      for (const item of body.rows as Record<string, unknown>[]) {
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const species = item.species === 'kedi' ? 'kedi' : 'kopek';
        if (!name) continue;
        const id = `an-${crypto.randomUUID().slice(0, 8)}`;
        const slug = await generateUniqueSlug(name);
        await dbRun(
          `INSERT INTO animals (
            id, slug, shelter_id, name, species, sex, age_months_est, size,
            shoulder_height_cm, coat_and_look, vaccinated, neutered, microchipped, health_note,
            t_energy, t_people, t_children, t_animals, t_alone, apartment_ok,
            story, ideal_home, seo_description, status, vet_approved_by, vet_approved_at,
            created_by, created_at, updated_at, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'taslak', NULL, NULL, ?, ?, ?, NULL)`,
          [
            id,
            slug,
            defaultShelterId,
            name.slice(0, 80),
            species,
            ['disi', 'erkek', 'bilinmiyor'].includes(String(item.sex))
              ? String(item.sex)
              : 'bilinmiyor',
            item.age_months_est ? Number(item.age_months_est) : null,
            ['kucuk', 'orta', 'buyuk'].includes(String(item.size)) ? String(item.size) : 'orta',
            item.shoulder_height_cm ? Number(item.shoulder_height_cm) : null,
            typeof item.coat_and_look === 'string' ? item.coat_and_look.slice(0, 200) : null,
            clampTriBool(item.vaccinated),
            clampTriBool(item.neutered),
            clampTriBool(item.microchipped),
            typeof item.health_note === 'string' ? item.health_note.slice(0, 240) : null,
            clampScore(item.t_energy),
            clampScore(item.t_people),
            clampScore(item.t_children),
            clampScore(item.t_animals),
            clampScore(item.t_alone),
            clampTriBool(item.apartment_ok),
            typeof item.story === 'string' ? item.story.slice(0, 600) : null,
            typeof item.ideal_home === 'string' ? item.ideal_home.slice(0, 200) : null,
            auth.user.uid,
            now,
            now,
          ]
        );
        await dbRun(
          `INSERT INTO photos (id, animal_id, file_key, width, height, blurhash, alt_text, credit, is_cover, sort_order)
           VALUES (?, ?, ?, 800, 1000, NULL, ?, ?, 1, 0)`,
          [
            `ph-${id}-1`,
            id,
            `placeholder:${slug}`,
            `${name} adlı ${species === 'kedi' ? 'kedi' : 'köpek'} için saha çekimi bekleniyor.`,
            'GEFOK Saha Kaydı',
          ]
        );
        createdIds.push(id);
      }

      await logAudit(
        auth.user.uid,
        'csv_bulk_import',
        'animal',
        createdIds[0] || 'batch',
        `${createdIds.length} taslak kayıt aktarıldı`
      );
      return NextResponse.json({ ok: true, count: createdIds.length, ids: createdIds });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Hayvan adı en az 2 karakter olmalıdır.' }, { status: 400 });
    }
    const species = body.species === 'kedi' ? 'kedi' : 'kopek';
    const sex = ['disi', 'erkek', 'bilinmiyor'].includes(String(body.sex))
      ? String(body.sex)
      : 'bilinmiyor';
    const size = ['kucuk', 'orta', 'buyuk'].includes(String(body.size))
      ? String(body.size)
      : 'orta';
    const shelters = await listShelters();
    const shelterId =
      typeof body.shelter_id === 'string' && shelters.some((s) => s.id === body.shelter_id)
        ? body.shelter_id
        : shelters[0]?.id ?? 'shelter-gerze';

    const id = `an-${crypto.randomUUID().slice(0, 8)}`;
    const slug = await generateUniqueSlug(name);
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO animals (
        id, slug, shelter_id, name, species, sex, age_months_est, size,
        shoulder_height_cm, coat_and_look, vaccinated, neutered, microchipped, health_note,
        t_energy, t_people, t_children, t_animals, t_alone, apartment_ok,
        story, ideal_home, seo_description, status, vet_approved_by, vet_approved_at,
        created_by, created_at, updated_at, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'taslak', NULL, NULL, ?, ?, ?, NULL)`,
      [
        id,
        slug,
        shelterId,
        name.slice(0, 80),
        species,
        sex,
        body.age_months_est !== null && body.age_months_est !== '' && body.age_months_est !== undefined
          ? Math.max(0, Math.min(300, Number(body.age_months_est)))
          : null,
        size,
        body.shoulder_height_cm !== null && body.shoulder_height_cm !== '' && body.shoulder_height_cm !== undefined
          ? Math.max(10, Math.min(120, Number(body.shoulder_height_cm)))
          : null,
        typeof body.coat_and_look === 'string' ? body.coat_and_look.trim().slice(0, 220) : null,
        clampTriBool(body.vaccinated),
        clampTriBool(body.neutered),
        clampTriBool(body.microchipped),
        typeof body.health_note === 'string' ? body.health_note.trim().slice(0, 300) : null,
        clampScore(body.t_energy),
        clampScore(body.t_people),
        clampScore(body.t_children),
        clampScore(body.t_animals),
        clampScore(body.t_alone),
        clampTriBool(body.apartment_ok),
        typeof body.story === 'string' ? body.story.trim().slice(0, 600) : null,
        typeof body.ideal_home === 'string' ? body.ideal_home.trim().slice(0, 200) : null,
        typeof body.seo_description === 'string' ? body.seo_description.trim().slice(0, 165) : null,
        auth.user.uid,
        now,
        now,
      ]
    );

    const altText =
      typeof body.cover_alt_text === 'string' && body.cover_alt_text.trim().length >= 5
        ? body.cover_alt_text.trim().slice(0, 220)
        : `${name} adlı ${species === 'kedi' ? 'kedi' : 'köpek'} için 4:5 portre çerçevesi.`;

    await dbRun(
      `INSERT INTO photos (id, animal_id, file_key, width, height, blurhash, alt_text, credit, is_cover, sort_order)
       VALUES (?, ?, ?, 800, 1000, NULL, ?, ?, 1, 0)`,
      [
        `ph-${id}-1`,
        id,
        `placeholder:${slug}`,
        altText,
        typeof body.credit === 'string' && body.credit.trim() ? body.credit.trim() : auth.user.name,
      ]
    );

    await logAudit(auth.user.uid, 'animal_created', 'animal', id, `${name} (taslak)`);
    return NextResponse.json({ ok: true, id, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kayıt oluşturulamadı.' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req, ['editor', 'admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    const existing = await dbGet<Animal>('SELECT * FROM animals WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Hayvan kaydı bulunamadı.' }, { status: 404 });
    }

    // Hard rule: Cannot set status='yayinda' without vet_approved_at
    let nextStatus = existing.status;
    if (typeof body.status === 'string') {
      const requested = body.status;
      if (requested === 'yayinda' && !existing.vet_approved_at) {
        return NextResponse.json(
          { error: 'Veteriner/bakımevi onayı olmayan hayvan yayına çıkamaz.' },
          { status: 403 }
        );
      }
      if (
        ['taslak', 'onay_bekliyor', 'yayinda', 'ilgi_var', 'yuvaya_kavustu', 'arsiv'].includes(
          requested
        )
      ) {
        if (auth.user.role === 'editor' && !['taslak', 'onay_bekliyor'].includes(requested)) {
          return NextResponse.json(
            { error: 'Editör yalnızca taslak veya onay bekliyor durumuna alabilir.' },
            { status: 403 }
          );
        }
        nextStatus = requested as Animal['status'];
      }
    }

    const now = new Date().toISOString();
    await dbRun(
      `UPDATE animals SET
        name = ?, species = ?, sex = ?, age_months_est = ?, size = ?,
        shoulder_height_cm = ?, coat_and_look = ?,
        vaccinated = ?, neutered = ?, microchipped = ?, health_note = ?,
        t_energy = ?, t_people = ?, t_children = ?, t_animals = ?, t_alone = ?,
        apartment_ok = ?, story = ?, ideal_home = ?, seo_description = ?,
        status = ?, updated_at = ?
       WHERE id = ?`,
      [
        typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : existing.name,
        body.species === 'kedi' || body.species === 'kopek' ? body.species : existing.species,
        ['disi', 'erkek', 'bilinmiyor'].includes(String(body.sex)) ? String(body.sex) : existing.sex,
        body.age_months_est !== undefined
          ? body.age_months_est === null || body.age_months_est === ''
            ? null
            : Number(body.age_months_est)
          : existing.age_months_est,
        ['kucuk', 'orta', 'buyuk'].includes(String(body.size)) ? String(body.size) : existing.size,
        body.shoulder_height_cm !== undefined
          ? body.shoulder_height_cm === null || body.shoulder_height_cm === ''
            ? null
            : Number(body.shoulder_height_cm)
          : existing.shoulder_height_cm,
        body.coat_and_look !== undefined
          ? typeof body.coat_and_look === 'string'
            ? body.coat_and_look.trim().slice(0, 220)
            : null
          : existing.coat_and_look,
        body.vaccinated !== undefined ? clampTriBool(body.vaccinated) : existing.vaccinated,
        body.neutered !== undefined ? clampTriBool(body.neutered) : existing.neutered,
        body.microchipped !== undefined ? clampTriBool(body.microchipped) : existing.microchipped,
        body.health_note !== undefined
          ? typeof body.health_note === 'string'
            ? body.health_note.trim().slice(0, 300)
            : null
          : existing.health_note,
        body.t_energy !== undefined ? clampScore(body.t_energy) : existing.t_energy,
        body.t_people !== undefined ? clampScore(body.t_people) : existing.t_people,
        body.t_children !== undefined ? clampScore(body.t_children) : existing.t_children,
        body.t_animals !== undefined ? clampScore(body.t_animals) : existing.t_animals,
        body.t_alone !== undefined ? clampScore(body.t_alone) : existing.t_alone,
        body.apartment_ok !== undefined ? clampTriBool(body.apartment_ok) : existing.apartment_ok,
        body.story !== undefined
          ? typeof body.story === 'string'
            ? body.story.trim().slice(0, 600)
            : null
          : existing.story,
        body.ideal_home !== undefined
          ? typeof body.ideal_home === 'string'
            ? body.ideal_home.trim().slice(0, 200)
            : null
          : existing.ideal_home,
        body.seo_description !== undefined
          ? typeof body.seo_description === 'string'
            ? body.seo_description.trim().slice(0, 165)
            : null
          : existing.seo_description,
        nextStatus,
        now,
        id,
      ]
    );

    await logAudit(auth.user.uid, 'animal_updated', 'animal', id, `Durum: ${nextStatus}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Güncelleme başarısız.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Kayıt kimliği gerekli.' }, { status: 400 });
  }
  await dbRun(`UPDATE animals SET status = 'arsiv', updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    id,
  ]);
  await logAudit(auth.user.uid, 'animal_archived', 'animal', id);
  return NextResponse.json({ ok: true });
}
