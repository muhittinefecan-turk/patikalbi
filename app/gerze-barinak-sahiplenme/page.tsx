import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoLandingView } from '@/components/SeoLandingView';
import { getSeoPageBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';
const SLUG = 'gerze-barinak-sahiplenme';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getSeoPageBySlug(SLUG);
  if (!page) return { title: 'Gerze Barınak Sahiplenme' };
  return {
    title: page.meta_title,
    description: page.meta_description,
    alternates: { canonical: `/${SLUG}` },
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      type: 'website',
      locale: 'tr_TR',
    },
  };
}

export default async function GerzeBarinakSahiplenmePage() {
  const page = await getSeoPageBySlug(SLUG);
  if (!page) notFound();
  return <SeoLandingView page={page} canonicalPath={`/${SLUG}`} />;
}
