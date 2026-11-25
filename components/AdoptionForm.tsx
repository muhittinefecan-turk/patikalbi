'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Heart, Send } from 'lucide-react';

interface AdoptionFormProps {
  animalId: string;
  animalName: string;
  onSuccess?: () => void;
}

export function AdoptionForm({ animalId, animalName, onSuccess }: AdoptionFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Sinop');
  const [housingType, setHousingType] = useState<'apartman' | 'mustakil' | 'bahceli'>('apartman');
  const [hasChildren, setHasChildren] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot

  const [submitting, setSubmitting] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorSummary(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animal_id: animalId,
          full_name: fullName,
          phone,
          email,
          city,
          housing_type: housingType,
          has_children: hasChildren,
          has_pets: hasPets,
          experience,
          motivation,
          consent,
          website,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!res.ok || !data.ok) {
        setErrorSummary(
          data.error ||
            'Başvuru gönderilemedi. İnternetini kontrol edip tekrar dene; sorun sürerse bize yaz.'
        );
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      setSuccessMsg(data.message || 'Ön başvurun gönderildi. Bakımevi seninle iletişime geçecek.');
      onSuccess?.();
    } catch {
      setErrorSummary(
        'Başvuru gönderilemedi. İnternetini kontrol edip tekrar dene; sorun sürerse bize yaz.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successMsg) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[var(--status-yosun)] bg-[var(--surface-beyaz)] p-6 space-y-3"
      >
        <div className="flex items-center gap-2.5 text-[var(--status-yosun)] font-bold text-lg">
          <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Ön başvuru alındı</span>
        </div>
        <p className="text-[var(--ink-karadeniz)]">{successMsg}</p>
        <p className="text-sm text-[var(--ink-muted)]">
          Unutma: Sahiplendirme kararı ve resmi teslim yalnızca Gerze Belediyesi Bakımevi usulüne
          göre yüz yüze tanışma sonrasında yapılır.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="basvuru-form-baslik"
      className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6 sm:p-8 space-y-5"
    >
      <div className="space-y-1">
        <h2
          id="basvuru-form-baslik"
          className="text-2xl font-bold text-[var(--ink-karadeniz)] flex items-center gap-2"
        >
          <Heart className="h-5 w-5 text-[var(--accent-kalp)] shrink-0" aria-hidden="true" />
          {animalName} için ön başvuru
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Yalnızca değerlendirme için gerekli bilgileri istiyoruz. Ödeme veya bağış alınmaz.
        </p>
      </div>

      {errorSummary && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--accent-kalp)] bg-[var(--accent-kalp)]/10 p-4 text-sm text-[var(--ink-karadeniz)]"
        >
          <p className="font-semibold">{errorSummary}</p>
          {Object.values(fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {Object.values(fieldErrors).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Honeypot */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website-field">Web sitesi</label>
        <input
          id="website-field"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="full-name" className="block text-sm font-semibold">
            Ad soyad *
          </label>
          <input
            id="full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Örn. Deniz Yılmaz"
            className="w-full min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sis)] px-4 text-sm text-[var(--ink-karadeniz)]"
          />
          {fieldErrors.full_name && (
            <p className="text-xs font-medium text-[var(--accent-kalp)]">{fieldErrors.full_name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-sm font-semibold">
            Telefon (başında 0 olmadan 10 hane) *
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5XX XXX XX XX"
            className="w-full min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sis)] px-4 text-sm text-[var(--ink-karadeniz)] tabular-nums"
          />
          {fieldErrors.phone && (
            <p className="text-xs font-medium text-[var(--accent-kalp)]">{fieldErrors.phone}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold">
            E-posta *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
            className="w-full min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sis)] px-4 text-sm text-[var(--ink-karadeniz)]"
          />
          {fieldErrors.email && (
            <p className="text-xs font-medium text-[var(--accent-kalp)]">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="city" className="block text-sm font-semibold">
            Şehir / ilçe *
          </label>
          <input
            id="city"
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Sinop / Gerze"
            className="w-full min-h-[44px] rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sis)] px-4 text-sm text-[var(--ink-karadeniz)]"
          />
          {fieldErrors.city && (
            <p className="text-xs font-medium text-[var(--accent-kalp)]">{fieldErrors.city}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-semibold">Konut tipi</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { val: 'apartman', label: 'Apartman dairesi' },
              { val: 'mustakil', label: 'Müstakil ev' },
              { val: 'bahceli', label: 'Bahçeli ev' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setHousingType(opt.val)}
              className={`min-h-[44px] rounded-full px-4 text-sm font-medium border transition-colors ${
                housingType === opt.val
                  ? 'border-[var(--ink-karadeniz)] bg-[var(--ink-karadeniz)] text-[var(--bg-sis)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-sis)] text-[var(--ink-karadeniz)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="inline-flex min-h-[44px] items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hasChildren}
            onChange={(e) => setHasChildren(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent-kalp)]"
          />
          <span>Evde çocuk var</span>
        </label>

        <label className="inline-flex min-h-[44px] items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hasPets}
            onChange={(e) => setHasPets(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent-kalp)]"
          />
          <span>Evde başka hayvan var</span>
        </label>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <label htmlFor="experience" className="font-semibold">
            Daha önce hayvan baktınız mı? (isteğe bağlı)
          </label>
          <span className="text-xs text-[var(--ink-muted)] tabular-nums">
            {experience.length}/300
          </span>
        </div>
        <textarea
          id="experience"
          rows={2}
          maxLength={300}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Kısaca deneyiminizden bahsedebilirsiniz."
          className="w-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-sis)] px-4 py-3 text-sm text-[var(--ink-karadeniz)]"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <label htmlFor="motivation" className="font-semibold">
            Neden {animalName}? *
          </label>
          <span className="text-xs text-[var(--ink-muted)] tabular-nums">
            {motivation.length}/500
          </span>
        </div>
        <textarea
          id="motivation"
          rows={3}
          required
          maxLength={500}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Yaşam düzeninizi ve bu can dostuna nasıl bir yuva açmak istediğinizi kısaca anlatın."
          className="w-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-sis)] px-4 py-3 text-sm text-[var(--ink-karadeniz)]"
        />
        {fieldErrors.motivation && (
          <p className="text-xs font-medium text-[var(--accent-kalp)]">{fieldErrors.motivation}</p>
        )}
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-kalp)]"
          />
          <span className="text-[var(--ink-muted)] leading-relaxed">
            Kişisel verilerimin, ön başvurumun değerlendirilmesi için Gerze Belediyesi bakım evine
            iletilmesine ilişkin{' '}
            <Link
              href="/kvkk"
              className="font-semibold text-[var(--ink-karadeniz)] underline underline-offset-2"
            >
              aydınlatma metnini
            </Link>{' '}
            okudum ve anladım. *
          </span>
        </label>
        {fieldErrors.consent && (
          <p className="text-xs font-medium text-[var(--accent-kalp)]">{fieldErrors.consent}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[var(--accent-kalp)] hover:bg-[var(--accent-kalp-hover)] disabled:opacity-60 px-7 py-3 text-base font-semibold text-white transition-colors"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {submitting ? 'Gönderiliyor...' : 'Ön başvuruyu gönder'}
      </button>
    </form>
  );
}
