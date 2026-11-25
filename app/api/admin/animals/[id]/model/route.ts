import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbGet, dbRun, logAudit } from '@/lib/db';
import { putMediaObject } from '@/lib/r2';
import type { Animal, AnimalModel } from '@/lib/types';

const MAX_MODEL_BYTES = 18 * 1024 * 1024;

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

    const form = await req.formData();
    const glbFile = form.get('glb');
    const usdzFile = form.get('usdz');
    const splatFile = form.get('splat');
    const scaleHeightCm = Math.max(
      12,
      Math.min(120, Number(form.get('scale_height_cm') ?? animal.shoulder_height_cm ?? 40))
    );
    const captureMethodRaw = String(form.get('capture_method') ?? 'image_to_3d');
    const captureMethod = ['image_to_3d', 'photogrammetry', 'gaussian_splat', 'hybrid'].includes(
      captureMethodRaw
    )
      ? captureMethodRaw
      : 'image_to_3d';
    const statusRaw = String(form.get('status') ?? 'aktif');
    const status = ['isleniyor', 'onay_bekliyor', 'aktif', 'pasif'].includes(statusRaw)
      ? statusRaw
      : 'aktif';

    const existing = await dbGet<AnimalModel>(
      'SELECT * FROM animal_models WHERE animal_id = ?',
      [id]
    );

    let glbKey = existing?.glb_key ?? null;
    let usdzKey = existing?.usdz_key ?? null;
    let splatKey = existing?.splat_key ?? null;
    let glbSizeBytes = existing?.glb_size_bytes ?? null;
    let sizeWarning: string | null = null;

    if (glbFile instanceof File && glbFile.size > 0) {
      if (!glbFile.name.toLowerCase().endsWith('.glb')) {
        return NextResponse.json({ error: 'Mesh dosyası .glb uzantılı olmalıdır.' }, { status: 400 });
      }
      if (glbFile.size > MAX_MODEL_BYTES) {
        return NextResponse.json({ error: '.glb dosyası 18 MB sınırını aşıyor.' }, { status: 400 });
      }
      if (glbFile.size > 5 * 1024 * 1024) {
        sizeWarning =
          'Uyarı: .glb dosyası 5 MB üzerinde. Mobil 4G performansı için Blender CLI betiğiyle sıkıştırmanız önerilir.';
      }
      const bytes = Buffer.from(await glbFile.arrayBuffer());
      glbKey = await putMediaObject(
        `models/${animal.slug}/${Date.now()}.glb`,
        bytes,
        'model/gltf-binary'
      );
      glbSizeBytes = glbFile.size;
    }

    if (usdzFile instanceof File && usdzFile.size > 0) {
      if (!usdzFile.name.toLowerCase().endsWith('.usdz')) {
        return NextResponse.json({ error: 'iOS AR dosyası .usdz uzantılı olmalıdır.' }, { status: 400 });
      }
      if (usdzFile.size > MAX_MODEL_BYTES) {
        return NextResponse.json({ error: '.usdz dosyası 18 MB sınırını aşıyor.' }, { status: 400 });
      }
      const bytes = Buffer.from(await usdzFile.arrayBuffer());
      usdzKey = await putMediaObject(
        `models/${animal.slug}/${Date.now()}.usdz`,
        bytes,
        'model/vnd.usdz+zip'
      );
    }

    if (splatFile instanceof File && splatFile.size > 0) {
      const lower = splatFile.name.toLowerCase();
      if (!lower.endsWith('.splat') && !lower.endsWith('.ksplat')) {
        return NextResponse.json(
          { error: 'Gaussian Splat dosyası .splat veya .ksplat uzantılı olmalıdır.' },
          { status: 400 }
        );
      }
      if (splatFile.size > MAX_MODEL_BYTES) {
        return NextResponse.json({ error: 'Splat dosyası 18 MB sınırını aşıyor.' }, { status: 400 });
      }
      const ext = lower.endsWith('.ksplat') ? '.ksplat' : '.splat';
      const bytes = Buffer.from(await splatFile.arrayBuffer());
      splatKey = await putMediaObject(
        `models/${animal.slug}/${Date.now()}${ext}`,
        bytes,
        'application/octet-stream'
      );
    }

    const now = new Date().toISOString();
    if (existing) {
      await dbRun(
        `UPDATE animal_models
         SET glb_key = ?, usdz_key = ?, splat_key = ?, scale_height_cm = ?,
             glb_size_bytes = ?, capture_method = ?, status = ?, updated_at = ?
         WHERE animal_id = ?`,
        [glbKey, usdzKey, splatKey, scaleHeightCm, glbSizeBytes, captureMethod, status, now, id]
      );
    } else {
      const modelId = `mdl-${crypto.randomUUID().slice(0, 8)}`;
      await dbRun(
        `INSERT INTO animal_models (
          id, animal_id, glb_key, usdz_key, splat_key, poster_key,
          scale_height_cm, poly_count, glb_size_bytes, capture_method, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?)`,
        [
          modelId,
          id,
          glbKey,
          usdzKey,
          splatKey,
          scaleHeightCm,
          glbSizeBytes,
          captureMethod,
          status,
          now,
          now,
        ]
      );
    }

    await dbRun('UPDATE animals SET shoulder_height_cm = ?, updated_at = ? WHERE id = ?', [
      scaleHeightCm,
      now,
      id,
    ]);

    await logAudit(
      auth.user.uid,
      'model_3d_updated',
      'animal_model',
      id,
      `Ölçek: ${scaleHeightCm} cm, Yöntem: ${captureMethod}, Durum: ${status}`
    );

    return NextResponse.json({ ok: true, glbKey, usdzKey, splatKey, sizeWarning });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '3D model yüklenemedi.' },
      { status: 400 }
    );
  }
}
