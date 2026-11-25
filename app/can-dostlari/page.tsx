import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AnimalCatalogClient } from '@/components/AnimalCatalogClient';
import { listPublicAnimals } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Can Dostları — Gerze Ücretsiz Kedi ve Köpek Sahiplenme',
  description:
    'Gerze Belediyesi Geçici Hayvan Bakımevi’nde yuva bekleyen veteriner onaylı kedi ve köpek profilleri. Mizaç, apartman uyumu ve 3D boyut filtresiyle arayın.',
  alternates: {
    canonical: '/can-dostlari',
  },
};

export default async function CanDostlariPage() {
  const initialAnimals = await listPublicAnimals();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
          Gerze Sanal Barınak Kataloğu
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-4xl">
          Yuva bekleyen can dostları
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
          Her profil veteriner hekim onayıyla yayına alınır. Ev yaşamına, çocuklara ve diğer
          hayvanlara uyumuna göre filtreleyebilir; 3D destekli dostları gerçek 1:1 omuz yüksekliğiyle
          inceleyebilirsin.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="py-12 text-sm text-[var(--ink-muted)]">
            Can dostları listesi yükleniyor...
          </div>
        }
      >
        <AnimalCatalogClient initialAnimals={initialAnimals} />
      </Suspense>
    </div>
  );
}
