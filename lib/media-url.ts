/**
 * Client-safe media URL resolver.
 * Never imports Node.js built-ins or S3 SDKs so it can be safely bundled in Client Components.
 */
export function getPublicMediaUrl(fileKey: string | null | undefined): string {
  if (!fileKey) return '';
  if (fileKey.startsWith('placeholder:')) return '';
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    return fileKey;
  }
  const cleanKey = fileKey.replace(/^\/+/, '');
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, '');
  if (publicBase) {
    return `${publicBase}/${cleanKey}`;
  }
  return `/api/media/${cleanKey}`;
}
