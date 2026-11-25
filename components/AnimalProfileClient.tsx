'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Box,
  Check,
  Heart,
  Image as ImageIcon,
  Maximize2,
  QrCode,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';
import { getPublicMediaUrl } from '@/lib/media-url';
import { formatAgeTr, formatSexTr, formatSizeTr, formatStatusLabelTr } from '@/lib/turkish';
import type { AnimalWithDetails } from '@/lib/types';
import { AdoptionForm } from './AdoptionForm';
import { AnimalTile } from './AnimalTile';
import { PortraitFrame } from './PortraitFrame';
import { TemperamentChart } from './TemperamentChart';

// Zero-KB initial load: Three.js is downloaded ONLY when the user clicks "3D Gör"
const LazyAnimal3DViewer = dynamic(() => import('./Animal3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-[16px] border border-[var(--border-hairline)] bg-[#E4ECEF] dark:bg-[#0B1D26] p-6 text-center">
      <Box className="h-8 w-8 text-[var(--ink-karadeniz)]" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-[var(--ink-karadeniz)]">
        3D stüdyo sahnesi hazırlanıyor...
      </p>
    </div>
  ),
});

interface AnimalProfileClientProps {
  animal: AnimalWithDetails;
  similarAnimals: AnimalWithDetails[];
}

export function AnimalProfileClient({ animal, similarAnimals }: AnimalProfileClientProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');
  const [showForm, setShowForm] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [arStatusMsg, setArStatusMsg] = useState<string | null>(null);

  const lightboxRef = useRef<HTMLDialogElement>(null);
  const qrDialogRef = useRef<HTMLDialogElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const has3d = animal.model?.status === 'aktif';
  const glbUrl = getPublicMediaUrl(animal.model?.glb_key);
  const usdzUrl = getPublicMediaUrl(animal.model?.usdz_key);
  const splatUrl = getPublicMediaUrl(animal.model?.splat_key);
  const isAdoptedOrArchived = animal.status === 'yuvaya_kavustu' || animal.status === 'arsiv';
  const statusMeta = formatStatusLabelTr(animal.status, animal.published_at);
  const activePhoto = animal.photos[activePhotoIdx] ?? animal.photos[0] ?? null;

  useEffect(() => {
    if (!has3d) return;
    const syncFromHash = () => {
      if (window.location.hash === '#3d') {
        setViewMode('3d');
      }
    };
    const raf = window.requestAnimationFrame(syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [has3d]);

  const handleOpenAr = async () => {
    setArStatusMsg(null);
    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const profileArUrl = `${window.location.origin}/can-dostlari/${animal.slug}#3d`;

    if (isIOS && usdzUrl) {
      const a = document.createElement('a');
      a.setAttribute('rel', 'ar');
      a.setAttribute('href', usdzUrl);
      a.click();
      return;
    }

    if (isAndroid && glbUrl) {
      const absGlb = new URL(glbUrl, window.location.origin).toString();
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        absGlb
      )}&mode=ar_preferred&title=${encodeURIComponent(
        `${animal.name} (${animal.shoulder_height_cm || 40} cm)`
      )}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
      window.location.href = intentUrl;
      return;
    }

    // Check native WebXR AR support on mobile browsers
    const navXr = (navigator as unknown as { xr?: { isSessionSupported?: (m: string) => Promise<boolean> } }).xr;
    if ((isAndroid || isIOS) && navXr?.isSessionSupported) {
      try {
        const supported = await navXr.isSessionSupported('immersive-ar');
        if (supported) {
          setViewMode('3d');
          setArStatusMsg(
            'Cihazınız WebXR AR destekliyor. Editör gerçek .glb/.usdz taramasını yüklediğinde tek dokunuşla zemine yerleşecektir.'
          );
          return;
        }
      } catch {
        // Fallback to QR modal
      }
    }

    // Desktop or fallback: generate instant QR Code modal for mobile AR
    try {
      const dataUrl = await QRCode.toDataURL(profileArUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0F2E3A', light: '#FFFFFF' },
      });
      setQrDataUrl(dataUrl);
      qrDialogRef.current?.showModal();
    } catch {
      setViewMode('3d');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/can-dostlari/${animal.slug}`;
    const shareData = {
      title: `${animal.name} yuva arıyor — Satın Alma, Sahiplen | Pati Kalbi`,
      text: `${animal.name} (${formatAgeTr(animal.age_months_est)}) Gerze Bakımevinde yuva bekliyor. Satın alma, sahiplen!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User canceled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast('Paylaşım bağlantısı kopyalandı.');
      setTimeout(() => setShareToast(null), 2600);
    } catch {
      setShareToast(shareUrl);
    }
  };

  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const healthItems: string[] = [];
  if (animal.vaccinated === 1) healthItems.push('Aşılı');
  else if (animal.vaccinated === 0) healthItems.push('Aşısı planlandı');
  if (animal.neutered === 1) healthItems.push('Kısırlaştırılmış');
  else if (animal.neutered === 0) healthItems.push('Kısırlaştırılmadı');
  if (animal.microchipped === 1) healthItems.push('Çipli');
  else if (animal.microchipped === 0) healthItems.push('Çip bekliyor');

  const unknownHealthCount = [animal.vaccinated, animal.neutered, animal.microchipped].filter(
    (v) => v === null
  ).length;

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-16">
      {/* Back navigation */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/can-dostlari"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink-karadeniz)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Tüm can dostları
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm font-medium text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)] transition-colors"
        >
          {shareToast ? (
            <Check className="h-4 w-4 text-[var(--status-yosun)]" aria-hidden="true" />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden="true" />
          )}
          {shareToast ? 'Kopyalandı' : 'Paylaş'}
        </button>
      </div>

      {/* Adopted / Archived 200 OK SEO-preserving notice */}
      {isAdoptedOrArchived && (
        <div className="mb-8 rounded-2xl border border-[var(--status-yosun)] bg-[var(--status-yosun)]/10 p-5 text-[var(--ink-karadeniz)]">
          <p className="text-lg font-bold">{animal.name} yuvasına kavuştu.</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Bu profil, sahiplenmenin mümkün olduğunu göstermek ve bağlantıların kırılmaması için
            arşivde korunuyor. Aşağıda hâlâ yuva bekleyen benzer can dostlarını görebilirsin.
          </p>
        </div>
      )}

      {/* Main 2-column profile split */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        {/* Left: 4:5 Portrait Gallery OR Lazy 3D/WebAR Stage */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative">
            {viewMode === '3d' && has3d ? (
              <LazyAnimal3DViewer
                name={animal.name}
                species={animal.species}
                shoulderHeightCm={animal.model?.scale_height_cm || animal.shoulder_height_cm || 40}
                glbUrl={glbUrl}
                splatUrl={splatUrl}
                captureMethod={animal.model?.capture_method}
              />
            ) : (
              <div className="relative group">
                <PortraitFrame
                  name={animal.name}
                  species={animal.species}
                  photo={activePhoto}
                  shoulderHeightCm={animal.shoulder_height_cm}
                  transitionId={animal.id}
                  sizeVariant="hero"
                  priority
                />
                <button
                  type="button"
                  onClick={() => lightboxRef.current?.showModal()}
                  aria-label="Fotoğrafı tam ekran incele"
                  className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0F2E3A]/80 text-white hover:bg-[#0F2E3A] transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* 2D / 3D Liquid Glass Pill Switch + Odamda Gör (AR) */}
          {has3d && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Görüntüleme modu"
                className="inline-flex items-center rounded-full liquid-glass p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'photo'}
                  onClick={() => setViewMode('photo')}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                    viewMode === 'photo'
                      ? 'bg-[var(--ink-karadeniz)] text-[var(--bg-sis)]'
                      : 'text-[var(--ink-karadeniz)] hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  Fotoğraflar
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === '3d'}
                  onClick={() => setViewMode('3d')}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                    viewMode === '3d'
                      ? 'bg-[var(--ink-karadeniz)] text-[var(--bg-sis)]'
                      : 'text-[var(--ink-karadeniz)] hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Box className="h-4 w-4" aria-hidden="true" />
                  3D Gör
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenAr}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#F2B33D] hover:brightness-95 px-5 text-sm font-bold text-[#0F2E3A] transition-all"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Odamda Gör (AR)
              </button>
            </div>
          )}

          {arStatusMsg && (
            <p className="text-xs text-[var(--ink-muted)] bg-[var(--surface-beyaz)] border border-[var(--border-hairline)] rounded-xl p-3">
              {arStatusMsg}
            </p>
          )}

          {/* Thumbnails */}
          {animal.photos.length > 1 && viewMode === 'photo' && (
            <div className="grid grid-cols-4 gap-3">
              {animal.photos.map((ph, idx) => (
                <button
                  key={ph.id}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  aria-label={`${animal.name} fotoğraf ${idx + 1}`}
                  className={`overflow-hidden rounded-[4px] border-2 transition-colors ${
                    idx === activePhotoIdx
                      ? 'border-[var(--accent-kalp)]'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <PortraitFrame
                    name={animal.name}
                    species={animal.species}
                    photo={ph}
                    sizeVariant="thumb"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Editorial Details, Health, Temperament, Ideal Home & Primary CTA */}
        <div className="lg:col-span-6 space-y-7">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--ink-karadeniz)]">
                {animal.name}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-[2px] ${
                  statusMeta.tone === 'adopted'
                    ? 'bg-[var(--status-yosun)] text-white'
                    : statusMeta.tone === 'new'
                      ? 'bg-[#F2B33D] text-[#0F2E3A]'
                      : 'border border-[var(--ink-karadeniz)]/35 text-[var(--ink-karadeniz)]'
                }`}
              >
                {statusMeta.label}
              </span>
              {has3d && (
                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#F2B33D] px-2.5 py-1 text-xs font-semibold text-[#0F2E3A]">
                  <Box className="h-3.5 w-3.5" aria-hidden="true" />
                  3D/AR
                </span>
              )}
            </div>

            <p className="text-base text-[var(--ink-muted)]">
              {formatAgeTr(animal.age_months_est)} · {formatSexTr(animal.sex)} ·{' '}
              {formatSizeTr(animal.size)}
              {animal.shoulder_height_cm ? ` · ${animal.shoulder_height_cm} cm omuz` : ''}
            </p>

            {/* Health unboxed line */}
            <p className="text-sm font-medium text-[var(--ink-karadeniz)]">
              {healthItems.length > 0 ? healthItems.join(' · ') : 'Sağlık kaydı: bilinmiyor'}
              {healthItems.length > 0 && unknownHealthCount > 0
                ? ' · diğer sağlık kaydı bilinmiyor'
                : ''}
            </p>

            {animal.health_note && (
              <p className="text-sm text-[var(--ink-muted)]">{animal.health_note}</p>
            )}
          </div>

          <hr className="border-[var(--border-hairline)]" />

          {/* Signature 5-Dimension Temperament */}
          <TemperamentChart animal={animal} />

          <hr className="border-[var(--border-hairline)]" />

          {/* Ideal Home */}
          {animal.ideal_home && (
            <section className="space-y-1.5">
              <h2 className="text-lg font-bold text-[var(--ink-karadeniz)]">
                Nasıl bir yuvaya uyar?
              </h2>
              <p className="text-base text-[var(--ink-karadeniz)] leading-relaxed">
                {animal.ideal_home}
              </p>
            </section>
          )}

          {/* Story & Look */}
          {(animal.story || animal.coat_and_look) && (
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-[var(--ink-karadeniz)]">Hikâyesi</h2>
              {animal.story && (
                <p className="text-base text-[var(--ink-muted)] leading-relaxed">{animal.story}</p>
              )}
              {animal.coat_and_look && (
                <p className="text-sm text-[var(--ink-muted)]">
                  <strong>Görünüm notu:</strong> {animal.coat_and_look}
                </p>
              )}
            </section>
          )}

          {/* Shelter & Vet Approval metadata */}
          <div className="text-xs text-[var(--ink-muted)] space-y-1 pt-1">
            {animal.shelter && (
              <p>
                <strong>Bakımevi:</strong> {animal.shelter.name} ({animal.shelter.district},{' '}
                {animal.shelter.city})
              </p>
            )}
            {animal.vet_approved_by && (
              <p>
                <strong>Veteriner / yetkili onayı:</strong> {animal.vet_approved_by}
              </p>
            )}
          </div>

          {/* Primary CTA (desktop & inline) */}
          {!isAdoptedOrArchived && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[var(--accent-kalp)] hover:bg-[var(--accent-kalp-hover)] px-7 py-3 text-base font-semibold text-white transition-colors"
              >
                <Heart className="h-5 w-5" aria-hidden="true" />
                Ön başvuru yap
              </button>
              <span className="text-xs text-[var(--ink-muted)]">
                Ücretsiz · Karar ve teslim bakımevine aittir
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Inline Pre-Adoption Form */}
      {!isAdoptedOrArchived && showForm && (
        <div ref={formSectionRef} className="mt-12 max-w-2xl">
          <AdoptionForm animalId={animal.id} animalName={animal.name} />
        </div>
      )}

      {/* Similar animals (especially helpful for adopted/archived SEO retention) */}
      {similarAnimals.length > 0 && (
        <section className="mt-20 pt-10 border-t border-[var(--border-hairline)]">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-[var(--ink-karadeniz)]">
              Yuva bekleyen diğer can dostları
            </h2>
            <Link
              href="/can-dostlari"
              className="text-sm font-semibold text-[var(--accent-kalp)] hover:underline"
            >
              Tümünü gör
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {similarAnimals.map((sim) => (
              <AnimalTile key={sim.id} animal={sim} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Bottom CTA (<= 15% mobile viewport height) */}
      {!isAdoptedOrArchived && !showForm && (
        <div className="fixed inset-x-0 bottom-0 z-30 md:hidden liquid-glass border-t border-[var(--border-hairline)] px-4 py-2.5">
          <button
            type="button"
            onClick={scrollToForm}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-kalp)] px-5 text-sm font-semibold text-white"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            Ön başvuru yap
          </button>
        </div>
      )}

      {/* Native <dialog> Fullscreen Lightbox */}
      <dialog
        ref={lightboxRef}
        aria-label={`${animal.name} tam ekran portre`}
        className="pati-dialog m-auto max-w-2xl w-[92vw] rounded-2xl bg-[var(--surface-beyaz)] p-4 sm:p-6 text-[var(--ink-karadeniz)] border border-[var(--border-hairline)]"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold">{animal.name} — 4:5 Portre</p>
          <button
            type="button"
            onClick={() => lightboxRef.current?.close()}
            aria-label="Kapat"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <PortraitFrame
          name={animal.name}
          species={animal.species}
          photo={activePhoto}
          shoulderHeightCm={animal.shoulder_height_cm}
          sizeVariant="hero"
        />
        {activePhoto?.alt_text && (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">{activePhoto.alt_text}</p>
        )}
      </dialog>

      {/* Native <dialog> Desktop QR Code Modal for Phone WebAR */}
      <dialog
        ref={qrDialogRef}
        aria-label="Telefon kamerasıyla Odamda Gör QR kodu"
        className="pati-dialog m-auto max-w-sm w-[92vw] rounded-2xl bg-[var(--surface-beyaz)] p-6 text-[var(--ink-karadeniz)] border border-[var(--border-hairline)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-lg">
            <QrCode className="h-5 w-5 text-[var(--accent-kalp)]" aria-hidden="true" />
            <span>Odanda 1:1 AR Gör</span>
          </div>
          <button
            type="button"
            onClick={() => qrDialogRef.current?.close()}
            aria-label="Kapat"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Telefonunun kamerasını okutarak <strong>{animal.name}</strong> profilini doğrudan 3D ve
          AR modunda açabilirsin (Omuz yüksekliği: {animal.shoulder_height_cm || 40} cm).
        </p>

        {qrDataUrl && (
          <div className="my-5 flex justify-center rounded-xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`${animal.name} 3D AR QR kodu`}
              width={220}
              height={220}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              qrDialogRef.current?.close();
              setViewMode('3d');
            }}
            className="min-h-[44px] w-full rounded-full bg-[var(--ink-karadeniz)] text-[var(--bg-sis)] text-sm font-semibold"
          >
            Tarayıcıda 360° 3D İncele
          </button>
        </div>
      </dialog>
    </div>
  );
}
