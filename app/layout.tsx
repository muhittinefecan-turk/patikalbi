import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Source_Sans_3 } from 'next/font/google';
import Script from 'next/script';
import { OfflineIndicator } from '@/components/PWAInstallButton';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

// Self-hosted by Next.js at build time (zero runtime requests to Google Fonts CDN)
const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const BASE_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EEF2F3' },
    { media: '(prefers-color-scheme: dark)', color: '#07141A' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Pati Kalbi | Satın Alma, Sahiplen — 3D & AR Sanal Barınak',
    template: '%s | Pati Kalbi',
  },
  description:
    'Gerze Belediyesi Bakımevi ve GEFOK iş birliğiyle hazırlanan 3D/WebAR destekli sanal barınak. Fotoğrafları gör, odanda 3D incele, ücretsiz ön başvuru yap.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pati Kalbi',
  },
  icons: {
    apple: '/api/pwa-icon?size=180',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Pati Kalbi',
    title: 'Pati Kalbi | Satın Alma, Sahiplen — 3D & AR Sanal Barınak',
    description:
      'Etiketi yok, kalbi var. Gerze Belediyesi Bakımevindeki can dostlarını dürüst mizaç kartı ve 1:1 3D/AR görünümüyle tanı.',
    images: [{ url: '/api/og/pamuk', width: 1200, height: 630, alt: 'Pati Kalbi — Satın Alma, Sahiplen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pati Kalbi | Satın Alma, Sahiplen — 3D & AR Sanal Barınak',
    description: 'Fiyatı 0 TL, değeri ömürlük. Barınaktaki can dostlarını tanı ve ücretsiz ön başvuru yap.',
    images: ['/api/og/pamuk'],
  },
};

const GLOBAL_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'NGO'],
      '@id': `${BASE_URL}/#organization`,
      name: 'Pati Kalbi — GEFOK & Gerze Belediyesi Sanal Barınak',
      url: BASE_URL,
      slogan: 'Satın Alma, Sahiplen.',
      description:
        'Bakımevindeki kedi ve köpekleri dürüst karakter bilgisi ve 3D/WebAR ile tanıtan açık kaynaklı sanal barınak.',
    },
    {
      '@type': 'LocalBusiness',
      additionalType: 'https://schema.org/AnimalShelter',
      '@id': `${BASE_URL}/#shelter`,
      name: 'Gerze Belediyesi Geçici Hayvan Bakımevi',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Gerze',
        addressRegion: 'Sinop',
        addressCountry: 'TR',
      },
      telephone: '+90-368-718-1001',
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Pati Kalbi',
      inLanguage: 'tr-TR',
      publisher: { '@id': `${BASE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/can-dostlari?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

const SPECULATION_RULES = JSON.stringify({
  prefetch: [
    {
      source: 'document',
      where: { href_matches: '/can-dostlari/*' },
      eagerness: 'moderate',
    },
  ],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const analyticsSrc = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL;
  const analyticsWebsiteId = process.env.NEXT_PUBLIC_ANALYTICS_WEBSITE_ID;

  return (
    <html lang="tr" className={`${bricolage.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(GLOBAL_JSON_LD) }}
        />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }}
        />
      </head>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <a
            href="#ana-icerik"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--accent-kalp)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Ana içeriğe geç
          </a>
          <SiteHeader />
          <main id="ana-icerik" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <OfflineIndicator />
        </ThemeProvider>
        {analyticsSrc && analyticsWebsiteId && (
          <Script
            src={analyticsSrc}
            data-website-id={analyticsWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
