import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Pati Kalbi — Sanal Barınak',
    short_name: 'Pati Kalbi',
    description:
      'Gerze Belediyesi Bakımevi ve GEFOK iş birliğiyle 3D/WebAR destekli sanal barınak. Satın alma, sahiplen.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#EEF2F3',
    theme_color: '#0F2E3A',
    lang: 'tr',
    icons: [
      {
        src: '/api/pwa-icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=512&maskable=1',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
