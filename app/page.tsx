import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Box, Compass, Heart, MapPin, ShieldCheck } from 'lucide-react';
import { AnimalTile } from '@/components/AnimalTile';
import { FaceWall } from '@/components/FaceWall';
import { getPublicStats, listPublicAnimals, listPublishedSeoPages } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [animals, stats, seoPages] = await Promise.all([
    listPublicAnimals(),
    getPublicStats(),
    listPublishedSeoPages(),
  ]);

  const activeAnimals = animals.filter((a) => a.status === 'yayinda' || a.status === 'ilgi_var');
  const wallAnimals = activeAnimals.slice(0, 12);
  const spotlight3d = activeAnimals.filter((a) => a.model?.status === 'aktif').slice(0, 4);
  const intentPages = seoPages.filter(
    (p) => p.page_type === 'intent_landing' || p.page_type === 'local_seo'
  );
  const guidePages = seoPages.filter((p) => p.page_type === 'guide').slice(0, 3);

  return (
    <div>
      {/* Hero + Manifesto */}
      <section className="mx-auto max-w-[1280px] px-4 pt-10 pb-8 sm:px-6 sm:pt-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-kalp)]">
            Satın alma, sahiplen · Etiketi yok, kalbi var
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--ink-karadeniz)] sm:text-5xl lg:text-[56px]">
            Gerze&apos;nin can dostlarıyla göz hizasında tanış.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Pati Kalbi, Gerze Belediyesi Geçici Hayvan Bakımevi&apos;ndeki kedi ve köpekleri
            veteriner onaylı mizaç profilleri, dürüst sağlık notları ve gerçek 1:1 3D boyut
            önizlemesiyle gönüllü yuvalarla buluşturur.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/can-dostlari"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--accent-kalp)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              Can dostlarını gör
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/can-dostlari?has_3d=1"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-6 py-3 text-sm font-semibold text-[var(--ink-karadeniz)] transition-colors hover:border-[var(--accent-kalp)]"
            >
              <Box className="h-4 w-4" aria-hidden="true" />
              Odanda 3D dene
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border-hairline)] pt-5 text-sm text-[var(--ink-muted)]">
            <span>
              Şu an yuva bekleyen{' '}
              <strong className="font-semibold text-[var(--ink-karadeniz)]">
                {stats.waiting} can dostu
              </strong>{' '}
              var.
            </span>
            {stats.with_3d > 0 && (
              <span>
                <strong className="font-semibold text-[var(--ink-karadeniz)]">
                  {stats.with_3d}
                </strong>{' '}
                profilde 3D / AR boyut incelemesi açık.
              </span>
            )}
            {stats.adopted > 0 && (
              <span>
                <strong className="font-semibold text-[var(--accent-yosun)]">
                  {stats.adopted}
                </strong>{' '}
                can dostu yuvasına kavuştu.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Full-bleed Face Wall */}
      <div className="pb-14 pt-2 sm:pb-18">
        <FaceWall animals={wallAnimals} />
      </div>

      {/* Numbered 3-Step Adoption Flow */}
      <section className="border-y border-[var(--border-hairline)] bg-[var(--surface-beyaz)] py-14 sm:py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-yosun)]">
                Sahiplenme süreci
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-3xl">
                Nasıl çalışır?
              </h2>
            </div>
            <Link
              href="/nasil-sahiplenilir"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--accent-kalp)] hover:underline"
            >
              Detaylı sahiplenme rehberi
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            <li className="border-t border-[var(--border-hairline)] pt-5">
              <span className="font-display text-sm font-bold text-[var(--accent-kalp)]">01</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                Tanış &amp; 3D ile gerçek boyutunu gör
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Mizaç puanlarını, apartman uyumunu ve veteriner onaylı sağlık durumunu incele.
                İstersen 3D sahnede omuz yüksekliğini cetvelle kontrol edip telefon kameranla odanda
                dene.
              </p>
            </li>
            <li className="border-t border-[var(--border-hairline)] pt-5">
              <span className="font-display text-sm font-bold text-[var(--accent-kalp)]">02</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                Ücretsiz ön başvuru gönder
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Profildeki ön başvuru formunu 2 dakikada doldur. Hiçbir ücret, bağış veya aracı
                yoktur; başvurunun doğrudan Gerze Belediyesi bakımevi ekibine ulaşmasını sağlarız.
              </p>
            </li>
            <li className="border-t border-[var(--border-hairline)] pt-5">
              <span className="font-display text-sm font-bold text-[var(--accent-kalp)]">03</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                Bakımevinde yüz yüze buluş
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Resmi sahiplenme ve mikroçip devri yalnızca bakımevinde yüz yüze tanışma sonrası
                gerçekleştirilir. Evine en uyumlu dostla ömürlük bir bağ kur.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* 3D & WebAR Spotlight */}
      {spotlight3d.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
                1:1 Omuz yüksekliği ölçeği · WebAR
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-3xl">
                3D ve Evinde Gör destekli can dostları
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                Sadece tıkladığında yüklenen hafif 3D stüdyo motoruyla boyut sürprizlerini ortadan
                kaldır. Mobilde salonunda dene, masaüstünde QR kodla telefonuna aktar.
              </p>
            </div>
            <Link
              href="/can-dostlari?has_3d=1"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--accent-kalp)] hover:underline"
            >
              Tüm 3D profiller
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {spotlight3d.map((animal) => (
              <AnimalTile key={animal.id} animal={animal} />
            ))}
          </div>
        </section>
      )}

      {/* Counter-Search SEO Landings & Local Shelter Pages */}
      <section className="border-t border-[var(--border-hairline)] bg-[var(--surface-beyaz)] py-14 sm:py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-yosun)]">
                Etik sahiplenme &amp; yerel rehber
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-3xl">
                Satın almadan önce buradakilerle tanış
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
                Arama motorlarında &ldquo;satın alma&rdquo; niyetiyle yola çıkan herkesin,
                ücretsiz ve veteriner onaylı sahiplenme seçeneğiyle karşılaşması için hazırladığımız
                bilgilendirici sayfalar ve Sinop / Gerze yerel rehberleri.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-4 text-xs text-[var(--ink-muted)]">
                <ShieldCheck
                  className="h-5 w-5 shrink-0 text-[var(--accent-yosun)]"
                  aria-hidden="true"
                />
                <span>
                  Tüm profiller veteriner hekim onayı olmadan yayına alınmaz; kişisel başvuru
                  verileri kamuya açık sayfalarda asla görünmez.
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
              {intentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="group flex flex-col justify-between rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-4 transition-colors hover:border-[var(--accent-kalp)]"
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      {page.page_type === 'local_seo' ? (
                        <>
                          <MapPin className="h-3.5 w-3.5 text-[var(--accent-yosun)]" />
                          Yerel Barınak Rehberi
                        </>
                      ) : (
                        <>
                          <Compass className="h-3.5 w-3.5 text-[var(--accent-kalp)]" />
                          Satın Alma, Sahiplen
                        </>
                      )}
                    </span>
                    <h3 className="mt-2 font-display text-base font-semibold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)] transition-colors">
                      {page.h1_title}
                    </h3>
                    {page.slogan && (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {page.slogan}
                      </p>
                    )}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-kalp)]">
                    Sayfaya git
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Adoption Guides Row */}
          {guidePages.length > 0 && (
            <div className="mt-12 border-t border-[var(--border-hairline)] pt-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--ink-karadeniz)]" aria-hidden="true" />
                  <h3 className="font-display text-xl font-semibold text-[var(--ink-karadeniz)]">
                    Sahiplenme Rehberleri
                  </h3>
                </div>
                <Link
                  href="/rehber"
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--accent-kalp)] hover:underline"
                >
                  Tüm rehberleri gör
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {guidePages.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/rehber/${guide.slug}`}
                    className="group rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-5 transition-colors hover:border-[var(--accent-kalp)]"
                  >
                    <h4 className="font-display text-base font-semibold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)] transition-colors">
                      {guide.h1_title}
                    </h4>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ink-muted)]">
                      {guide.meta_description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)]">
                      Rehberi oku
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
