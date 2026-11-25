import type { AnimalSize, AnimalStatus, Sex, Species } from './types';

export function slugifyTr(input: string): string {
  const map: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    I: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  };
  const replaced = input
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');

  return replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function normalizeTrSearch(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .normalize('NFC')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export function formatAgeTr(months: number | null): string {
  if (months === null || months === undefined) return 'yaşı tahmin ediliyor';
  if (months < 12) return `${months} aylık`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} yaş`;
  if (years === 1 && rem === 6) return '1,5 yaş';
  return `${years} yaş ${rem} ay`;
}

export function getAgeGroup(months: number | null): 'yavru' | 'genc' | 'yetiskin' | 'yasli' | null {
  if (months === null || months === undefined) return null;
  if (months < 12) return 'yavru';
  if (months < 36) return 'genc';
  if (months < 84) return 'yetiskin';
  return 'yasli';
}

export function formatSpeciesTr(species: Species): string {
  return species === 'kedi' ? 'Kedi' : 'Köpek';
}

export function formatSexTr(sex: Sex): string {
  if (sex === 'disi') return 'dişi';
  if (sex === 'erkek') return 'erkek';
  return 'cinsiyeti bilinmiyor';
}

export function formatSizeTr(size: AnimalSize | null): string {
  if (size === 'kucuk') return 'küçük boy';
  if (size === 'orta') return 'orta boy';
  if (size === 'buyuk') return 'büyük boy';
  return 'boy bilinmiyor';
}

export function formatStatusLabelTr(
  status: AnimalStatus,
  publishedAt?: string | null
): { label: string; tone: 'new' | 'interest' | 'adopted' | 'draft' } {
  if (status === 'yuvaya_kavustu') {
    return { label: 'Yuvaya kavuştu', tone: 'adopted' };
  }
  if (status === 'ilgi_var') {
    return { label: 'İlgi var', tone: 'interest' };
  }
  if (status === 'yayinda') {
    const isRecent =
      publishedAt && Date.now() - new Date(publishedAt).getTime() < 14 * 24 * 60 * 60 * 1000;
    return isRecent
      ? { label: 'Yeni', tone: 'new' }
      : { label: 'Yuva bekliyor', tone: 'interest' };
  }
  if (status === 'onay_bekliyor') {
    return { label: 'Onay bekliyor', tone: 'new' };
  }
  return { label: 'Taslak', tone: 'draft' };
}

export function validateTurkishPhone(raw: string): { valid: boolean; normalized: string } {
  const digits = raw.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('90') && normalized.length === 12) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    normalized = normalized.slice(1);
  }
  const valid = /^[5][0-9]{9}$/.test(normalized) || /^[2-4][0-9]{9}$/.test(normalized);
  return { valid, normalized: valid ? `+90${normalized}` : raw.trim() };
}

export const TEMPERAMENT_META = [
  { key: 't_energy', label: 'Enerji', low: 'Sakin', high: 'Çok hareketli' },
  { key: 't_people', label: 'İnsanlara yaklaşım', low: 'Çekingen', high: 'Çok girişken' },
  { key: 't_children', label: 'Çocuklarla uyum', low: 'Zor', high: 'Çok iyi' },
  { key: 't_animals', label: 'Diğer hayvanlarla uyum', low: 'Zor', high: 'Çok iyi' },
  { key: 't_alone', label: 'Yalnız kalabilme', low: 'Zor', high: 'Rahat' },
] as const;

export const MANIFESTO_SLOGANS = [
  'Satın alma, sahiplen.',
  'Etiketi yok, kalbi var.',
  'Vitrinlerden değil, barınaktan.',
  'Fiyatı 0 TL, değeri ömürlük.',
  'Önce odanda gör, sonra kalbine al.',
] as const;
