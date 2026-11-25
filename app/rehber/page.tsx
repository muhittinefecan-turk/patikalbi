import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, MapPin } from 'lucide-react';
import { listPublishedSeoPages } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sahiplenme Rehberleri ve Kaynaklar',
  description:
    'Apartmanda köpek bakımı, barınaktan sahiplenilen hayvanın ilk haftası, 5199 sayılı kanun ve etik sahiplenme rehberleri.',
  alternates: { canonical: '/rehber' },
};

export default async function RehberIndexPage() {
  const pages = await listPublishedSeoPages();
  const guides = pages.filter((p) => p.page_type === 'guide');
  const landings = pages.filter(
    (p) => p.page_type === 'intent_landing' || p.page_type === 'local_seo'
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-3xl border-b border-[var(--border-hairline)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-yosun)]">
          Bilgi ve Hazırlık
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-4xl">
          Sahiplenme Rehberleri
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--ink-muted)]">
          Sorumlu ve ömürlük bir sahiplenme için ilk gün hazırlığından apartman yaşamına, yasal
          mikroçip sorumluluklarından etik sahiplenme ilkelerine kadar tüm kaynaklar.
        </p>
      </header>

      <section className="py-10">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-[var(--accent-kalp)]" aria-hidden="true" />
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-karadeniz)]">
            Pratik Rehberler
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/rehber/${guide.slug}`}
              className="group flex flex-col justify-between rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6 transition-colors hover:border-[var(--accent-kalp)]"
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)] transition-colors">
                  {guide.h1_title}
                </h3>
                {guide.slogan && (
                  <p className="mt-2 text-xs font-medium text-[var(--accent-yosun)]">
                    {guide.slogan}
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {guide.meta_description}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-kalp)]">
                Rehberi oku
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border-hairline)] pt-10">
        <h2 className="font-display text-2xl font-semibold text-[var(--ink-karadeniz)]">
          Satın Alma Sahiplen &amp; Yerel Barınak Sayfaları
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landings.map((item) => (
            <Link
              key={item.id}
              href={`/${item.slug}`}
              className="group flex flex-col justify-between rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 transition-colors hover:border-[var(--accent-kalp)]"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  {item.page_type === 'local_seo' ? (
                    <>
                      <MapPin className="h-3.5 w-3.5 text-[var(--accent-yosun)]" />
                      Yerel Rehber
                    </>
                  ) : (
                    <>
                      <Compass className="h-3.5 w-3.5 text-[var(--accent-kalp)]" />
                      Satın Alma, Sahiplen
                    </>
                  )}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)]">
                  {item.h1_title}
                </h3>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-kalp)]">
                İncele
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
