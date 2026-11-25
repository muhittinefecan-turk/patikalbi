'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const NAV_LINKS = [
  { href: '/can-dostlari', label: 'Can dostları' },
  { href: '/rehber', label: 'Rehber' },
  { href: '/nasil-sahiplenilir', label: 'Nasıl sahiplenilir' },
  { href: '/hakkinda', label: 'Hakkında' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-[var(--border-hairline)]">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[var(--ink-karadeniz)] whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          Pati Kalbi
        </Link>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav aria-label="Ana menü" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors underline-offset-4 hover:underline ${
                  active
                    ? 'text-[var(--ink-karadeniz)] underline decoration-[var(--accent-kalp)] decoration-2'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-karadeniz)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Theme switch + 1 primary action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aydınlık Sis temasına geç' : 'Gece Karadeniz temasına geç'}
            title={theme === 'dark' ? 'Aydınlık (Sis)' : 'Karanlık (Gece Karadeniz)'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-karadeniz)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link
            href="/can-dostlari?has_3d=1"
            className="hidden sm:inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--accent-kalp)] hover:bg-[var(--accent-kalp-hover)] px-5 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Box className="w-4 h-4" aria-hidden="true" />
            3D Galeri
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Menüyü aç veya kapat"
            className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-full text-[var(--ink-karadeniz)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobil menü"
          className="md:hidden border-t border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 py-4 space-y-1"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center rounded-full px-4 text-base font-medium text-[var(--ink-karadeniz)] hover:bg-[var(--bg-sis)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/sss"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-[44px] items-center rounded-full px-4 text-base font-medium text-[var(--ink-karadeniz)] hover:bg-[var(--bg-sis)]"
          >
            Sık sorulanlar
          </Link>
          <div className="pt-2">
            <Link
              href="/can-dostlari?has_3d=1"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-kalp)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Box className="w-4 h-4" aria-hidden="true" />
              3D / AR Galeri
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
