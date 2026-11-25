import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular (SSS)',
  description:
    'Pati Kalbi sanal barınak, ücretsiz sahiplenme şartları, 3D/AR boyut incelemesi, mikroçip devri ve başvuru süreci hakkında sıkça sorulan sorular.',
  alternates: { canonical: '/sss' },
};

const FAQ_ITEMS = [
  {
    q: 'Pati Kalbi üzerinden sahiplenme ücretli mi?',
    a: 'Hayır. Pati Kalbi ve Gerze Belediyesi Geçici Hayvan Bakımevi üzerinden yapılan tüm sahiplenmeler tamamen ücretsizdir. Sitede herhangi bir ödeme, bağış veya aracılık sistemi bulunmaz.',
  },
  {
    q: 'Çevrimiçi ön başvuru yaptıktan sonra hayvanı kargoyla veya uzaktan teslim alabilir miyim?',
    a: 'Hayır. Hayvanların refahı ve yasal sahiplendirme kuralları gereği resmi sahiplenme ve mikroçip devri yalnızca bakımevinde yüz yüze tanışma sonrasında gerçekleştirilir.',
  },
  {
    q: 'Profillerdeki "3D Gör" ve "Evinde Gör (AR)" özelliği ne işe yarar?',
    a: 'Özellikle köpek sahiplenmede hayvanın gerçek boyutunu tahmin etmek zordur. 3D sahne, her hayvanın veterinerce ölçülen omuz yüksekliğine (cm) göre 1:1 ölçeklenir. Mobilde telefon kameranla evinin zeminine yerleştirip boyutunu görebilir, masaüstünde ise QR kod okutarak telefonunda açabilirsin.',
  },
  {
    q: 'Mizaç puanlarında neden bazı alanlar "Denenmedi" olarak görünüyor?',
    a: 'Dürüstlük ilkemiz gereği gözlemlenmemiş hiçbir davranış hakkında tahmin yürütmeyiz. Örneğin bir köpeğin çocuklarla veya kedilerle teması henüz gözlemlenmediyse o alan açıkça "Denenmedi" şeklinde belirtilir.',
  },
  {
    q: 'Başvuru formunda paylaştığım kişisel veriler kimlerle paylaşılır ve ne kadar saklanır?',
    a: 'Ad, telefon, e-posta ve yaşam alanı bilgileriniz yalnızca sahiplenme ön değerlendirmesi amacıyla Gerze Belediyesi Geçici Hayvan Bakımevi sorumlularıyla paylaşılır; kamuya açık sayfalarda asla görünmez. En fazla 12 ay sonunda veya talebiniz üzerine tek tıkla silinir.',
  },
  {
    q: 'Sinop veya Gerze dışından başvuru yapabilir miyim?',
    a: 'Evet, ön başvuru yapabilirsiniz. Ancak bakımevine bizzat gelip can dostuyla yüz yüze tanışmanız ve güvenli ulaşımı kendi imkanlarınızla sağlamanız gerekir.',
  },
  {
    q: 'Pati Kalbi çerez veya takip kodu kullanıyor mu?',
    a: 'Hayır. Ziyaretçi sayfalarında reklam, izleme veya analiz çerezi kullanılmaz. Yazı tipleri kendi sunucumuzdan servis edilir; tema tercihiniz yalnızca kendi tarayıcınızda saklanır.',
  },
];

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function SssPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />

      <header className="border-b border-[var(--border-hairline)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
          Merak Edilenler
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink-karadeniz)] sm:text-4xl">
          Sıkça sorulan sorular
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--ink-muted)]">
          Sahiplenme süreci, 3D önizleme, yasal teslim ve veri gizliliği hakkında en çok sorulan
          soruların yanıtları.
        </p>
      </header>

      <div className="mt-8 divide-y divide-[var(--border-hairline)] border-b border-[var(--border-hairline)]">
        {FAQ_ITEMS.map((item, idx) => (
          <details key={idx} className="group py-5" open={idx === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
              <span>{item.q}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-[var(--ink-muted)] transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[var(--ink-muted)]">
        <span>Başka bir sorunuz mu var?</span>
        <Link href="/nasil-sahiplenilir" className="font-semibold text-[var(--accent-kalp)] hover:underline">
          Bakımevi iletişim bilgileri
        </Link>
        <Link href="/rehber" className="font-semibold text-[var(--ink-karadeniz)] hover:text-[var(--accent-kalp)]">
          Sahiplenme rehberleri
        </Link>
      </div>
    </div>
  );
}
