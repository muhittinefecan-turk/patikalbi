'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  Box,
  Camera,
  Check,
  CheckCircle2,
  CloudOff,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Inbox,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus } from '@/hooks/usePWAInstall';
import { processShelterPhotoClient } from '@/lib/client-image';
import { getPublicMediaUrl } from '@/lib/media-url';
import {
  listOfflineDrafts,
  removeOfflineDraft,
  saveOfflineDraft,
  type OfflineAnimalDraft,
} from '@/lib/offline-queue';
import {
  formatAgeTr,
  formatSexTr,
  formatSizeTr,
  formatStatusLabelTr,
  TEMPERAMENT_META,
} from '@/lib/turkish';
import type {
  AnimalStatus,
  AnimalWithDetails,
  ApplicationRecord,
  ApplicationStatus,
  AuditLogEntry,
  PanelUser,
  SeoPage,
  SeoPageType,
  Shelter,
  UserRole,
} from '@/lib/types';
import { PortraitFrame } from './PortraitFrame';
import { TemperamentChart } from './TemperamentChart';

const LazyAnimal3DViewer = dynamic(() => import('./Animal3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-6 text-center">
      <Box className="h-7 w-7 text-[var(--ink-karadeniz)]" aria-hidden="true" />
      <p className="mt-2 text-xs font-semibold text-[var(--ink-karadeniz)]">
        3D önizleme hazırlanıyor...
      </p>
    </div>
  ),
});

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  totp_enabled: number;
}

type AdminTab = 'animals' | 'studio3d' | 'approvals' | 'applications' | 'seo' | 'users';

interface AnimalFormState {
  id?: string;
  name: string;
  species: 'kedi' | 'kopek';
  sex: 'disi' | 'erkek' | 'bilinmiyor';
  size: 'kucuk' | 'orta' | 'buyuk';
  age_months_est: string;
  shoulder_height_cm: string;
  coat_and_look: string;
  vaccinated: string;
  neutered: string;
  microchipped: string;
  apartment_ok: string;
  health_note: string;
  t_energy: number | null;
  t_people: number | null;
  t_children: number | null;
  t_animals: number | null;
  t_alone: number | null;
  story: string;
  ideal_home: string;
  seo_description: string;
  status: AnimalStatus;
  shelter_id: string;
}

const EMPTY_ANIMAL_FORM: AnimalFormState = {
  name: '',
  species: 'kopek',
  sex: 'bilinmiyor',
  size: 'orta',
  age_months_est: '12',
  shoulder_height_cm: '45',
  coat_and_look: '',
  vaccinated: '',
  neutered: '',
  microchipped: '',
  apartment_ok: '',
  health_note: '',
  t_energy: 3,
  t_people: 4,
  t_children: null,
  t_animals: null,
  t_alone: 3,
  story: '',
  ideal_home: '',
  seo_description: '',
  status: 'taslak',
  shelter_id: 'shelter-gerze',
};

const APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  yeni: 'Yeni',
  bakimevine_iletildi: 'Bakımevine iletildi',
  gorusme: 'Görüşme aşamasında',
  yuvaya_kavustu: 'Yuvaya kavuştu',
  sonuclanmadi: 'Sonuçlanmadı',
  vazgecti: 'Vazgeçti',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Yönetici',
  approver: 'Veteriner Onaylayıcı',
  editor: 'Saha Gönüllüsü (Editör)',
};

function triToForm(v: number | null | undefined): string {
  if (v === 1) return '1';
  if (v === 0) return '0';
  return '';
}

function formToTri(v: string): number | null {
  if (v === '1') return 1;
  if (v === '0') return 0;
  return null;
}

function createDraftMeta(): { id: string; createdAt: string } {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `draft-${crypto.randomUUID().slice(0, 10)}`
      : `draft-${Math.random().toString(36).slice(2, 10)}`;
  return { id, createdAt: new Date().toISOString() };
}

export function AdminPanelClient() {
  const isOnline = useOnlineStatus();

  // Auth status & in-memory Bearer token (NEVER persisted in localStorage)
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [storageMode, setStorageMode] = useState('sqlite');
  const [mediaMode, setMediaMode] = useState('local-r2-mirror');

  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Login / Setup forms
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authTotp, setAuthTotp] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Navigation & feedback
  const [activeTab, setActiveTab] = useState<AdminTab>('animals');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Data stores
  const [animals, setAnimals] = useState<AnimalWithDetails[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [seoPages, setSeoPages] = useState<SeoPage[]>([]);
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineAnimalDraft[]>([]);

  // Animals tab state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [animalForm, setAnimalForm] = useState<AnimalFormState>(EMPTY_ANIMAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [savingAnimal, setSavingAnimal] = useState(false);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoAlt, setPhotoAlt] = useState('');
  const [photoCredit, setPhotoCredit] = useState('GEFOK Gönüllü');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // CSV bulk import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvText, setCsvText] = useState(
    'name,species,sex,size,age_months_est,shoulder_height_cm,t_energy,t_people,t_children,t_animals,t_alone,story\nLimon,kedi,disi,kucuk,8,24,4,5,4,4,4,Sıcakkanlı ve oyuncak farelere bayılan sarman tekir.'
  );

  // 3D Studio tab state
  const [studioAnimalId, setStudioAnimalId] = useState<string>('');
  const [studioScaleCm, setStudioScaleCm] = useState<number>(45);
  const [studioMethod, setStudioMethod] = useState<string>('image_to_3d');
  const [studioStatus, setStudioStatus] = useState<string>('aktif');
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [usdzFile, setUsdzFile] = useState<File | null>(null);
  const [splatFile, setSplatFile] = useState<File | null>(null);
  const [studioWarning, setStudioWarning] = useState<string | null>(null);
  const [showStudioPreview, setShowStudioPreview] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);

  // Approvals tab state
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  // Applications tab state
  const [appNotes, setAppNotes] = useState<Record<string, string>>({});
  const [confirmDeleteAppId, setConfirmDeleteAppId] = useState<string | null>(null);

  // SEO tab state
  const [selectedSeoId, setSelectedSeoId] = useState<string>('new');
  const [seoForm, setSeoForm] = useState({
    slug: '',
    page_type: 'guide' as SeoPageType,
    h1_title: '',
    slogan: '',
    meta_title: '',
    meta_description: '',
    filter_preset: '{}',
    body_md: '',
    faq_json: '[]',
    is_published: true,
  });

  // Users & 2FA state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('editor');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  const [totpEnrollSecret, setTotpEnrollSecret] = useState<string | null>(null);
  const [totpQrDataUrl, setTotpQrDataUrl] = useState<string | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');

  const notify = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
  }, []);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, { ...init, headers });
    },
    [token]
  );

  // Initial check: does system need first-run admin claim?
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/auth', { cache: 'no-store' });
        const data = (await res.json()) as {
          needsSetup?: boolean;
          storageMode?: string;
          mediaMode?: string;
        };
        if (!active) return;
        setNeedsSetup(Boolean(data.needsSetup));
        if (data.storageMode) setStorageMode(data.storageMode);
        if (data.mediaMode) setMediaMode(data.mediaMode);
      } catch {
        // Offline fallback
      } finally {
        if (active) setAuthStatusLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshOfflineDrafts = useCallback(async () => {
    try {
      const list = await listOfflineDrafts();
      setOfflineDrafts(list);
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  const loadDashboardData = useCallback(
    async (authToken: string, role: UserRole) => {
      setLoadingData(true);
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const anRes = await fetch('/api/admin/animals', { headers, cache: 'no-store' });
        if (anRes.ok) {
          const anData = (await anRes.json()) as {
            animals: AnimalWithDetails[];
            shelters: Shelter[];
            auditLogs: AuditLogEntry[];
          };
          setAnimals(anData.animals || []);
          setShelters(anData.shelters || []);
          setAuditLogs(anData.auditLogs || []);
          if (anData.animals?.length > 0 && !studioAnimalId) {
            const first = anData.animals[0];
            setStudioAnimalId(first.id);
            setStudioScaleCm(first.model?.scale_height_cm ?? first.shoulder_height_cm ?? 45);
          }
        }

        if (role === 'admin') {
          const [appRes, seoRes, usrRes] = await Promise.all([
            fetch('/api/admin/applications', { headers, cache: 'no-store' }),
            fetch('/api/admin/seo-pages', { headers, cache: 'no-store' }),
            fetch('/api/admin/users', { headers, cache: 'no-store' }),
          ]);
          if (appRes.ok) {
            const d = (await appRes.json()) as { applications: ApplicationRecord[] };
            setApplications(d.applications || []);
            const noteMap: Record<string, string> = {};
            for (const ap of d.applications || []) {
              noteMap[ap.id] = ap.internal_note || '';
            }
            setAppNotes(noteMap);
          }
          if (seoRes.ok) {
            const d = (await seoRes.json()) as { pages: SeoPage[] };
            setSeoPages(d.pages || []);
          }
          if (usrRes.ok) {
            const d = (await usrRes.json()) as { users: PanelUser[] };
            setUsers(d.users || []);
          }
        }
        await refreshOfflineDrafts();
      } catch {
        notify('err', 'Veriler yüklenirken bağlantı hatası oluştu.');
      } finally {
        setLoadingData(false);
      }
    },
    [notify, refreshOfflineDrafts, studioAnimalId]
  );

  // Handle Login or Initial Admin Setup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const payload = needsSetup
        ? {
            action: 'setup',
            email: authEmail,
            name: authName,
            password: authPassword,
          }
        : {
            action: 'login',
            email: authEmail,
            password: authPassword,
            totp_code: authTotp || undefined,
          };

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        token?: string;
        user?: AuthUser;
        error?: string;
        requiresTotp?: boolean;
      };
      if (!res.ok || !data.token || !data.user) {
        if (data.requiresTotp) setRequiresTotp(true);
        setAuthError(data.error || 'Giriş başarısız.');
        return;
      }

      setToken(data.token);
      setCurrentUser(data.user);
      setNeedsSetup(false);
      setAuthPassword('');
      setAuthTotp('');
      setRequiresTotp(false);
      if (data.user.role === 'approver') {
        setActiveTab('approvals');
      } else {
        setActiveTab('animals');
      }
      await loadDashboardData(data.token, data.user.role);
    } catch {
      setAuthError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setAnimals([]);
    setApplications([]);
    setSeoPages([]);
    setUsers([]);
    setTotpEnrollSecret(null);
    setTotpQrDataUrl(null);
  };

  // Open Animal Form for Edit
  const openEditAnimal = (a: AnimalWithDetails) => {
    setAnimalForm({
      id: a.id,
      name: a.name,
      species: a.species,
      sex: a.sex,
      size: a.size || 'orta',
      age_months_est: a.age_months_est !== null ? String(a.age_months_est) : '',
      shoulder_height_cm: a.shoulder_height_cm !== null ? String(a.shoulder_height_cm) : '',
      coat_and_look: a.coat_and_look || '',
      vaccinated: triToForm(a.vaccinated),
      neutered: triToForm(a.neutered),
      microchipped: triToForm(a.microchipped),
      apartment_ok: triToForm(a.apartment_ok),
      health_note: a.health_note || '',
      t_energy: a.t_energy,
      t_people: a.t_people,
      t_children: a.t_children,
      t_animals: a.t_animals,
      t_alone: a.t_alone,
      story: a.story || '',
      ideal_home: a.ideal_home || '',
      seo_description: a.seo_description || '',
      status: a.status,
      shelter_id: a.shelter_id,
    });
    setPhotoFile(null);
    setPhotoAlt(`${a.name} adlı ${a.species === 'kedi' ? 'kedi' : 'köpek'} bakımevi portresi`);
    setShowForm(true);
  };

  const openNewAnimal = () => {
    setAnimalForm({
      ...EMPTY_ANIMAL_FORM,
      shelter_id: shelters[0]?.id || 'shelter-gerze',
    });
    setPhotoFile(null);
    setPhotoAlt('');
    setShowForm(true);
  };

  const buildAnimalPayload = () => ({
    id: animalForm.id,
    shelter_id: animalForm.shelter_id,
    name: animalForm.name.trim(),
    species: animalForm.species,
    sex: animalForm.sex,
    size: animalForm.size,
    age_months_est: animalForm.age_months_est ? Number(animalForm.age_months_est) : null,
    shoulder_height_cm: animalForm.shoulder_height_cm ? Number(animalForm.shoulder_height_cm) : null,
    coat_and_look: animalForm.coat_and_look.trim() || null,
    vaccinated: formToTri(animalForm.vaccinated),
    neutered: formToTri(animalForm.neutered),
    microchipped: formToTri(animalForm.microchipped),
    apartment_ok: formToTri(animalForm.apartment_ok),
    health_note: animalForm.health_note.trim() || null,
    t_energy: animalForm.t_energy,
    t_people: animalForm.t_people,
    t_children: animalForm.t_children,
    t_animals: animalForm.t_animals,
    t_alone: animalForm.t_alone,
    story: animalForm.story.trim() || null,
    ideal_home: animalForm.ideal_home.trim() || null,
    seo_description: animalForm.seo_description.trim() || null,
    status: animalForm.status,
  });

  const handleSaveAnimal = async (e: React.FormEvent, forceOffline = false) => {
    e.preventDefault();
    const payload = buildAnimalPayload();
    if (!payload.name || payload.name.length < 2) {
      notify('err', 'Hayvan adı en az 2 karakter olmalıdır.');
      return;
    }

    // Offline Field Queue path
    if (forceOffline || !isOnline) {
      try {
        const meta = createDraftMeta();
        await saveOfflineDraft({
          id: meta.id,
          createdAt: meta.createdAt,
          payload,
          photoBlob: photoFile || undefined,
          photoAltText: photoAlt || `${payload.name} saha fotoğrafı`,
          photoCredit: photoCredit || currentUser?.name || 'GEFOK',
        });
        await refreshOfflineDrafts();
        setShowForm(false);
        notify('ok', `"${payload.name}" çevrimdışı saha kuyruğuna kaydedildi.`);
      } catch {
        notify('err', 'Çevrimdışı kuyruk kaydı başarısız oldu.');
      }
      return;
    }

    setSavingAnimal(true);
    try {
      const method = animalForm.id ? 'PATCH' : 'POST';
      const res = await authFetch('/api/admin/animals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok) {
        notify('err', data.error || 'Kayıt güncellenemedi.');
        return;
      }

      const savedId = animalForm.id || data.id;
      if (savedId && photoFile && photoAlt.trim().length >= 5) {
        await uploadPhotoForAnimal(savedId, photoFile, photoAlt.trim(), photoCredit.trim());
      }

      notify('ok', animalForm.id ? 'Hayvan profili güncellendi.' : 'Yeni taslak profil oluşturuldu.');
      setShowForm(false);
      if (token && currentUser) {
        await loadDashboardData(token, currentUser.role);
      }
    } catch {
      notify('err', 'Kayıt sırasında bağlantı hatası oluştu.');
    } finally {
      setSavingAnimal(false);
    }
  };

  const uploadPhotoForAnimal = async (
    animalId: string,
    file: File,
    altText: string,
    credit: string
  ) => {
    setUploadingPhoto(true);
    try {
      // Browser-side EXIF/GPS stripping + 400/800/1200w WebP + BlurHash
      const processed = await processShelterPhotoClient(file);
      const fd = new FormData();
      fd.append('file', processed.file800);
      fd.append('file_400', processed.file400);
      fd.append('file_1200', processed.file1200);
      fd.append('alt_text', altText);
      fd.append('credit', credit || currentUser?.name || 'GEFOK');
      fd.append('blurhash', processed.blurhash);
      fd.append('width', String(processed.width));
      fd.append('height', String(processed.height));
      fd.append('is_cover', '1');

      const res = await authFetch(`/api/admin/animals/${animalId}/photos`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        notify('err', data.error || 'Fotoğraf yüklenemedi.');
        return false;
      }
      notify('ok', 'Fotoğraf EXIF temizlenerek WebP formatında yüklendi.');
      return true;
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Görsel işlenemedi.');
      return false;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSyncOfflineDrafts = async () => {
    if (!isOnline || !token || !currentUser) return;
    let synced = 0;
    for (const draft of offlineDrafts) {
      const res = await authFetch('/api/admin/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft.payload),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string };
      if (res.ok && data.id) {
        if (draft.photoBlob) {
          const f = new File([draft.photoBlob], 'saha.jpg', {
            type: draft.photoBlob.type || 'image/jpeg',
          });
          await uploadPhotoForAnimal(
            data.id,
            f,
            draft.photoAltText || 'Saha gönüllü fotoğrafı',
            draft.photoCredit || currentUser.name
          );
        }
        await removeOfflineDraft(draft.id);
        synced += 1;
      }
    }
    await refreshOfflineDrafts();
    await loadDashboardData(token, currentUser.role);
    notify('ok', `${synced} çevrimdışı taslak sunucuya aktarıldı.`);
  };

  const handleSubmitForVetApproval = async (animalId: string) => {
    const res = await authFetch(`/api/admin/animals/${animalId}/submit`, { method: 'POST' });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'Onaya gönderilemedi.');
      return;
    }
    notify('ok', 'Profil veteriner hekim onayına gönderildi.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleVetDecision = async (animalId: string, decision: 'approve' | 'reject') => {
    const res = await authFetch(`/api/admin/animals/${animalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        note: rejectNotes[animalId] || '',
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'İşlem başarısız.');
      return;
    }
    notify(
      'ok',
      decision === 'approve'
        ? 'Profil veteriner onayıyla yayına alındı ve arama motorlarına bildirildi.'
        : 'Profil düzeltme notuyla taslağa geri gönderildi.'
    );
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleCsvBulkImport = async () => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      notify('err', 'En az bir başlık ve bir veri satırı gerekli.');
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (cols[i] || '').trim();
      });
      return obj;
    });

    const res = await authFetch('/api/admin/animals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'csv_bulk', rows }),
    });
    const data = (await res.json()) as { ok?: boolean; count?: number; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'CSV içe aktarım başarısız.');
      return;
    }
    notify('ok', `${data.count || 0} taslak kayıt CSV ile aktarıldı.`);
    setShowCsvImport(false);
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  // 3D Studio Upload
  const handleModelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioAnimalId) return;
    setUploadingModel(true);
    setStudioWarning(null);
    try {
      const fd = new FormData();
      fd.append('scale_height_cm', String(studioScaleCm));
      fd.append('capture_method', studioMethod);
      fd.append('status', studioStatus);
      if (glbFile) fd.append('glb', glbFile);
      if (usdzFile) fd.append('usdz', usdzFile);
      if (splatFile) fd.append('splat', splatFile);

      const res = await authFetch(`/api/admin/animals/${studioAnimalId}/model`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        sizeWarning?: string | null;
        error?: string;
      };
      if (!res.ok) {
        notify('err', data.error || '3D model güncellenemedi.');
        return;
      }
      if (data.sizeWarning) setStudioWarning(data.sizeWarning);
      setGlbFile(null);
      setUsdzFile(null);
      setSplatFile(null);
      notify('ok', '3D / AR ölçek ve model ayarları kaydedildi.');
      if (token && currentUser) await loadDashboardData(token, currentUser.role);
    } catch {
      notify('err', '3D yükleme sırasında bağlantı hatası oluştu.');
    } finally {
      setUploadingModel(false);
    }
  };

  // Applications actions
  const handleUpdateApplication = async (appId: string, status: ApplicationStatus) => {
    const res = await authFetch('/api/admin/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, status, internal_note: appNotes[appId] || '' }),
    });
    if (!res.ok) {
      notify('err', 'Başvuru güncellenemedi.');
      return;
    }
    notify('ok', 'Başvuru durumu kaydedildi.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleForwardApplication = async (appId: string) => {
    const res = await authFetch(`/api/admin/applications/${appId}/forward`, { method: 'POST' });
    const data = (await res.json()) as { ok?: boolean; detail?: string; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'Bakımevine iletilemedi.');
      return;
    }
    notify('ok', data.detail || 'Başvuru bakımevine iletildi.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleDeleteApplicationKvkk = async (appId: string) => {
    const res = await authFetch(`/api/admin/applications?id=${encodeURIComponent(appId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      notify('err', 'Kayıt silinemedi.');
      return;
    }
    setConfirmDeleteAppId(null);
    notify('ok', 'Başvuru kişisel verileri KVKK kapsamında kalıcı olarak silindi.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleDownloadAnonymousCsv = async () => {
    try {
      const res = await authFetch('/api/admin/export.csv');
      if (!res.ok) {
        notify('err', 'Rapor indirilemedi.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pati-kalbi-anonim-rapor-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify('ok', 'Anonim CSV raporu indirildi.');
    } catch {
      notify('err', 'Rapor indirme başarısız.');
    }
  };

  // SEO Pages Save
  const selectSeoPage = (id: string) => {
    setSelectedSeoId(id);
    if (id === 'new') {
      setSeoForm({
        slug: '',
        page_type: 'guide',
        h1_title: '',
        slogan: '',
        meta_title: '',
        meta_description: '',
        filter_preset: '{}',
        body_md: '',
        faq_json: '[]',
        is_published: true,
      });
      return;
    }
    const found = seoPages.find((p) => p.id === id);
    if (found) {
      setSeoForm({
        slug: found.slug,
        page_type: found.page_type,
        h1_title: found.h1_title,
        slogan: found.slogan || '',
        meta_title: found.meta_title,
        meta_description: found.meta_description,
        filter_preset: found.filter_preset || '{}',
        body_md: found.body_md,
        faq_json: found.faq_json || '[]',
        is_published: found.is_published === 1,
      });
    }
  };

  const handleSaveSeoPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = selectedSeoId === 'new';
    const res = await authFetch('/api/admin/seo-pages', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isNew ? seoForm : { ...seoForm, id: selectedSeoId }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'SEO sayfası kaydedilemedi.');
      return;
    }
    notify('ok', isNew ? 'Yeni SEO / rehber sayfası oluşturuldu.' : 'SEO sayfası güncellendi.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  // Users & 2FA Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUserEmail,
        name: newUserName,
        role: newUserRole,
        password: newUserPassword,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'Kullanıcı oluşturulamadı.');
      return;
    }
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPassword('');
    notify('ok', 'Yeni yetkili kullanıcı eklendi.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleDeleteUser = async (uid: string) => {
    const res = await authFetch(`/api/admin/users?id=${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'Kullanıcı silinemedi.');
      return;
    }
    setConfirmDeleteUserId(null);
    notify('ok', 'Kullanıcı kaldırıldı.');
    if (token && currentUser) await loadDashboardData(token, currentUser.role);
  };

  const handleStartTotpEnroll = async () => {
    const res = await authFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'totp-enroll' }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      secret?: string;
      otpauthUrl?: string;
      error?: string;
    };
    if (!res.ok || !data.secret || !data.otpauthUrl) {
      notify('err', data.error || '2FA başlatılamadı.');
      return;
    }
    setTotpEnrollSecret(data.secret);
    try {
      const qr = await QRCode.toDataURL(data.otpauthUrl, { width: 200, margin: 1 });
      setTotpQrDataUrl(qr);
    } catch {
      setTotpQrDataUrl(null);
    }
  };

  const handleVerifyTotpEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'totp-verify', code: totpVerifyCode }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      notify('err', data.error || 'Kod doğrulanamadı.');
      return;
    }
    setTotpEnrollSecret(null);
    setTotpQrDataUrl(null);
    setTotpVerifyCode('');
    if (currentUser) setCurrentUser({ ...currentUser, totp_enabled: 1 });
    notify('ok', 'İki adımlı doğrulama (2FA) hesabınızda etkinleştirildi.');
  };

  // --- AUTH GATE VIEW ---
  if (authStatusLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-[var(--ink-muted)]">
        Yönetim paneli durumu kontrol ediliyor...
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Pati Kalbi Yetkili Alanı
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--ink-karadeniz)]">
            {needsSetup ? 'İlk Yönetici Kurulumu' : 'Yönetim Paneli Girişi'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            {needsSetup
              ? 'Bu kurulumda henüz yönetici hesabı oluşturulmamış. İlk yönetici hesabını şimdi belirleyin; oturum jetonu yalnızca bellekte tutulur.'
              : 'Gönüllü editör, veteriner onaylayıcı veya yönetici hesabınızla giriş yapın.'}
          </p>

          <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
            {needsSetup && (
              <div>
                <label
                  htmlFor="setup-name"
                  className="block text-xs font-semibold text-[var(--ink-karadeniz)]"
                >
                  Ad Soyad
                </label>
                <input
                  id="setup-name"
                  type="text"
                  required
                  minLength={2}
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Örn. Ayşe Yılmaz"
                  className="mt-1.5 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm text-[var(--ink-karadeniz)]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-[var(--ink-karadeniz)]"
              >
                E-posta
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="username"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="yonetici@gerze.bel.tr"
                className="mt-1.5 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm text-[var(--ink-karadeniz)]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[var(--ink-karadeniz)]"
              >
                Parola
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={needsSetup ? 8 : 4}
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={needsSetup ? 'En az 8 karakter güçlü parola' : '••••••••'}
                className="mt-1.5 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm text-[var(--ink-karadeniz)]"
              />
            </div>

            {!needsSetup && requiresTotp && (
              <div>
                <label
                  htmlFor="auth-totp"
                  className="block text-xs font-semibold text-[var(--ink-karadeniz)]"
                >
                  2FA Doğrulama Kodu (6 hane)
                </label>
                <input
                  id="auth-totp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={authTotp}
                  onChange={(e) => setAuthTotp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="mt-1.5 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm tracking-widest text-[var(--ink-karadeniz)]"
                />
              </div>
            )}

            {authError && (
              <div
                role="alert"
                className="rounded-[8px] border border-[var(--accent-kalp)]/40 bg-[var(--accent-kalp)]/10 px-3 py-2 text-xs font-medium text-[var(--accent-kalp)]"
              >
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full min-h-[48px] rounded-full bg-[var(--accent-kalp)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {authSubmitting
                ? 'İşleniyor...'
                : needsSetup
                  ? 'Yönetici Hesabını Oluştur ve Gir'
                  : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-4 text-[11px] text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Veritabanı: {storageMode === 'cloudflare-d1' ? 'Cloudflare D1' : 'Yerel SQLite (D1 uyumlu)'}
            </span>
            <span>Medya: {mediaMode === 'cloudflare-r2' ? 'Cloudflare R2' : 'Yerel R2 Aynası'}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED RBAC DASHBOARD ---
  const pendingApprovalAnimals = animals.filter((a) => a.status === 'onay_bekliyor');
  const filteredAnimals =
    statusFilter === 'all' ? animals : animals.filter((a) => a.status === statusFilter);
  const studioAnimal = animals.find((a) => a.id === studioAnimalId) || animals[0] || null;

  const canEdit = currentUser.role === 'editor' || currentUser.role === 'admin';
  const canApprove = currentUser.role === 'approver' || currentUser.role === 'admin';
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-kalp)]">
            Pati Kalbi Yönetim &amp; Saha Paneli
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--ink-karadeniz)] sm:text-3xl">
            Hoş geldin, {currentUser.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="font-semibold text-[var(--ink-karadeniz)]">
              {ROLE_LABELS[currentUser.role]}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-[var(--accent-yosun)]" /> Çevrimiçi
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-[var(--accent-kehribar)]" /> Çevrimdışı Saha
                  Modu
                </>
              )}
            </span>
            <span>·</span>
            <span>{storageMode === 'cloudflare-d1' ? 'Cloudflare D1' : 'Yerel SQLite (D1)'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadDashboardData(token, currentUser.role)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-xs font-semibold text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-xs font-semibold text-[var(--accent-kalp)] hover:border-[var(--accent-kalp)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Çıkış
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`mt-4 flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3 text-sm ${
            toast.type === 'ok'
              ? 'border-[var(--accent-yosun)]/40 bg-[var(--accent-yosun)]/10 text-[var(--ink-karadeniz)]'
              : 'border-[var(--accent-kalp)]/40 bg-[var(--accent-kalp)]/10 text-[var(--accent-kalp)]'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Bildirimi kapat"
            className="p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Offline Draft Queue Banner */}
      {offlineDrafts.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--accent-kehribar)] bg-[var(--surface-beyaz)] p-4 text-sm">
          <div className="flex items-center gap-2.5">
            <CloudOff className="h-5 w-5 text-[var(--accent-kehribar)]" aria-hidden="true" />
            <span>
              Cihazında bekleyen{' '}
              <strong className="text-[var(--ink-karadeniz)]">{offlineDrafts.length}</strong>{' '}
              çevrimdışı saha taslağı var.
            </span>
          </div>
          <button
            type="button"
            disabled={!isOnline}
            onClick={handleSyncOfflineDrafts}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--ink-karadeniz)] px-4 text-xs font-semibold text-[var(--surface-beyaz)] disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {isOnline ? 'Sunucuya Eşitle' : 'İnternet bekleniyor'}
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <nav
        aria-label="Yönetim paneli sekmeleri"
        className="mt-6 flex gap-2 overflow-x-auto border-b border-[var(--border-hairline)] pb-3"
      >
        <button
          type="button"
          onClick={() => setActiveTab('animals')}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors ${
            activeTab === 'animals'
              ? 'bg-[var(--ink-karadeniz)] text-[var(--surface-beyaz)]'
              : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
          }`}
        >
          Hayvanlar ({animals.length})
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={() => setActiveTab('studio3d')}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors ${
              activeTab === 'studio3d'
                ? 'bg-[var(--ink-karadeniz)] text-[var(--surface-beyaz)]'
                : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            3D / AR Stüdyosu
          </button>
        )}

        {canApprove && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors ${
              activeTab === 'approvals'
                ? 'bg-[var(--accent-kalp)] text-white'
                : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Veteriner Onayı ({pendingApprovalAnimals.length})
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors ${
              activeTab === 'applications'
                ? 'bg-[var(--ink-karadeniz)] text-[var(--surface-beyaz)]'
                : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            Başvurular ({applications.length})
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors ${
              activeTab === 'seo'
                ? 'bg-[var(--ink-karadeniz)] text-[var(--surface-beyaz)]'
                : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            SEO &amp; Rehberler ({seoPages.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-[var(--ink-karadeniz)] text-[var(--surface-beyaz)]'
              : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          {isAdmin ? 'Kullanıcılar, 2FA & Denetim' : '2FA Güvenlik'}
        </button>
      </nav>

      {/* ==================== TAB 1: ANIMALS ==================== */}
      {activeTab === 'animals' && (
        <section className="py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ['all', 'Tümü'],
                  ['onay_bekliyor', 'Onay Bekliyor'],
                  ['taslak', 'Taslak'],
                  ['yayinda', 'Yayında'],
                  ['ilgi_var', 'İlgi Var'],
                  ['yuvaya_kavustu', 'Yuvaya Kavuştu'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStatusFilter(val)}
                  className={`min-h-[40px] rounded-full px-3.5 text-xs font-semibold ${
                    statusFilter === val
                      ? 'bg-[var(--accent-kalp)] text-white'
                      : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {canEdit && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvImport((v) => !v)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-4 text-xs font-semibold text-[var(--ink-karadeniz)]"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV Toplu Aktarım
                </button>
                <button
                  type="button"
                  onClick={openNewAnimal}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--accent-kalp)] px-5 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Can Dostu Ekle
                </button>
              </div>
            )}
          </div>

          {/* CSV Bulk Temperament Importer */}
          {showCsvImport && canEdit && (
            <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5">
              <h2 className="font-display text-base font-semibold text-[var(--ink-karadeniz)]">
                CSV Toplu Mizaç ve Profil Aktarımı (Taslak Olarak)
              </h2>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Toplu aktarılan tüm kayıtlar önce &ldquo;Taslak&rdquo; durumunda oluşur; veteriner
                onayı olmadan yayına çıkmaz.
              </p>
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="mt-3 w-full rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3 font-mono text-xs text-[var(--ink-karadeniz)]"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleCsvBulkImport}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--ink-karadeniz)] px-5 text-xs font-semibold text-[var(--surface-beyaz)]"
                >
                  CSV Satırlarını Aktar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCsvImport(false)}
                  className="min-h-[44px] rounded-full border border-[var(--border-hairline)] px-4 text-xs font-semibold text-[var(--ink-muted)]"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}

          {/* Create / Edit Animal Form */}
          {showForm && canEdit && (
            <form
              onSubmit={(e) => handleSaveAnimal(e, false)}
              className="rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 sm:p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                  {animalForm.id ? `Profili Düzenle: ${animalForm.name}` : 'Yeni Can Dostu Kaydı'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hairline)]"
                  aria-label="Formu kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Basic fields */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Ad *
                  </label>
                  <input
                    type="text"
                    required
                    value={animalForm.name}
                    onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })}
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Tür
                  </label>
                  <select
                    value={animalForm.species}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, species: e.target.value as 'kedi' | 'kopek' })
                    }
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  >
                    <option value="kopek">Köpek</option>
                    <option value="kedi">Kedi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Cinsiyet
                  </label>
                  <select
                    value={animalForm.sex}
                    onChange={(e) =>
                      setAnimalForm({
                        ...animalForm,
                        sex: e.target.value as 'disi' | 'erkek' | 'bilinmiyor',
                      })
                    }
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  >
                    <option value="disi">Dişi</option>
                    <option value="erkek">Erkek</option>
                    <option value="bilinmiyor">Bilinmiyor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Boyut
                  </label>
                  <select
                    value={animalForm.size}
                    onChange={(e) =>
                      setAnimalForm({
                        ...animalForm,
                        size: e.target.value as 'kucuk' | 'orta' | 'buyuk',
                      })
                    }
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  >
                    <option value="kucuk">Küçük</option>
                    <option value="orta">Orta</option>
                    <option value="buyuk">Büyük</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Tahmini Yaş (Ay)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={animalForm.age_months_est}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, age_months_est: e.target.value })
                    }
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Omuz Yüksekliği (cm · 3D Ölçeği)
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={animalForm.shoulder_height_cm}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, shoulder_height_cm: e.target.value })
                    }
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Tüy ve Görünüm Notu
                  </label>
                  <input
                    type="text"
                    value={animalForm.coat_and_look}
                    onChange={(e) =>
                      setAnimalForm({ ...animalForm, coat_and_look: e.target.value })
                    }
                    placeholder="Örn. Kısa krem tüy, kehribar gözler"
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  />
                </div>
              </div>

              {/* Tri-state Health & Apartment */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-[var(--border-hairline)] pt-5">
                {(
                  [
                    ['vaccinated', 'Aşıları Tam'],
                    ['neutered', 'Kısırlaştırılmış'],
                    ['microchipped', 'Mikroçipli'],
                    ['apartment_ok', 'Apartmana Uygun'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                      {label}
                    </label>
                    <select
                      value={animalForm[field]}
                      onChange={(e) => setAnimalForm({ ...animalForm, [field]: e.target.value })}
                      className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                    >
                      <option value="">Bilinmiyor</option>
                      <option value="1">Evet</option>
                      <option value="0">Hayır</option>
                    </select>
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Sağlık Notu
                  </label>
                  <input
                    type="text"
                    maxLength={240}
                    value={animalForm.health_note}
                    onChange={(e) => setAnimalForm({ ...animalForm, health_note: e.target.value })}
                    placeholder="Örn. İç-dış parazit ve kuduz aşısı tamamlandı."
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  />
                </div>
              </div>

              {/* 5 Temperament Sliders with "Denenmedi" Toggle */}
              <div className="border-t border-[var(--border-hairline)] pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  5 Eksenli Mizaç Gözlemi (Gözlemlenmediyse &ldquo;Denenmedi&rdquo; işaretleyin)
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {TEMPERAMENT_META.map((axis) => {
                    const val = animalForm[axis.key];
                    return (
                      <div
                        key={axis.key}
                        className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--ink-karadeniz)]">
                            {axis.label}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setAnimalForm({
                                ...animalForm,
                                [axis.key]: val === null ? 3 : null,
                              })
                            }
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              val === null
                                ? 'bg-[var(--accent-kehribar)] text-[#0F2E3A]'
                                : 'border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-muted)]'
                            }`}
                          >
                            {val === null ? 'Denenmedi (Aktif)' : 'Denenmedi yap'}
                          </button>
                        </div>
                        {val !== null ? (
                          <div className="mt-2.5 flex items-center gap-3">
                            <span className="text-[11px] text-[var(--ink-muted)]">
                              {axis.low}
                            </span>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={val}
                              onChange={(e) =>
                                setAnimalForm({
                                  ...animalForm,
                                  [axis.key]: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[var(--accent-kalp)]"
                            />
                            <span className="text-[11px] font-bold text-[var(--ink-karadeniz)]">
                              {val}/5
                            </span>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
                            Profilde dürüstçe &ldquo;Denenmedi&rdquo; olarak gösterilir.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Story & Ideal Home */}
              <div className="grid gap-4 md:grid-cols-2 border-t border-[var(--border-hairline)] pt-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[var(--ink-karadeniz)]">
                    <label htmlFor="an-story">Hikâyesi</label>
                    <span className="text-[var(--ink-muted)]">{animalForm.story.length}/600</span>
                  </div>
                  <textarea
                    id="an-story"
                    rows={4}
                    maxLength={600}
                    value={animalForm.story}
                    onChange={(e) => setAnimalForm({ ...animalForm, story: e.target.value })}
                    className="mt-1 w-full rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3 text-sm"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-[var(--ink-karadeniz)]">
                      <label htmlFor="an-ideal">İdeal Yuva</label>
                      <span className="text-[var(--ink-muted)]">
                        {animalForm.ideal_home.length}/200
                      </span>
                    </div>
                    <textarea
                      id="an-ideal"
                      rows={2}
                      maxLength={200}
                      value={animalForm.ideal_home}
                      onChange={(e) => setAnimalForm({ ...animalForm, ideal_home: e.target.value })}
                      className="mt-1 w-full rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="an-seo"
                      className="block text-xs font-semibold text-[var(--ink-karadeniz)]"
                    >
                      SEO Özeti (max 160 karakter)
                    </label>
                    <input
                      id="an-seo"
                      type="text"
                      maxLength={160}
                      value={animalForm.seo_description}
                      onChange={(e) =>
                        setAnimalForm({ ...animalForm, seo_description: e.target.value })
                      }
                      className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Browser-Side EXIF-Stripped WebP Photo Uploader */}
              <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-karadeniz)]">
                  <Camera className="h-4 w-4 text-[var(--accent-kalp)]" />
                  Portre Fotoğrafı Yükle (Tarayıcıda EXIF/GPS Temizlenir · 400/800/1200w WebP)
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="text-xs text-[var(--ink-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--ink-karadeniz)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--surface-beyaz)]"
                  />
                  <input
                    type="text"
                    value={photoAlt}
                    onChange={(e) => setPhotoAlt(e.target.value)}
                    placeholder="Zorunlu alt metin (erişilebilirlik)"
                    className="min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-3 text-xs"
                  />
                  <input
                    type="text"
                    value={photoCredit}
                    onChange={(e) => setPhotoCredit(e.target.value)}
                    placeholder="Fotoğrafçı / GEFOK"
                    className="min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] px-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingAnimal || uploadingPhoto}
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[var(--accent-kalp)] px-6 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {savingAnimal || uploadingPhoto
                    ? 'Kaydediliyor...'
                    : isOnline
                      ? 'Kaydet'
                      : 'Çevrimdışı Kuyruğa Kaydet'}
                </button>
                {!animalForm.id && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveAnimal(e, true)}
                    className="inline-flex min-h-[46px] items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-5 text-xs font-semibold text-[var(--ink-karadeniz)]"
                  >
                    <CloudOff className="h-4 w-4" />
                    Çevrimdışı Kuyruğa Ekle (Test)
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Animals List */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAnimals.map((a) => (
              <div
                key={a.id}
                className="flex gap-4 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-4"
              >
                <div className="w-24 shrink-0">
                  <PortraitFrame
                    name={a.name}
                    species={a.species}
                    photo={a.photos[0]}
                    shoulderHeightCm={a.shoulder_height_cm}
                    sizeVariant="thumb"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)] truncate">
                      {a.name}
                    </h3>
                    <span className="rounded-full border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-karadeniz)]">
                      {formatStatusLabelTr(a.status).label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {formatAgeTr(a.age_months_est)} · {formatSexTr(a.sex)} ·{' '}
                    {formatSizeTr(a.size)}
                    {a.shoulder_height_cm ? ` · ${a.shoulder_height_cm} cm` : ''}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                    {a.vet_approved_at
                      ? `Veteriner onayı: ${a.vet_approved_by || 'Onaylı'}`
                      : 'Veteriner onayı bekleniyor'}
                    {a.model?.status === 'aktif' ? ' · 3D Aktif' : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditAnimal(a)}
                        className="min-h-[38px] rounded-full border border-[var(--border-hairline)] px-3.5 text-xs font-semibold text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)]"
                      >
                        Düzenle
                      </button>
                    )}
                    {canEdit && a.status === 'taslak' && (
                      <button
                        type="button"
                        onClick={() => handleSubmitForVetApproval(a.id)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-[var(--accent-yosun)] px-3.5 text-xs font-semibold text-white"
                      >
                        <Send className="h-3 w-3" />
                        Onaya Gönder
                      </button>
                    )}
                    {(a.status === 'yayinda' || a.status === 'ilgi_var') && (
                      <Link
                        href={`/can-dostlari/${a.slug}`}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--accent-kalp)]"
                      >
                        Profili gör
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== TAB 2: 3D / AR STUDIO ==================== */}
      {activeTab === 'studio3d' && canEdit && (
        <section className="py-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-5">
            <form
              onSubmit={handleModelUpload}
              className="rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                    3D Model, Gaussian Splat ve AR Ölçek Yöneticisi
                  </h2>
                  <p className="text-xs text-[var(--ink-muted)]">
                    .glb (Web/Android), .usdz (iOS Quick Look) ve .splat/.ksplat yükleyip 1:1 omuz
                    yüksekliğini kalibre edin.
                  </p>
                </div>
                <a
                  href="/api/blender-script"
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-4 text-xs font-semibold text-[var(--ink-karadeniz)] hover:border-[var(--accent-kalp)]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Blender CLI Betiği (.py)
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Can Dostu Seç
                  </label>
                  <select
                    value={studioAnimalId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setStudioAnimalId(nextId);
                      const found = animals.find((a) => a.id === nextId);
                      if (found) {
                        setStudioScaleCm(
                          found.model?.scale_height_cm ?? found.shoulder_height_cm ?? 45
                        );
                        setStudioMethod(found.model?.capture_method ?? 'image_to_3d');
                        setStudioStatus(found.model?.status ?? 'aktif');
                      }
                    }}
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  >
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.species === 'kedi' ? 'Kedi' : 'Köpek'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    1:1 Omuz Yüksekliği Kalibrasyonu: {studioScaleCm} cm
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={95}
                    value={studioScaleCm}
                    onChange={(e) => setStudioScaleCm(Number(e.target.value))}
                    className="mt-3 w-full accent-[var(--accent-kalp)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Tarama / Üretim Yöntemi
                  </label>
                  <select
                    value={studioMethod}
                    onChange={(e) => setStudioMethod(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  >
                    <option value="image_to_3d">Fotoğraftan 3D (Image-to-3D)</option>
                    <option value="photogrammetry">Çoklu Fotoğraf Fotogrametri</option>
                    <option value="gaussian_splat">3D Gaussian Splatting (.splat/.ksplat)</option>
                    <option value="hybrid">Hibrit (Mesh + Splat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    3D Durumu
                  </label>
                  <select
                    value={studioStatus}
                    onChange={(e) => setStudioStatus(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm"
                  >
                    <option value="aktif">Aktif (Profilde 3D/AR Açık)</option>
                    <option value="onay_bekliyor">Veteriner Onayı Bekliyor</option>
                    <option value="pasif">Pasif</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3">
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    .GLB Mesh (Web / Android)
                  </label>
                  <input
                    type="file"
                    accept=".glb"
                    onChange={(e) => setGlbFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-[11px]"
                  />
                </div>
                <div className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3">
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    .USDZ (iOS AR Quick Look)
                  </label>
                  <input
                    type="file"
                    accept=".usdz"
                    onChange={(e) => setUsdzFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-[11px]"
                  />
                </div>
                <div className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3">
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    .SPLAT / .KSPLAT
                  </label>
                  <input
                    type="file"
                    accept=".splat,.ksplat"
                    onChange={(e) => setSplatFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-[11px]"
                  />
                </div>
              </div>

              {studioWarning && (
                <div className="flex items-start gap-2 rounded-[8px] border border-[var(--accent-kehribar)] bg-[var(--surface-sis)] p-3 text-xs text-[var(--ink-karadeniz)]">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--accent-kehribar)]" />
                  <span>{studioWarning}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingModel}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[var(--accent-kalp)] px-6 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploadingModel ? 'Yükleniyor...' : '3D Ayarlarını & Dosyaları Kaydet'}
              </button>

              <div className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3 text-xs text-[var(--ink-muted)]">
                <p className="font-semibold text-[var(--ink-karadeniz)]">
                  Blender CLI Otomatik İşleme Komutu:
                </p>
                <code className="mt-1 block break-all font-mono text-[11px]">
                  blender --background --python scripts/optimize_3d_blender.py -- --input ham.glb
                  --output-dir out --shoulder-cm {studioScaleCm}
                </code>
              </div>
            </form>
          </div>

          {/* Live 3D Studio Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-[var(--ink-karadeniz)]">
                  Canlı 1:1 Ölçek Önizleme
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStudioPreview((v) => !v)}
                  className="min-h-[38px] rounded-full bg-[var(--ink-karadeniz)] px-4 text-xs font-semibold text-[var(--surface-beyaz)]"
                >
                  {showStudioPreview ? 'Önizlemeyi Kapat' : '3D Sahneyi Başlat'}
                </button>
              </div>
              {studioAnimal && showStudioPreview ? (
                <LazyAnimal3DViewer
                  name={studioAnimal.name}
                  species={studioAnimal.species}
                  shoulderHeightCm={studioScaleCm}
                  glbUrl={
                    studioAnimal.model?.glb_key
                      ? getPublicMediaUrl(studioAnimal.model.glb_key)
                      : null
                  }
                  splatUrl={
                    studioAnimal.model?.splat_key
                      ? getPublicMediaUrl(studioAnimal.model.splat_key)
                      : null
                  }
                  captureMethod={studioMethod}
                />
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border-hairline)] bg-[var(--surface-sis)] p-6 text-center">
                  <Box className="h-8 w-8 text-[var(--ink-muted)]" />
                  <p className="mt-3 text-sm font-semibold text-[var(--ink-karadeniz)]">
                    {studioAnimal?.name || 'Hayvan seçin'} — {studioScaleCm} cm omuz yüksekliği
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Sıfır başlangıç yükü kuralı gereği 3D motor yalnızca siz başlattığınızda
                    yüklenir.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== TAB 3: VET APPROVALS ==================== */}
      {activeTab === 'approvals' && canApprove && (
        <section className="py-6 space-y-6">
          <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-4 text-sm text-[var(--ink-muted)]">
            Aşağıdaki profiller saha gönüllüleri tarafından hazırlandı ve veteriner hekim onayı
            bekliyor. Sağlık ve mizaç bilgilerini doğruladıktan sonra tek tıkla yayına
            alabilirsiniz.
          </div>

          {pendingApprovalAnimals.length === 0 ? (
            <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-10 text-center text-sm text-[var(--ink-muted)]">
              Şu an veteriner onayı bekleyen profil bulunmuyor.
            </div>
          ) : (
            <div className="space-y-6">
              {pendingApprovalAnimals.map((a) => (
                <div
                  key={a.id}
                  className="grid gap-6 rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 lg:grid-cols-12"
                >
                  <div className="lg:col-span-3">
                    <PortraitFrame
                      name={a.name}
                      species={a.species}
                      photo={a.photos[0]}
                      shoulderHeightCm={a.shoulder_height_cm}
                      sizeVariant="tile"
                    />
                  </div>
                  <div className="lg:col-span-5 space-y-3">
                    <h2 className="font-display text-2xl font-semibold text-[var(--ink-karadeniz)]">
                      {a.name}
                    </h2>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {formatAgeTr(a.age_months_est)} · {formatSexTr(a.sex)} ·{' '}
                      {formatSizeTr(a.size)}
                      {a.shoulder_height_cm ? ` · ${a.shoulder_height_cm} cm omuz` : ''}
                    </p>
                    {a.health_note && (
                      <p className="rounded-[8px] bg-[var(--surface-sis)] p-3 text-xs text-[var(--ink-karadeniz)]">
                        <strong>Sağlık Notu:</strong> {a.health_note}
                      </p>
                    )}
                    {a.story && <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{a.story}</p>}
                    <div className="pt-2">
                      <TemperamentChart animal={a} />
                    </div>
                  </div>
                  <div className="lg:col-span-4 flex flex-col justify-between gap-4 border-t border-[var(--border-hairline)] pt-4 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                        Düzeltme Notu (Taslağa iade edilecekse)
                      </label>
                      <textarea
                        rows={3}
                        value={rejectNotes[a.id] || ''}
                        onChange={(e) =>
                          setRejectNotes({ ...rejectNotes, [a.id]: e.target.value })
                        }
                        placeholder="Örn. Kuduz aşısı tarihi sağlık notuna eklenmeli."
                        className="mt-1.5 w-full rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-2.5 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleVetDecision(a.id, 'approve')}
                        className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[var(--accent-yosun)] px-5 text-sm font-semibold text-white"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Onayla ve Yayınla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVetDecision(a.id, 'reject')}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-4 text-xs font-semibold text-[var(--ink-karadeniz)]"
                      >
                        Düzeltme İste (Taslağa Çek)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== TAB 4: APPLICATIONS ==================== */}
      {activeTab === 'applications' && isAdmin && (
        <section className="py-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ink-muted)]">
              Başvuru verileri yalnızca yönetici ekranında görünür; en fazla 12 ay saklanır ve
              KVKK talebinde tek tıkla silinebilir.
            </p>
            <button
              type="button"
              onClick={handleDownloadAnonymousCsv}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--ink-karadeniz)] px-5 text-xs font-semibold text-[var(--surface-beyaz)]"
            >
              <Download className="h-4 w-4" />
              Anonim Rapor İndir (CSV)
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-10 text-center text-sm text-[var(--ink-muted)]">
              Henüz ön başvuru kaydı yok.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((ap) => (
                <div
                  key={ap.id}
                  className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-kalp)]">
                        {ap.animal_name || ap.animal_id}
                      </p>
                      <h3 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                        {ap.full_name}
                      </h3>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {ap.phone} · {ap.email} · {ap.city}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-[var(--ink-muted)]">
                      <p>KVKK Onay: {ap.consent_at.slice(0, 10)}</p>
                      <p>Otomatik İmha: {ap.delete_after.slice(0, 10)}</p>
                    </div>
                  </div>

                  {ap.motivation && (
                    <p className="rounded-[8px] bg-[var(--surface-sis)] p-3 text-sm text-[var(--ink-karadeniz)]">
                      {ap.motivation}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-12 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                        Başvuru Durumu
                      </label>
                      <select
                        value={ap.status}
                        onChange={(e) =>
                          handleUpdateApplication(ap.id, e.target.value as ApplicationStatus)
                        }
                        className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                      >
                        {(Object.keys(APP_STATUS_LABELS) as ApplicationStatus[]).map((st) => (
                          <option key={st} value={st}>
                            {APP_STATUS_LABELS[st]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                        İç Not
                      </label>
                      <input
                        type="text"
                        value={appNotes[ap.id] || ''}
                        onChange={(e) => setAppNotes({ ...appNotes, [ap.id]: e.target.value })}
                        placeholder="Görüşme veya takip notu"
                        className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateApplication(ap.id, ap.status)}
                        className="min-h-[42px] rounded-full border border-[var(--border-hairline)] px-3.5 text-xs font-semibold text-[var(--ink-karadeniz)]"
                      >
                        Notu Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForwardApplication(ap.id)}
                        className="inline-flex min-h-[42px] items-center gap-1 rounded-full bg-[var(--accent-yosun)] px-3.5 text-xs font-semibold text-white"
                      >
                        <Send className="h-3 w-3" />
                        Bakımevine İlet
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end border-t border-[var(--border-hairline)] pt-3">
                    {confirmDeleteAppId === ap.id ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[var(--accent-kalp)]">
                          Kişisel veriler kalıcı silinsin mi?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteApplicationKvkk(ap.id)}
                          className="rounded-full bg-[var(--accent-kalp)] px-3 py-1.5 font-semibold text-white"
                        >
                          Evet, KVKK Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAppId(null)}
                          className="rounded-full border border-[var(--border-hairline)] px-3 py-1.5"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAppId(ap.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-kalp)] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        KVKK Kişisel Verileri Sil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== TAB 5: SEO & GUIDES ==================== */}
      {activeTab === 'seo' && isAdmin && (
        <section className="py-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-2">
            <button
              type="button"
              onClick={() => selectSeoPage('new')}
              className={`w-full min-h-[44px] rounded-[10px] border px-4 py-2.5 text-left text-xs font-semibold ${
                selectedSeoId === 'new'
                  ? 'border-[var(--accent-kalp)] bg-[var(--accent-kalp)] text-white'
                  : 'border-[var(--border-hairline)] bg-[var(--surface-beyaz)] text-[var(--ink-karadeniz)]'
              }`}
            >
              + Yeni Rehber / SEO Sayfası
            </button>
            {seoPages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectSeoPage(p.id)}
                className={`w-full rounded-[10px] border p-3 text-left transition-colors ${
                  selectedSeoId === p.id
                    ? 'border-[var(--accent-kalp)] bg-[var(--surface-beyaz)]'
                    : 'border-[var(--border-hairline)] bg-[var(--surface-beyaz)]/70'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  {p.page_type} · /{p.slug}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--ink-karadeniz)]">
                  {p.h1_title}
                </p>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSaveSeoPage}
            className="lg:col-span-8 rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
              {selectedSeoId === 'new' ? 'Yeni SEO / Rehber Sayfası' : `Düzenle: /${seoForm.slug}`}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">Slug</label>
                <input
                  type="text"
                  required
                  disabled={selectedSeoId !== 'new'}
                  value={seoForm.slug}
                  onChange={(e) => setSeoForm({ ...seoForm, slug: e.target.value })}
                  placeholder="orn-barinak-rehberi"
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Sayfa Tipi</label>
                <select
                  disabled={selectedSeoId !== 'new'}
                  value={seoForm.page_type}
                  onChange={(e) =>
                    setSeoForm({ ...seoForm, page_type: e.target.value as SeoPageType })
                  }
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs disabled:opacity-60"
                >
                  <option value="guide">Rehber (/rehber/[slug])</option>
                  <option value="intent_landing">Satın Alma Sahiplen İniş</option>
                  <option value="local_seo">Yerel SEO Sayfası</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">H1 Başlık</label>
                <input
                  type="text"
                  required
                  value={seoForm.h1_title}
                  onChange={(e) => setSeoForm({ ...seoForm, h1_title: e.target.value })}
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">Slogan</label>
                <input
                  type="text"
                  value={seoForm.slogan}
                  onChange={(e) => setSeoForm({ ...seoForm, slogan: e.target.value })}
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Meta Title</label>
                <input
                  type="text"
                  required
                  value={seoForm.meta_title}
                  onChange={(e) => setSeoForm({ ...seoForm, meta_title: e.target.value })}
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Filtre Ön Ayarı (JSON)</label>
                <input
                  type="text"
                  value={seoForm.filter_preset}
                  onChange={(e) => setSeoForm({ ...seoForm, filter_preset: e.target.value })}
                  placeholder='{"species":"kopek"}'
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 font-mono text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">Meta Description</label>
                <input
                  type="text"
                  value={seoForm.meta_description}
                  onChange={(e) => setSeoForm({ ...seoForm, meta_description: e.target.value })}
                  className="mt-1 w-full min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">İçerik (Markdown)</label>
                <textarea
                  rows={8}
                  required
                  value={seoForm.body_md}
                  onChange={(e) => setSeoForm({ ...seoForm, body_md: e.target.value })}
                  className="mt-1 w-full rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3 font-mono text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold">SSS JSON ([&#123;&quot;q&quot;,&quot;a&quot;&#125;])</label>
                <textarea
                  rows={3}
                  value={seoForm.faq_json}
                  onChange={(e) => setSeoForm({ ...seoForm, faq_json: e.target.value })}
                  className="mt-1 w-full rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] p-3 font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={seoForm.is_published}
                  onChange={(e) => setSeoForm({ ...seoForm, is_published: e.target.checked })}
                />
                Yayında
              </label>
              <button
                type="submit"
                className="min-h-[44px] rounded-full bg-[var(--accent-kalp)] px-6 text-xs font-semibold text-white"
              >
                Kaydet
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ==================== TAB 6: USERS, 2FA & AUDIT ==================== */}
      {activeTab === 'users' && (
        <section className="py-6 space-y-6">
          {/* Own TOTP 2FA Setup */}
          <div className="rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                  <KeyRound className="h-5 w-5 text-[var(--accent-kalp)]" />
                  İki Adımlı Doğrulama (TOTP 2FA)
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Hesap durumunuz:{' '}
                  <strong className="text-[var(--ink-karadeniz)]">
                    {currentUser.totp_enabled ? 'Etkin' : 'Henüz kurulmadı'}
                  </strong>
                </p>
              </div>
              {!totpEnrollSecret && (
                <button
                  type="button"
                  onClick={handleStartTotpEnroll}
                  className="min-h-[44px] rounded-full bg-[var(--ink-karadeniz)] px-5 text-xs font-semibold text-[var(--surface-beyaz)]"
                >
                  {currentUser.totp_enabled ? '2FA Anahtarını Yenile' : '2FA Kurulumunu Başlat'}
                </button>
              )}
            </div>

            {totpEnrollSecret && (
              <div className="mt-5 grid gap-5 border-t border-[var(--border-hairline)] pt-5 sm:grid-cols-2 items-center">
                <div className="space-y-2">
                  {totpQrDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={totpQrDataUrl}
                      alt="2FA TOTP QR kodu"
                      className="h-44 w-44 rounded-[8px] border border-[var(--border-hairline)] bg-white p-2"
                    />
                  )}
                  <p className="text-xs text-[var(--ink-muted)]">
                    Manuel Base32 Anahtar:{' '}
                    <code className="font-mono font-bold text-[var(--ink-karadeniz)]">
                      {totpEnrollSecret}
                    </code>
                  </p>
                </div>
                <form onSubmit={handleVerifyTotpEnroll} className="space-y-3">
                  <label className="block text-xs font-semibold text-[var(--ink-karadeniz)]">
                    Authenticator uygulamanızdaki 6 haneli kodu girin:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full min-h-[44px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-sm tracking-widest"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-full bg-[var(--accent-yosun)] px-5 text-xs font-semibold text-white"
                  >
                    Doğrula ve Etkinleştir
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Admin-only User Management & Audit Log */}
          {isAdmin && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6 rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5 space-y-5">
                <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                  Yetkili Kullanıcılar
                </h2>

                <form onSubmit={handleCreateUser} className="grid gap-3 sm:grid-cols-2 border-b border-[var(--border-hairline)] pb-5">
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                  />
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="E-posta"
                    className="min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                  >
                    <option value="editor">Saha Gönüllüsü (Editör)</option>
                    <option value="approver">Veteriner Onaylayıcı</option>
                    <option value="admin">Yönetici</option>
                  </select>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Geçici parola (min 8)"
                    className="min-h-[42px] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 text-xs"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 min-h-[42px] rounded-full bg-[var(--accent-kalp)] px-4 text-xs font-semibold text-white"
                  >
                    Kullanıcı Ekle
                  </button>
                </form>

                <div className="space-y-2.5">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[var(--ink-karadeniz)]">{u.name}</p>
                        <p className="text-[var(--ink-muted)]">
                          {u.email} · {ROLE_LABELS[u.role]} {u.totp_enabled ? '· 2FA Açık' : ''}
                        </p>
                      </div>
                      {u.id !== currentUser.id && (
                        confirmDeleteUserId === u.id ? (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="rounded-full bg-[var(--accent-kalp)] px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUserId(null)}
                              className="rounded-full border border-[var(--border-hairline)] px-2.5 py-1 text-[11px]"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUserId(u.id)}
                            className="text-[var(--accent-kalp)] hover:underline"
                          >
                            Kaldır
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 rounded-[16px] border border-[var(--border-hairline)] bg-[var(--surface-beyaz)] p-5">
                <h2 className="font-display text-lg font-semibold text-[var(--ink-karadeniz)]">
                  Son Denetim Kayıtları (Audit Log)
                </h2>
                <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--surface-sis)] px-3 py-2 text-xs"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-[var(--ink-karadeniz)]">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          {log.at.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                        {log.entity}: {log.entity_id}
                        {log.detail ? ` — ${log.detail}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
