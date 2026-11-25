import React from 'react';
import { Camera, Cat, Dog } from 'lucide-react';
import { getPublicMediaUrl } from '@/lib/media-url';
import type { AnimalPhoto, Species } from '@/lib/types';

interface PortraitFrameProps {
  name: string;
  species: Species;
  photo?: AnimalPhoto | null;
  shoulderHeightCm?: number | null;
  transitionId?: string;
  sizeVariant?: 'wall' | 'tile' | 'hero' | 'thumb';
  className?: string;
  priority?: boolean;
}

function parseBlurBackdrop(blurhash?: string | null): string | undefined {
  if (!blurhash || !blurhash.startsWith('pk:')) return undefined;
  const parts = blurhash.split(':');
  if (parts.length < 4) return undefined;
  return `linear-gradient(155deg, #${parts[1]} 0%, #${parts[2]} 55%, #${parts[3]} 100%)`;
}

export function PortraitFrame({
  name,
  species,
  photo,
  shoulderHeightCm,
  transitionId,
  sizeVariant = 'tile',
  className = '',
  priority = false,
}: PortraitFrameProps) {
  const mediaUrl = photo ? getPublicMediaUrl(photo.file_key) : null;
  const altText =
    photo?.alt_text || `${name} adlı ${species === 'kedi' ? 'kedi' : 'köpek'} portre çerçevesi`;
  const blurBg = parseBlurBackdrop(photo?.blurhash);

  const transitionStyle: React.CSSProperties = transitionId
    ? ({ viewTransitionName: `animal-hero-${transitionId}` } as React.CSSProperties)
    : {};

  if (mediaUrl) {
    return (
      <div
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-[4px] bg-[#DCE5E8] dark:bg-[#132C37] ${className}`}
        style={{
          ...transitionStyle,
          ...(blurBg ? { backgroundImage: blurBg } : {}),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={altText}
          width={photo?.width || 800}
          height={photo?.height || 1000}
          loading={priority ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center"
        />
        {photo?.credit && sizeVariant === 'hero' && (
          <span className="absolute bottom-2 right-2 rounded-[2px] bg-[#0F2E3A]/80 px-2 py-0.5 text-[11px] text-white">
            {photo.credit}
          </span>
        )}
      </div>
    );
  }

  // Editorial 4:5 sharp architectural placeholder portrait frame (user-selected placeholder mode)
  const SpeciesIcon = species === 'kedi' ? Cat : Dog;
  const isThumb = sizeVariant === 'thumb';

  return (
    <div
      role="img"
      aria-label={altText}
      style={transitionStyle}
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-[4px] border border-[var(--border-hairline)] bg-[#E1E9EC] dark:bg-[#102833] text-[var(--ink-karadeniz)] select-none ${className}`}
    >
      {/* Subtle eye-level framing crosshairs (GEFOK 4:5 portrait guide) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[36%] border-t border-dashed border-[#0F2E3A]/15 dark:border-[#F0F5F6]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-[#0F2E3A]/10 dark:border-[#F0F5F6]/10"
      />

      {/* Corner crop marks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[#0F2E3A]/35 dark:border-[#F0F5F6]/35"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-[#0F2E3A]/35 dark:border-[#F0F5F6]/35"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[#0F2E3A]/35 dark:border-[#F0F5F6]/35"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[#0F2E3A]/35 dark:border-[#F0F5F6]/35"
      />

      <div className="relative flex h-full w-full flex-col justify-between p-4 sm:p-5">
        {!isThumb ? (
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] tabular-nums">
            <span>4:5 portre</span>
            {shoulderHeightCm ? <span>{shoulderHeightCm} cm</span> : <span>Göz hizası</span>}
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-col items-center justify-center text-center gap-2.5 my-auto">
          <div
            className={`flex items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)]/70 ${
              isThumb ? 'h-9 w-9' : sizeVariant === 'hero' ? 'h-20 w-20' : 'h-14 w-14'
            }`}
          >
            <SpeciesIcon
              className={
                isThumb
                  ? 'h-4 w-4 text-[var(--ink-karadeniz)]'
                  : sizeVariant === 'hero'
                    ? 'h-9 w-9 text-[var(--ink-karadeniz)]'
                    : 'h-6 w-6 text-[var(--ink-karadeniz)]'
              }
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          {!isThumb && (
            <div className="space-y-1 max-w-[90%]">
              <p
                className={`font-bold tracking-tight ${
                  sizeVariant === 'hero' ? 'text-2xl sm:text-3xl' : 'text-lg'
                }`}
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                {name}
              </p>
              {sizeVariant === 'hero' && (
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-snug line-clamp-3">
                  {altText}
                </p>
              )}
            </div>
          )}
        </div>

        {!isThumb ? (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1 truncate">
              <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{photo?.credit || 'GEFOK çekim çerçevesi'}</span>
            </span>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
