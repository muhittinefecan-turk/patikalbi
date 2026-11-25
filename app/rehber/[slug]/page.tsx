import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoLandingView } from '@/components/SeoLandingView';
import { getSeoPageBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPageBySlug(slug);
  if (!page || page.page_type !== 'guide') {
    return { title: 'Rehber bulunamadı' };
  }
  return {
    title: page.meta_title,
    description: page.meta_description,
    alternates: { canonical: `/rehber/${page.slug}` },
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      type: 'article',
      locale: 'tr_TR',
    },
  };
}

export default async function RehberDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getSeoPageBySlug(slug);
  if (!page || page.page_type !== 'guide') {
    notFound();
  }
  return (
    <SeoLandingView
      page={page}
      canonicalPath={`/rehber/${page.slug}`}
      parentBreadcrumb={{ label: 'Rehberler', href: '/rehber' }}
    />
  );
}
