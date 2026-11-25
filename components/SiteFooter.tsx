import React from 'react';
import Link from 'next/link';
import { PWAInstallButton } from './PWAInstallButton';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4 space-y-4">
            <p
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Pati Kalbi
            </p>
            <p className="text-sm text-[var(--ink-muted)] max-w-sm leading-relaxed">
              Satın alma, sahiplen. Etiketi yok, kalbi var. Gerze Belediyesi Geçici Hayvan Bakımevi
              ve GEFOK gönüllüleriyle hazırlanan açık kaynaklı sanal barınak.
            </p>
            <div className="pt-1">
              <PWAInstallButton compact />
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-sm font-semibold">Sahiplenme ve keşif</p>
            <ul className="space-y-2 text-sm text-[var(--ink-muted)]">
              <li>
                <Link href="/can-dostlari" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Tüm can dostları
                </Link>
              </li>
              <li>
                <Link href="/can-dostlari?has_3d=1" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  3D ve WebAR profiller
                </Link>
              </li>
              <li>
                <Link href="/kopek-satin-alma-sahiplen" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Köpek satın alma, sahiplen
                </Link>
              </li>
              <li>
                <Link href="/kedi-satin-alma-sahiplen" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Kedi satın alma, sahiplen
                </Link>
              </li>
              <li>
                <Link href="/pet-satin-alma-sahiplen" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Can satın alınmaz, sahiplenilir
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-sm font-semibold">Yerel bilgi ve rehber</p>
            <ul className="space-y-2 text-sm text-[var(--ink-muted)]">
              <li>
                <Link href="/gerze-barinak-sahiplenme" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Gerze barınak sahiplenme
                </Link>
              </li>
              <li>
                <Link href="/sinop-hayvan-sahiplenme" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Sinop hayvan sahiplenme
                </Link>
              </li>
              <li>
                <Link href="/nasil-sahiplenilir" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Nasıl sahiplenilir?
                </Link>
              </li>
              <li>
                <Link href="/rehber" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Sahiplenme rehberi
                </Link>
              </li>
              <li>
                <Link href="/sss" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Sık sorulanlar
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-sm font-semibold">Kurumsal</p>
            <ul className="space-y-2 text-sm text-[var(--ink-muted)]">
              <li>
                <Link href="/hakkinda" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Proje hakkında
                </Link>
              </li>
              <li>
                <Link href="/kvkk" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  KVKK aydınlatma
                </Link>
              </li>
              <li>
                <Link href="/gizlilik" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Gizlilik ve çerezler
                </Link>
              </li>
              <li>
                <Link href="/yonetim" className="hover:text-[var(--ink-karadeniz)] hover:underline">
                  Yönetim paneli
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border-hairline)] pt-6 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Satın Alma, Sahiplen. Kod açık kaynaktır (MIT). Fotoğrafların hakları fotoğrafçılarına
            aittir.
          </p>
          <p>Ödeme veya bağış alınmaz · Çerezsiz gizlilik</p>
        </div>
      </div>
    </footer>
  );
}
