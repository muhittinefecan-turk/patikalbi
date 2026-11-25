import fs from 'fs';
import path from 'path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const LOCAL_R2_DIR = path.resolve(process.cwd(), '.data', 'r2');

const ALLOWED_EXTENSIONS: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.usdz': 'model/vnd.usdz+zip',
  '.ksplat': 'application/octet-stream',
  '.splat': 'application/octet-stream',
};

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

export function getMediaStorageMode(): 'cloudflare-r2' | 'local-r2-mirror' {
  return isR2Configured() ? 'cloudflare-r2' : 'local-r2-mirror';
}

function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function sanitizeObjectKey(rawKey: string): string {
  const cleaned = rawKey
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .map((seg) => seg.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
  if (!cleaned) {
    throw new Error('Geçersiz dosya anahtarı.');
  }
  return cleaned;
}

export function getContentTypeForKey(key: string): string | null {
  const ext = path.extname(key).toLowerCase();
  return ALLOWED_EXTENSIONS[ext] ?? null;
}

function resolveConfinedLocalPath(key: string): string {
  const safeKey = sanitizeObjectKey(key);
  const resolved = path.resolve(LOCAL_R2_DIR, safeKey);
  if (!resolved.startsWith(LOCAL_R2_DIR + path.sep)) {
    throw new Error('Dizin sınırı ihlali engellendi.');
  }
  return resolved;
}

export async function putMediaObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const safeKey = sanitizeObjectKey(key);
  const allowedType = getContentTypeForKey(safeKey);
  if (!allowedType) {
    throw new Error('Desteklenmeyen dosya uzantısı.');
  }

  if (isR2Configured()) {
    const client = createR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: safeKey,
        Body: body,
        ContentType: contentType || allowedType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    return safeKey;
  }

  const filePath = resolveConfinedLocalPath(safeKey);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
  return safeKey;
}

export async function getMediaObject(
  key: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const safeKey = sanitizeObjectKey(key);
  const contentType = getContentTypeForKey(safeKey);
  if (!contentType) return null;

  if (isR2Configured()) {
    try {
      const client = createR2Client();
      const res = await client.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: safeKey,
        })
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return { data: Buffer.from(bytes), contentType: res.ContentType || contentType };
    } catch {
      return null;
    }
  }

  const filePath = resolveConfinedLocalPath(safeKey);
  if (!fs.existsSync(filePath)) return null;
  return { data: fs.readFileSync(filePath), contentType };
}

export function getPublicMediaUrl(fileKey: string | null | undefined): string | null {
  if (!fileKey || fileKey.startsWith('placeholder:')) return null;
  if (isR2Configured() && process.env.R2_PUBLIC_URL) {
    const base = process.env.R2_PUBLIC_URL.replace(/\/+$/, '');
    return `${base}/${sanitizeObjectKey(fileKey)}`;
  }
  return `/api/media/${sanitizeObjectKey(fileKey)}`;
}
