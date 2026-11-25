import fs from 'fs';
import path from 'path';
import type { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import { SEED_ANIMALS, SEED_APPLICATIONS, SEED_SEO_PAGES, SEED_SHELTERS } from './seed-data';
import { getAgeGroup, normalizeTrSearch } from './turkish';
import type {
  Animal,
  AnimalModel,
  AnimalPhoto,
  AnimalWithDetails,
  ApplicationRecord,
  AuditLogEntry,
  PanelUser,
  PublicStats,
  SeoPage,
  Shelter,
} from './types';

type ParamValue = string | number | null;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS shelters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    municipality TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    visiting_info TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS animals (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    shelter_id TEXT NOT NULL REFERENCES shelters(id),
    name TEXT NOT NULL,
    species TEXT NOT NULL CHECK (species IN ('kedi','kopek')),
    sex TEXT NOT NULL CHECK (sex IN ('disi','erkek','bilinmiyor')),
    age_months_est INTEGER,
    size TEXT CHECK (size IN ('kucuk','orta','buyuk')),
    shoulder_height_cm INTEGER,
    coat_and_look TEXT,
    vaccinated INTEGER,
    neutered INTEGER,
    microchipped INTEGER,
    health_note TEXT,
    t_energy INTEGER,
    t_people INTEGER,
    t_children INTEGER,
    t_animals INTEGER,
    t_alone INTEGER,
    apartment_ok INTEGER,
    story TEXT,
    ideal_home TEXT,
    seo_description TEXT,
    status TEXT NOT NULL DEFAULT 'taslak' CHECK (status IN ('taslak','onay_bekliyor','yayinda','ilgi_var','yuvaya_kavustu','arsiv')),
    vet_approved_by TEXT,
    vet_approved_at TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    file_key TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    blurhash TEXT,
    alt_text TEXT NOT NULL,
    credit TEXT,
    is_cover INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS animal_models (
    id TEXT PRIMARY KEY,
    animal_id TEXT UNIQUE NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    glb_key TEXT,
    usdz_key TEXT,
    splat_key TEXT,
    poster_key TEXT,
    scale_height_cm INTEGER NOT NULL,
    poly_count INTEGER,
    glb_size_bytes INTEGER,
    capture_method TEXT NOT NULL DEFAULT 'image_to_3d' CHECK (capture_method IN ('image_to_3d','photogrammetry','gaussian_splat','hybrid')),
    status TEXT NOT NULL DEFAULT 'isleniyor' CHECK (status IN ('isleniyor','onay_bekliyor','aktif','pasif')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS seo_pages (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    page_type TEXT NOT NULL CHECK (page_type IN ('intent_landing','local_seo','guide')),
    h1_title TEXT NOT NULL,
    slogan TEXT,
    meta_title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    filter_preset TEXT,
    body_md TEXT NOT NULL,
    faq_json TEXT,
    is_published INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    animal_id TEXT NOT NULL REFERENCES animals(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    housing_type TEXT,
    has_children INTEGER,
    has_pets INTEGER,
    experience TEXT,
    motivation TEXT,
    consent_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'yeni' CHECK (status IN ('yeni','bakimevine_iletildi','gorusme','yuvaya_kavustu','sonuclanmadi','vazgecti')),
    internal_note TEXT,
    created_at TEXT NOT NULL,
    forwarded_at TEXT,
    delete_after TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('editor','approver','admin')),
    password_hash TEXT NOT NULL,
    totp_secret TEXT,
    totp_enabled INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    detail TEXT,
    at TEXT NOT NULL
  )`,
];

function isCloudflareD1Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_D1_DATABASE_ID &&
      process.env.CLOUDFLARE_API_TOKEN
  );
}

export function getStorageMode(): 'cloudflare-d1' | 'local-sqlite' {
  return isCloudflareD1Configured() ? 'cloudflare-d1' : 'local-sqlite';
}

interface GlobalDbState {
  dbPromise?: Promise<SqlJsDatabase>;
  seeded?: boolean;
}

const globalForDb = globalThis as unknown as { __patiKalbiDb?: GlobalDbState };
if (!globalForDb.__patiKalbiDb) {
  globalForDb.__patiKalbiDb = {};
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'patikalbi.sqlite');

async function getLocalSqlite(): Promise<SqlJsDatabase> {
  if (!globalForDb.__patiKalbiDb!.dbPromise) {
    globalForDb.__patiKalbiDb!.dbPromise = (async () => {
      const initSqlJs = (await import('sql.js')).default;
      const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
      const SQL = await initSqlJs({
        locateFile: () => wasmPath,
      });

      fs.mkdirSync(DATA_DIR, { recursive: true });
      let db: SqlJsDatabase;
      if (fs.existsSync(DB_FILE)) {
        const buffer = fs.readFileSync(DB_FILE);
        db = new SQL.Database(new Uint8Array(buffer));
      } else {
        db = new SQL.Database();
      }
      db.run('PRAGMA foreign_keys = ON;');
      for (const stmt of SCHEMA_STATEMENTS) {
        db.run(stmt);
      }
      return db;
    })();
  }
  return globalForDb.__patiKalbiDb!.dbPromise!;
}

function persistLocalSqlite(db: SqlJsDatabase) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('[Pati Kalbi DB] Yerel SQLite yazma hatası:', err);
  }
}

async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: ParamValue[] = []
): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID!;
  const token = process.env.CLOUDFLARE_API_TOKEN!;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(dbId)}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    throw new Error(`Cloudflare D1 HTTP ${res.status}`);
  }
  const payload = (await res.json()) as {
    success: boolean;
    result?: Array<{ results?: T[] }>;
    errors?: Array<{ message: string }>;
  };
  if (!payload.success) {
    throw new Error(payload.errors?.[0]?.message || 'Cloudflare D1 sorgu hatası');
  }
  return payload.result?.[0]?.results ?? [];
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  params: ParamValue[] = []
): Promise<T[]> {
  await ensureSeeded();
  return dbAllRaw<T>(sql, params);
}

async function dbAllRaw<T = Record<string, unknown>>(
  sql: string,
  params: ParamValue[] = []
): Promise<T[]> {
  if (isCloudflareD1Configured()) {
    return queryD1<T>(sql, params);
  }
  const db = await getLocalSqlite();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params as SqlValue[]);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  params: ParamValue[] = []
): Promise<T | null> {
  const rows = await dbAll<T>(sql, params);
  return rows[0] ?? null;
}

export async function dbRun(sql: string, params: ParamValue[] = []): Promise<void> {
  await ensureSeeded();
  return dbRunRaw(sql, params);
}

async function dbRunRaw(sql: string, params: ParamValue[] = []): Promise<void> {
  if (isCloudflareD1Configured()) {
    await queryD1(sql, params);
    return;
  }
  const db = await getLocalSqlite();
  const stmt = db.prepare(sql);
  try {
    stmt.run(params as SqlValue[]);
  } finally {
    stmt.free();
  }
  persistLocalSqlite(db);
}

async function ensureSeeded(): Promise<void> {
  if (globalForDb.__patiKalbiDb!.seeded) return;

  if (isCloudflareD1Configured()) {
    for (const stmt of SCHEMA_STATEMENTS) {
      await queryD1(stmt, []);
    }
  } else {
    await getLocalSqlite();
  }

  const shelterRows = await dbAllRaw<{ cnt: number }>('SELECT COUNT(*) as cnt FROM shelters');
  if (Number(shelterRows[0]?.cnt ?? 0) === 0) {
    for (const s of SEED_SHELTERS) {
      await dbRunRaw(
        `INSERT INTO shelters (id, name, city, district, municipality, contact_email, contact_phone, visiting_info)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.name,
          s.city,
          s.district,
          s.municipality,
          s.contact_email,
          s.contact_phone,
          s.visiting_info,
        ]
      );
    }
  }

  const animalRows = await dbAllRaw<{ cnt: number }>('SELECT COUNT(*) as cnt FROM animals');
  if (Number(animalRows[0]?.cnt ?? 0) === 0) {
    for (const a of SEED_ANIMALS) {
      await dbRunRaw(
        `INSERT INTO animals (
          id, slug, shelter_id, name, species, sex, age_months_est, size,
          shoulder_height_cm, coat_and_look, vaccinated, neutered, microchipped, health_note,
          t_energy, t_people, t_children, t_animals, t_alone, apartment_ok,
          story, ideal_home, seo_description, status, vet_approved_by, vet_approved_at,
          created_by, created_at, updated_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.slug,
          a.shelter_id,
          a.name,
          a.species,
          a.sex,
          a.age_months_est,
          a.size,
          a.shoulder_height_cm,
          a.coat_and_look,
          a.vaccinated,
          a.neutered,
          a.microchipped,
          a.health_note,
          a.t_energy,
          a.t_people,
          a.t_children,
          a.t_animals,
          a.t_alone,
          a.apartment_ok,
          a.story,
          a.ideal_home,
          a.seo_description,
          a.status,
          a.vet_approved_by,
          a.vet_approved_at,
          a.created_by,
          a.created_at,
          a.updated_at,
          a.published_at,
        ]
      );

      await dbRunRaw(
        `INSERT INTO photos (id, animal_id, file_key, width, height, blurhash, alt_text, credit, is_cover, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `ph-${a.slug}-1`,
          a.id,
          `placeholder:${a.slug}`,
          800,
          1000,
          null,
          a.alt_text,
          a.credit,
          1,
          0,
        ]
      );

      if (a.has_3d) {
        await dbRunRaw(
          `INSERT INTO animal_models (
            id, animal_id, glb_key, usdz_key, splat_key, poster_key,
            scale_height_cm, poly_count, glb_size_bytes, capture_method, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `mdl-${a.slug}`,
            a.id,
            null,
            null,
            null,
            null,
            a.shoulder_height_cm ?? 40,
            28400,
            null,
            a.capture_method,
            'aktif',
            a.created_at,
            a.updated_at,
          ]
        );
      }
    }

    for (const app of SEED_APPLICATIONS) {
      await dbRunRaw(
        `INSERT INTO applications (
          id, animal_id, full_name, phone, email, city, housing_type,
          has_children, has_pets, experience, motivation, consent_at,
          status, internal_note, created_at, forwarded_at, delete_after
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          app.id,
          app.animal_id,
          app.full_name,
          app.phone,
          app.email,
          app.city,
          app.housing_type,
          app.has_children,
          app.has_pets,
          app.experience,
          app.motivation,
          app.consent_at,
          app.status,
          app.internal_note,
          app.created_at,
          app.forwarded_at,
          app.delete_after,
        ]
      );
    }
  }

  const seoRows = await dbAllRaw<{ cnt: number }>('SELECT COUNT(*) as cnt FROM seo_pages');
  if (Number(seoRows[0]?.cnt ?? 0) === 0) {
    for (const p of SEED_SEO_PAGES) {
      await dbRunRaw(
        `INSERT INTO seo_pages (
          id, slug, page_type, h1_title, slogan, meta_title, meta_description,
          filter_preset, body_md, faq_json, is_published, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.slug,
          p.page_type,
          p.h1_title,
          p.slogan,
          p.meta_title,
          p.meta_description,
          p.filter_preset,
          p.body_md,
          p.faq_json,
          p.is_published,
          p.updated_at,
        ]
      );
    }
  }

  globalForDb.__patiKalbiDb!.seeded = true;
}

export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string,
  detail?: string
): Promise<void> {
  const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await dbRun(
    `INSERT INTO audit_log (id, user_id, action, entity, entity_id, detail, at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, action, entity, entityId, detail ?? null, new Date().toISOString()]
  );
}

async function hydrateAnimals(animals: Animal[]): Promise<AnimalWithDetails[]> {
  if (animals.length === 0) return [];
  const shelters = await dbAll<Shelter>('SELECT * FROM shelters');
  const photos = await dbAll<AnimalPhoto>(
    'SELECT * FROM photos ORDER BY is_cover DESC, sort_order ASC'
  );
  const models = await dbAll<AnimalModel>('SELECT * FROM animal_models');

  const shelterMap = new Map(shelters.map((s) => [s.id, s]));
  const photoMap = new Map<string, AnimalPhoto[]>();
  for (const ph of photos) {
    const arr = photoMap.get(ph.animal_id) ?? [];
    arr.push(ph);
    photoMap.set(ph.animal_id, arr);
  }
  const modelMap = new Map(models.map((m) => [m.animal_id, m]));

  return animals.map((a) => ({
    ...a,
    shelter: shelterMap.get(a.shelter_id),
    photos: photoMap.get(a.id) ?? [],
    model: modelMap.get(a.id) ?? null,
  }));
}

export interface AnimalFilterQuery {
  species?: string;
  sex?: string;
  size?: string;
  age?: string;
  kids?: boolean;
  pets?: boolean;
  apartment?: boolean;
  has_3d?: boolean;
  status?: string;
  q?: string;
  sort?: string;
  shelter_city?: string;
  shelter_district?: string;
}

export async function listPublicAnimals(
  filters: AnimalFilterQuery = {}
): Promise<AnimalWithDetails[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await dbAll<Animal>(
    `SELECT * FROM animals
     WHERE status IN ('yayinda', 'ilgi_var')
        OR (status = 'yuvaya_kavustu' AND updated_at >= ?)
     ORDER BY CASE status WHEN 'yayinda' THEN 0 WHEN 'ilgi_var' THEN 1 ELSE 2 END,
              published_at DESC`,
    [thirtyDaysAgo]
  );

  let list = await hydrateAnimals(rows);

  if (filters.species === 'kedi' || filters.species === 'kopek') {
    list = list.filter((a) => a.species === filters.species);
  }
  if (filters.sex === 'disi' || filters.sex === 'erkek') {
    list = list.filter((a) => a.sex === filters.sex);
  }
  if (filters.size === 'kucuk' || filters.size === 'orta' || filters.size === 'buyuk') {
    list = list.filter((a) => a.size === filters.size);
  }
  if (filters.age) {
    list = list.filter((a) => getAgeGroup(a.age_months_est) === filters.age);
  }
  if (filters.kids) {
    list = list.filter((a) => (a.t_children ?? 0) >= 4);
  }
  if (filters.pets) {
    list = list.filter((a) => (a.t_animals ?? 0) >= 4);
  }
  if (filters.apartment) {
    list = list.filter((a) => a.apartment_ok === 1);
  }
  if (filters.has_3d) {
    list = list.filter((a) => a.model?.status === 'aktif');
  }
  if (filters.status) {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters.shelter_city) {
    const cityNorm = normalizeTrSearch(filters.shelter_city);
    list = list.filter((a) => normalizeTrSearch(a.shelter?.city ?? '') === cityNorm);
  }
  if (filters.shelter_district) {
    const distNorm = normalizeTrSearch(filters.shelter_district);
    list = list.filter((a) => normalizeTrSearch(a.shelter?.district ?? '') === distNorm);
  }
  if (filters.q && filters.q.trim()) {
    const needle = normalizeTrSearch(filters.q);
    list = list.filter((a) => {
      const hay = normalizeTrSearch(
        `${a.name} ${a.story ?? ''} ${a.ideal_home ?? ''} ${a.coat_and_look ?? ''} ${a.shelter?.district ?? ''}`
      );
      return hay.includes(needle);
    });
  }

  if (filters.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  } else if (filters.sort === 'youngest') {
    list.sort((a, b) => (a.age_months_est ?? 999) - (b.age_months_est ?? 999));
  } else if (filters.sort === 'oldest') {
    list.sort((a, b) => (b.age_months_est ?? 0) - (a.age_months_est ?? 0));
  }

  return list;
}

export async function getPublicAnimalBySlug(slug: string): Promise<AnimalWithDetails | null> {
  const row = await dbGet<Animal>(
    `SELECT * FROM animals
     WHERE slug = ? AND status IN ('yayinda', 'ilgi_var', 'yuvaya_kavustu', 'arsiv')`,
    [slug]
  );
  if (!row) return null;
  const hydrated = await hydrateAnimals([row]);
  return hydrated[0] ?? null;
}

export async function listAllAnimalsAdmin(): Promise<AnimalWithDetails[]> {
  const rows = await dbAll<Animal>(
    `SELECT * FROM animals
     ORDER BY CASE status
       WHEN 'onay_bekliyor' THEN 0
       WHEN 'taslak' THEN 1
       WHEN 'yayinda' THEN 2
       WHEN 'ilgi_var' THEN 3
       WHEN 'yuvaya_kavustu' THEN 4
       ELSE 5 END,
       updated_at DESC`
  );
  return hydrateAnimals(rows);
}

export async function getPublicStats(): Promise<PublicStats> {
  const rows = await dbAll<{ status: string; cnt: number }>(
    `SELECT status, COUNT(*) as cnt FROM animals GROUP BY status`
  );
  const map = new Map(rows.map((r) => [r.status, Number(r.cnt)]));
  const waiting = (map.get('yayinda') ?? 0) + (map.get('ilgi_var') ?? 0);
  const interested = map.get('ilgi_var') ?? 0;
  const adopted = map.get('yuvaya_kavustu') ?? 0;

  const modelRows = await dbAll<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM animal_models m
     INNER JOIN animals a ON a.id = m.animal_id
     WHERE m.status = 'aktif' AND a.status IN ('yayinda', 'ilgi_var')`
  );

  return {
    waiting,
    interested,
    adopted,
    with_3d: Number(modelRows[0]?.cnt ?? 0),
    total_public: waiting + adopted,
  };
}

export async function listPublishedSeoPages(pageType?: string): Promise<SeoPage[]> {
  if (pageType) {
    return dbAll<SeoPage>(
      'SELECT * FROM seo_pages WHERE is_published = 1 AND page_type = ? ORDER BY updated_at DESC',
      [pageType]
    );
  }
  return dbAll<SeoPage>('SELECT * FROM seo_pages WHERE is_published = 1 ORDER BY page_type, slug');
}

export async function getSeoPageBySlug(slug: string): Promise<SeoPage | null> {
  return dbGet<SeoPage>('SELECT * FROM seo_pages WHERE slug = ? AND is_published = 1', [slug]);
}

export async function listAllSeoPagesAdmin(): Promise<SeoPage[]> {
  return dbAll<SeoPage>('SELECT * FROM seo_pages ORDER BY page_type, slug');
}

export async function listShelters(): Promise<Shelter[]> {
  return dbAll<Shelter>('SELECT * FROM shelters ORDER BY name');
}

export async function listApplicationsAdmin(): Promise<ApplicationRecord[]> {
  return dbAll<ApplicationRecord>(
    `SELECT ap.*, a.name as animal_name, a.slug as animal_slug
     FROM applications ap
     LEFT JOIN animals a ON a.id = ap.animal_id
     ORDER BY ap.created_at DESC`
  );
}

export async function listUsersAdmin(): Promise<PanelUser[]> {
  return dbAll<PanelUser>(
    'SELECT id, email, name, role, totp_enabled, created_at FROM users ORDER BY created_at ASC'
  );
}

export async function listAuditLogsAdmin(limit = 40): Promise<AuditLogEntry[]> {
  return dbAll<AuditLogEntry>('SELECT * FROM audit_log ORDER BY at DESC LIMIT ?', [limit]);
}
