'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatAgeTr } from '@/lib/turkish';
import type { AnimalWithDetails } from '@/lib/types';
import { PortraitFrame } from './PortraitFrame';

export function FaceWall({ animals }: { animals: AnimalWithDetails[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const scrollByCards = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  return (
    <section aria-label="Yüz Duvarı" className="relative">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--ink-muted)]">
          Göz hizasında, dürüst profiller — yana kaydırarak tanış
        </p>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Sola kaydır"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Sağa kaydır"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)] transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="face-wall-scroll flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 lg:px-8 pb-4"
        onMouseLeave={() => setFocusedId(null)}
      >
        {animals.map((animal, idx) => {
          const coverPhoto = animal.photos.find((p) => p.is_cover === 1) ?? animal.photos[0] ?? null;
          const has3d = animal.model?.status === 'aktif';
          const isDimmed = focusedId !== null && focusedId !== animal.id;
          const isActive = focusedId === animal.id;
          // 60ms staggered reveal capped at 600ms total per spec §4.7
          const delay = prefersReduced ? 0 : Math.min(idx * 0.06, 0.48);

          return (
            <motion.div
              key={animal.id}
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.22, delay, ease: [0.16, 1, 0.3, 1] }}
              className="snap-start shrink-0 w-[220px] sm:w-[248px] md:w-[264px]"
            >
              <Link
                href={`/can-dostlari/${animal.slug}`}
                onMouseEnter={() => setFocusedId(animal.id)}
                onFocus={() => setFocusedId(animal.id)}
                onBlur={() => setFocusedId(null)}
                className={`group block transition-all duration-200 ${
                  isDimmed ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
                }`}
              >
                <div className="relative">
                  <PortraitFrame
                    name={animal.name}
                    species={animal.species}
                    photo={coverPhoto}
                    shoulderHeightCm={animal.shoulder_height_cm}
                    transitionId={animal.id}
                    sizeVariant="wall"
                    priority={idx < 4}
                  />
                  {has3d && (
                    <span
                      className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-[2px] bg-[#F2B33D] px-2 py-0.5 text-xs font-semibold text-[#0F2E3A] transition-transform duration-200 ${
                        isActive ? 'scale-105' : ''
                      }`}
                    >
                      <Box className="h-3.5 w-3.5" aria-hidden="true" />
                      3D / Evinde Gör
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="text-lg font-bold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)] transition-colors truncate">
                    {animal.name}
                  </span>
                  <span className="text-xs text-[var(--ink-muted)] shrink-0">
                    {formatAgeTr(animal.age_months_est)}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
