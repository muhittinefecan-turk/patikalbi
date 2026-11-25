import React from 'react';
import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni (Taslak)',
  description:
    '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Pati Kalbi sahiplenme ön başvuru aydınlatma metni taslağı.',
  alternates: { canonical: '/kvkk' },
};

export default function KvkkPage() {
  return (
    <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div
        role="note"
        className="mb-8 flex items-start gap-3 rounded-[12px] border border-[var(--accent-kehribar)] bg-[var(--surface-beyaz)] p-4 text-sm text-[var(--ink-karadeniz)]"
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-kehribar)]"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold">Hukuki İnceleme Bekleyen Taslak Metin</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
            Bu sayfa 6698 sayılı KVKK kapsamında hazırlanan taslak aydınlatma metnidir. Canlı
            ortama geçilmeden önce Gerze Belediyesi Hukuk İşleri / Veri Sorumlusu temsilcisi
            tarafından onaylanarak kesinleştirilmelidir.
          </p>
        </div>
      </div>

      <header className="border-b border-[var(--border-hairline)] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
          6698 Sayılı Kanun
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)]">
          Kişisel Verilerin Korunması Aydınlatma Metni
        </h1>
      </header>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--ink-muted)]">
        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            1. Veri Sorumlusu
          </h2>
          <p className="mt-2">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca kişisel
            verileriniz; veri sorumlusu sıfatıyla Gerze Belediyesi Geçici Hayvan Bakımevi / Pati
            Kalbi proje yürütücü birimi tarafından aşağıda açıklanan kapsamda işlenmektedir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            2. İşlenen Kişisel Veriler ve İşleme Amacı
          </h2>
          <p className="mt-2">
            Sahiplenme ön başvuru formunu doldurduğunuzda paylaştığınız ad-soyad, telefon numarası,
            e-posta adresi, ikamet ili/ilçesi, ev tipi, evde çocuk/hayvan bilgisi ve sahiplenme
            motivasyonu verileri; yalnızca ilgili can dostunun uygun bir yuvaya kavuşturulması,
            bakımevi sorumlularının sizinle iletişime geçmesi ve 5199 sayılı Hayvanları Koruma
            Kanunu kapsamındaki sahiplendirme ön değerlendirmesi amacıyla işlenir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            3. Aktarım ve Kamuya Kapalılık İlkesi
          </h2>
          <p className="mt-2">
            Başvuru bilgileriniz hiçbir koşulda üçüncü taraf reklam şirketleriyle paylaşılmaz ve
            sitenin kamuya açık hiçbir sayfasında yayınlanmaz. Veriler yalnızca yetkili bakımevi
            personeli tarafından rol tabanlı erişim kontrolü ve iki adımlı doğrulama koruması
            altında görüntülenir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            4. Saklama Süresi ve İmha
          </h2>
          <p className="mt-2">
            Başvuru kayıtları, başvurunun iletildiği tarihten itibaren en fazla{' '}
            <strong className="text-[var(--ink-karadeniz)]">12 ay</strong> süreyle saklanır; süre
            dolduğunda veya ilgili kişinin talebi halinde yönetim panelinden tek işlemle kalıcı
            olarak silinir. İstatistiksel raporlar yalnızca kişisel verilerden arındırılmış anonim
            şekilde dışa aktarılır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
            5. İlgili Kişinin Hakları (KVKK Madde 11)
          </h2>
          <p className="mt-2">
            KVKK&apos;nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltme
            veya silinmesini talep etme haklarınızı{' '}
            <strong className="text-[var(--ink-karadeniz)]">bakimevi@gerze.bel.tr</strong> adresi
            üzerinden iletebilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
