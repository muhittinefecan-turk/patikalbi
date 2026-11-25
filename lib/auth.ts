import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { dbAll, dbGet, dbRun } from './db';
import type { UserRole } from './types';

interface GlobalAuthState {
  signingKey?: Buffer;
  rateLimits?: Map<string, number[]>;
}

const globalForAuth = globalThis as unknown as { __patiKalbiAuth?: GlobalAuthState };
if (!globalForAuth.__patiKalbiAuth) {
  globalForAuth.__patiKalbiAuth = {};
}

function getSigningKey(): Buffer {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return crypto.createHash('sha256').update(process.env.SESSION_SECRET).digest();
  }
  if (!globalForAuth.__patiKalbiAuth!.signingKey) {
    globalForAuth.__patiKalbiAuth!.signingKey = crypto.randomBytes(32);
  }
  return globalForAuth.__patiKalbiAuth!.signingKey;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexKey] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hexKey, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningKey())
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSigningKey())
    .update(body)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): { user: SessionPayload | null; error?: string; status?: number } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Oturum gerekli.', status: 401 };
  }
  const token = authHeader.slice(7).trim();
  const session = verifySessionToken(token);
  if (!session) {
    return { user: null, error: 'Oturum geçersiz veya süresi doldu.', status: 401 };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { user: null, error: 'Bu işlem için yetkiniz bulunmuyor.', status: 403 };
  }
  return { user: session };
}

export async function needsInitialAdminSetup(): Promise<boolean> {
  if (process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0) {
    return false;
  }
  const admins = await dbAll<{ id: string }>("SELECT id FROM users WHERE role = 'admin'");
  return admins.length === 0;
}

export async function claimInitialAdmin(
  email: string,
  name: string,
  password: string
): Promise<{ id: string; email: string; name: string; role: UserRole }> {
  const needs = await needsInitialAdminSetup();
  if (!needs) {
    throw new Error('İlk yönetici kurulumu zaten tamamlanmış.');
  }
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO users (id, email, name, role, password_hash, totp_secret, totp_enabled, created_at)
     VALUES (?, ?, ?, 'admin', ?, NULL, 0, ?)`,
    [id, email.toLowerCase().trim(), name.trim(), hashPassword(password), now]
  );
  return { id, email: email.toLowerCase().trim(), name: name.trim(), role: 'admin' };
}

export async function authenticateUser(
  email: string,
  password: string,
  totpCode?: string
): Promise<{
  ok: boolean;
  user?: { id: string; email: string; name: string; role: UserRole; totp_enabled: number };
  requiresTotp?: boolean;
  error?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'koordinator@patikalbi.org')
    .toLowerCase()
    .trim();

  if (envPasscode && normalizedEmail === envAdminEmail) {
    const a = Buffer.from(password);
    const b = Buffer.from(envPasscode);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return {
        ok: true,
        user: {
          id: 'env-admin',
          email: envAdminEmail,
          name: 'Proje Koordinatörü',
          role: 'admin',
          totp_enabled: 0,
        },
      };
    }
    return { ok: false, error: 'E-posta veya parola hatalı.' };
  }

  const row = await dbGet<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    password_hash: string;
    totp_secret: string | null;
    totp_enabled: number;
  }>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

  if (!row || !verifyPassword(password, row.password_hash)) {
    return { ok: false, error: 'E-posta veya parola hatalı.' };
  }

  if (row.totp_enabled === 1 && row.totp_secret) {
    if (!totpCode || !totpCode.trim()) {
      return { ok: false, requiresTotp: true, error: 'İki adımlı doğrulama (2FA) kodu gerekli.' };
    }
    if (!verifyTotpCode(row.totp_secret, totpCode.trim())) {
      return { ok: false, requiresTotp: true, error: '2FA kodu geçersiz. Tekrar deneyin.' };
    }
  }

  return {
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      totp_enabled: row.totp_enabled,
    },
  };
}

// RFC 6238 TOTP (Base32 secret + 6-digit 30s window)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = '';
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

function decodeBase32(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx >= 0) bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, stepOffset = 0): string {
  const key = decodeBase32(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + stepOffset;
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 1000000).padStart(6, '0');
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const clean = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  for (const offset of [-1, 0, 1]) {
    if (generateTotpCode(secret, offset) === clean) return true;
  }
  return false;
}

export function checkRateLimit(
  req: NextRequest,
  bucket: string,
  maxRequests: number,
  windowMs: number
): boolean {
  if (!globalForAuth.__patiKalbiAuth!.rateLimits) {
    globalForAuth.__patiKalbiAuth!.rateLimits = new Map();
  }
  const map = globalForAuth.__patiKalbiAuth!.rateLimits;
  const forwarded = req.headers.get('x-forwarded-for') || 'local';
  const ip = forwarded.split(',')[0]?.trim() || 'local';
  // Hash IP so raw IP is never stored
  const key = crypto
    .createHmac('sha256', getSigningKey())
    .update(`${bucket}:${ip}`)
    .digest('hex')
    .slice(0, 20);

  const now = Date.now();
  const timestamps = (map.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    map.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  map.set(key, timestamps);
  return true;
}
