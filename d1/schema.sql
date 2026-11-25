-- Pati Kalbi: Sanal Barınak v2.0 — Cloudflare D1 (SQLite) Şeması

CREATE TABLE IF NOT EXISTS shelters (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  city          TEXT NOT NULL,
  district      TEXT NOT NULL,
  municipality  TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  visiting_info TEXT
);

CREATE TABLE IF NOT EXISTS animals (
  id                 TEXT PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  shelter_id         TEXT NOT NULL REFERENCES shelters(id),
  name               TEXT NOT NULL,
  species            TEXT NOT NULL CHECK (species IN ('kedi','kopek')),
  sex                TEXT NOT NULL CHECK (sex IN ('disi','erkek','bilinmiyor')),
  age_months_est     INTEGER,
  size               TEXT CHECK (size IN ('kucuk','orta','buyuk')),
  shoulder_height_cm INTEGER,
  coat_and_look      TEXT,
  vaccinated         INTEGER,
  neutered           INTEGER,
  microchipped       INTEGER,
  health_note        TEXT,
  t_energy           INTEGER,
  t_people           INTEGER,
  t_children         INTEGER,
  t_animals          INTEGER,
  t_alone            INTEGER,
  apartment_ok       INTEGER,
  story              TEXT,
  ideal_home         TEXT,
  seo_description    TEXT,
  status             TEXT NOT NULL DEFAULT 'taslak'
                     CHECK (status IN ('taslak','onay_bekliyor','yayinda',
                                       'ilgi_var','yuvaya_kavustu','arsiv')),
  vet_approved_by    TEXT,
  vet_approved_at    TEXT,
  created_by         TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  published_at       TEXT
);

CREATE TABLE IF NOT EXISTS photos (
  id         TEXT PRIMARY KEY,
  animal_id  TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  file_key   TEXT NOT NULL,
  width      INTEGER,
  height     INTEGER,
  blurhash   TEXT,
  alt_text   TEXT NOT NULL,
  credit     TEXT,
  is_cover   INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS animal_models (
  id               TEXT PRIMARY KEY,
  animal_id        TEXT UNIQUE NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  glb_key          TEXT,
  usdz_key         TEXT,
  splat_key        TEXT,
  poster_key       TEXT,
  scale_height_cm  INTEGER NOT NULL,
  poly_count       INTEGER,
  glb_size_bytes   INTEGER,
  capture_method   TEXT NOT NULL DEFAULT 'image_to_3d'
                   CHECK (capture_method IN ('image_to_3d','photogrammetry','gaussian_splat','hybrid')),
  status           TEXT NOT NULL DEFAULT 'isleniyor'
                   CHECK (status IN ('isleniyor','onay_bekliyor','aktif','pasif')),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seo_pages (
  id               TEXT PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  page_type        TEXT NOT NULL CHECK (page_type IN ('intent_landing','local_seo','guide')),
  h1_title         TEXT NOT NULL,
  slogan           TEXT,
  meta_title       TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  filter_preset    TEXT,
  body_md          TEXT NOT NULL,
  faq_json         TEXT,
  is_published     INTEGER DEFAULT 0,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id            TEXT PRIMARY KEY,
  animal_id     TEXT NOT NULL REFERENCES animals(id),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  city          TEXT NOT NULL,
  housing_type  TEXT,
  has_children  INTEGER,
  has_pets      INTEGER,
  experience    TEXT,
  motivation    TEXT,
  consent_at    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'yeni'
                CHECK (status IN ('yeni','bakimevine_iletildi','gorusme',
                                  'yuvaya_kavustu','sonuclanmadi','vazgecti')),
  internal_note TEXT,
  created_at    TEXT NOT NULL,
  forwarded_at  TEXT,
  delete_after  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('editor','approver','admin')),
  password_hash TEXT NOT NULL,
  totp_secret   TEXT,
  totp_enabled  INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id        TEXT PRIMARY KEY,
  user_id   TEXT,
  action    TEXT NOT NULL,
  entity    TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  detail    TEXT,
  at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_photos_animal ON photos(animal_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_applications_animal ON applications(animal_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_type ON seo_pages(page_type, is_published);
