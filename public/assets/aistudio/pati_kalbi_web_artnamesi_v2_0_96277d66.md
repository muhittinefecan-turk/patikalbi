# Pati Kalbi: Sanal Barınak — Web Sitesi Teknik ve Tasarım Şartnamesi (v2.0)

Bu belge, ÜNİDES başvurusu kapsamındaki **"Pati Kalbi"** sanal barınak platformunun yeni nesil web mimarisini, tasarım sistemini, tarayıcı içi 3D/WebAR görüntüleme hattını ve arama motoru hakimiyeti (SEO) stratejisini tanımlar. Amaç; 2. haftada (08–14 Mart 2027) altyapıyı ayağa kaldırmak, 3.–4. haftada 60–80 hayvanın profilini (ve uygun olanların 3D/AR modellerini) girmek, 5. haftada yayına almaktır.

> **Hukuki Not:** Bu belgedeki fiyat, süre ve teknoloji seçimleri uygulama önerisidir. Hukuki metinler (KVKK aydınlatma ve açık rıza) belediye, üniversite hukuk birimi veya konuyu bilen bir uzman tarafından gözden geçirilmelidir.

---

## 1. Kapsam, Manifesto ve İlkeler

**Platform ne yapar:**
- Bakımevindeki can dostlarını profesyonel fotoğraf, dürüst karakter/mizaç bilgisi ve **gerçek ölçekli 3D / WebAR modeliyle** tanıtır.
- Sahiplenmek isteyenlerden yalnızca gerekli veriyi alarak ön başvuru toplar ve başvuruyu bakımevine iletir.
- Google'da evcil hayvan satın alma niyetiyle yapılan aramalarda ("pet al", "köpek satın al", "kedi fiyatları" vb.) organik olarak en üst sıralara çıkıp kullanıcıyı **"Satın Alma, Sahiplen"** bilinciyle barınak profillerine yönlendirir.

**Platform ne yapmaz:**
- Sahiplendirme kararı vermez, hayvan teslim etmez. Resmi karar ve teslim, bakımevi ve belediyenin usulüne göre yürür.
- Ödeme, komisyon veya bağış toplamaz.
- Hayvan satışına yönlendirmez.

**Manifesto ve Slogan Sistemi:**
- **Ana Manifesto:** **Satın Alma, Sahiplen.**
- **Destekleyici Sloganlar (Hero, SEO Kartları, Sosyal Paylaşım Görselleri):**
  - *"Etiketi yok, kalbi var."*
  - *"Vitrinlerden değil, barınaktan."*
  - *"Fiyatı 0 TL, değeri ömürlük."*
  - *"Önce odanda gör, sonra kalbine al."* (3D/WebAR çağrısı)

**Ürün İlkeleri:**
1. Fotoğraf ve 3D deneyim ana içeriktir; arayüz içeriğin önüne geçmez.
2. **Dürüstlük:** Mizaç bilgisi gözleme dayanır ve sitede açıkça belirtilir; hayvan olduğundan farklı gösterilmez.
3. **Az Veri (KVKK):** Başvuru formu yalnızca sahiplendirme ön değerlendirmesi için zorunlu veriyi ister.
4. **Kusursuz Türkçe:** Türkçe karakterler (`ğ, ş, ı, İ, ö, ü, ç`) arama, filtreleme, sıralama ve URL yapısında sorunsuz çalışır.
5. **Açık Kaynak:** Yazılım kodu açık kaynaktır (MIT); fotoğraf ve 3D varlık hakları ayrı yönetilir (bkz. Bölüm 12).

**Başarı Ölçütleri:**

| Ölçüt | Resmi Proje Hedefi | Teknik / Büyüme Hedefi |
|---|---|---|
| Yayındaki hayvan profili | 60–80 | 60–80 (en az %40–60 3D/AR destekli) |
| Sahiplendirme ön başvurusu | En az 30 (proje süresi içinde) | 50+ |
| Çevrim içi tekil ziyaretçi | 3.000 | 10.000+ (SEO iniş sayfalarıyla) |
| Core Web Vitals (Mobil) | LCP < 2,5 sn | LCP < 1,8 sn · Lighthouse SEO & A11y: 100 |
| Mobil ve Erişilebilirlik | 360 px kesintisiz · WCAG 2.1 AA | 360 px + PWA çevrimdışı saha desteği |

---

## 2. Kullanıcılar ve Roller

| Rol | Kim | Yetki |
|---|---|---|
| **Ziyaretçi** | Herkes | Hayvanları gezer, 3D/AR inceler, filtreler, ön başvuru yapar |
| **Editör** | GEFOK gönüllüsü | Hayvan kaydı açar/düzenler, fotoğraf ve 3D model yükler, onaya gönderir |
| **Onaylayıcı** | Bakımevi veteriner hekimi veya yetkilisi | Hayvan bilgisini, sağlık durumunu ve mizaç kartını onaylar |
| **Yönetici** | Proje koordinatörü | Tüm sistemi, SEO sayfalarını, rolleri yönetir; başvuruları bakımevine iletir |

**Kırmızı Çizgi:** Veteriner/bakımevi onayı (`vet_approved_at`) olmayan hiçbir hayvan yayına çıkamaz.

---

## 3. Sayfalar ve URL Mimarisi

| Sayfa | Adres | Amaç ve SEO Rolü |
|---|---|---|
| Ana sayfa | `/` | İnteraktif Yüz Duvarı, canlı sayaç, manifesto, 3D/AR vitrini |
| Can dostları | `/can-dostlari` | Anlık filtreli galeri ve arama |
| Hayvan profili | `/can-dostlari/{slug}` | 4:5 galeri, 3D/AR inceleme, mizaç kartı, ön başvuru |
| Nasıl sahiplenilir | `/nasil-sahiplenilir` | Adım adım yasal süreç ve hazırlık |
| **SEO İniş Sayfaları** | `/kopek-satin-alma-sahiplen`, `/kedi-satin-alma-sahiplen`, `/pet-satin-alma-sahiplen` | Ticari aramaları ("pet al", "köpek fiyatları" vb.) sahiplenmeye çeviren yüksek kaliteli içerik + canlı liste |
| **Yerel SEO Sayfaları** | `/sinop-hayvan-sahiplenme`, `/gerze-barinak-sahiplenme` | Bölgesel aramalarda 1. sıra hedefi |
| **Sahiplenme Rehberi** | `/rehber/{slug}` | Uzun kuyruklu (long-tail) organik trafik makaleleri |
| Proje hakkında | `/hakkinda` | Proje, GEFOK, paydaşlar, açık kaynak bağlantısı |
| Sık sorulanlar | `/sss` | `FAQPage` şemalı zengin sonuç sayfası |
| Aydınlatma metni | `/kvkk` | KVKK aydınlatma metni |
| Gizlilik ve çerezler | `/gizlilik` | Çerezsiz analitik beyanı |
| Yönetim paneli | `/yonetim` | Giriş sonrası yönetim ve saha paneli (`noindex, nofollow`) |

---

## 4. Tasarım Sistemi 2.0 (Editorial + Liquid Glass + Çift Tema)

Site bir fotoğrafçılık kulübünden doğduğu için ana sahne **"Yüz Duvarı"** olarak korunur; ancak modern web etkileşimleri, çift tema (Aydınlık + Gece Karadeniz) ve dokunsal arayüz katmanlarıyla (Liquid Glass) üst seviyeye taşınır.

### 4.1 Hero: İnteraktif "Yüz Duvarı" + Manifesto

Ana sayfanın ilk ekranı bir metin duvarı değil, hayvanların göz hizasında çekilmiş portrelerinden oluşan akıcı, dokunmatik kaydırılabilir (momentum/drag destekli) bir şerittir. Bir portrenin üzerine gelindiğinde (hover) veya odaklanıldığında diğer portreler hafifçe geri çekilir; seçili can dostunun adı, yaşı ve varsa **"3D / Evinde Gör"** rozeti belirir.

```
┌───────────────────────────────────────────────────────────┐
│ Pati Kalbi       Can dostları   Rehber   [☀/☾]  [3D Galeri]│
├───────────────────────────────────────────────────────────┤
│ [portre][portre][portre ★3D][portre][portre]  →           │ ← İnteraktif Yüz Duvarı
│                                                           │
│ Şu an yuva bekleyen 74 can dostu var.                     │
│ Satın alma, sahiplen. Etiketi yok, kalbi var.             │
│                                                           │
│ [ ♥ Can dostlarını gör ]   [ ✦ Odanda 3D dene ]           │
├───────────────────────────────────────────────────────────┤
│ Nasıl çalışır?  1 Gez & 3D Gör → 2 Ön başvur → 3 Tanış    │
└───────────────────────────────────────────────────────────┘
```

### 4.2 Renk Sistemi (Aydınlık + Gece Karadeniz Karanlık Modu)

Varsayılan tema işletim sistemi tercihine (`prefers-color-scheme`) uyar, üst çubuktan tek tıkla değiştirilebilir.

| Rol | Aydınlık Mod (Sis) | Karanlık Mod (Gece Karadeniz) | Kullanım |
|---|---|---|---|
| Zemin | `#EEF2F3` | `#07141A` | Sayfa zemini |
| Yüzey | `#FFFFFF` | `#0F242E` | Kartlar, form ve panel yüzeyi |
| Liquid Glass | `rgba(255,255,255,0.72)` + `blur(20px)` | `rgba(15,36,46,0.68)` + `blur(20px)` | Yüzen üst çubuk, filtre dock'u, 3D/AR kontrol barı |
| Ana Metin | `#0F2E3A` | `#F0F5F6` | Başlık, metin, koyu vurgular |
| Kalp (Birincil CTA) | `#C9223F` | `#E63956` | Ana eylem düğmesi, kalp simgesi, odak halkası |
| Yosun (Başarı) | `#2F7D6B` | `#3DA38B` | Onay ve "Yuvaya kavuştu" etiketi |
| Kehribar (Vurgu) | `#F2B33D` | `#F5BE4F` | "Yeni" ve "3D/AR Hazır" etiketi (metin her zaman `#0F2E3A`) |

*Tüm renk çiftleri WCAG 2.1 AA (en az 4.5:1 metin, 3:1 büyük metin/UI) kontrast oranına göre tarayıcı geliştirici araçlarıyla doğrulanır. Anlam asla yalnızca renkle verilmez.*

### 4.3 Tipografi ve Geometri

- **Başlıklar:** `Bricolage Grotesque` (Variable WOFF2, self-host; yedek: `Source Sans 3 Bold`).
- **Metin ve Arayüz:** `Source Sans 3` (Variable WOFF2, self-host; 16 px, satır aralığı 1,55, Türkçe karakter testi zorunlu).
- **Kendi Sunucundan Yayın:** Google Fonts CDN'e doğrudan bağlanılmaz; yazı tipleri kendi alan adından sunulur (hem hız hem gizlilik).
- **Ölçek ve Şekil:** Tipografi ölçeği `14 / 16 / 20 / 28 / 40 / 56 px`, satır uzunluğu en fazla 80 karakter. Fotoğraflar keskin köşeli (`4 px`, baskı hissi), 3D sahne çerçevesi yumuşak (`16 px`), düğme ve filtre çipleri tam yuvarlak hap biçimli (`9999 px`). Boşluk birimi `8 px`.
- **Fotoğraf Oranı:** `4:5` (dikey portre). Kapak fotoğrafı göz hizasında kadrajlanır.

### 4.4 Yeni Nesil Web Etkileşimleri ve Hareket Dili

- **View Transitions API:** Liste sayfasındaki bir hayvan portresine tıklandığında fotoğraf kopmadan, akıcı biçimde profil sayfasındaki büyük kahraman görseline akar (`view-transition-name: animal-hero-{id}`).
- **Speculation Rules API:** Kullanıcı masaüstünde bir hayvan kartının üzerine geldiğinde veya mobilde duraksadığında, tarayıcı o profil sayfasını arka planda `prerender` / `prefetch` eder; tıklandığında sayfa anında (0 ms hissiyatıyla) açılır.
- **2D / 3D Geçişi:** Profil görsel alanının altında yüzen Liquid Glass hap anahtarı ile tek tıkla **"Fotoğraflar"** ve **"3D / Evinde Gör"** görünümleri arasında geçilir.
- **Giriş Hareketi ve Erişilebilirlik:** Sayfa açılışında Yüz Duvarı portreleri soldan sağa 60 ms arayla (toplam maks. 600 ms) yerleşir. `prefers-reduced-motion: reduce` açıksa tüm geçiş ve giriş animasyonları kapatılır.

### 4.5 Ana Bileşenler ve Mizaç Kartı

**Hayvan Karosu (Liste):** 4:5 fotoğraf, sağ üstte varsa `3D/AR` rozeti, altında ad, `"2 yaş · dişi · orta boy"` tek satır özet ve durum etiketi (`Yeni` / `İlgi var` / `Yuvaya kavuştu`).

**Mizaç Göstergesi (Profilin İmza Öğesi):** Beş boyut, 1–5 noktalı skala ve **"Denenmedi"** seçeneği:

| Boyut | 1 | 5 |
|---|---|---|
| Enerji | Sakin | Çok hareketli |
| İnsanlara yaklaşım | Çekingen | Çok girişken |
| Çocuklarla uyum | Henüz denenmedi / Zor | Çok iyi |
| Diğer hayvanlarla uyum | Zor | Çok iyi |
| Yalnız kalabilme | Zor | Rahat |

- Her satırda okunabilir `"4/5"` metni ve ekran okuyucu için `aria-label` bulunur.
- Altında sabit dürüstlük notu: *"Mizaç bilgisi, bakımevi personeli ve gönüllülerin gözlemine dayanır. Kesin değildir; tanışarak netleşir."*
- **"Nasıl bir yuvaya uyar?":** En fazla 200 karakterlik serbest cümle.
- **Sağlık Etiketleri:** Aşılı, kısırlaştırılmış, çipli. Veri yoksa tahmin yapılmaz; "bilinmiyor" yazılır.
- **Filtre Çubuğu:** Tür, cinsiyet, boy, yaş grubu, "3D/AR mevcut", "çocuklarla uyumlu", "diğer hayvanlarla uyumlu", "apartmana uygun". Mobilde alttan açılan Liquid Glass panel.

### 4.6 Ekran Taslağı (Profil — Masaüstü)

```
┌──────────────────────────────────────────────────────────┐
│ ← Tüm can dostları                                       │
├───────────────────────────┬──────────────────────────────┤
│                           │ Pamuk             [ 3D/AR ✦ ]│
│   [ 4:5 portre VEYA       │ 2 yaş · dişi · orta boy      │
│     interaktif 3D sahne ] │ Aşılı · kısır · çipli        │
│                           │                              │
│  ( Fotoğraflar | 3D Gör ) │ Karakter                     │
│  [ 📱 Odamda Gör (AR) ]   │ Enerji             ●●●○○ 3/5 │
│                           │ İnsanlara yaklaşım ●●●●● 5/5 │
│ [küçük][küçük][küçük]     │ Çocuklarla uyum    ●●●●○ 4/5 │
│                           │ Diğer hayvanlar    ●●○○○ 2/5 │
│                           │ Yalnız kalabilme   ●●●○○ 3/5 │
│                           │                              │
│                           │ Nasıl bir yuvaya uyar?       │
│                           │ Sakin bir evde, ilgili biri… │
│                           │                              │
│                           │ [ ♥ Ön başvuru yap ]         │
└───────────────────────────┴──────────────────────────────┘
```

*Mobil görünümde görsel/3D alan tam genişlikte, "Odamda Gör (AR)" düğmesi hemen altında ve "Ön başvuru yap" düğmesi alt sabit çubukta (en az 44×44 px dokunma hedefiyle) yer alır.*

### 4.7 Mikro Metinler ve Fotoğraf Standardı (GEFOK Çekim Kuralı)

- **Dil:** Sade, etken, cümle düzeni (`Ön başvuru yap`, `Pamuk için ön başvuru`, `Ön başvurun gönderildi. Bakımevi seninle iletişime geçecek.`).
- **Çekim Standardı:** Göz hizasında, doğal veya yumuşak sürekli ışıkta, flaşsız. Her hayvan için 3–8 fotoğraf (yüz, tam boy, karakter anı). Kafes teli arkasından çekimden kaçınılır; bakımevi izniyle çekim alanına alınarak çekilir.
- **Erişilebilirlik:** Klavye ile tam gezinti, görünür odak halkası (`2 px` Kalp rengi, `2 px` boşluk), her fotoğrafta zorunlu ve anlamlı `alt` metni.

---

## 5. Tarayıcı İçi 3D ve WebAR Sistemi ("Odamda Gör")

Her can dostunu yalnızca düz fotoğraftan değil, **gerçek fiziksel boyutlarıyla kullanıcının kendi odasında veya salonunda** görebilmesi hem projenin en güçlü teknolojik vitrini hem de sahiplenme sürecinde boyut beklentisini netleştiren pratik bir araçtır.

### 5.1 Kullanıcı Deneyimi

1. **Tarayıcı İçi 360° Stüdyo İnceleme:** Kullanıcı profilde **"3D Gör"** sekmesine bastığında hayvanın yumuşak stüdyo ışıklı (HDRI), gerçekçi zemin gölgeli 3D modeli tarayıcıda açılır; parmakla/fareyle döndürülebilir ve yakınlaştırılabilir.
2. **Gerçek Ölçekli Boyut Göstergesi:** Sahne üzerinde açılıp kapatılabilen ölçü çubuğu yer alır (örn. *"Omuz yüksekliği: 42 cm · Orta boy"*).
3. **Uygulama İndirmeden Tek Tıkla WebAR:**
   - **iOS (iPhone / iPad):** Apple **AR Quick Look** (`.usdz`) ile doğrudan kamerada 1:1 gerçek ölçekte zemine yerleştirilir.
   - **Android:** Tarayıcı içi **WebXR** (destekliyorsa) veya **Google Scene Viewer** (`.glb`) ile zemine yerleştirilir.
   - **Masaüstü:** "Odamda Gör (AR)" düğmesine basıldığında telefon kamerasıyla okutulup doğrudan o hayvanın AR sahnesini açan anlık **QR Kod** penceresi çıkar.

### 5.2 Performans Garantisi (Zero-KB Initial Load)

3D modellerin Core Web Vitals ve SEO skorlarını düşürmemesi için 3 katmanlı kural uygulanır:
- **Tembel Kütüphane Yükleme:** 3D görüntüleyici (`@google/model-viewer` veya özel **Three.js / WebGL2** modülü) sayfa ilk açıldığında **0 KB** yüklenir. Yalnızca kullanıcı "3D Gör" sekmesine tıkladığında dinamik `import()` ile indirilir.
- **Sıkıştırma Bütçesi:**
  - `.glb`: **Meshopt / Draco** geometri sıkıştırması + **KTX2 / WebP** doku (maks. `1024×1024` veya `2048×2048`), hedef dosya boyutu **1,5 – 4 MB**.
  - `.usdz`: iOS Quick Look için optimize edilmiş eşlenik dosya (maks. **5 MB**).
- **Ücretsiz Çıkış Trafikli Dağıtım (CDN):** Tüm 3D modeller **Cloudflare R2** üzerinde tutulur; bant genişliği (egress) ücretsiz olduğu için viral trafikte sunucu çökmez ve ek maliyet oluşmaz.

### 5.3 Gerçekçi Saha 3D Üretim Hattı (Canlı Hayvan Gerçeği)

Barınaktaki kedi ve köpekler uzun süre sabit duramadığı için klasik fotogrametri her hayvanda uygulanamaz. Bu nedenle sahaya uygun **hibrit bir üretim hattı** kurulur:
1. **Saha Çekimi (GEFOK):** Hayvanın sakin bir anında ön, sağ-sol yan ve 3/4 açılardan 3–5 net fotoğraf (veya 5–8 sn kısa dönüş videosu) alınır; tahmini omuz yüksekliği (`shoulder_height_cm`) kaydedilir.
2. **Model Üretimi:**
   - *Ana Akış (Hızlı Yol):* Çoklu açı fotoğraflarından modern **Multi-View Image-to-3D** hattı (açık kaynaklı yerel model veya API servisi) ile baz 3D model çıkarılır.
   - *Hassas Yol (Sakin Hayvanlar):* Video karelerinden fotogrametri / mesh rekonstrüksiyonu.
3. **Otomatik Blender CLI Optimizasyon Betiği (Python):** Ham modeller tek komutla:
   - Taban noktası `(0, 0, 0)` merkezine oturtulur,
   - Hayvanın gerçek `shoulder_height_cm` değerine göre **1:1 metre ölçeğine** ayarlanır,
   - Poligon sayısı (25k–50k üçgen) düşürülüp dokular sıkıştırılır; eşzamanlı olarak `.glb` (Meshopt) ve `.usdz` çıktısı üretilir.
4. **Kademeli Yaygınlaştırma (Graceful Fallback):** 3D modeli henüz üretilmemiş veya çekime izin vermeyecek kadar ürkek hayvanların profili kusursuz biçimde yalnızca fotoğraflarla çalışır; 3D/AR sekmesi yalnızca model `aktif` olduğunda gösterilir.

---

## 6. Tam Kapsamlı SEO ve "Satın Alma, Sahiplen" Arama Hakimiyeti

Hedef; yalnızca "Pati Kalbi" aramalarında değil, Google'da **"pet al", "köpek satın al", "kedi satın al", "yavru köpek fiyatları", "cins kedi fiyatları", "ücretsiz köpek sahiplenme"** gibi yüksek hacimli ticari aramalarda organik olarak üst sıralara çıkıp kullanıcıları barınaktan sahiplenmeye yönlendirmektir.

### 6.1 Arama Niyeti Dönüştürme (Counter-Search SEO)

Google anahtar kelime doldurmayı (keyword stuffing) cezalandırır. Kalıcı 1. sıra için arama niyetine dürüst, bilgilendirici ve yüksek etkileşimli yanıt veren özel iniş sayfaları oluşturulur:

| Hedef Arama Kümeleri | Hedef URL | Sayfa Kurgusu ve H1 |
|---|---|---|
| `köpek satın al`, `yavru köpek fiyatları`, `pet al` | `/kopek-satin-alma-sahiplen` | **H1:** Köpek Satın Almak Yerine Sahiplen — Ücretsiz, Aşılı ve Seni Bekliyor. Neden satın almamak gerektiği + canlı köpek galerisi + 3D inceleme. |
| `kedi satın al`, `yavru kedi fiyatları`, `cins kedi al` | `/kedi-satin-alma-sahiplen` | **H1:** Kedi Satın Alma, Sahiplen — Barınaktaki Can Dostlarıyla Tanış. Bakım gerçekleri + canlı kedi listesi. |
| `evcil hayvan satın al`, `pet shop fiyatları` | `/pet-satin-alma-sahiplen` | **H1:** Can Satın Alınmaz, Sahiplenilir. 5199 sayılı kanun bilinci, barınak sahiplenme süreci ve anlık filtreli galeri. |
| `Sinop köpek sahiplenme`, `Gerze barınak`, `Karadeniz sahiplenme` | `/sinop-hayvan-sahiplenme`, `/gerze-barinak-sahiplenme` | Bölgesel harita, bakımevi ziyaret bilgileri ve o bakımevindeki güncel can dostları. |
| `apartmanda köpek bakımı`, `ilk kez kedi sahiplenme` | `/rehber/{slug}` | Uzun kuyruklu (long-tail) bilgilendirici rehberler + içine gömülü ilgili hayvan kartları. |

### 6.2 SERP Tıklama Oranı (CTR) ve Meta Şablonları

- **Ana Sayfa `<title>`:** `Pati Kalbi | Satın Alma, Sahiplen — 3D & AR Sanal Barınak`
- **SEO İniş Sayfası `<title>`:** `Köpek Satın Alma, Sahiplen! Ücretsiz ve Veteriner Onaylı Can Dostları | Pati Kalbi`
- **Profil `<title>`:** `{İsim} ({Yaş}, {Tür}) Yuva Arıyor — Satın Alma, Sahiplen | Pati Kalbi`
- **Meta Açıklamalar:** Benzersiz, 145–155 karakter, eylem çağrılı (*"Fotoğraflarını gör, odanda 3D/AR ile incele, ücretsiz ön başvuru yap."*).

### 6.3 Teknik SEO Mimarisi

1. **Sunucu Tarafı Üretim (SSR / Edge ISR):** Tüm profil, kategori, yerel SEO ve rehber sayfaları tam HTML olarak sunulur; Googlebot JavaScript çalıştırmaya gerek duymadan tüm içeriği okur.
2. **Zengin Yapısal Veri Grafiği (JSON-LD `@graph`):**
   - `Organization` / `NGO` + `AnimalShelter` (bakımevi bilgileri, belediye bağlantısı, konum)
   - `WebSite` + `SearchAction` (arama sonuçlarında site içi arama kutusu)
   - `ProfilePage` + `Thing` (hayvan profilleri — **kritik politika kuralı:** canlı hayvanlarda asla `Product`/`Offer` şeması kullanılmaz; Google spam/politika cezası riski sıfırlanır)
   - `FAQPage` (`/sss` ve tüm "Satın Alma, Sahiplen" iniş sayfalarında sık sorulan sorular)
   - `BreadcrumbList`, `ItemList` ve rehber yazılarında `Article`
3. **Dinamik Edge Sosyal Paylaşım Kartları (OG Image Engine):**
   - Her hayvan profilinin linki WhatsApp, X veya Telegram'da paylaşıldığında Edge üzerinde (`Satori`) otomatik olarak `1200×630` özel kart üretilir: solda hayvanın göz hizası 4:5 portresi, sağda büyük tipografiyle adı, yaşı, **"SATIN ALMA, SAHİPLEN"** kalp mührü ve varsa **"3D / Evinde Gör"** rozeti.
4. **Otomatik İndeksleme ve Kalıcı Otorite:**
   - Dinamik `sitemap-index.xml` (`sitemap-animals.xml`, `sitemap-pages.xml`, `sitemap-images.xml`) ve `/yonetim` kapalı `robots.txt`.
   - Hayvan veteriner onayıyla `yayinda` olduğu anda **IndexNow API** otomatik tetiklenir.
   - Kusursuz Türkçe slug üretimi (`ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u`) ve `canonical` etiketleri.
   - Yuvaya kavuşan hayvanların URL'leri 404 yapılmaz: 30 gün aktif kalır, arşivlense dahi *"Bu can dostu yuvasına kavuştu — benzer dostları gör"* ekranıyla `200 OK` döndürerek sayfanın kazandığı SEO otoritesini korur.

---

## 7. Sistem Mimarisi (Hibrit Edge + Açık Kaynak)

1 haftalık kurulum hızını korurken 3D modelleri sıfır bant genişliği maliyetiyle dağıtmak ve 100/100 hız skoru almak için **Hibrit Edge Mimarisi** önerilir.

### 7.1 Önerilen: Astro 5 (SSR/Edge) + Cloudflare Edge/R2 + PocketBase

```
                          ┌──────────────────────────────────────────┐
                          │        Cloudflare Global Edge CDN        │
Ziyaretçi / Googlebot ───►│  • Astro 5 (SSR + Edge Cache + ViewTr.)  │
                          │  • Dinamik OG Kart Üretici (Satori)      │
                          │  • Turnstile (Çerezsiz Bot Koruması)     │
                          └─────────┬──────────────────────┬─────────┘
                                    │ (API / Okuma-Yazma)  │ (Medya & 3D Akışı)
                                    ▼                      ▼
                         ┌────────────────────┐   ┌────────────────────┐
                         │   PocketBase (VPS) │   │   Cloudflare R2    │
                         │ • Hazır Admin Panel│   │ • WebP/AVIF Foto   │
                         │ • SQLite + Audit   │   │ • .glb & .usdz 3D  │
                         │ • Roller & 2FA     │   │ • 0 TL Egress!     │
                         │ • SMTP E-posta     │   └────────────────────┘
                         └────────────────────┘
```

- **Hızlı Kurulum:** PocketBase tek dosyada veritabanı, kullanıcı girişi, 2FA, rol kuralları ve yönetim panelini hazır verir; 2. hafta takvimi riske girmez.
- **Trafik ve 3D Dayanıklılığı:** Tüm fotoğraflar ve 3D modeller Cloudflare R2 + Edge CDN'den sunulur; VPS yorulmaz.
- **Bütçe:** Alan adı + küçük VPS + Cloudflare (ücretsiz katman + R2 10 GB ücretsiz) toplamı 8.1 bütçe kaleminin (5.500 TL) rahatça altında kalır.

### 7.2 Alternatif: %100 Serverless Cloudflare (Astro/Next.js + Workers + D1 + R2)

Sunucu bakımı hiç istenmiyorsa tüm arka yüz Cloudflare Workers + D1 + R2 üzerine kurulabilir; ancak yönetim panelinin özel olarak yazılması gerekir.

### 7.3 PWA ve Çevrimdışı Saha Desteği

Barınakta mobil internetin zayıf çektiği noktalar için saha veri giriş ekranı **PWA** olarak çalışır: gönüllü telefonda internet yokken bile hayvan bilgisini ve fotoğrafları yerel (`IndexedDB`) kaydeder, bağlantı geldiğinde sunucuya senkronize eder.

### 7.4 Ortamlar

`geliştirme` (yerel) → `deneme` (gizli adres, test verisi) → `canlı`. Canlıya geçiş yalnızca koordinatör onayıyla yapılır.

---

## 8. Veri Modeli (3D/AR ve SEO Genişletmeli SQL Şeması)

```sql
CREATE TABLE shelters (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  city          TEXT NOT NULL,                   -- örn. 'Sinop'
  district      TEXT NOT NULL,                   -- örn. 'Gerze'
  municipality  TEXT NOT NULL,
  contact_email TEXT NOT NULL,                   -- ön başvuruların iletileceği adres
  contact_phone TEXT,
  visiting_info TEXT
);

CREATE TABLE animals (
  id                 TEXT PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  shelter_id         TEXT NOT NULL REFERENCES shelters(id),
  name               TEXT NOT NULL,
  species            TEXT NOT NULL CHECK (species IN ('kedi','kopek')),
  sex                TEXT NOT NULL CHECK (sex IN ('disi','erkek','bilinmiyor')),
  age_months_est     INTEGER,
  size               TEXT CHECK (size IN ('kucuk','orta','buyuk')),
  shoulder_height_cm INTEGER,                    -- 3D/AR 1:1 gerçek ölçeklendirme için
  coat_and_look      TEXT,                       -- dürüst fiziksel tanım
  -- sağlık (NULL = bilinmiyor)
  vaccinated         INTEGER,
  neutered           INTEGER,
  microchipped       INTEGER,
  health_note        TEXT,
  -- mizaç (1–5, NULL = henüz denenmedi)
  t_energy           INTEGER,
  t_people           INTEGER,
  t_children         INTEGER,
  t_animals          INTEGER,
  t_alone            INTEGER,
  apartment_ok       INTEGER,
  story              TEXT,                       -- en çok 600 karakter
  ideal_home         TEXT,                       -- en çok 200 karakter
  seo_description    TEXT,                       -- opsiyonel özel meta açıklama
  status             TEXT NOT NULL DEFAULT 'taslak'
                     CHECK (status IN ('taslak','onay_bekliyor','yayinda',
                                       'ilgi_var','yuvaya_kavustu','arsiv')),
  vet_approved_by    TEXT,
  vet_approved_at    TEXT,
  created_by         TEXT,
  created_at         TEXT,
  updated_at         TEXT,
  published_at       TEXT
);

CREATE TABLE photos (
  id         TEXT PRIMARY KEY,
  animal_id  TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  file_key   TEXT NOT NULL,                      -- Cloudflare R2 anahtarı
  width      INTEGER,
  height     INTEGER,
  blurhash   TEXT,                               -- anlık yumuşak önizleme
  alt_text   TEXT NOT NULL,                      -- zorunlu (erişilebilirlik + görsel SEO)
  credit     TEXT,                               -- fotoğrafçı adı
  is_cover   INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE animal_models (
  id               TEXT PRIMARY KEY,
  animal_id        TEXT UNIQUE NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  glb_key          TEXT NOT NULL,                -- Web & Android (.glb)
  usdz_key         TEXT,                         -- iOS Apple AR Quick Look (.usdz)
  poster_key       TEXT,                         -- 3D yüklenmeden önce görünen kare
  scale_height_cm  INTEGER NOT NULL,             -- AR gerçek boyut referansı
  poly_count       INTEGER,
  glb_size_bytes   INTEGER,
  capture_method   TEXT CHECK (capture_method IN ('image_to_3d','photogrammetry','hybrid')),
  status           TEXT NOT NULL DEFAULT 'isleniyor'
                   CHECK (status IN ('isleniyor','onay_bekliyor','aktif','pasif')),
  created_at       TEXT,
  updated_at       TEXT
);

CREATE TABLE seo_pages (
  id               TEXT PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,         -- örn. 'kopek-satin-alma-sahiplen'
  page_type        TEXT NOT NULL CHECK (page_type IN ('intent_landing','local_seo','guide')),
  h1_title         TEXT NOT NULL,
  slogan           TEXT,                         -- örn. 'Satın Alma, Sahiplen.'
  meta_title       TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  filter_preset    TEXT,                         -- JSON (sayfada gösterilecek canlı hayvan filtresi)
  body_md          TEXT NOT NULL,
  faq_json         TEXT,                         -- JSON-LD FAQPage şeması için soru-cevaplar
  is_published     INTEGER DEFAULT 0,
  updated_at       TEXT
);

CREATE TABLE applications (
  id            TEXT PRIMARY KEY,
  animal_id     TEXT NOT NULL REFERENCES animals(id),
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  city          TEXT NOT NULL,
  housing_type  TEXT,                            -- apartman / müstakil / bahçeli
  has_children  INTEGER,
  has_pets      INTEGER,
  experience    TEXT,                            -- en çok 300 karakter
  motivation    TEXT,                            -- en çok 500 karakter
  consent_at    TEXT NOT NULL,                   -- aydınlatma metni onay zamanı
  status        TEXT NOT NULL DEFAULT 'yeni'
                CHECK (status IN ('yeni','bakimevine_iletildi','gorusme',
                                  'yuvaya_kavustu','sonuclanmadi','vazgecti')),
  internal_note TEXT,
  created_at    TEXT,
  forwarded_at  TEXT,
  delete_after  TEXT                             -- KVKK otomatik silme tarihi (öneri: +12 ay)
);

CREATE TABLE audit_log (
  id        TEXT PRIMARY KEY,
  user_id   TEXT,
  action    TEXT,
  entity    TEXT,
  entity_id TEXT,
  at        TEXT
);
```

**Veri Kuralları:**
- `status = 'yayinda'` yalnızca `vet_approved_at` doluysa mümkündür.
- Her hayvanda en az 1 fotoğraf ve `is_cover = 1` olan tam 1 kapak fotoğrafı bulunur.
- İlk başvuru hayvanı yayından kaldırmaz, durumunu `ilgi_var` yapar; birden fazla başvuru alınabilir.
- Kişisel veri içeren başvurular `delete_after` tarihinde (öneri: sonuçlanmadan 12 ay sonra) otomatik silinir.

---

## 9. API ve Ön Başvuru Akışı

### 9.1 API Uç Noktaları

**Herkese Açık (Okuma ve Başvuru):**

| Uç Nokta | Açıklama |
|---|---|
| `GET /api/animals` | Liste (`species, sex, size, age, kids, pets, apartment, energy, has_3d, status, q, sort, page`) |
| `GET /api/animals/{slug}` | Tek profil, fotoğraflar ve aktif 3D/AR model bilgileri |
| `GET /api/stats` | Yayındaki, ilgi gören, 3D hazır ve yuvaya kavuşan sayıları |
| `GET /api/og/{slug}.png` | Dinamik "Satın Alma, Sahiplen" paylaşım kartı |
| `POST /api/applications` | Ön başvuru gönder |

*`GET /api/animals` yalnızca `yayinda`, `ilgi_var` ve son 30 günün `yuvaya_kavustu` kayıtlarını döndürür. Başvuru yapanların kişisel verisi hiçbir herkese açık uçta yer almaz.*

**Yönetim (Giriş + Rol + Yönetici/Onaylayıcı için 2FA Zorunlu):**
- `POST/PATCH/DELETE /api/admin/animals` (Editör, Yönetici)
- `POST /api/admin/animals/{id}/photos` & `/model` (Fotoğraf + `.glb`/`.usdz` yükleme — Editör, Yönetici)
- `POST /api/admin/animals/{id}/submit` (Editör) & `/approve` (Onaylayıcı, Yönetici)
- `GET/PATCH /api/admin/applications` & `/forward` (Yönetici)
- `POST/PATCH /api/admin/seo-pages` (SEO iniş sayfaları ve rehber yönetimi — Yönetici)
- `GET /api/admin/export.csv` (Kişisel veri içermeyen istatistik çıktısı — Yönetici)

**Doğrulama ve Koruma:**
- Türkiye telefon biçimi (başında 0 olmadan 10 hane veya `+90`), e-posta biçim kontrolü, sunucu tarafı şema doğrulaması.
- `POST /api/applications`: saatte en çok 3 istek, görünmez bal tuzağı (honeypot) ve çerezsiz bot doğrulaması (Cloudflare Turnstile). IP kalıcı saklanmaz.

### 9.2 Ön Başvuru Akışı

```
Ziyaretçi ► Profil (Fotoğraf + 3D/AR) ► "Ön başvuru yap" ► Form + KVKK onayı
   ► Sunucu doğrular ► Kaydeder ► Ziyaretçiye onay e-postası
   ► Yönetici panelde görür ► "Bakımevine ilet" ► Bakımevine e-posta
   ► Bakımevi/belediye kendi usulüyle sonuçlandırır
   ► Yönetici sonucu işler (yuvaya kavuştu / sonuçlanmadı / vazgeçti)
```

**Onay Metni Taslağı (Hukuki Gözden Geçirme Gerekir):**
> Kişisel verilerimin, ön başvurumun değerlendirilmesi için Gerze Belediyesi bakım evine iletilmesine ilişkin aydınlatma metnini okudum ve anladım.

---

## 10. Yönetim Paneli ve Medya Kuralları

**Ekranlar:**
1. **Hayvan Listesi:** Durum filtresiyle; "onay bekleyenler" en üstte.
2. **Hayvan Düzenle:** Temel bilgi, omuz yüksekliği (cm), mizaç kaydırıcıları (+ "denenmedi"), sağlık, hikâye, fotoğraf ve 3D model yükleme.
3. **3D Önizleme ve Boyut Kontrolü:** `.glb`/`.usdz` sürükle-bırak yüklendiğinde canlı 3D önizleme, poligon ve dosya boyutu uyarısı (`5 MB` üstü için sıkıştırma uyarısı).
4. **Onay Ekranı:** Veteriner hekim/onaylayıcı için yayındaki halin tam önizlemesi ve tek tıkla "Onayla / Düzeltme İste".
5. **Başvuru Kutusu & SEO Yöneticisi:** Başvuru iletimi, durum takibi ve "Satın Alma, Sahiplen" SEO sayfalarının düzenlenmesi.

**Fotoğraf Yükleme Kuralları:**
- Tarayıcıda yükleme öncesi yeniden boyutlandırma (`400 / 800 / 1200 px`, WebP/AVIF) ve `blurhash` üretimi.
- **EXIF (konum, kamera, cihaz) bilgisi tamamen silinir.**
- `alt_text` boş bırakılamaz; fotoğrafçı adı alanı vardır. En fazla 8 fotoğraf.

---

## 11. Güvenlik, Gizlilik (KVKK) ve Yedekleme

- Her yerde HTTPS; güvenlik başlıkları (`CSP`, `X-Content-Type-Options`, `Referrer-Policy`). CSP yalnızca kendi alan adına ve R2 medya alan adına izin verir.
- **Sıfır Çerez Politikası:** Çerezsiz ve kişisel veri toplamayan analitik (Umami veya Cloudflare Web Analytics). Üçüncü taraf reklam/takip betiği yok; çerez onay penceresi gerekmez.
- **Yedekleme:** Veritabanı günlük, R2 fotoğraf ve 3D arşivi haftalık iki ayrı konuma yedeklenir. Proje bitmeden **en az bir kez geri yükleme tatbikatı** yapılır.
- **Çalışma İzleme ve KVKK İmha:** Ücretsiz uptime izleme + hata e-postası; başvuran silme talep edince panelden tek tıkla silme ve `delete_after` ile otomatik imha.

---

## 12. Fotoğraf, 3D Model Hakları ve Açık Kaynak

- **Yazılım Kodu:** Herkese açık GitHub deposu, **MIT** lisansı.
- **Fotoğraflar ve 3D Varlıklar:** Fotoğraf hakları çeken öğrencide kalır; sitede ve proje tanıtımında kullanım için yazılı izin alınır. 3D modeller yalnızca sahiplendirme ve proje tanıtımı için (ticari kullanım hariç) lisanslanır.
- **Kurumsal İzin:** Bakımevi ve belediyeden hayvanların fotoğraf ve 3D görselleştirmelerinin yayın izni yazılı alınır.
- **Alt Bilgi (Footer):** *"Satın Alma, Sahiplen. Kod açık kaynaktır (MIT). Fotoğrafların hakları fotoğrafçılarına aittir."*

---

## 13. Test ve Doğrulama Planı

| Alan | Test Kapsamı |
|---|---|
| **İşlev & Kurallar** | Filtreler, profil, form + e-posta akışı, onaysız hayvanın yayına çıkamaması, kişisel verinin açık API'ye sızmaması |
| **3D & WebAR** | Gerçek iPhone (Safari AR Quick Look `.usdz`) ve Android (Chrome WebXR/Scene Viewer `.glb`) cihazlarda 1:1 ölçek ve FPS testi; 3D yokken sorunsuz fallback |
| **SEO & Rich Results** | Google Rich Results Test (`AnimalShelter`, `FAQPage`, `BreadcrumbList`), Lighthouse (Mobil Performans ≥ 95, SEO = 100), WhatsApp/X dinamik OG kart doğrulaması |
| **Erişilebilirlik & Türkçe** | Klavye gezintisi, ekran okuyucu, `İ/ı/ğ/ş/ö/ü/ç` arama-sıralama, `prefers-reduced-motion`, 360/390/768 px mobil testleri |
| **Yük & Güvenlik** | 50+ eşzamanlı ziyaretçi + 3D akışı, Turnstile/honeypot spam testi, yetkisiz admin çağrıları |
| **Kullanıcı Testi** | Kulüp dışından 3 kişiyle "hayvan bul → 3D/AR incele → ön başvuru yap" denemesi |

---

## 14. Uygulama Takvimi (Proje Takvimiyle Uyumlu)

| Hafta | Yapılacaklar |
|---|---|
| **2. Hafta (08–14 Mart 2027)** | Alan adı + Cloudflare/VPS/R2 kurulumu, GitHub deposu, tasarım sistemi (Aydınlık/Karanlık + Liquid Glass), Yüz Duvarı, veri modeli, 3D/WebAR görüntüleyici, Blender optimizasyon betiği, ilk 3 "Satın Alma, Sahiplen" SEO iniş sayfası, yönetim paneli ve 5 örnek profil |
| **3. Hafta (15–21 Mart 2027)** | Saha fotoğraf ve 3D referans çekimleri; her akşam panele veri girişi, mizaç kartlarının veteriner onayına gitmesi, ilk 3D modellerin dönüştürülüp R2'ye yüklenmesi |
| **4. Hafta (22–28 Mart 2027)** | 60–80 profilin tamamlanması, kalan 3D/AR modellerin optimizasyonu, gerçek iOS/Android AR testleri, Lighthouse/SEO doğrulamaları, yedek geri yükleme denemesi |
| **5. Hafta (29 Mart–4 Nisan 2027)** | Canlıya geçiş, Google Search Console & IndexNow kaydı, dinamik OG kartlarıyla sosyal medya lansmanı, ön başvuruların bakımevine iletilmesi ve sonuç raporu verileri |

---

## 15. Kabul Ölçütleri (Bitti Sayılma Şartları)

1. 60–80 hayvan profili yayında; her biri veteriner/bakımevi onaylı.
2. Uygun hayvanlarda tarayıcı içi 3D inceleme ve iOS/Android 1:1 gerçek boyutlu WebAR ("Odamda Gör") sorunsuz çalışıyor.
3. "Satın Alma, Sahiplen" odaklı en az 5 SEO iniş/rehber sayfası yayında, JSON-LD yapısal verileri hatasız ve Lighthouse SEO skoru 100.
4. Dinamik OG paylaşım görselleri WhatsApp ve sosyal medyada eksiksiz önizleniyor.
5. Ön başvuru formu hem başvurana hem bakımevine e-posta olarak ulaşıyor; KVKK onayı zorunlu ve hiçbir açık uçta kişisel veri yok.
6. Tüm fotoğraflarda `alt` metni ve EXIF temizliği tamam; 3D modeller 5 MB altında.
7. Yedekleme aktif ve en az bir kez geri yüklenebildiği doğrulandı.
8. GitHub deposu MIT lisanslı ve kurulum rehberi (README) ile herkese açık.

---

## 16. Açık Kararlar (Başlamadan Netleşmeli)

- [ ] **Veri sorumlusu:** Belediye mi, GEFOK / üniversite mi?
- [ ] **Alan adı:** `patikalbi.org` / `.org.tr` / `.com` müsaitlik ve tescil kararı.
- [ ] **Backend tercihi:** Hızlı kurulum için **PocketBase + Cloudflare R2** mi, yoksa sıfır bakım için **tam Cloudflare (D1 + R2 + özel panel)** mi?
- [ ] **3D üretim hattı:** Saha çekimlerinden `.glb`/`.usdz` üretimi için hangi araç/pipeline (yerel GPU'da açık kaynaklı model mi, API tabanlı servis mi) seçilecek?
- [ ] **Bakımevi kapsamı:** Sinop'taki bakımevi de eklenecek mi, yoksa ilk faz yalnızca Gerze mi?
- [ ] **Onaylayıcı ve iletişim:** Bakımevi veteriner hekimi adı/e-postası ve başvuruların gideceği resmi bakımevi e-posta adresi.
- [ ] **İzin yazıları:** Öğrenci fotoğrafçı yazılı izin formları ve bakımevi/belediye yayın izni.
- [ ] **Sürdürülebilirlik:** Sitenin proje sonrası bakımını GEFOK'ta kimin üstleneceği.