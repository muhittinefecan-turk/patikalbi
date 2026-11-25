import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUser,
  checkRateLimit,
  claimInitialAdmin,
  createSessionToken,
  generateTotpSecret,
  needsInitialAdminSetup,
  requireAuth,
  verifyTotpCode,
} from '@/lib/auth';
import { dbGet, dbRun, getStorageMode, logAudit } from '@/lib/db';
import { getMediaStorageMode } from '@/lib/r2';

export async function GET() {
  const needsSetup = await needsInitialAdminSetup();
  return NextResponse.json({
    needsSetup,
    storageMode: getStorageMode(),
    mediaMode: getMediaStorageMode(),
    envAdminConfigured: Boolean(process.env.ADMIN_PASSCODE?.trim()),
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(req, 'admin-auth', 15, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : 'login';

    if (action === 'setup') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Geçerli bir yönetici e-postası yazın.' }, { status: 400 });
      }
      if (name.length < 2) {
        return NextResponse.json({ error: 'Ad soyad en az 2 karakter olmalıdır.' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Parola en az 8 karakter olmalıdır.' }, { status: 400 });
      }

      const admin = await claimInitialAdmin(email, name, password);
      await logAudit(admin.id, 'initial_admin_claimed', 'user', admin.id, admin.email);
      const token = createSessionToken({
        uid: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      return NextResponse.json({ ok: true, token, user: { ...admin, totp_enabled: 0 } });
    }

    if (action === 'login') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const totpCode = typeof body.totp_code === 'string' ? body.totp_code : undefined;

      const result = await authenticateUser(email, password, totpCode);
      if (!result.ok || !result.user) {
        return NextResponse.json(
          { error: result.error || 'Giriş başarısız.', requiresTotp: Boolean(result.requiresTotp) },
          { status: 401 }
        );
      }

      const token = createSessionToken({
        uid: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      });
      await logAudit(result.user.id, 'login', 'user', result.user.id, result.user.role);
      return NextResponse.json({ ok: true, token, user: result.user });
    }

    if (action === 'totp-enroll') {
      const auth = requireAuth(req, ['admin', 'approver', 'editor']);
      if (!auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
      }
      if (auth.user.uid === 'env-admin') {
        return NextResponse.json(
          { error: 'Ortam değişkeni yöneticisi için 2FA veritabanı kullanıcısı üzerinden kurulur.' },
          { status: 400 }
        );
      }
      const secret = generateTotpSecret();
      await dbRun('UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?', [
        secret,
        auth.user.uid,
      ]);
      const otpauthUrl = `otpauth://totp/PatiKalbi:${encodeURIComponent(auth.user.email)}?secret=${secret}&issuer=PatiKalbi`;
      return NextResponse.json({ ok: true, secret, otpauthUrl });
    }

    if (action === 'totp-verify') {
      const auth = requireAuth(req, ['admin', 'approver', 'editor']);
      if (!auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
      }
      const code = typeof body.code === 'string' ? body.code : '';
      const userRow = await dbGet<{ totp_secret: string | null }>(
        'SELECT totp_secret FROM users WHERE id = ?',
        [auth.user.uid]
      );
      if (!userRow?.totp_secret || !verifyTotpCode(userRow.totp_secret, code)) {
        return NextResponse.json({ error: '6 haneli doğrulama kodu geçersiz.' }, { status: 400 });
      }
      await dbRun('UPDATE users SET totp_enabled = 1 WHERE id = ?', [auth.user.uid]);
      await logAudit(auth.user.uid, 'totp_enabled', 'user', auth.user.uid);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kimlik doğrulama hatası.' },
      { status: 400 }
    );
  }
}
