# Pati Kalbi: Sanal Barınak — Web Sitesi Şartnamesi (Tasarım + Backend)

Bu belge, ÜNİDES başvurusunda taahhüt edilen "Pati Kalbi" sanal barınak web sitesinin tasarımını ve arka yüzünü tarif eder. Amaç, 2. haftada (08–14 Mart 2027) siteyi kurmak, 3.–4. haftada 60–80 hayvanın profilini girmek, 5. haftada yayına almaktır.

> Not: Bu belgedeki fiyat, süre ve teknoloji seçimleri öneridir. Hukuki metinler (KVKK aydınlatma ve açık rıza) belediye, üniversite hukuk birimi veya konuyu bilen biri tarafından gözden geçirilmelidir.

---

## 1. Kapsam ve ilkeler

**Site ne yapar:** Bakımevindeki hayvanları profesyonel fotoğraf ve dürüst karakter bilgisiyle tanıtır, sahiplenmek isteyenlerden ön başvuru toplar ve başvuruyu bakımevine iletir.

**Site ne yapmaz:**
- Sahiplendirme kararı vermez, hayvan teslim etmez. Karar ve teslim, bakımevi ve belediyenin usulüne göre yürür.
- Ödeme veya bağış almaz.
- Hayvan satışına yönlendirmez. Slogan: **Satın Alma, Sahiplen.**

**Ürün ilkeleri:**
1. Fotoğraf ana içeriktir; arayüz geri çekilir.
2. Dürüstlük: mizaç bilgisi gözleme dayanır ve sitede bunu söyleriz. Hayvanı olduğundan iyi göstermeyiz.
3. Az veri: başvuru formu yalnızca gerekli bilgiyi ister.
4. Türkçe karakterler (ğ, ş, ı, İ, ö, ü, ç) her yerde sorunsuz çalışır.
5. Kod açık kaynaktır; fotoğraf hakları ayrı yönetilir (bkz. bölüm 12).

**Başarı ölçütleri (form hedefleriyle uyumlu):**

| Ölçüt | Hedef |
|---|---|
| Yayındaki hayvan profili | 60–80 |
| Sahiplendirme ön başvurusu | en az 30 (proje süresi içinde) |
| Çevrim içi tekil ziyaretçi | 3.000 hedeflenmektedir |
| Mobil kullanılabilirlik | Tüm akışlar 360 px genişlikte kesintisiz |
| Erişilebilirlik | WCAG 2.1 AA'yı hedefler |

---

## 2. Kullanıcılar ve roller

| Rol | Kim | Ne yapabilir |
|---|---|---|
| Ziyaretçi | Herkes | Hayvanları gezer, filtreler, ön başvuru yapar |
| Editör | GEFOK gönüllüsü | Hayvan ekler/düzenler, fotoğraf yükler, onaya gönderir |
| Onaylayıcı | Bakımevi veteriner hekimi veya yetkilisi | Hayvan bilgisini ve mizaç kartını onaylar |
| Yönetici | Proje koordinatörü | Her şeyi yönetir, kullanıcı ekler, başvuruları bakımevine iletir |

**Kural:** Veteriner/bakımevi onayı olmayan hayvan yayına çıkamaz.

---

## 3. Sayfalar ve adresler

| Sayfa | Adres | Amaç |
|---|---|---|
| Ana sayfa | `/` | Yüz Duvarı, sayaç, nasıl çalışır |
| Can dostları | `/can-dostlari` | Liste ve filtreler |
| Profil | `/can-dostlari/{slug}` | Hayvanın tüm bilgisi ve ön başvuru |
| Nasıl sahiplenilir | `/nasil-sahiplenilir` | Süreç (gerçek bir sıra olduğu için numaralı) |
| Proje hakkında | `/hakkinda` | Proje, GEFOK, paydaşlar, açık kaynak bağlantısı |
| Sık sorulanlar | `/sss` | Kısa cevaplar |
| Aydınlatma metni | `/kvkk` | KVKK aydınlatma |
| Gizlilik ve çerezler | `/gizlilik` | Çerezsiz analitik açıklaması |
| Yönetim | `/yonetim` | Giriş sonrası panel (arama motorlarına kapalı) |

---

## 4. Tasarım sistemi

### 4.1 Fikir: "Yüz Duvarı"

Ana sayfanın ilk ekranı bir paragraf değil, **hayvanların yüzleridir**: aynı boyda, göz hizasında portrelerden oluşan yatay bir şerit. Altında tek cümle ve bir sayaç. Site fotoğrafçılık kulübünden çıktığı için en karakteristik şey fotoğrafın kendisidir.

Cesaret tek yerde harcanır: **Yüz Duvarı**. Geri kalan her şey sakin ve disiplinlidir.

```
┌──────────────────────────────────────────────┐
│ Pati Kalbi                      Can dostları │
├──────────────────────────────────────────────┤
│ [portre][portre][portre][portre][portre] →   │  ← Yüz Duvarı (kaydırılır)
│                                              │
│ Şu an yuva bekleyen 74 can dostu var.        │
│ Satın alma, sahiplen.                        │
│ [ Can dostlarını gör ]                       │
├──────────────────────────────────────────────┤
│ Nasıl çalışır?  1 Gez → 2 Ön başvur → 3 …    │
└──────────────────────────────────────────────┘
```

### 4.2 Renk

| Ad | Hex | Kullanım |
|---|---|---|
| Sis | `#EEF2F3` | Sayfa zemini |
| Beyaz | `#FFFFFF` | Form ve panel yüzeyi |
| Karadeniz | `#0F2E3A` | Metin, başlık, koyu bölümler |
| Kalp | `#C9223F` | Ana eylem düğmesi, kalp simgesi (beyaz metinle yaklaşık 5,5:1) |
| Yosun | `#2F7D6B` | Onay, "yuvaya kavuştu" (beyaz üstünde yaklaşık 4,9:1) |
| Kehribar | `#F2B33D` | "Yeni" ve uyarı etiketi zemini; üzerinde her zaman Karadeniz metin |

Kontrast değerleri hesapla bulundu; uygularken tarayıcı geliştirici araçlarıyla doğrulayın. Anlam yalnızca renkle verilmez: durum etiketlerinde her zaman metin vardır.

### 4.3 Yazı tipi

| Rol | Yazı tipi | Not |
|---|---|---|
| Başlıklar | Bricolage Grotesque (yedek: Source Sans 3 Bold) | Türkçe karakter testi zorunlu |
| Metin | Source Sans 3 | 16 px, satır aralığı 1,55 |

- Yazı tipleri **sunucudan kendi alan adınızla** yayınlanır (self-host). Google Fonts'a doğrudan bağlanmak ziyaretçi IP'sinin Google'a gitmesi demektir.
- Ölçek: 14 / 16 / 20 / 28 / 40 / 56. Satır uzunluğu 80 karakteri geçmez.
- Etiketlerde BÜYÜK HARF, başlık üstünde gereksiz küçük etiket kullanılmaz. Cümle düzeni kullanılır.

### 4.4 Şekil ve aralık

- Fotoğraflar **keskin köşeli** (2 px), baskı gibi durur. Düğme ve form alanları **hap biçimli** (tam yuvarlak). Hiyerarşi şekilden okunur; her şey aynı yuvarlaklıkta olmaz.
- Boşluk birimi 8 px (8 / 16 / 24 / 40 / 64).
- Profil ve liste öğeleri kutu içine alınmaz; fotoğraf, altında ad ve iki satır bilgi. Gölge yok, ince çizgi yok.
- Fotoğraf oranı **4:5 (dikey portre)**. Kapak fotoğrafı göz hizasında kadrajlanır.

### 4.5 Ana bileşenler

**Hayvan karosu (liste):** Fotoğraf, ad, "2 yaş · dişi · orta boy" gibi tek satır, durum etiketi (Yeni / İlgi var / Yuvaya kavuştu).

**Mizaç göstergesi (profilin imza öğesi):** Beş boyut, her biri 5 noktalı skala:

| Boyut | 1 | 5 |
|---|---|---|
| Enerji | Sakin | Çok hareketli |
| İnsanlara yaklaşım | Çekingen | Çok girişken |
| Çocuklarla uyum | Henüz denenmedi / Zor | Çok iyi |
| Diğer hayvanlarla uyum | Zor | Çok iyi |
| Yalnız kalabilme | Zor | Rahat |

- Dolu noktalar Karadeniz, boşlar açık gri. Her satırın yanında okunabilir "4/5" metni ve ekran okuyucu için `aria-label` bulunur.
- Altında sabit uyarı: *"Mizaç bilgisi, bakımevi personeli ve gönüllülerin gözlemine dayanır. Kesin değildir; tanışarak netleşir."*
- "Denenmedi" seçeneği vardır. Bilmediğimiz şeyi 3/5 diye uydurmayız.

**"Nasıl bir yuvaya uyar?":** En fazla 200 karakterlik serbest cümle.

**Sağlık etiketleri:** Aşılı, kısırlaştırılmış, çipli. Veri yoksa etiket gösterilmez; "bilinmiyor" yazılır.

**Filtre çubuğu:** Tür, cinsiyet, boy, yaş grubu, "çocuklarla uyumlu", "diğer hayvanlarla uyumlu", "apartmana uygun". Mobilde alttan açılan panel; aktif filtreler üstte silinebilir etiket olarak durur.

**Durum etiketleri:** Yeni (Kehribar), İlgi var (Karadeniz çerçeveli), Yuvaya kavuştu (Yosun). "Yuvaya kavuştu" profilleri 30 gün görünür kalır; hem umut verir hem dürüst bir sonuç gösterir.

### 4.6 Ekran taslakları

**Profil (masaüstü):**

```
┌──────────────────────────────────────────────────────┐
│ ← Tüm can dostları                                   │
├────────────────────────┬─────────────────────────────┤
│                        │ Pamuk                       │
│     [ büyük portre ]   │ 2 yaş · dişi · orta boy     │
│        4:5             │ Aşılı · kısır · çipli       │
│                        │                             │
│ [küçük][küçük][küçük]  │ Karakter                    │
│                        │ Enerji            ●●●○○ 3/5 │
│                        │ İnsanlara yaklaşım ●●●●● 5/5│
│                        │ Çocuklarla uyum   ●●●●○ 4/5 │
│                        │ Diğer hayvanlar   ●●○○○ 2/5 │
│                        │ Yalnız kalabilme  ●●●○○ 3/5 │
│                        │                             │
│                        │ Nasıl bir yuvaya uyar?      │
│                        │ Sakin bir evde, ilgili biri…│
│                        │                             │
│                        │ [ ♥ Ön başvuru yap ]        │
└────────────────────────┴─────────────────────────────┘
```

**Mobil:** Fotoğraf tam genişlik, altında ad ve etiketler, ardından mizaç, ardından sabit alt çubukta "Ön başvuru yap" düğmesi.

### 4.7 Hareket

- Tek yönlendirilmiş an: sayfa açılınca Yüz Duvarı portreleri soldan sağa 60 ms arayla yerine oturur (toplam en fazla 600 ms).
- Diğer hareketler yalnızca kullanıcı eylemine yanıttır: filtre paneli açılır, form gönderildi onayı.
- `prefers-reduced-motion` açıksa hareket tamamen kapanır.

### 4.8 Erişilebilirlik (taban gereksinimler)

- Klavye ile tüm akış kullanılabilir; odak halkası her zaman görünür (2 px Kalp rengi, 2 px boşlukla).
- Her fotoğrafta anlamlı `alt` metni **zorunludur** (panel boş bırakmaya izin vermez). Örnek: "Beyaz tüylü, kulakları kıvrık bir köpek kameraya bakıyor."
- Dokunma hedefleri en az 44×44 px.
- Form hataları alanın yanında ve özet olarak verilir; renk tek başına anlam taşımaz.

### 4.9 Mikro metin

Dil: sade, etken, cümle düzeni. Bir eylem akış boyunca aynı adı taşır.

| Yer | Metin |
|---|---|
| Ana düğme (profil) | Ön başvuru yap |
| Form başlığı | Pamuk için ön başvuru |
| Gönder düğmesi | Ön başvuruyu gönder |
| Başarı | Ön başvurun gönderildi. Bakımevi seninle iletişime geçecek. |
| Boş filtre sonucu | Bu filtrelere uyan can dostu yok. Filtreleri gevşet ya da tümünü gör. |
| Hata (telefon) | Telefon numarası eksik görünüyor. Başında 0 olmadan 10 hane yaz. |
| Hata (genel) | Başvuru gönderilemedi. İnternetini kontrol edip tekrar dene; sorun sürerse bize yaz. |
| Yuvaya kavuşmuş | Pamuk yuvasına kavuştu. |

### 4.10 Fotoğraf standardı (GEFOK çekim kuralı)

- Göz hizasında, doğal ışıkta veya yumuşak sürekli ışıkta; flaş yok.
- Kapak: yüz net, 4:5, hayvanın bakışı veya ruh hali anlaşılır.
- Her hayvan için en az 3, en çok 8 fotoğraf: yüz, tam boy, ve karakteri gösteren bir an.
- Kafes teli arkasından çekimden kaçınılır; mümkünse çekim alanına çıkarılarak yapılır (bakımevi izniyle).

---

## 5. Mimari

### 5.1 Önerilen: PocketBase + Astro

Form, "hazır açık kaynak altyapı" diyor ve kurulum için tek hafta var. PocketBase tek bir çalıştırılabilir dosyada veritabanı, yönetim paneli, kullanıcı girişi, dosya yükleme ve API sağlar. Böylece kendi yönetim panelimizi sıfırdan yazmayız.

```
Ziyaretçi ──► Astro (sayfalar, SEO, filtre arayüzü)
                  │  (okuma)
                  ▼
              PocketBase  ◄── Yönetim paneli (editör, onaylayıcı, yönetici)
              ├─ SQLite veritabanı
              ├─ Fotoğraf depolama
              └─ E-posta (SMTP)
```

- **Barındırma:** Küçük bir sanal sunucu (VPS) veya eşdeğer; HTTPS otomatik sertifika. Alan adı + 12 ay barındırma bütçedeki 8.1 kalemi (5.500 TL) içinde kalmalıdır; teklif alınca doğrulayın.
- **Ön yüz:** Astro ile üretilir; hayvan sayfaları sunucu tarafında oluşturulur (hızlı ve arama motoru dostu), filtreleme küçük bir JavaScript adasıyla yapılır.
- **Kod deposu:** Herkese açık GitHub deposu, **MIT** lisansı (fotoğraflar hariç).

### 5.2 Alternatif: Cloudflare (Pages + Workers + D1 + R2)

Ücretsiz katman geniştir ve sunucu bakımı yoktur. Ancak yönetim paneli sıfırdan yazılır; 1 haftalık kurulum için riskli. Panel hazır bir araçla (ör. ayrı bir yönetim kütüphanesi) çözülüyorsa uygun olur.

| | PocketBase + Astro | Cloudflare |
|---|---|---|
| Yönetim paneli | Hazır | Yazılacak |
| Kurulum süresi | Kısa | Daha uzun |
| Bakım | Sunucu güncellemesi gerekir | Neredeyse yok |
| Maliyet | VPS ücreti | Çoğunlukla ücretsiz katman |
| Önerilen mi | **Evet (bu proje için)** | Panel hazırsa |

### 5.3 Ortamlar

`geliştirme` (yerel) → `deneme` (gizli adres, test verisi) → `canlı`. Canlıya geçiş yalnızca koordinatör onayıyla.

---

## 6. Veri modeli

Aşağıdaki şema SQLite diline yakındır; PocketBase'de aynı alanlar koleksiyon olarak tanımlanır.

```sql
CREATE TABLE shelters (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  municipality  TEXT NOT NULL,
  contact_email TEXT NOT NULL,   -- ön başvuruların iletileceği adres
  contact_phone TEXT
);

CREATE TABLE animals (
  id               TEXT PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  shelter_id       TEXT NOT NULL REFERENCES shelters(id),
  name             TEXT NOT NULL,
  species          TEXT NOT NULL CHECK (species IN ('kedi','kopek')),
  sex              TEXT NOT NULL CHECK (sex IN ('disi','erkek','bilinmiyor')),
  age_months_est   INTEGER,                       -- tahmini yaş (ay)
  size             TEXT CHECK (size IN ('kucuk','orta','buyuk')),
  -- sağlık (NULL = bilinmiyor)
  vaccinated       INTEGER, neutered INTEGER, microchipped INTEGER,
  health_note      TEXT,
  -- mizaç (1–5, NULL = henüz denenmedi)
  t_energy         INTEGER, t_people INTEGER, t_children INTEGER,
  t_animals        INTEGER, t_alone  INTEGER,
  apartment_ok     INTEGER,
  story            TEXT,                          -- en çok 600 karakter
  ideal_home       TEXT,                          -- en çok 200 karakter
  status           TEXT NOT NULL DEFAULT 'taslak'
                   CHECK (status IN ('taslak','onay_bekliyor','yayinda',
                                     'ilgi_var','yuvaya_kavustu','arsiv')),
  vet_approved_by  TEXT,
  vet_approved_at  TEXT,
  created_by       TEXT, created_at TEXT, updated_at TEXT, published_at TEXT
);

CREATE TABLE photos (
  id         TEXT PRIMARY KEY,
  animal_id  TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  file_key   TEXT NOT NULL,
  width INTEGER, height INTEGER,
  alt_text   TEXT NOT NULL,                       -- zorunlu
  credit     TEXT,                                -- fotoğrafçı adı
  is_cover   INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE applications (
  id            TEXT PRIMARY KEY,
  animal_id     TEXT NOT NULL REFERENCES animals(id),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  city          TEXT NOT NULL,
  housing_type  TEXT,                             -- apartman / müstakil / bahçeli
  has_children  INTEGER, has_pets INTEGER,
  experience    TEXT,                             -- en çok 300 karakter
  motivation    TEXT,                             -- en çok 500 karakter
  consent_at    TEXT NOT NULL,                    -- aydınlatma metni onay zamanı
  status        TEXT NOT NULL DEFAULT 'yeni'
                CHECK (status IN ('yeni','bakimevine_iletildi','gorusme',
                                  'yuvaya_kavustu','sonuclanmadi','vazgecti')),
  internal_note TEXT,
  created_at    TEXT, forwarded_at TEXT, delete_after TEXT   -- saklama süresi
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY, user_id TEXT, action TEXT, entity TEXT,
  entity_id TEXT, at TEXT
);
```

**Kurallar:**
- `status = 'yayinda'` yalnızca `vet_approved_at` doluysa mümkündür.
- Her hayvanda en az 1 fotoğraf ve `is_cover = 1` olan tam 1 fotoğraf bulunur.
- Bir hayvan için birden fazla başvuru gelebilir; ilk başvuru hayvanı yayından kaldırmaz, yalnızca `ilgi_var` olur.
- Kişisel veri içeren başvurular `delete_after` tarihinde (öneri: sonuçlanmadan 12 ay sonra) otomatik silinir.

---

## 7. API

**Herkese açık (okuma):**

| Uç nokta | Açıklama |
|---|---|
| `GET /api/animals` | Liste. Sorgu: `species, sex, size, age, kids, pets, apartment, energy, status, q, sort, page` |
| `GET /api/animals/{slug}` | Tek profil, fotoğraflar dahil |
| `GET /api/stats` | Yayındaki sayısı, ilgi gören, yuvaya kavuşan |
| `POST /api/applications` | Ön başvuru gönder |

`GET /api/animals` yalnızca `yayinda`, `ilgi_var` ve son 30 günün `yuvaya_kavustu` kayıtlarını döndürür. Başvuru yapanların kişisel verisi hiçbir herkese açık uçta yer almaz.

**Yönetim (giriş gerekir):**

| Uç nokta | Rol |
|---|---|
| `POST/PATCH/DELETE /api/admin/animals` | Editör, Yönetici |
| `POST /api/admin/animals/{id}/photos` | Editör, Yönetici |
| `POST /api/admin/animals/{id}/submit` (onaya gönder) | Editör |
| `POST /api/admin/animals/{id}/approve` | Onaylayıcı, Yönetici |
| `GET /api/admin/applications` | Yönetici |
| `PATCH /api/admin/applications/{id}` (durum, not) | Yönetici |
| `POST /api/admin/applications/{id}/forward` (bakımevine e-posta) | Yönetici |
| `GET /api/admin/export.csv` (kişisel veri içermeyen sayılar) | Yönetici |

**Doğrulama ve sınırlar:**
- Telefon: Türkiye biçimi (10 hane, başında 0 olmadan veya +90). E-posta: biçim kontrolü. Metin uzunlukları şemadaki sınırlarla aynı.
- `POST /api/applications`: aynı kişiden saatte en çok 3 istek; görünmez bal tuzağı alanı (honeypot) ve bot doğrulaması (Cloudflare Turnstile gibi çerezsiz bir çözüm). IP adresi kalıcı saklanmaz.
- Tüm veri sunucuda yeniden doğrulanır; yalnızca ön yüze güvenilmez.

---

## 8. Ön başvuru akışı

```
Ziyaretçi ► Profil ► "Ön başvuru yap" ► Form + aydınlatma onayı
   ► Sunucu doğrular ► Kaydeder ► Ziyaretçiye "gönderildi" e-postası
   ► Yönetici panelde görür ► "Bakımevine ilet" ► Bakımevi e-postası
   ► Bakımevi/belediye kendi usulüyle sonuçlandırır
   ► Yönetici sonucu panelde işler (yuvaya kavuştu / sonuçlanmadı / vazgeçti)
```

**Form alanları:** Ad soyad, telefon, e-posta, şehir, konut tipi, evde çocuk var mı, evde başka hayvan var mı, daha önce hayvan baktı mı (kısa), neden bu can dostu (kısa), aydınlatma metni onay kutusu.

**Onay metni taslağı (hukuki gözden geçirme gerekir):**
> Kişisel verilerimin, ön başvurumun değerlendirilmesi için Gerze Belediyesi bakım evine iletilmesine ilişkin aydınlatma metnini okudum ve anladım.

**Bakımevine giden e-posta:** Hayvan adı ve bağlantısı, başvuranın bilgileri ve motivasyon metni. Başvuru bilgileri başka bir yere gönderilmez.

**Açık nokta:** Veri sorumlusu kim olacak (belediye mi, GEFOK/üniversite mi)? Aydınlatma metni buna göre yazılır. Bakımevi ve belediye ile bu konu yazılı netleştirilmelidir.

---

## 9. Yönetim paneli

**Ekranlar:**
1. **Hayvan listesi:** Durum filtresiyle; "onay bekleyenler" üstte.
2. **Hayvan düzenle:** Temel bilgi, mizaç alanları (5 kaydırıcı + "denenmedi"), sağlık, hikâye ve yuva cümlesi, fotoğraf yükleme.
3. **Onay ekranı:** Onaylayıcı için hayvanın yayındaki halinin önizlemesi ve tek düğmeli "Onayla / Düzeltme iste".
4. **Başvuru kutusu:** Yönetici için; durum değiştirme, not, bakımevine iletme.
5. **Kullanıcılar:** Rol atama, iki adımlı doğrulama zorunlu (yönetici ve onaylayıcı için).

**Fotoğraf yükleme kuralları:**
- Tarayıcıda yeniden boyutlandırılır: 400, 800, 1200 px genişlik; WebP biçimi.
- EXIF bilgisi (konum, cihaz) **silinir**.
- Alt metin boş geçilemez; fotoğrafçı adı alanı vardır.
- En fazla 8 fotoğraf, her biri en fazla 10 MB (yükleme öncesi sıkıştırılmış hâli çok daha küçük olur).

**Toplu giriş:** Sahada tablet/telefonla kayıt tutulacağı için, panelin telefonda kullanılabilir olması şarttır. İsteğe bağlı: CSV ile mizaç kartlarını toplu içe aktarma (fotoğraflar ayrıca yüklenir).

---

## 10. Güvenlik, gizlilik, yedek

- Her yerde HTTPS; güvenlik başlıkları (CSP, X-Content-Type-Options, Referrer-Policy).
- Panel giriş denemelerine hız sınırı; yönetici ve onaylayıcıda 2FA.
- Analitik: çerezsiz ve kişisel veri toplamayan bir araç (ör. Plausible veya Umami). Böylece çerez onay çubuğu gerekmez. Üçüncü taraf takip betiği yok.
- Yazı tipleri ve görseller kendi alan adından sunulur.
- Yedek: veritabanı günlük, fotoğraflar haftalık, en az iki ayrı yere. Proje bitmeden **bir kez geri yükleme denemesi** yapılır.
- Çalışma izleme: ücretsiz bir uptime kontrolü, hata e-postası.
- Kişisel veri silme: başvuran silme isteyince panelden tek tıkla silinir; `delete_after` ile otomatik silme çalışır.

---

## 11. Performans ve SEO

- Hedef: 4G'de LCP 2,5 sn altı; ana sayfada JavaScript 100 KB (sıkıştırılmış) altı.
- Görseller: `srcset` (400/800/1200 w), `loading="lazy"` (ilk ekran hariç), net `width/height` (yer kayması yok).
- Her profilin kendi başlığı, açıklaması ve **paylaşım görseli** (Open Graph) vardır; WhatsApp'ta paylaşınca güzel görünür. Bu sitenin en önemli yayılma yolu paylaşımdır.
- `sitemap.xml` ve `robots.txt`; `/yonetim` indekslenmez.
- Sayfa dili `lang="tr"`.

---

## 12. Fotoğraf hakları ve açık kaynak

- **Kod:** Açık kaynak (MIT).
- **Fotoğraflar:** Hakları çeken öğrencide kalır. Her fotoğrafçıdan, fotoğrafın bu sitede ve proje tanıtımında kullanılmasına dair kısa **yazılı izin** alınır.
- Bakımevi ve belediyeden, hayvanların fotoğraflarının yayınlanmasına dair izin yazısı alınır (proje öncesi yazışmalara eklenir).
- Sitede alt bilgi: "Kod açık kaynaktır. Fotoğrafların hakları fotoğrafçılarına aittir."

---

## 13. Test planı

| Alan | Ne denenir |
|---|---|
| İşlev | Filtreler, profil, form gönderme, e-posta düşmesi, durum geçişleri |
| Kural | Onaysız hayvan yayına çıkamaz; kişisel veri herkese açık uçta görünmez |
| Mobil | 360, 390, 768 px; gerçek bir Android ve bir iPhone ile |
| Erişilebilirlik | Klavye ile tüm akış, ekran okuyucu ile bir profil ve bir form |
| Türkçe | İ, ı, ğ, ş içeren ad ve metinlerle arama ve sıralama |
| Yük | Aynı anda 50 ziyaretçi ile liste ve profil |
| Güvenlik | Form spam denemesi, yetkisiz uç nokta çağrısı |
| Kullanıcı | 3 kişiyle (kulüp dışından) "bir hayvan bul ve ön başvuru yap" denemesi |

---

## 14. Uygulama takvimi (proje takvimiyle uyumlu)

| Hafta | Sitede yapılacak |
|---|---|
| 2 (08–14 Mart; bayram haftası, çevrim içi çalışma) | Sunucu ve alan adı, depo, tasarım sistemi (renk, yazı, bileşenler), veri modeli, yönetim paneli ve roller, 5 örnek hayvan, ön başvuru formu, aydınlatma metni taslağı |
| 3 (15–21 Mart; saha çekimleri) | Her çekim günü sonunda o günün hayvanlarını panele girme; mizaç kartları veteriner onayına gider |
| 4 (22–28 Mart) | Kalan girişler, fotoğraf düzenlemeleri, test planı, mobil ve erişilebilirlik düzeltmeleri, yedek denemesi |
| 5 (29 Mart–4 Nisan) | Canlıya geçiş, lansman, paylaşım görselleri, ön başvuruların bakımevine iletilmesi, sonuç raporu için veri |

---

## 15. Kabul ölçütleri (bitti sayılma şartları)

1. 60–80 hayvan profili yayında; her biri veteriner/bakımevi onaylı.
2. Telefonda ilk ekrandan ön başvuruya kadar sorunsuz akış.
3. Ön başvuru, hem başvurana hem bakımevine e-posta olarak ulaşıyor.
4. Aydınlatma metni yayında ve formdaki onay kutusu zorunlu.
5. Hiçbir herkese açık uçta kişisel veri yok.
6. Tüm fotoğraflarda alt metin ve EXIF temizliği tamam.
7. Yedek alınıyor ve bir kez geri yüklenebildiği denendi.
8. Kod deposu herkese açık ve kurulum rehberi (README) yazılmış.

---

## 16. Açık kararlar (başlamadan netleşmeli)

- [ ] Veri sorumlusu kim: belediye mi, GEFOK/üniversite mi?
- [ ] Alan adı: örn. `patikalbi...` — müsaitlik ve uzantı kontrolü.
- [ ] Barındırma: PocketBase (VPS) mı, Cloudflare mı? Teklif ve bütçe (8.1 kalemi: 5.500 TL).
- [ ] Onaylayıcı kim: bakımevi veteriner hekimi adı ve e-postası.
- [ ] Sinop'taki bakımevi de eklenecek mi? (Şu an paydaşlar yalnızca Gerze.)
- [ ] Başvuruların gideceği bakımevi e-posta adresi.
- [ ] Öğrenci fotoğrafçıların yazılı izin formu.
- [ ] Bakımevi ve belediyeden fotoğraf yayın izni.
- [ ] Sitenin proje sonrası bakımını kimin yapacağı (GEFOK'ta sorumlu kişi).
