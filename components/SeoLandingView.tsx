import React from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { ArrowRight, ChevronDown, Heart, Home } from 'lucide-react';
import { listPublicAnimals, type AnimalFilterQuery } from '@/lib/db';
import type { FaqItem, SeoFilterPreset, SeoPage } from '@/lib/types';
import { AnimalTile } from './AnimalTile';

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function parseFilterPreset(raw: string | null): AnimalFilterQuery {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SeoFilterPreset;
    return {
      species: parsed.species,
      size: parsed.size,
      apartment: parsed.apartment,
      has_3d: parsed.has_3d,
      shelter_city: parsed.shelter_city,
      shelter_district: parsed.shelter_district,
    };
  } catch {
    return {};
  }
}

function parseFaqItems(raw: string | null): FaqItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FaqItem =>
        Boolean(item) && typeof item.q === 'string' && typeof item.a === 'string'
    );
  } catch {
    return [];
  }
}

export async function SeoLandingView({
  page,
  canonicalPath,
  parentBreadcrumb,
}: {
  page: SeoPage;
  canonicalPath: string;
  parentBreadcrumb?: { label: string; href: string };
}) {
  const filterQuery = parseFilterPreset(page.filter_preset);
  const matchingAnimals = (await listPublicAnimals(filterQuery))
    .filter((a) => a.status === 'yayinda' || a.status === 'ilgi_var')
    .slice(0, 8);

  const faqs = parseFaqItems(page.faq_json);
  const baseUrl = (process.env.APP_URL || 'https://patikalbi.org').replace(/\/+$/, '');
  const fullUrl = `${baseUrl}${canonicalPath}`;

  const breadcrumbItems: Array<{ '@type': string; position: number; name: string; item: string }> =
    [{ '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: baseUrl }];

  if (parentBreadcrumb) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: parentBreadcrumb.label,
      item: `${baseUrl}${parentBreadcrumb.href}`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: page.h1_title,
      item: fullUrl,
    });
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: page.h1_title,
      item: fullUrl,
    });
  }

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  ];

  if (page.page_type === 'guide') {
    graph.push({
      '@type': 'Article',
      headline: page.h1_title,
      description: page.meta_description,
      dateModified: page.updated_at,
      author: {
        '@type': 'Organization',
        name: 'Pati Kalbi — Gerze Belediyesi & GEFOK',
      },
      mainEntityOfPage: fullUrl,
    });
  } else if (matchingAnimals.length > 0) {
    graph.push({
      '@type': 'ItemList',
      name: page.h1_title,
      numberOfItems: matchingAnimals.length,
      itemListElement: matchingAnimals.map((a, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${baseUrl}/can-dostlari/${a.slug}`,
        name: a.name,
      })),
    });
  }

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  const catalogParams = new URLSearchParams();
  if (filterQuery.species) catalogParams.set('species', filterQuery.species);
  if (filterQuery.size) catalogParams.set('size', filterQuery.size);
  if (filterQuery.apartment) catalogParams.set('apartment', '1');
  if (filterQuery.has_3d) catalogParams.set('has_3d', '1');
  const catalogHref = catalogParams.toString()
    ? `/can-dostlari?${catalogParams.toString()}`
    : '/can-dostlari';

  return (
    <article className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({ '@context': 'https://schema.org', '@graph': graph }),
        }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Sayfa yolu" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-[var(--accent-kalp)]">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Ana Sayfa
        </Link>
        <span>/</span>
        {parentBreadcrumb && (
          <>
            <Link href={parentBreadcrumb.href} className="hover:text-[var(--accent-kalp)]">
              {parentBreadcrumb.label}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-semibold text-[var(--ink-karadeniz)]">{page.h1_title}</span>
      </nav>

      {/* Editorial Header */}
      <header className="max-w-3xl border-b border-[var(--border-hairline)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-kalp)]">
          {page.page_type === 'guide'
            ? 'Pati Kalbi Sahiplenme Rehberi'
            : page.page_type === 'local_seo'
              ? 'Sinop · Gerze Resmi Barınak Rehberi'
              : 'Satın Alma, Sahiplen'}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--ink-karadeniz)] sm:text-4xl lg:text-[44px]">
          {page.h1_title}
        </h1>
        {page.slogan && (
          <p className="mt-3 text-base font-medium leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            {page.slogan}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={catalogHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--accent-kalp)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            Yuva bekleyen can dostlarını gör
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/nasil-sahiplenilir"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)]"
          >
            Sahiplenme süreci
          </Link>
        </div>
      </header>

      {/* Live Matching Animals Grid */}
      {matchingAnimals.length > 0 && (
        <section className="py-10 border-b border-[var(--border-hairline)]">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--ink-karadeniz)]">
                Şu an yuva bekleyen dostlarımız
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Gerze Belediyesi Geçici Hayvan Bakımevi&apos;nden veteriner onaylı gerçek profiller.
              </p>
            </div>
            <Link
              href={catalogHref}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--accent-kalp)] hover:underline"
            >
              Tümünü filtrele
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {matchingAnimals.map((animal) => (
              <AnimalTile key={animal.id} animal={animal} />
            ))}
          </div>
        </section>
      )}

      {/* Markdown Editorial Body */}
      <section className="py-10">
        <div className="prose prose-slate dark:prose-invert max-w-3xl prose-headings:font-display prose-headings:text-[var(--ink-karadeniz)] prose-p:text-[var(--ink-muted)] prose-li:text-[var(--ink-muted)] prose-strong:text-[var(--ink-karadeniz)] prose-a:text-[var(--accent-kalp)]">
          <Markdown>{page.body_md}</Markdown>
        </div>
      </section>

      {/* Accessible FAQ Accordion */}
      {faqs.length > 0 && (
        <section className="max-w-3xl border-t border-[var(--border-hairline)] pt-10">
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-karadeniz)]">
            Sıkça sorulan sorular
          </h2>
          <div className="mt-5 divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">
            {faqs.map((item, index) => (
              <details key={index} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-[var(--ink-karadeniz)]">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-[var(--ink-muted)] transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
