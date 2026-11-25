export interface ProcessedPhotoVariants {
  file400: File;
  file800: File;
  file1200: File;
  width: number;
  height: number;
  blurhash: string;
}

async function encodeCanvasVariant(
  bitmap: ImageBitmap,
  targetWidth: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, targetWidth / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.84 });
      return { blob, width: w, height: h };
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Tarayıcı görsel işleme bağlamı oluşturulamadı.');
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('WebP dönüşümü başarısız.'))),
      'image/webp',
      0.84
    );
  });
  return { blob, width: w, height: h };
}

function computeCompactColorSignature(bitmap: ImageBitmap): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 5;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'pk:eef2f3:0f2e3a';
    ctx.drawImage(bitmap, 0, 0, 4, 5);
    const data = ctx.getImageData(0, 0, 4, 5).data;
    const hex = (idx: number) =>
      [data[idx], data[idx + 1], data[idx + 2]]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('');
    // Top-left, center, bottom-right compact preview gradient hash
    return `pk:${hex(0)}:${hex(9 * 4)}:${hex(19 * 4)}`;
  } catch {
    return 'pk:eef2f3:0f2e3a';
  }
}

/**
 * Re-encodes any uploaded photo inside the browser into 400 / 800 / 1200 px WebP.
 * Decoding into ImageBitmap and drawing onto OffscreenCanvas/Canvas strips 100% of EXIF/GPS metadata.
 */
export async function processShelterPhotoClient(file: File): Promise<ProcessedPhotoVariants> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Fotoğraf boyutu yükleme öncesi en fazla 10 MB olabilir.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const blurhash = computeCompactColorSignature(bitmap);
    const [v400, v800, v1200] = await Promise.all([
      encodeCanvasVariant(bitmap, 400),
      encodeCanvasVariant(bitmap, 800),
      encodeCanvasVariant(bitmap, 1200),
    ]);

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
    return {
      file400: new File([v400.blob], `${baseName}_400w.webp`, { type: 'image/webp' }),
      file800: new File([v800.blob], `${baseName}_800w.webp`, { type: 'image/webp' }),
      file1200: new File([v1200.blob], `${baseName}_1200w.webp`, { type: 'image/webp' }),
      width: v800.width,
      height: v800.height,
      blurhash,
    };
  } finally {
    bitmap.close();
  }
}
