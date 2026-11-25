import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbAll, dbGet, dbRun, logAudit } from '@/lib/db';
import { putMediaObject } from '@/lib/r2';
import type { Animal } from '@/lib/types';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['editor', 'admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const { id } = await context.params;
    const animal = await dbGet<Animal>('SELECT * FROM animals WHERE id = ?', [id]);
    if (!animal) {
      return NextResponse.json({ error: 'Hayvan kaydı bulunamadı.' }, { status: 404 });
    }

    const existingPhotos = await dbAll<{ id: string; file_key: string }>(
      'SELECT id, file_key FROM photos WHERE animal_id = ?',
      [id]
    );
    const realPhotos = existingPhotos.filter((p) => !p.file_key.startsWith('placeholder:'));
    if (realPhotos.length >= 8) {
      return NextResponse.json(
        { error: 'Bir hayvan için en fazla 8 fotoğraf yüklenebilir.' },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    const altText = String(form.get('alt_text') ?? '').trim();
    const credit = String(form.get('credit') ?? '').trim().slice(0, 100);
    const blurhash = String(form.get('blurhash') ?? '').trim().slice(0, 64) || null;
    const width = Number(form.get('width') ?? 800) || 800;
    const height = Number(form.get('height') ?? 1000) || 1000;
    const isCover = form.get('is_cover') === '1' || realPhotos.length === 0;

    if (!altText || altText.length < 5) {
      return NextResponse.json(
        { error: 'Erişilebilirlik için anlamlı alt metin zorunludur (en az 5 karakter).' },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fotoğraf dosyası gerekli.' }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: 'Fotoğraf boyutu en fazla 10 MB olabilir.' },
        { status: 400 }
      );
    }

    const allowedMimes = ['image/webp', 'image/jpeg', 'image/png'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Yalnızca WebP, JPEG veya PNG fotoğraf kabul edilir.' },
        { status: 400 }
      );
    }

    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/jpeg' ? '.jpg' : '.webp';
    const photoId = `ph-${crypto.randomUUID().slice(0, 8)}`;
    const fileKey = `photos/${animal.slug}/${photoId}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const storedKey = await putMediaObject(fileKey, bytes, file.type);

    // Optional responsive variants generated client-side (400w / 1200w)
    for (const variantName of ['file_400', 'file_1200'] as const) {
      const vFile = form.get(variantName);
      if (vFile instanceof File && vFile.size <= MAX_PHOTO_BYTES) {
        const vBytes = Buffer.from(await vFile.arrayBuffer());
        const suffix = variantName === 'file_400' ? '_400w' : '_1200w';
        await putMediaObject(`photos/${animal.slug}/${photoId}${suffix}.webp`, vBytes, 'image/webp');
      }
    }

    // Remove initial placeholder row when first real photo is uploaded
    const placeholderRows = existingPhotos.filter((p) => p.file_key.startsWith('placeholder:'));
    for (const ph of placeholderRows) {
      await dbRun('DELETE FROM photos WHERE id = ?', [ph.id]);
    }

    if (isCover) {
      await dbRun('UPDATE photos SET is_cover = 0 WHERE animal_id = ?', [id]);
    }

    await dbRun(
      `INSERT INTO photos (id, animal_id, file_key, width, height, blurhash, alt_text, credit, is_cover, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photoId,
        id,
        storedKey,
        width,
        height,
        blurhash,
        altText.slice(0, 240),
        credit || auth.user.name,
        isCover ? 1 : 0,
        realPhotos.length,
      ]
    );

    await logAudit(auth.user.uid, 'photo_uploaded', 'photo', photoId, `${animal.name} (${storedKey})`);
    return NextResponse.json({ ok: true, id: photoId, file_key: storedKey });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fotoğraf yüklenemedi.' },
      { status: 400 }
    );
  }
}
