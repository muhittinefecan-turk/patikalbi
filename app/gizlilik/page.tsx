import React from 'react';
import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gizlilik ve Çerezsiz Web İlkesi',
  description:
    'Pati Kalbi ziyaretçi sayfalarında çerez, reklam izleyici veya üçüncü parti yazı tipi çağrısı kullanmaz.',
  alternates: { canonical: '/gizlilik' },
};

export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-[var(--border-hairline)] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-yosun)]">
          Sıfır Çerez · Sıfır İzleyici
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)]">
          Gizlilik Politikası
        </h1>
      </header>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--ink-muted)]">
        <div className="flex items-start gap-3 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-yosun)]" />
          <p className="text-[var(--ink-karadeniz)]">
            Pati Kalbi ziyaretçi sayfalarında hiçbir takip çerezi, reklam pikseli veya üçüncü parti
            davranışsal izleme kodu çalıştırılmaz. Bu nedenle rahatsız edici çerez onay pencereleri
            görmezsiniz.
          </p>
        </div>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Yerel Olarak Sunulan Yazı Tipleri ve Medya
          </h2>
          <p className="mt-2">
            Sitede kullanılan Bricolage Grotesque ve Source Sans 3 yazı tipleri uygulama derlemesi
            içinde kendi sunucumuzdan servis edilir; tarayıcınız dış yazı tipi sunucularına istek
            göndermez.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Tema Tercihi ve Çevrimdışı PWA Desteği
          </h2>
          <p className="mt-2">
            Aydınlık (Sis) / Karanlık (Gece Karadeniz) tema seçiminiz yalnızca kendi cihazınızın
            tarayıcı depolamasında saklanır ve sunucuya gönderilmez. Gönüllü saha ekibi için
            sunulan çevrimdışı taslak kuyruğu da yalnızca gönüllünün kendi cihazındaki IndexedDB
            alanında bekletilir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Spam Koruması ve Hız Sınırı
          </h2>
          <p className="mt-2">
            Ön başvuru formunu kötüye kullanıma karşı korumak için gizlilik dostu oran sınırlama
            uygulanır. Ham IP adresleri kalıcı veritabanına yazılmaz; yalnızca bellek içi kısa
            süreli özet (hash) değeriyle saatlik sınır kontrolü yapılır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            Fotoğraf Üst Verisi (EXIF / GPS) Temizliği
          </h2>
          <p className="mt-2">
            Yönetim panelinden yüklenen her fotoğraf, sunucuya gönderilmeden önce gönüllünün
            tarayıcısında yeniden kodlanarak EXIF kamera ve GPS konum bilgilerinden tamamen
            arındırılır.
          </p>
        </section>
      </div>
    </div>
  );
}
