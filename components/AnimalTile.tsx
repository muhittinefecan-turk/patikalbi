import React from 'react';
import Link from 'next/link';
import { Box } from 'lucide-react';
import { formatAgeTr, formatSexTr, formatSizeTr, formatStatusLabelTr } from '@/lib/turkish';
import type { AnimalWithDetails } from '@/lib/types';
import { PortraitFrame } from './PortraitFrame';

export function AnimalTile({ animal }: { animal: AnimalWithDetails }) {
  const coverPhoto = animal.photos.find((p) => p.is_cover === 1) ?? animal.photos[0] ?? null;
  const has3d = animal.model?.status === 'aktif';
  const statusMeta = formatStatusLabelTr(animal.status, animal.published_at);

  return (
    <article className="tile-container group">
      <Link
        href={`/can-dostlari/${animal.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-kalp)]"
      >
        <div className="relative">
          <PortraitFrame
            name={animal.name}
            species={animal.species}
            photo={coverPhoto}
            shoulderHeightCm={animal.shoulder_height_cm}
            transitionId={animal.id}
            sizeVariant="tile"
            className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
          />
          {has3d && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-[2px] bg-[#F2B33D] px-2 py-0.5 text-xs font-semibold text-[#0F2E3A]">
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
              3D/AR
            </span>
          )}
        </div>

        {/* Unboxed typography directly beneath photo per spec §4.4 */}
        <div className="mt-3 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xl font-bold text-[var(--ink-karadeniz)] group-hover:text-[var(--accent-kalp)] transition-colors truncate">
              {animal.name}
            </h3>
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-[2px] ${
                statusMeta.tone === 'adopted'
                  ? 'bg-[var(--status-yosun)] text-white'
                  : statusMeta.tone === 'new'
                    ? 'bg-[#F2B33D] text-[#0F2E3A]'
                    : 'border border-[var(--ink-karadeniz)]/35 text-[var(--ink-karadeniz)]'
              }`}
            >
              {statusMeta.label}
            </span>
          </div>

          <p className="text-sm text-[var(--ink-muted)] truncate">
            {formatAgeTr(animal.age_months_est)} · {formatSexTr(animal.sex)} ·{' '}
            {formatSizeTr(animal.size)}
          </p>
        </div>
      </Link>
    </article>
  );
}
