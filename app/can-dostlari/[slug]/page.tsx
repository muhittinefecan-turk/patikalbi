import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AnimalProfileClient } from '@/components/AnimalProfileClient';
import { getPublicAnimalBySlug, listPublicAnimals } from '@/lib/db';
import { formatAgeTr, formatSexTr, formatSpeciesTr } from '@/lib/turkish';

export const dynamic = 'force-dynamic';

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const animal = await getPublicAnimalBySlug(slug);
  if (!animal) {
    return { title: 'Profil bulunamadı' };
  }

  const age = formatAgeTr(animal.age_months_est);
  const species = formatSpeciesTr(animal.species);
  const district = animal.shelter?.district || 'Gerze';
  const title = `${animal.name} — ${age} ${species} | ${district} Sahiplenme`;
  const description =
    animal.seo_description ||
    animal.story ||
    `${animal.name}, ${district} Geçici Hayvan Bakımevi'nde sıcak bir yuva bekliyor. Satın alma, sahiplen.`;

  const ogUrl = `/api/og/${encodeURIComponent(animal.slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/can-dostlari/${animal.slug}`,
    },
    openGraph: {
      title: `${title} | Pati Kalbi`,
      description,
      type: 'profile',
      locale: 'tr_TR',
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${animal.name} — Satın Alma, Sahiplen | Pati Kalbi`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Pati Kalbi`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function AnimalProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const animal = await getPublicAnimalBySlug(slug);
  if (!animal) {
    notFound();
  }

  const allPublic = await listPublicAnimals();
  const similarAnimals = allPublic
    .filter((a) => a.id !== animal.id && (a.status === 'yayinda' || a.status === 'ilgi_var'))
    .sort((a, b) => {
      const aSame = a.species === animal.species ? 0 : 1;
      const bSame = b.species === animal.species ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 4);

  const baseUrl = (process.env.APP_URL || 'https://patikalbi.org').replace(/\/+$/, '');
  const profileUrl = `${baseUrl}/can-dostlari/${animal.slug}`;
  const ogImageUrl = `${baseUrl}/api/og/${animal.slug}`;

  // Strictly ProfilePage + Thing + BreadcrumbList (NEVER Product or Offer)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: baseUrl },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Can Dostları',
            item: `${baseUrl}/can-dostlari`,
          },
          { '@type': 'ListItem', position: 3, name: animal.name, item: profileUrl },
        ],
      },
      {
        '@type': 'ProfilePage',
        url: profileUrl,
        name: `${animal.name} — Pati Kalbi Sanal Barınak`,
        datePublished: animal.published_at || animal.created_at,
        dateModified: animal.updated_at,
        mainEntity: {
          '@type': 'Thing',
          name: animal.name,
          url: profileUrl,
          image: ogImageUrl,
          description:
            animal.seo_description ||
            animal.story ||
            `${animal.name} (${formatAgeTr(animal.age_months_est)}, ${formatSexTr(animal.sex)})`,
          additionalType:
            animal.species === 'kedi'
              ? 'https://www.wikidata.org/wiki/Q146'
              : 'https://www.wikidata.org/wiki/Q144',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <AnimalProfileClient animal={animal} similarAnimals={similarAnimals} />
    </>
  );
}
