import React from 'react';
import type { Metadata } from 'next';
import { AdminPanelClient } from '@/components/AdminPanelClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Yönetim ve Saha Paneli',
  description: 'Pati Kalbi yetkili gönüllü, veteriner onay ve yönetici paneli.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function YonetimPage() {
  return <AdminPanelClient />;
}
