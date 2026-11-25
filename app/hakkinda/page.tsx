import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Code2, HeartHandshake, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hakkında — Pati Kalbi Sanal Barınak',
  description:
    'Gerze Belediyesi Geçici Hayvan Bakımevi ve Sinop Üniversitesi GEFOK iş birliğiyle geliştirilen açık kaynaklı, etik sanal barınak projesi.',
  alternates: { canonical: '/hakkinda' },
};

export default function HakkindaPage() {
  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
          Proje ve İlkelerimiz
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-4xl">
          Pati Kalbi hakkında
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--ink-muted)]">
          Pati Kalbi, barınaktaki kedi ve köpekleri birer &ldquo;ilan&rdquo; gibi değil; kendi
          mizaçları, geçmişleri ve ihtiyaçları olan birer birey olarak tanıtan dijital sanal
          barınaktır.
        </p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
          <HeartHandshake className="h-6 w-6 text-[var(--accent-kalp)]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Gerze Belediyesi &amp; GEFOK İş Birliği
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Pilot uygulama Gerze Belediyesi Geçici Hayvan Bakımevi ile Sinop Üniversitesi
            Fotoğrafçılık Kulübü (GEFOK) gönüllü öğrencilerinin ortak emeğiyle hayata geçirildi.
            Bakımevi veteriner hekimleri sağlık ve mizaç verilerini doğrular; gönüllüler portre
            fotoğrafçılığı ve 3D boyut kayıtlarını hazırlar.
          </p>
        </section>

        <section className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
          <ShieldCheck className="h-6 w-6 text-[var(--accent-yosun)]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Veteriner Onayı ve Dürüstlük İlkesi
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Hiçbir profil veteriner hekim onayı olmadan yayına alınmaz. Bilinmeyen sağlık veya mizaç
            özellikleri uydurulmaz; açıkça &ldquo;Bilinmiyor&rdquo; veya &ldquo;Denenmedi&rdquo;
            olarak gösterilir. Sitede satış, ücret, bağış veya aracılık mekanizması bulunmaz.
          </p>
        </section>

        <section className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
          <Camera className="h-6 w-6 text-[var(--ink-karadeniz)]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Fotoğraf ve 3D Kayıt Hakları
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Tüm hayvan portreleri göz hizasında, doğal ışıkla ve hayvanlara stres vermeden çekilir.
            Yükleme anında fotoğraflardaki EXIF ve GPS konum üst verileri tarayıcıda otomatik olarak
            temizlenir. 3D modeller ve taramalar yalnızca ilgili can dostunun sahiplenme profili için
            kullanılır.
          </p>
        </section>

        <section className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6">
          <Code2 className="h-6 w-6 text-[var(--ink-karadeniz)]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            MIT Açık Kaynak ve Çoğaltılabilirlik
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Pati Kalbi yazılımı MIT lisansı ile açık kaynaklı olarak tasarlandı. Veritabanı mimarisi
            birden fazla belediye bakımevini destekleyecek şekilde kurgulanmıştır; Türkiye&apos;deki
            diğer belediyeler ve üniversite kulüpleri aynı altyapıyı kolayca kendi ilçelerine
            uyarlayabilir.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-[var(--border-hairline)] pt-8 text-sm">
        <Link href="/nasil-sahiplenilir" className="font-semibold text-[var(--accent-kalp)] hover:underline">
          Nasıl sahiplenilir?
        </Link>
        <Link href="/kvkk" className="font-semibold text-[var(--ink-karadeniz)] hover:text-[var(--accent-kalp)]">
          KVKK Aydınlatma Metni
        </Link>
        <Link href="/gizlilik" className="font-semibold text-[var(--ink-karadeniz)] hover:text-[var(--accent-kalp)]">
          Çerezsiz Gizlilik Politikası
        </Link>
      </div>
    </div>
  );
}
