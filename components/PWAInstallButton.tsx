'use client';

import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)] transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
          compact ? 'px-4 py-2 text-sm font-medium' : 'px-5 py-2.5 text-sm font-medium'
        }`}
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        Uygulamayı kur (PWA)
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 py-2 text-sm font-medium text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Ana ekrana ekle
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="iPhone ve iPad kurulum rehberi"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[var(--surface-beyaz)] p-6 text-[var(--ink-karadeniz)] border border-[var(--border-hairline)]">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold">Ana ekrana ekle (iOS)</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Kapat"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-sm text-[var(--ink-muted)] list-decimal pl-5">
                <li>Safari alt çubuğundaki <strong>Paylaş</strong> simgesine dokunun.</li>
                <li>Listede aşağı kaydırıp <strong>Ana Ekrana Ekle</strong> seçeneğini seçin.</li>
                <li>Sağ üstten <strong>Ekle</strong> diyerek çevrimdışı saha desteğini etkinleştirin.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-full bg-[var(--ink-karadeniz)] text-[var(--bg-sis)] font-medium text-sm"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-[#F2B33D] px-4 py-2 text-sm font-semibold text-[#0F2E3A] shadow-md"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>Çevrimdışı mod — saha kayıtları yerel kuyruğa alınır.</span>
    </div>
  );
}
