import { NextRequest, NextResponse } from 'next/server';
import { getMediaObject } from '@/lib/r2';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await context.params;
    const joined = key.join('/');
    const obj = await getMediaObject(joined);
    if (!obj) {
      return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(obj.data), {
      status: 200,
      headers: {
        'Content-Type': obj.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Geçersiz medya yolu.' }, { status: 400 });
  }
}
