# CLAUDE.md — Mechi-YDO (Yurt Dışı Asistanı — Arapça)

> Bu dosya Claude Code için kalıcı proje talimatıdır. **Önce bu bölümü, sonra altındaki ana prompt'u oku.**

## Güncel durum (özet)

- **Aşama 1 tamamlandı** (iskelet, tohum veri, üç alanlı ana ekran, okunuş çentiği).
- **Aşama 2 tamamlandı** (fiil sistemi: Wiktionary çekimleri + bağımsız kural motoruyla 1621/1621 çapraz doğrulama, okunuş motoru, buzlu arka planlı fiil penceresi, kullanılan çekimin işaretlenmesi, ayarlar v2). Sonraki: **Aşama 3 — Çeviri katmanları ve havuz.**
- Kararlar: `docs/DECISIONS.md`. Okunuş kuralları: `docs/TRANSLIT_RULES.md`. Kaynaklar: `docs/DATA_SOURCES.md`. Çekim doğrulama raporu: `docs/VERB_CROSSCHECK.md`.
- **Bu bilgisayarda Python yok.** Veri araçları Node/TypeScript ile yazılıyor (`node tools/*.ts`, Node 24 TS'yi doğrudan çalıştırır; tools içindeki göreli importlar `.ts` uzantılı olmalı).
- **Sohbet (Mısır Arapçası) eklendi** (kullanıcı kararı, lehçe yalnızca bu sekmede): `src/core/chat/`, `ChatScreen`, Worker `workers/translate-proxy/` (Claude, anahtar yalnızca Worker'da), kelime defteri + md (`misir-arapcasi-kelimeler.md`). Karar ve riskler: `docs/DECISIONS.md` (Sohbet bölümü). Fusha kütüphanesine Mısır verisi karıştırılmaz. Gerçek Claude çağrısı ve Android dosya yolu henüz denenmedi.
- **Kütüphane genişletildi** (günlük/alışveriş/yolculuk/tartışma/iş): `npm run build:content`, rapor `docs/LIBRARY_REPORT.md`.
- Kesinleşen kararlar: çevrimiçi çeviri = **Claude API (Cloudflare Worker proxy)**, **minSdk 29 (Android 10+)**, depo **Mechi-YDO**, appId `com.mechi.ydo`.
- Komutlar: `npm run dev` · `npm test` · `npm run build` · `npm run typecheck` (src + tools + worker) · `npm run build:verbs` (Wiktionary indir + çekim tablosu + rapor) · `python3 tools/build_forms.py` (Python gerekir)
- Doğrulama: her değişiklikten sonra `npm run typecheck`, `npx vitest run`, `npm run build`.
- Tohum veri tamamen `verified: false`; Arapça bilen biriyle doğrulanana kadar öyle kalır.

---

# PROJE PROMPTU: Türkçe ⇄ Standart Arapça (Fusha) Çeviri ve Yurt Dışı Asistanı

> Bu dosyayı Claude Code'da proje kökünde `CLAUDE.md` olarak kaydet (veya ilk mesaja yapıştır). Claude bu dosyayı kalıcı proje talimatı olarak okuyacaktır.

---

## 0. ROLÜN VE ÇALIŞMA KURALLARI

Sen kıdemli bir mobil uygulama mühendisi ve Arapça dilbilimine (nahiv/sarf) hâkim bir veri mühendisisin. Aşağıdaki uygulamayı **aşama aşama** inşa edeceksin.

**Çalışma kuralları:**

1. Kullanıcı (Cihan) **Türkçe** konuşur. Tüm açıklamalarını, commit mesajlarını ve arayüz metinlerini Türkçe yaz. Kod, değişken ve dosya adları İngilizce olsun.
2. Her aşamanın sonunda: ne yaptığını, nasıl test edeceğini ve bir sonraki adımı kısaca özetle. Gereksiz uzun anlatma.
3. Bir aşamayı bitirmeden sonrakine geçme. Her aşamanın "Kabul" kriteri sağlanmalı.
4. Emin olmadığın bir dilbilgisi/kelime bilgisini **uydurma**. Doğrulanamayan Arapça veriyi `verified: false` olarak işaretle ve raporla. Yanlış çeviri, çeviri olmamasından kötüdür.
5. Gerçek anahtarları, şifreleri ve token'ları asla koda gömme. `.env` / yapılandırma kullan.
6. Her büyük değişiklikten sonra `npm run build` ve `npx tsc --noEmit` çalıştır. Hata varsa düzelt, sonra devam et.
7. Kararsız kaldığın yerde en basit çalışan çözümü seç, alternatifi `docs/DECISIONS.md` dosyasına yaz.
8. Kullanıcıya doğrudan ve saygılı ol, gereksiz uyarı/öğüt verme.

---

## 1. ÜRÜN TANIMI

**Ad (çalışma adı):** Yurt Dışı Asistanı — Arapça (Fusha)
**Amaç:** Arapça konuşulan bir ülkede yaşayan bir Türk'ün Türkçe ⇄ Standart Arapça (Fusha / Modern Standart Arapça, MSA) iletişim kurmasına yardım etmek ve dil öğrenmesini sağlamak.
**Platform:** Android (Capacitor). **İnternetsiz çalışabilmeli.**
**İlk dil çifti:** Türkçe ⇄ Standart Arapça. Mimari ileride başka dillere (İngilizce, Almanca vb.) ve Arapça lehçelerine genişleyecek şekilde **dil-bağımsız** kurulmalı (`languagePair` ve `variant` kavramı).

**Varyant politikası:** Tek varyant **Standart Arapça (`msa`)**. Veritabanında yine de her kayıtta `variant` alanı tutulur (`msa` varsayılan), ileride lehçe (ör. `eg`) eklemek şema değişikliği gerektirmesin. **Şimdi lehçe özelliği geliştirme**; sadece alanı ve altyapıyı hazır bırak.

### 1.1 Ana ekran akışı (ZORUNLU DÜZEN)

Kullanıcı bir Türkçe kelime/cümle yazar (veya mikrofonla söyler). Sonuç ekranı **yukarıdan aşağıya şu sırayla** olacak:

1. **Üst alan:** Kullanıcının yazdığı Türkçe metin.
2. **Orta alan:** Arapça çeviri (büyük punto, sağdan sola, harekeli/harekesiz ayara bağlı). Ayar açıksa altında **Türkçe harflerle okunuş**.
3. **Alt pencere (kelime tablosu):** Cümledeki her kelimenin tek tek **Türkçe ↔ Arapça** karşılığı. Satır başına: Türkçe kelime | Arapça | okunuş (ayara bağlı) | tür (fiil/isim/…).
4. Çevrilen cümlede/kelimede **fiil** varsa, o kelime tabloda ve üst metinde **yanıp sönen (pulse) vurgu** ile gösterilir.

### 1.2 Fiil penceresi (modal)

- Yanıp sönen fiile dokunulunca **ön planda açılır pencere (modal/bottom sheet)** açılır. Arka plandaki ana ekran **buzlu cam efekti** alır (`backdrop-filter: blur()`, yoğunluğu ayarlanabilir).
- **Önemli:** Fiil cümlede hangi zamanda kullanılmış olursa olsun (ör. "bindim"), pencere **Türkçe mastardan** (`binmek`) başlar ve **tüm zamanları** gösterir:
  - **Geçmiş (māḍī)**
  - **Geniş/şimdiki (muḍāriʿ)**
  - **Gelecek** — `سَـ` (sa-) ve `سَوْفَ` (sawfa) ile
  - **Emir (amr)**
- Her zaman için şahıs çekimleri tablo hâlinde. Fusha'da **13 şahıs** vardır: ben, sen (erkek), sen (kadın), o (erkek), o (kadın), **siz ikiniz (müsenna)**, **onlar ikisi (müsenna, eril)**, **onlar ikisi (müsenna, dişil; yalnızca geçmişte ayrı)**, biz, siz (erkek çoğul), siz (kadın çoğul), onlar (erkek çoğul), onlar (kadın çoğul). Emirde 5 şahıs (sen m/f, siz ikiniz, siz erkek çoğul, siz kadın çoğul). Müsenna (ikil) satırları ayarlardan gizlenebilir.
- Pencerede ayrıca: Arapça fiilin sözlük formu (geçmiş zaman, 3. tekil eril, ör. `رَكِبَ`), **masdar** (fiilimsi isim), **kök** (ر-ك-ب), **fiil kalıbı (bab: I–X)**, aktif/pasif (majhūl) çekim seçeneği, **cümlede kullanılan çekimin işaretlenmesi**, kısa örnek cümle.
- Kapatma: dışarıya dokunma, aşağı kaydırma veya X.
- Okunuş ayarı kapalıysa çekim tablosunda da okunuş gösterilmez.

### 1.3 Mikrofon

- Mikrofon **Türkçe** konuşmayı algılarsa Arapçaya, **Arapça** konuşmayı algılarsa Türkçeye çevirir.
- Android konuşma tanıyıcı dili önceden ister. Bu yüzden **v1'de iki ayrı mikrofon düğmesi** yap: `🎤 TR` ve `🎤 AR`. Ayarlarda "Tek düğme (otomatik dil algılama – deneysel)" seçeneği olsun; tanıma sonucundaki karakter kümesine (Arap harfi mi Latin harfi mi) bakan basit bir geçici çözümle başlasın. (Cihan içi Whisper ileride araştırılacak, şimdi uygulama.)
- **Önemli not:** Arapça konuşma tanıma yerel ayarı olarak `ar-SA` (varsayılan) kullan; kullanıcı konuşurken gerçekte lehçeli konuşuyorsa tanıma kalitesi düşebilir. Bu durumu ayar açıklamasında dürüstçe belirt.
- Çeviri sonrası **sesli okuma (TTS)**: çeviri hedef dilde seslendirilir (Arapça için `ar-SA`, cihazda yoksa mevcut herhangi bir `ar-*` ses). Ayarlardan otomatik seslendirme açılıp kapanır. Her çeviri satırında manuel "🔊" düğmesi de olsun.

### 1.4 Eksikler havuzu (missing pool)

- Kütüphanede bulunamayan her kelime/cümle (yazılı veya konuşulmuş) **`missing.json`** dosyasına kaydedilir. Aynı kayıt tekrar gelirse yeni kayıt açılmaz, `count` artar, `last_seen` güncellenir.
- Şema:

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "id": "sha1(text|lang|kind)",
      "text": "arabaya bindim",
      "lang": "tr",
      "kind": "sentence",
      "source": "typed",
      "missing_words": ["bindim"],
      "reason": "no_library_match",
      "engine_used": "mlkit_offline",
      "variant_wanted": "msa",
      "count": 3,
      "first_seen": "2026-10-05T10:20:00Z",
      "last_seen": "2026-10-07T18:02:00Z",
      "app_version": "0.1.0",
      "library_version": 12
    }
  ]
}
```

- `kind`: `word | sentence | verb_form | phrase`; `source`: `typed | speech`; `reason`: `no_library_match | verb_unknown | translation_failed | low_confidence | alignment_failed`.
- Dosya uygulama klasörüne yazılır (Capacitor `Filesystem`, `Directory.Data`). Uygulama silinince gideceği için **"Dışa aktar"** (Documents klasörü / paylaşım menüsü) ve internet varken **isteğe bağlı otomatik yükleme** (ayarlardan açılır) olmalı.
- Yazma işlemleri **atomik** olmalı (önce geçici dosya, sonra yeniden adlandırma) ve bozuk dosyaya karşı yedeği (`missing.json.bak`) tutulmalı.

---

## 2. TEKNİK MİMARİ

**Yığın (değiştirme):** React + Vite + TypeScript + Capacitor (Android). Çevrimdışı öncelikli (offline-first). Bulut APK derlemesi GitHub Actions ile yapılır.

**Önerilen paketler (kullanmadan önce güncel sürüm ve Capacitor sürüm uyumunu doğrula):**
- Veritabanı: `@capacitor-community/sqlite`
- Dosya: `@capacitor/filesystem`, `@capacitor/share`
- Ayarlar: `@capacitor/preferences`
- Ağ durumu: `@capacitor/network`
- Konuşma tanıma: `@capacitor-community/speech-recognition`
- Sesli okuma: `@capacitor-community/text-to-speech`
- Çevrimdışı çeviri: Google ML Kit Translate için bir Capacitor eklentisi bul veya ince bir özel eklenti yaz (Türkçe ⇄ Arapça modeli). **ML Kit'in Arapça çıktısı standart Arapçadır; bu proje için doğru varyanttır.** Yine de çıktı harekesiz gelir ve kalitesi değişkendir: kütüphane eşleşmesi her zaman önceliklidir.
- Durum yönetimi: Zustand, yönlendirme: gerekirse React Router.

**Klasör yapısı önerisi:**

```
src/
  core/
    translation/      # çeviri orkestratörü (katmanlar)
    library/          # SQLite erişimi, arama, sürüm
    verbs/            # fiil bulma + çekim sorguları
    tokenizer/        # Türkçe ve Arapça tokenizer
    translit/         # Arapça -> Türkçe okunuş motoru
    speech/           # STT + TTS sarmalayıcılar
    missing/          # missing.json yöneticisi
    settings/         # ayar şeması + store
    i18n/             # arayüz dil dosyaları
  ui/
    screens/ (Home, Settings, History, Library, About)
    components/ (WordTable, VerbModal, MicButton, ArabicText, ...)
  plugins/            # özel native eklentiler (gerekirse)
tools/                # BİLGİSAYAR tarafı Python araçları (bkz. bölüm 5)
data/                 # ham ve işlenmiş veri (git'e büyük dosya koyma)
docs/                 # DECISIONS.md, DATA_SOURCES.md, TRANSLIT_RULES.md
```

### 2.1 Çeviri orkestratörü (3 katman, bu sırayla)

1. **Kütüphane (SQLite):** Tam cümle/kalıp eşleşmesi, sonra kelime-kelime sözlük. Normalizasyon uygula (Türkçe: küçük harf, noktalama, `İ/ı` dikkat; Arapça: harekeleri ve tatweel'i arama için kaldır, `أ إ آ → ا`, `ى → ي`, `ة → ه` gibi eşlemeler yalnızca **arama anahtarı** için; görüntülenen metin orijinal kalır).
2. **Çeviri motoru:**
   - İnternet varsa: yapılandırılabilir online çeviri servisi. **API anahtarını uygulamaya gömme**; bir ara sunucu (ör. Cloudflare Worker proxy) üzerinden çağır. Endpoint `settings`'ten ve `.env`'den okunur. Servise "Modern Standard Arabic, fully vowelized (harakat) if possible" talimatı verilir.
   - İnternet yoksa: ML Kit çevrimdışı model. Çıktı harekesizse okunuş motoru kütüphane sözlüğünden destek alarak harekelendirmeyi dener; yapamazsa harekesiz gösterir ve okunuşu "tahmini" etiketler.
3. **Başarısızlık:** Havuza yaz, kullanıcıya "Bu çeviri kütüphanede yok, havuza eklendi" bilgisi ver.

Her sonuç nesnesinde `source` (`library|online|offline_model`), `confidence` ve `verified` alanları taşınır. UI'da küçük bir rozetle kaynağı göster (güvenilirlik için önemli).

### 2.2 Kelime eşleştirme (alt pencere tablosu)

- Türkçe cümleyi tokenlara ayır; her token için `forms` tablosundan **lemma** bul (`bindim → binmek`).
- Arapça çıktıyı tokenlara ayır; yapışık ön ekleri (`و`, `ف`, `ب`, `ل`, `ك`, `ال`, gelecek eki `سـ`) ve bağlı zamirleri (`ـه`, `ـها`, `ـك`, `ـني`, `ـهم`…) ayırıp sözlükte ara. Arapça yazıda bu ekler kelimeye bitişik yazıldığı için tokenizer bunları ayırmayı **ayrı bir modül olarak** ele almalı ve birim testlerle desteklenmeli.
- İki taraf arasında hizalama: önce kütüphane eşleşmesinden, yoksa konum/benzerlik sezgisinden. Emin olunamayan hizalamada satırı "~" işaretiyle göster ve havuza `low_confidence` yaz.
- Hizalanamayan kelimeler havuza gider.

### 2.3 Okunuş motoru (Türkçe harflerle)

Arapça metinden **Türkçe harflerle** okunuş üretir. Harekeli yazım varsa kurallarla, kütüphanedeki `translit_tr` alanı varsa **o alan kuraldan önceliklidir** (elle doğrulanmış okunuş her zaman üstündür). Kurallar `docs/TRANSLIT_RULES.md` dosyasına yazılsın ve en az 100 örnekli birim testi olsun.

| Arap harfi | Okunuş (Sade) | Okunuş (Ayrıntılı) | Not |
|---|---|---|---|
| ا (uzun) | a | â | Uzun ünlü |
| ب | b | b | |
| ت | t | t | |
| ث | s | s̱ / th | Dişarası, Türkçede `s`'ye yakın |
| ج | c | c | Standart Arapçada `c` (Türkçe "cam") |
| ح | h | ḥ | Boğazdan, vurgulu h |
| خ | h | ḫ / kh | Boğazdan, sert h |
| د | d | d | |
| ذ | z | ẕ / dh | Dişarası, Türkçede `z`'ye yakın |
| ر | r | r | |
| ز | z | z | |
| س | s | s | |
| ش | ş | ş | |
| ص | s | ṣ | Vurgulu s |
| ض | d | ḍ | Vurgulu d |
| ط | t | ṭ | Vurgulu t |
| ظ | z | ẓ | Vurgulu z |
| ع | ' | ʿ | Ayn, gırtlaksı |
| غ | ğ | ğ | |
| ف | f | f | |
| ق | k | ḳ / q | Gırtlağa yakın k |
| ك | k | k | |
| ل | l | l | |
| م | m | m | |
| ن | n | n | |
| ه | h | h | |
| و | v/u/w (bağlama göre) | w / û | Ünsüz: `v`; uzun ünlü: `u` |
| ي | y / i (bağlama göre) | y / î | Ünsüz: `y`; uzun ünlü: `i` |
| ء / أ / ؤ / ئ | ' | ʾ | Hemze |
| ة | a (durakta), at (bağlamda) | a / at | Tā marbūta |
| Şedde (ّ) | ünsüz ikilenir | aynı | `madrasa` → `meddrese` değil, `medrese` yazımına göre: ünsüzü ikile |
| Tenvin | -un / -an / -in | aynı | Sade modda gizlenebilir |

- **Sade stil:** Türkçe okuyan biri için, özel işaretsiz (`ḥ`, `ʿ`, `ṣ` yok). Uzun ünlüler `a i u` yazılır.
- **Ayrıntılı stil:** İnce farkları ayırt eden işaretler ve uzun ünlü şapkaları (`â î û`).
- **Kelime sonu (i'rab) kuralı:** Fusha'da kelime sonlarındaki hareke (i'rab) cümle içinde okunur, ama konuşmada duruşta (waqf) düşer. Ayarlarda **"Kelime sonu harekelerini oku"** seçeneği olsun (varsayılan: **kapalı**, yani duruş okunuşu; günlük kullanım için daha doğaldır). Kapalıyken `kitābun` yerine `kitāb` yazılır.
- **Güneş harfleri:** `ال` tanımlık eki güneş harflerinde asimile olur (`الشمس` → `eş-şems`). Motor bunu uygulamalı.
- **Vasl hemzesi** ve `ال` birleşmesi (`فِي الْبَيْتِ` → `fil-beyt`) için kural ekle.

---

## 3. VERİ MODELİ (SQLite)

`library_v{N}.sqlite` olarak sürümlenir. Şema:

```sql
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);              -- library_version, built_at, lang_pair, sources
CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  tr TEXT NOT NULL, tr_norm TEXT NOT NULL,
  ar TEXT NOT NULL,            -- harekeli (varsa)
  ar_plain TEXT NOT NULL,      -- harekesiz, arama için
  translit_tr TEXT,            -- Türkçe okunuş (sade, duruş/waqf)
  translit_tr_detail TEXT,     -- ayrıntılı
  translit_tr_irab TEXT,       -- kelime sonu harekeli okunuş (isteğe bağlı)
  pos TEXT,                    -- noun|verb|adj|adv|prep|pron|num|particle|phrase
  gender TEXT, plural_ar TEXT, -- isimler için (eril/dişil, çoğul biçimi)
  variant TEXT NOT NULL DEFAULT 'msa',
  category TEXT,               -- hastane, market, taksi, ...
  freq_rank INTEGER, verified INTEGER DEFAULT 0, source TEXT, note TEXT
);
CREATE INDEX idx_words_tr_norm ON words(tr_norm);
CREATE INDEX idx_words_ar_plain ON words(ar_plain);

CREATE TABLE verbs (
  id INTEGER PRIMARY KEY,
  tr_infinitive TEXT NOT NULL,   -- binmek
  ar_lemma TEXT NOT NULL,        -- رَكِبَ (geçmiş 3. tekil eril, harekeli)
  ar_masdar TEXT,                -- masdar (fiilimsi isim)
  ar_root TEXT,                  -- ر ك ب
  ar_form TEXT,                  -- I..X (bab)
  verb_type TEXT,                -- sahih|mithal|ecvef|nakis|mudaaf|hemzeli|lefif
  transitive INTEGER,
  variant TEXT NOT NULL DEFAULT 'msa',
  conjugations_json TEXT NOT NULL,  -- aktif + pasif, tüm zaman/şahıs çekimleri (harekeli + okunuş)
  irregular INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, example_tr TEXT, example_ar TEXT
);

CREATE TABLE forms (               -- Türkçe çekimli hal -> mastar eşlemesi
  form_norm TEXT NOT NULL, lemma TEXT NOT NULL, tense TEXT, person TEXT,
  PRIMARY KEY(form_norm, lemma)
);

CREATE TABLE sentences (
  id INTEGER PRIMARY KEY, tr TEXT, tr_norm TEXT, ar TEXT, ar_plain TEXT,
  translit_tr TEXT, variant TEXT NOT NULL DEFAULT 'msa', category TEXT,
  verified INTEGER DEFAULT 0, source TEXT
);
```

**Kural:** Telefonda **ağır hesaplama yapma**. Türkçe ek çözümleme ve Arapça fiil çekimi üretimi bilgisayarda yapılıp `forms` ve `verbs.conjugations_json` içine hazır yazılır. Uygulama sadece sorgular.

`conjugations_json` biçimi (kısaltılmış, yalnızca yapıyı göstermek için):

```json
{
  "active": {
    "past": {
      "ana": {"ar": "...", "tr": "..."}, "anta": {}, "anti": {}, "huwa": {}, "hiya": {},
      "antuma": {}, "huma_m": {}, "huma_f": {},
      "nahnu": {}, "antum": {}, "antunna": {}, "hum": {}, "hunna": {}
    },
    "present": { "...": "aynı 13 şahıs" },
    "future":  { "...": "sa- ve sawfa ile; 13 şahıs" },
    "imperative": {"anta": {}, "anti": {}, "antuma": {}, "antum": {}, "antunna": {}}
  },
  "passive": { "past": {}, "present": {} }
}
```

> Şemadaki değerleri **ezbere doldurma**. Gerçek çekimleri veri hattından üret ve doğrula.

---

## 4. AYARLAR EKRANI (TAM LİSTE)

Ayarlar `@capacitor/preferences` içinde tek bir sürümlü JSON olarak saklanır (`settingsVersion` alanı, göç/migration desteği). Her ayarın varsayılanı, açıklaması ve anında etkisi olsun. Gruplar:

### 4.1 Dil ve Çeviri
- **Dil çifti:** Türkçe ⇄ Arapça (ileride genişleyecek, şimdilik sabit)
- **Arapça türü:** `Standart Arapça (Fusha)` (tek aktif seçenek; "Lehçeler yakında" notuyla pasif gösterilebilir)
- **Çeviri yönü:** Otomatik algıla / Hep TR→AR / Hep AR→TR
- **Çeviri motoru önceliği:** Kütüphane → Çevrimiçi → Çevrimdışı model (sıralama değiştirilebilir)
- ☑ **Çevrimiçi çeviri kullan** (kapalıyken yalnızca kütüphane + çevrimdışı model)
- ☑ **Yalnızca Wi-Fi'de çevrimiçi çeviri**
- **Eril/dişil hitap tercihi:** Kullanıcı erkek/kadın (Arapçada fiil ve hitap cinsiyete göre değişir; "sen" çevirilerinde varsayılan hitap kime yapılıyor: erkek/kadın/sor)

### 4.2 Gösterim (Arapça bilmeyenler için kritik)
- ☑ **Türkçe okunuşu göster** (ana çentik; **kapalıysa uygulamanın hiçbir yerinde okunuş görünmez**: ana ekran, kelime tablosu, fiil penceresi, geçmiş, favoriler)
- **Okunuş stili:** `Sade` / `Ayrıntılı`
- ☑ **Kelime sonu (i'rab) harekelerini oku** (varsayılan kapalı, bölüm 2.3)
- **Okunuş konumu:** Arapça metnin altında / yanında
- ☑ **Harekeli Arapça göster** (kısa ünlü işaretleri; Fusha'da öğrenme için önerilir, varsayılan açık)
- **Arapça yazı tipi:** birkaç seçenek (Noto Naskh Arabic, Amiri, Scheherazade New vb.). **Harekeler için uygun, fontları uygulamaya gömerek çevrimdışı çalışmasını sağla**
- **Arapça punto boyutu** (kaydırıcı, canlı önizleme; hareke taşmasını önlemek için satır aralığı otomatik)
- **Türkçe punto boyutu** (kaydırıcı)
- **Tema:** Açık / Koyu / Sistem
- **Fiil penceresi arka plan bulanıklığı** (kaydırıcı, 0–20 px)
- ☑ **Fiilleri yanıp sönerek vurgula** (kapatılabilir; "Hareketi azalt" ayarına uyum)
- **Fiil penceresinde gösterilecek zamanlar:** ☑ Geçmiş ☑ Geniş ☑ Gelecek ☑ Emir
- ☑ **Müsenna (ikil) satırlarını göster**
- ☑ **Pasif (meçhul) çekimleri göster**
- ☑ **Fiil tablosunda cümlede kullanılan çekimi işaretle**
- ☑ **Masdar, kök ve fiil kalıbı (bab) bilgisini göster**
- ☑ **Eril/dişil şahıs ayrımını göster**

### 4.3 Ses ve Konuşma
- **Mikrofon modu:** `İki düğme (TR/AR)` (varsayılan) / `Tek düğme – otomatik algıla (deneysel)`
- **Konuşma tanıma Arapça yerel ayarı:** `ar-SA` (varsayılan) / `ar-EG` / `ar-AE` (kullanıcı konuştuğu aksana göre deneyebilsin)
- ☑ **Çeviriyi otomatik seslendir**
- **Seslendirme sesi:** cihazda yüklü Arapça sesler listelenir
- **Konuşma hızı** (0.5×–1.5×) ve **ses tonu** (kaydırıcı) + **"Dene"** düğmesi
- **Mikrofon davranışı:** basılı tut-konuş / dokun-başlat-dokun-bitir
- **Çevrimdışı ses paketi durumu:** Türkçe ✔/✘, Arapça ✔/✘ ve **"Android ses ayarlarını aç"** düğmesi
- ☑ **Titreşimle geri bildirim**

### 4.4 Kütüphane ve Eksikler Havuzu
- **Kütüphane sürümü** ve son güncelleme tarihi (salt okunur)
- **Kütüphane istatistikleri:** kelime, fiil, kalıp sayısı; doğrulanmış oranı
- **Güncellemeyi kontrol et** / **Şimdi güncelle** (GitHub Releases'ten sürümlü `.sqlite` indirir; indirmeden önce boyutu göster)
- ☑ **Açılışta güncelleme kontrolü** (yalnızca Wi-Fi seçeneğiyle)
- **Kütüphane kaynağı URL'si** (gelişmiş)
- ☑ **Eksikleri havuza kaydet** (varsayılan açık)
- **Havuz kayıt sayısı** (salt okunur) ve **en çok aranan eksikler** listesi
- **`missing.json` dışa aktar** (Documents / paylaş) · **içe aktar/birleştir** · **havuzu temizle** (onay iste)
- ☑ **İnternet varken havuzu otomatik sunucuya gönder** + **sunucu adresi**
- **Havuz üst sınırı** (ör. 10.000 kayıt; aşınca en eski/en az sayılı silinir)
- **Kullanıcı düzeltmesi:** eksik bir kayda "doğru çeviri bu olmalı" notu ekleme (`user_suggestion` alanı)

### 4.5 Çevrimdışı Mod
- **Çevrimdışı çeviri modelleri:** TR ✔/✘ · AR ✔/✘, indir/sil düğmeleri, boyut gösterimi
- ☑ **Modelleri yalnızca Wi-Fi'de indir**
- **Çevrimdışı hazır mı?** özet kartı (kütüphane ✔, çeviri modeli ✔, STT paketi ✔, TTS sesi ✔); eksik olanın yanında "Düzelt" düğmesi
- ☑ **İnternet yokken uyarı gösterme** (sessiz çevrimdışı mod)

### 4.6 Geçmiş ve Favoriler
- ☑ **Geçmişi kaydet** · **Geçmiş üst sınırı** · **Geçmişi temizle**
- **Favoriler** (yıldızla) · **Kategoriye göre pratik cümleler** (hastane, market, taksi, banka, kira, tamir, selamlaşma)

### 4.7 Gizlilik ve Veri
- Mikrofon/konuşma verisi **cihazda işlenir**; çevrimiçi çeviri ve havuz yükleme açıksa **hangi verinin nereye gittiği** açıkça yazılsın.
- ☑ **Çevrimiçi servislere metin gönderimine izin ver** (kapalıysa hiçbir metin cihazdan çıkmaz)
- **Tüm verileri yedekle / geri yükle** (ayarlar + geçmiş + favoriler + havuz)
- **Tüm verileri sil**

### 4.8 Arayüz Dili ve Erişilebilirlik
- **Uygulama arayüz dili:** Türkçe (varsayılan) · İngilizce (altyapı hazır)
- **Hareketi azalt**, **yüksek kontrast**, **büyük dokunma hedefleri**
- **Sağdan-sola (RTL) metin** yalnızca Arapça alanlarda doğru çalışmalı (`dir="rtl"`, Unicode bidi); arayüz LTR kalır. Arapça ile Türkçe/rakam karışık metinlerde bidi sorunlarını test et.

### 4.9 Geliştirici / Gelişmiş
- ☑ **Ayrıntılı günlük (debug log)** · **Günlükleri dışa aktar**
- **Çeviri kaynağı rozetini göster** (library/online/offline)
- **Doğrulanmamış çevirileri turuncu işaretle**
- **Ayarları varsayılana sıfırla**

### 4.10 Hakkında
- Uygulama sürümü, kütüphane sürümü, **açık kaynak lisanslar ve veri kaynağı atıfları** (Wiktionary CC-BY-SA, Tatoeba CC-BY vb.; **lisans gereği atıf zorunlu**), sürüm notları, geri bildirim gönderme.

> **Teknik not:** Okunuş çentiği tek bir kaynaktan (`settings.showTransliteration`) yönetilsin; tüm bileşenler bu değere abone olsun. Kapalıyken okunuş hesaplaması bile yapılmasın (performans).

---

## 5. BİLGİSAYAR TARAFI ARAÇLARI (`tools/`, Python)

Kütüphaneyi büyüten ve havuzu işleyen hat. Hepsi tekrar çalıştırılabilir (idempotent) olmalı.

1. **`ingest_wiktionary.py`:** kaikki.org Wiktionary dökümlerinden Arapça (`ar`) ve Türkçe karşılıklı kayıtlar. Harekeli yazım, kök, cins ve çoğul bilgisini al.
2. **`ingest_tatoeba.py`:** Tatoeba TR–AR (`ara`) cümle çiftleri. Lisans ve atıf bilgisini kayıtlara yaz.
3. **`build_forms.py`:** Zeyrek ile (veya benzeri Türkçe morfolojik analizör) her Türkçe mastar için çekimli hâlleri üretip `forms` tablosuna yazar. Doğrulamada rastgele 50 örneği raporla.
4. **`build_verbs.py`:** Standart Arapça fiil çekimleri üretir: 10 fiil kalıbı (I–X), aktif ve pasif, 13 şahıs. **Düzensiz fiil türlerini** (mithal, ecvef, nakıs, mudaaf, hemzeli, lefif) ayrı kural setleriyle işle ve doğrula. Mevcut açık kaynak Arapça sarf (morfoloji) araçlarını araştır (ör. CAMeL Tools, Qalsadi, Alyahmor); lisansını ve doğruluğunu kontrol ettikten sonra kullan, **çıktıyı rastgele örneklerle ve bilinen çekim tablolarıyla çapraz doğrula**. Her fiil için `verified` bayrağı tut.
5. **`build_translit.py`:** Bölüm 2.3 kurallarıyla okunuş alanlarını doldurur (duruş, i'rab'lı ve ayrıntılı üç alan); kural testlerini çalıştırır.
6. **`diacritize.py`:** Harekesiz Arapça girdileri (özellikle Tatoeba ve makine çevirisi çıktılarını) harekelendirmek için bir otomatik harekelendirme aracı kullan; sonuçları `verified=0` olarak işaretle.
7. **`process_missing.py`:** `missing.json` dosyalarını okur; `count` sırasına göre sıralar; kaynaklarda arar; bulamadıklarını **taslak** çeviri olarak bir LLM API'siyle üretir ve `review/pending.csv` dosyasına yazar (**kullanıcı onayı olmadan kütüphaneye girmez**). Onaylananlar `verified=1` ile eklenir.
8. **`build_library.py`:** Tüm verileri birleştirip şema doğrulaması yapar, `library_v{N}.sqlite` üretir, `meta` tablosunu doldurur, boyut ve istatistik raporu basar, **sürüm numarasını artırır**.
9. **`publish_release.py` (veya GitHub Actions iş akışı):** Yeni `.sqlite` dosyasını GitHub Releases'e yükler; uygulama bu sürümü indirir. APK yeniden üretmeye gerek kalmaz.

**Başlangıç veri hedefi (v1 kütüphane):** en sık 1000 kelime, 150 fiil, 300 günlük kalıp (hastane, market, taksi, kira/ev sahibi, banka, tamir, selamlaşma, pazarlık, yol sorma, sayılar, saat, günler). "Tüm kelimeler" hedefi **sürekli büyüme** demektir; bu döngü onu sağlar.

---

## 6. DOĞRULAMA VE KALİTE

- **Verified** bayrağı kritik: kullanıcı, Arapça bilen kişilerle doğrulayacaktır. `tools/export_for_review.py` ile doğrulanacak kayıtları kolay okunur CSV/HTML olarak dışa aktar (Türkçe | Arapça | okunuş | örnek).
- **Birim testleri:** tokenizer (Arapça ön ek/zamir ayırma dahil), normalizasyon, okunuş motoru (en az 100 örnek: güneş harfleri, şedde, vasl hemzesi, tā marbūta), fiil çekimi (her fiil türünden örnekler), `missing.json` birleştirme/atomik yazma, ayar göçü.
- **Altın test seti** (`tests/golden.json`): "arabaya bindim", "ne kadar?", "hesap lütfen", "bu çok pahalı", "taksi çağırır mısın?", "doktora gitmem lazım" vb. 50 cümle; beklenen çıktı yapısı (üst/alt düzen, fiil algısı, havuz kaydı) otomatik test edilsin.
- **Performans:** Arama sonucu < 100 ms, fiil penceresi < 150 ms açılış (düşük donanımlı Android'de bile). Büyük sorgularda indeks ve sayfalama kullan.
- **Erişilebilirlik:** TalkBack etiketleri, yeterli kontrast, RTL doğruluğu.

---

## 7. APK VE CI/CD

- GitHub Actions iş akışı: Node kurulumu → `npm ci` → `npm run build` → `npx cap sync android` → Gradle ile **imzalı** APK. **Keystore sabit olmalı** (her derlemede aynı imza), aksi hâlde güncelleme "paket mevcut paketle çakışıyor" hatası verir. Keystore ve şifreleri GitHub Secrets'ta tut; depoya koyma.
- `versionCode` her derlemede otomatik artsın.
- SQLite kütüphane dosyası APK içine `assets` olarak gömülür ve ilk açılışta uygulama veri klasörüne kopyalanır; sonraki sürümler GitHub Releases'ten indirilir.
- Android izinleri: `RECORD_AUDIO`, `INTERNET`, `ACCESS_NETWORK_STATE`. Depolama için Scoped Storage kullan, gereksiz geniş izin isteme.

---

## 8. AŞAMALAR (SIRAYLA UYGULA)

Her aşamanın sonunda dur, özetle, kullanıcının "devam" demesini bekle.

**Aşama 1 — İskelet ve veri:** Proje kurulumu, klasör yapısı, SQLite şeması, 200 kelime + 30 fiil örnek verisi (doğrulanabilir olanlar), ana ekranın üç alanlı düzeni (Türkçe / Arapça / kelime tablosu), ayarlar altyapısı (store + göç) ve **Türkçe okunuş çentiği**. *Kabul:* "arabaya bindim" yazınca üç alan dolu görünür; okunuş çentiği tüm ekranda okunuşu açıp kapatır.

**Aşama 2 — Fiil sistemi:** `forms` tablosu, fiil algılama, yanıp sönme vurgusu, buzlu arka planlı fiil modalı, 4 zaman × 13 şahıs tablosu (müsenna ayarla gizlenebilir), cümledeki çekimin işaretlenmesi. *Kabul:* "bindim" dokununca modal `binmek` mastarıyla açılır; geçmiş/geniş/gelecek/emir görünür; cümledeki çekim vurgulanır.

**Aşama 3 — Çeviri katmanları ve havuz:** Orkestratör (kütüphane → çevrimiçi/çevrimdışı → havuz), `missing.json` yöneticisi (sayaç, atomik yazma, dışa aktar), çevrimiçi proxy yapılandırması, çevrimdışı model entegrasyonu. *Kabul:* Kütüphanede olmayan kelime havuza yazılır, tekrarında `count` artar.

**Aşama 4 — Konuşma:** İki mikrofon düğmesi, STT (`tr-TR`, `ar-SA`), TTS, ses paketi kontrolleri ve yönlendirme, ayarlarla tam bağ. *Kabul:* Türkçe konuşunca Arapça yazı + ses; Arapça konuşunca Türkçe yazı.

**Aşama 5 — Ayarlar ekranı tamamı:** Bölüm 4'teki **tüm** grup ve seçenekler, canlı önizleme, varsayılanlara sıfırlama. *Kabul:* Her ayar çalışır ve uygulama yeniden açılınca korunur.

**Aşama 6 — Çevrimdışı ve güncelleme:** Model/ses paketi durum kartı, GitHub Releases'ten kütüphane güncelleme, sürüm karşılaştırma, hata/yarıda kesilme toleransı. *Kabul:* Uçak modunda temel çeviri ve fiil penceresi çalışır.

**Aşama 7 — Bilgisayar araç hattı:** Bölüm 5'teki scriptler, ilk 1000/150/300 veri paketi, doğrulama dışa aktarımı. *Kabul:* `build_library.py` tek komutla yeni sürüm üretir.

**Aşama 8 — Cilalama:** Geçmiş/favoriler, kategori kalıpları, erişilebilirlik, performans, CI/CD ve imzalı APK.

---

## 9. İLK GÖREV (ŞİMDİ BAŞLA)

1. Bu dosyayı oku ve **belirsiz ya da riskli gördüğün 5'ten fazla olmayan noktayı** tek mesajda kısa maddelerle sor (özellikle: çevrimiçi çeviri servisi tercihi, hedef Android sürümü, mevcut depo var mı).
2. Cevaplar gelince veya kullanıcı "varsayılanlarla devam" derse **Aşama 1'i** başlat.
3. `docs/DECISIONS.md` dosyasını oluştur ve kararlarını oraya yaz.
4. Aşama 1 bitince dur ve rapor ver.

**Başarı tanımı:** Arapça konuşulan bir ülkede biri uygulamayı açıp Türkçe cümle yazdığında, doğru ve güvenilir Standart Arapça karşılığını, kelime kelime tabloyu, isteğe bağlı Türkçe okunuşu ve dokunduğunda tam fiil çekimlerini görebilmeli; internet olmadığında da bunların büyük kısmı çalışmalı; bilmediği her şey ise sessizce havuza yazılıp ileride kütüphaneyi büyütmeli.
