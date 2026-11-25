export async function notifyIndexNow(urls: string[]): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.INDEXNOW_KEY?.trim();
  const appUrl = process.env.APP_URL?.trim();
  if (!key || !appUrl || urls.length === 0) {
    return { sent: false, reason: 'IndexNow anahtarı tanımlı değil.' };
  }
  try {
    const parsed = new URL(appUrl);
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: parsed.host,
        key,
        urlList: urls,
      }),
    });
    return { sent: res.ok, reason: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : 'Ağ hatası' };
  }
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ delivered: boolean; mode: 'resend' | 'audit-preview'; note: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim() || 'Pati Kalbi <bildirim@patikalbi.org>';
  if (!apiKey) {
    return {
      delivered: false,
      mode: 'audit-preview',
      note: `E-posta önizlemesi kaydedildi (RESEND_API_KEY tanımlandığında ${params.to} adresine canlı gönderilir).`,
    };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        text: params.text,
      }),
    });
    if (!res.ok) {
      return {
        delivered: false,
        mode: 'resend',
        note: `E-posta servisi HTTP ${res.status} döndürdü.`,
      };
    }
    return {
      delivered: true,
      mode: 'resend',
      note: `${params.to} adresine iletildi.`,
    };
  } catch (err) {
    return {
      delivered: false,
      mode: 'resend',
      note: err instanceof Error ? err.message : 'E-posta gönderim hatası.',
    };
  }
}

export async function verifyTurnstileToken(token?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
