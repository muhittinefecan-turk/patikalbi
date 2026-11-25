export type Species = 'kedi' | 'kopek';
export type Sex = 'disi' | 'erkek' | 'bilinmiyor';
export type AnimalSize = 'kucuk' | 'orta' | 'buyuk';
export type AnimalStatus =
  | 'taslak'
  | 'onay_bekliyor'
  | 'yayinda'
  | 'ilgi_var'
  | 'yuvaya_kavustu'
  | 'arsiv';

export type ModelCaptureMethod =
  | 'image_to_3d'
  | 'photogrammetry'
  | 'gaussian_splat'
  | 'hybrid';

export type ModelStatus = 'isleniyor' | 'onay_bekliyor' | 'aktif' | 'pasif';

export type SeoPageType = 'intent_landing' | 'local_seo' | 'guide';

export type ApplicationStatus =
  | 'yeni'
  | 'bakimevine_iletildi'
  | 'gorusme'
  | 'yuvaya_kavustu'
  | 'sonuclanmadi'
  | 'vazgecti';

export type UserRole = 'editor' | 'approver' | 'admin';

export interface Shelter {
  id: string;
  name: string;
  city: string;
  district: string;
  municipality: string;
  contact_email: string;
  contact_phone: string | null;
  visiting_info: string | null;
}

export interface AnimalPhoto {
  id: string;
  animal_id: string;
  file_key: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt_text: string;
  credit: string | null;
  is_cover: number;
  sort_order: number;
}

export interface AnimalModel {
  id: string;
  animal_id: string;
  glb_key: string | null;
  usdz_key: string | null;
  splat_key: string | null;
  poster_key: string | null;
  scale_height_cm: number;
  poly_count: number | null;
  glb_size_bytes: number | null;
  capture_method: ModelCaptureMethod;
  status: ModelStatus;
  created_at: string;
  updated_at: string;
}

export interface Animal {
  id: string;
  slug: string;
  shelter_id: string;
  name: string;
  species: Species;
  sex: Sex;
  age_months_est: number | null;
  size: AnimalSize | null;
  shoulder_height_cm: number | null;
  coat_and_look: string | null;
  vaccinated: number | null;
  neutered: number | null;
  microchipped: number | null;
  health_note: string | null;
  t_energy: number | null;
  t_people: number | null;
  t_children: number | null;
  t_animals: number | null;
  t_alone: number | null;
  apartment_ok: number | null;
  story: string | null;
  ideal_home: string | null;
  seo_description: string | null;
  status: AnimalStatus;
  vet_approved_by: string | null;
  vet_approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface AnimalWithDetails extends Animal {
  shelter?: Shelter;
  photos: AnimalPhoto[];
  model: AnimalModel | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SeoFilterPreset {
  species?: Species;
  size?: AnimalSize;
  apartment?: boolean;
  has_3d?: boolean;
  shelter_city?: string;
  shelter_district?: string;
}

export interface SeoPage {
  id: string;
  slug: string;
  page_type: SeoPageType;
  h1_title: string;
  slogan: string | null;
  meta_title: string;
  meta_description: string;
  filter_preset: string | null;
  body_md: string;
  faq_json: string | null;
  is_published: number;
  updated_at: string;
}

export interface ApplicationRecord {
  id: string;
  animal_id: string;
  animal_name?: string;
  animal_slug?: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  housing_type: string | null;
  has_children: number | null;
  has_pets: number | null;
  experience: string | null;
  motivation: string | null;
  consent_at: string;
  status: ApplicationStatus;
  internal_note: string | null;
  created_at: string;
  forwarded_at: string | null;
  delete_after: string;
}

export interface PanelUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  totp_enabled: number;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  detail: string | null;
  at: string;
}

export interface PublicStats {
  waiting: number;
  interested: number;
  adopted: number;
  with_3d: number;
  total_public: number;
}
