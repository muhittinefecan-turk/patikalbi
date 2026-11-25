'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Search, SlidersHorizontal, X } from 'lucide-react';
import { getAgeGroup, normalizeTrSearch } from '@/lib/turkish';
import type { AnimalWithDetails } from '@/lib/types';
import { AnimalTile } from './AnimalTile';

interface FilterState {
  species: string;
  sex: string;
  size: string;
  age: string;
  kids: boolean;
  pets: boolean;
  apartment: boolean;
  has_3d: boolean;
  q: string;
  sort: string;
}

export function AnimalCatalogClient({ initialAnimals }: { initialAnimals: AnimalWithDetails[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobileDrawerRef = useRef<HTMLDialogElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    species: searchParams.get('species') || '',
    sex: searchParams.get('sex') || '',
    size: searchParams.get('size') || '',
    age: searchParams.get('age') || '',
    kids: searchParams.get('kids') === '1',
    pets: searchParams.get('pets') === '1',
    apartment: searchParams.get('apartment') === '1',
    has_3d: searchParams.get('has_3d') === '1',
    q: searchParams.get('q') || '',
    sort: searchParams.get('sort') || 'recent',
  });

  const syncUrl = (next: FilterState) => {
    const params = new URLSearchParams();
    if (next.species) params.set('species', next.species);
    if (next.sex) params.set('sex', next.sex);
    if (next.size) params.set('size', next.size);
    if (next.age) params.set('age', next.age);
    if (next.kids) params.set('kids', '1');
    if (next.pets) params.set('pets', '1');
    if (next.apartment) params.set('apartment', '1');
    if (next.has_3d) params.set('has_3d', '1');
    if (next.q.trim()) params.set('q', next.q.trim());
    if (next.sort && next.sort !== 'recent') params.set('sort', next.sort);
    const qs = params.toString();
    router.replace(qs ? `/can-dostlari?${qs}` : '/can-dostlari', { scroll: false });
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    syncUrl(next);
  };

  const resetAll = () => {
    const empty: FilterState = {
      species: '',
      sex: '',
      size: '',
      age: '',
      kids: false,
      pets: false,
      apartment: false,
      has_3d: false,
      q: '',
      sort: 'recent',
    };
    setFilters(empty);
    syncUrl(empty);
  };

  const filteredAnimals = useMemo(() => {
    let list = [...initialAnimals];
    if (filters.species) list = list.filter((a) => a.species === filters.species);
    if (filters.sex) list = list.filter((a) => a.sex === filters.sex);
    if (filters.size) list = list.filter((a) => a.size === filters.size);
    if (filters.age) list = list.filter((a) => getAgeGroup(a.age_months_est) === filters.age);
    if (filters.kids) list = list.filter((a) => (a.t_children ?? 0) >= 4);
    if (filters.pets) list = list.filter((a) => (a.t_animals ?? 0) >= 4);
    if (filters.apartment) list = list.filter((a) => a.apartment_ok === 1);
    if (filters.has_3d) list = list.filter((a) => a.model?.status === 'aktif');
    if (filters.q.trim()) {
      const needle = normalizeTrSearch(filters.q);
      list = list.filter((a) =>
        normalizeTrSearch(
          `${a.name} ${a.story ?? ''} ${a.ideal_home ?? ''} ${a.coat_and_look ?? ''}`
        ).includes(needle)
      );
    }
    if (filters.sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
    } else if (filters.sort === 'youngest') {
      list.sort((a, b) => (a.age_months_est ?? 999) - (b.age_months_est ?? 999));
    } else if (filters.sort === 'oldest') {
      list.sort((a, b) => (b.age_months_est ?? 0) - (a.age_months_est ?? 0));
    }
    return list;
  }, [initialAnimals, filters]);

  const activeChips: Array<{ label: string; clear: () => void }> = [];
  if (filters.species) {
    activeChips.push({
      label: filters.species === 'kedi' ? 'Kedi' : 'Köpek',
      clear: () => updateFilter('species', ''),
    });
  }
  if (filters.sex) {
    activeChips.push({
      label: filters.sex === 'disi' ? 'Dişi' : 'Erkek',
      clear: () => updateFilter('sex', ''),
    });
  }
  if (filters.size) {
    activeChips.push({
      label:
        filters.size === 'kucuk'
          ? 'Küçük boy'
          : filters.size === 'orta'
            ? 'Orta boy'
            : 'Büyük boy',
      clear: () => updateFilter('size', ''),
    });
  }
  if (filters.age) {
    const map: Record<string, string> = {
      yavru: 'Yavru (0–1 yaş)',
      genc: 'Genç (1–3 yaş)',
      yetiskin: 'Yetişkin (3–7 yaş)',
      yasli: 'Olgun (7+ yaş)',
    };
    activeChips.push({ label: map[filters.age] || filters.age, clear: () => updateFilter('age', '') });
  }
  if (filters.has_3d) {
    activeChips.push({ label: '3D / AR mevcut', clear: () => updateFilter('has_3d', false) });
  }
  if (filters.kids) {
    activeChips.push({ label: 'Çocuklarla uyumlu', clear: () => updateFilter('kids', false) });
  }
  if (filters.pets) {
    activeChips.push({ label: 'Diğer hayvanlarla uyumlu', clear: () => updateFilter('pets', false) });
  }
  if (filters.apartment) {
    activeChips.push({ label: 'Apartmana uygun', clear: () => updateFilter('apartment', false) });
  }
  if (filters.q.trim()) {
    activeChips.push({ label: `Arama: ${filters.q.trim()}`, clear: () => updateFilter('q', '') });
  }

  const filterControls = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          aria-label="Tür filtresi"
          value={filters.species}
          onChange={(e) => updateFilter('species', e.target.value)}
          className="min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm text-[var(--ink-karadeniz)]"
        >
          <option value="">Tüm türler</option>
          <option value="kopek">Köpek</option>
          <option value="kedi">Kedi</option>
        </select>

        <select
          aria-label="Cinsiyet filtresi"
          value={filters.sex}
          onChange={(e) => updateFilter('sex', e.target.value)}
          className="min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm text-[var(--ink-karadeniz)]"
        >
          <option value="">Cinsiyet (tümü)</option>
          <option value="disi">Dişi</option>
          <option value="erkek">Erkek</option>
        </select>

        <select
          aria-label="Boy filtresi"
          value={filters.size}
          onChange={(e) => updateFilter('size', e.target.value)}
          className="min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm text-[var(--ink-karadeniz)]"
        >
          <option value="">Boy (tümü)</option>
          <option value="kucuk">Küçük boy</option>
          <option value="orta">Orta boy</option>
          <option value="buyuk">Büyük boy</option>
        </select>

        <select
          aria-label="Yaş grubu filtresi"
          value={filters.age}
          onChange={(e) => updateFilter('age', e.target.value)}
          className="min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm text-[var(--ink-karadeniz)]"
        >
          <option value="">Yaş grubu (tümü)</option>
          <option value="yavru">Yavru (0–1 yaş)</option>
          <option value="genc">Genç (1–3 yaş)</option>
          <option value="yetiskin">Yetişkin (3–7 yaş)</option>
          <option value="yasli">Olgun (7+ yaş)</option>
        </select>

        <select
          aria-label="Sıralama"
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm text-[var(--ink-karadeniz)]"
        >
          <option value="recent">En yeni eklenenler</option>
          <option value="name">Ada göre (A–Z)</option>
          <option value="youngest">En genç önce</option>
          <option value="oldest">En olgun önce</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateFilter('has_3d', !filters.has_3d)}
          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-sm font-medium border transition-colors whitespace-nowrap ${
            filters.has_3d
              ? 'border-[#F2B33D] bg-[#F2B33D] text-[#0F2E3A] font-semibold'
              : 'border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
          }`}
        >
          <Box className="h-4 w-4" aria-hidden="true" />
          3D / AR mevcut
        </button>

        <button
          type="button"
          onClick={() => updateFilter('apartment', !filters.apartment)}
          className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium border transition-colors whitespace-nowrap ${
            filters.apartment
              ? 'border-[var(--ink-karadeniz)] bg-[var(--ink-karadeniz)] text-[var(--bg-sis)]'
              : 'border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
          }`}
        >
          Apartmana uygun
        </button>

        <button
          type="button"
          onClick={() => updateFilter('kids', !filters.kids)}
          className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium border transition-colors whitespace-nowrap ${
            filters.kids
              ? 'border-[var(--ink-karadeniz)] bg-[var(--ink-karadeniz)] text-[var(--bg-sis)]'
              : 'border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
          }`}
        >
          Çocuklarla uyumlu
        </button>

        <button
          type="button"
          onClick={() => updateFilter('pets', !filters.pets)}
          className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium border transition-colors whitespace-nowrap ${
            filters.pets
              ? 'border-[var(--ink-karadeniz)] bg-[var(--ink-karadeniz)] text-[var(--bg-sis)]'
              : 'border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
          }`}
        >
          Diğer hayvanlarla uyumlu
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Search + Mobile Drawer Trigger */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
            placeholder="İsim veya özellik ara (örn. Pamuk, Çakıl, sakin)..."
            aria-label="Can dostu ara"
            className="min-h-[44px] w-full rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] pl-11 pr-4 text-sm text-[var(--ink-karadeniz)]"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-muted)] tabular-nums">
            {filteredAnimals.length} can dostu listeleniyor
          </p>
          <button
            type="button"
            onClick={() => mobileDrawerRef.current?.showModal()}
            className="inline-flex md:hidden min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-sm font-semibold text-[var(--ink-karadeniz)]"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtrele{activeChips.length > 0 ? ` (${activeChips.length})` : ''}
          </button>
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block rounded-2xl liquid-glass p-5">{filterControls}</div>

      {/* Active Removable Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.clear}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--ink-karadeniz)] px-3.5 text-xs font-medium text-[var(--bg-sis)]"
            >
              <span>{chip.label}</span>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="min-h-[36px] px-3 text-xs font-semibold text-[var(--accent-kalp)] hover:underline"
          >
            Tümünü temizle
          </button>
        </div>
      )}

      {/* Results Grid or Empty State */}
      {filteredAnimals.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-10 text-center space-y-4">
          <p className="text-lg font-semibold text-[var(--ink-karadeniz)]">
            Bu filtrelere uyan can dostu yok. Filtreleri gevşet ya da tümünü gör.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--accent-kalp)] px-6 text-sm font-semibold text-white"
          >
            Tüm can dostlarını gör
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAnimals.map((animal) => (
            <AnimalTile key={animal.id} animal={animal} />
          ))}
        </div>
      )}

      {/* Mobile Bottom Sheet Native <dialog> */}
      <dialog
        ref={mobileDrawerRef}
        aria-label="Filtre paneli"
        className="pati-dialog fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-3xl bg-[var(--surface-beyaz)] p-6 text-[var(--ink-karadeniz)] border-t border-[var(--border-hairline)]"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Filtrele</h2>
          <button
            type="button"
            onClick={() => mobileDrawerRef.current?.close()}
            aria-label="Kapat"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {filterControls}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetAll();
              mobileDrawerRef.current?.close();
            }}
            className="min-h-[44px] flex-1 rounded-full border border-[var(--border-hairline)] text-sm font-semibold"
          >
            Sıfırla
          </button>
          <button
            type="button"
            onClick={() => mobileDrawerRef.current?.close()}
            className="min-h-[44px] flex-1 rounded-full bg-[var(--accent-kalp)] text-sm font-semibold text-white"
          >
            Sonuçları gör ({filteredAnimals.length})
          </button>
        </div>
      </dialog>
    </div>
  );
}
