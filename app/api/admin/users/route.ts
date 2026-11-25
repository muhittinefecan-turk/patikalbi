import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, requireAuth } from '@/lib/auth';
import { dbRun, listUsersAdmin, logAudit } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const users = await listUsersAdmin();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const role = ['editor', 'approver', 'admin'].includes(String(body.role))
      ? String(body.role)
      : 'editor';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi yazın.' }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: 'Ad soyad en az 2 karakter olmalıdır.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Parola en az 8 karakter olmalıdır.' }, { status: 400 });
    }

    const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
    await dbRun(
      `INSERT INTO users (id, email, name, role, password_hash, totp_secret, totp_enabled, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, 0, ?)`,
      [id, email, name, role, hashPassword(password), new Date().toISOString()]
    );
    await logAudit(auth.user.uid, 'user_created', 'user', id, `${email} (${role})`);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kullanıcı oluşturulamadı.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req, ['admin']);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id || id === auth.user.uid) {
    return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz.' }, { status: 400 });
  }
  await dbRun('DELETE FROM users WHERE id = ?', [id]);
  await logAudit(auth.user.uid, 'user_deleted', 'user', id);
  return NextResponse.json({ ok: true });
}
