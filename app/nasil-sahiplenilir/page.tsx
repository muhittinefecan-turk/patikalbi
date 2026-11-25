import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, Heart, MapPin, ShieldCheck } from 'lucide-react';
import { listShelters } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nasıl Sahiplenilir?',
  description:
    'Gerze Belediyesi Geçici Hayvan Bakımevi’nden ücretsiz kedi ve köpek sahiplenme adımları, gerekli belgeler ve yüz yüze teslim kuralları.',
  alternates: { canonical: '/nasil-sahiplenilir' },
};

const STEPS = [
  {
    num: '01',
    title: 'Profili ve mizaç bilgilerini dürüstçe incele',
    body: 'Her hayvanın enerji düzeyi, insanlarla/çocuklarla/diğer hayvanlarla uyumu ve yalnız kalabilme süresi veteriner gözlemiyle puanlanmıştır. 3D destekli profillerde omuz yüksekliğini cetvelle kontrol edip telefonunda odanda deneyebilirsin.',
  },
  {
    num: '02',
    title: 'Ücretsiz ön başvuru formunu doldur',
    body: 'Profil sayfasındaki ön başvuru formunda iletişim bilgilerini, ev tipini ve sahiplenme motivasyonunu paylaş. Formda herhangi bir ücret, kapora veya bağış talebi yoktur; bilgiler yalnızca KVKK açık rızanla bakımevine iletilmek üzere saklanır.',
  },
  {
    num: '03',
    title: 'Bakımevi ekibiyle telefon veya e-posta görüşmesi',
    body: 'Ön başvurun Gerze Belediyesi Geçici Hayvan Bakımevi sorumlularına iletilir. Evinin ve yaşam düzeninin seçtiğin can dostuyla uyumu birlikte değerlendirilir ve tanışma günü planlanır.',
  },
  {
    num: '04',
    title: 'Bakımevinde yüz yüze tanışma ve teslim',
    body: 'Sahiplenme işlemi çevrimiçi tamamlanmaz; yasal sahiplenme formu, kimlik tespiti ve 5199 sayılı kanun kapsamında Tarım ve Orman Bakanlığı mikroçip devri yalnızca bakımevinde yüz yüze yapılır.',
  },
];

export default async function NasilSahiplenilirPage() {
  const shelters = await listShelters();
  const shelter = shelters[0];

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-3xl border-b border-[var(--border-hairline)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
          Adım Adım Sahiplenme
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-4xl">
          Nasıl sahiplenilir?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--ink-muted)]">
          Pati Kalbi üzerinden sahiplenme tamamen ücretsizdir. Amacımız bir hayvanı en hızlı
          şekilde değil, ömür boyu ayrılmayacağı en doğru yuvaya kavuşturmaktır.
        </p>
      </header>

      <ol className="mt-10 space-y-8">
        {STEPS.map((step) => (
          <li
            key={step.num}
            className="grid gap-4 border-b border-[var(--border-hairline)] pb-8 sm:grid-cols-12"
          >
            <div className="sm:col-span-2">
              <span className="font-display text-2xl font-bold text-[var(--accent-kalp)]">
                {step.num}
              </span>
            </div>
            <div className="sm:col-span-10">
              <h2 className="font-display text-xl font-semibold text-[var(--ink-karadeniz)]">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
          <div className="flex items-center gap-2 text-[var(--accent-yosun)]">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
              Bakımevine gelirken gerekenler
            </h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ink-muted)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-yosun)]" />
              <span>T.C. kimlik kartı (18 yaşını doldurmuş sahiplenici)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-yosun)]" />
              <span>Kediler için güvenli taşıma kutusu, köpekler için göğüs tasması ve kayış</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-yosun)]" />
              <span>Evde birlikte yaşayan diğer bireylerin ortak onayı</span>
            </li>
          </ul>
        </div>

        <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
          <div className="flex items-center gap-2 text-[var(--accent-kalp)]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
              Bakımevi Ziyaret Bilgisi
            </h2>
          </div>
          {shelter ? (
            <div className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
              <p className="font-semibold text-[var(--ink-karadeniz)]">{shelter.name}</p>
              <p>
                {shelter.district}, {shelter.city} ({shelter.municipality})
              </p>
              {shelter.visiting_info && <p>{shelter.visiting_info}</p>}
              {shelter.contact_phone && <p>Telefon: {shelter.contact_phone}</p>}
              <p>E-posta: {shelter.contact_email}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Gerze Belediyesi Geçici Hayvan Bakımevi, Gerze / Sinop.
            </p>
          )}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-yosun)]" />
          <p className="text-sm text-[var(--ink-muted)]">
            Hazırsan şimdi yuva bekleyen can dostlarımızla tanışabilir, ücretsiz ön başvurunu
            gönderebilirsin.
          </p>
        </div>
        <Link
          href="/can-dostlari"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--accent-kalp)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          Can dostlarını gör
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
