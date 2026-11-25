import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbGet, dbRun, listAllSeoPagesAdmin, logAudit } from '@/lib/db';
import { slugifyTr } from '@/lib/turkish';
import type { SeoPage } from '@/lib/types';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const pages = await listAllSeoPagesAdmin();
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const h1Title = typeof body.h1_title === 'string' ? body.h1_title.trim() : '';
    const slug = slugifyTr(typeof body.slug === 'string' && body.slug.trim() ? body.slug : h1Title);
    const pageType = ['intent_landing', 'local_seo', 'guide'].includes(String(body.page_type))
      ? String(body.page_type)
      : 'guide';
    const metaTitle = typeof body.meta_title === 'string' ? body.meta_title.trim() : h1Title;
    const metaDesc = typeof body.meta_description === 'string' ? body.meta_description.trim() : '';
    const bodyMd = typeof body.body_md === 'string' ? body.body_md.trim() : '';

    if (!slug || !h1Title || !bodyMd) {
      return NextResponse.json(
        { error: 'Slug, başlık (H1) ve içerik metni zorunludur.' },
        { status: 400 }
      );
    }

    const id = `seo-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    await dbRun(
      `INSERT INTO seo_pages (
        id, slug, page_type, h1_title, slogan, meta_title, meta_description,
        filter_preset, body_md, faq_json, is_published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        pageType,
        h1Title.slice(0, 140),
        typeof body.slogan === 'string' ? body.slogan.trim().slice(0, 120) : null,
        metaTitle.slice(0, 120),
        metaDesc.slice(0, 180),
        typeof body.filter_preset === 'string' ? body.filter_preset : '{}',
        bodyMd,
        typeof body.faq_json === 'string' ? body.faq_json : '[]',
        body.is_published ? 1 : 0,
        now,
      ]
    );
    await logAudit(auth.user.uid, 'seo_page_created', 'seo_page', id, slug);
    return NextResponse.json({ ok: true, id, slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'SEO sayfası oluşturulamadı.' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const id = typeof body.id === 'string' ? body.id : '';
  const existing = await dbGet<SeoPage>('SELECT * FROM seo_pages WHERE id = ?', [id]);
  if (!existing) {
    return NextResponse.json({ error: 'SEO sayfası bulunamadı.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  await dbRun(
    `UPDATE seo_pages SET
      h1_title = ?, slogan = ?, meta_title = ?, meta_description = ?,
      filter_preset = ?, body_md = ?, faq_json = ?, is_published = ?, updated_at = ?
     WHERE id = ?`,
    [
      typeof body.h1_title === 'string' ? body.h1_title.trim().slice(0, 140) : existing.h1_title,
      body.slogan !== undefined
        ? typeof body.slogan === 'string'
          ? body.slogan.trim().slice(0, 120)
          : null
        : existing.slogan,
      typeof body.meta_title === 'string' ? body.meta_title.trim().slice(0, 120) : existing.meta_title,
      typeof body.meta_description === 'string'
        ? body.meta_description.trim().slice(0, 180)
        : existing.meta_description,
      typeof body.filter_preset === 'string' ? body.filter_preset : existing.filter_preset,
      typeof body.body_md === 'string' ? body.body_md : existing.body_md,
      typeof body.faq_json === 'string' ? body.faq_json : existing.faq_json,
      body.is_published !== undefined ? (body.is_published ? 1 : 0) : existing.is_published,
      now,
      id,
    ]
  );

  await logAudit(auth.user.uid, 'seo_page_updated', 'seo_page', id, existing.slug);
  return NextResponse.json({ ok: true });
}
