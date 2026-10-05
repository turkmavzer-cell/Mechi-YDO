# Kararlar (DECISIONS.md)

Her karar: **ne**, **neden**, **alternatif**.

## Kullanıcıdan gelen kararlar (Aşama 0 soruları)

| Konu | Karar |
|---|---|
| Çevrimiçi çeviri servisi | **Claude API**, Cloudflare Worker proxy üzerinden. API anahtarı yalnızca Worker'da durur; uygulamada yalnızca proxy adresi (`VITE_TRANSLATE_PROXY_URL` / ayar) bulunur. Aşama 3'te yazılacak. |
| Hedef Android | **Android 10+ (`minSdkVersion = 29`)**. `android/variables.gradle` içinde ayarlandı. |
| Depo | GitHub: **Mechi-YDO** (hazır). |

## Aşama 1 teknik kararları

1. **Paket adı / appId: `com.mechi.ydo`.** Depo adından türetildi. Yayından önce değiştirilebilir; yayından sonra değişmez (güncelleme çakışması).
2. **Veri katmanı arayüzü (`LibraryRepo`) + gömülü tohum (`SeedRepo`).** Aşama 1'in kabulü SQLite eklentisini gerektirmez; tarayıcıda (`npm run dev`) SQLite için ek WASM kurulumu gerekir ve riskli. Bu yüzden Aşama 1'de tohum JSON doğrudan bundle'a gömülür ve aynı arayüzü Aşama 3/6'da `@capacitor-community/sqlite` ile uygulayacağız. Üst katmanlar değişmez. *Alternatif:* Aşama 1'de doğrudan SQLite; reddedildi (kurulum riski, kabul kriterine katkısı yok).
3. **SQLite şeması bu aşamada yalnızca belgede (özet `docs/` + ana prompt bölüm 3).** `build_library.py` Aşama 7'de şemayı üretir.
4. **Fiil çekimleri (`conjugations_json`) Aşama 1'de üretilmedi.** Prompt kuralı: çekimleri ezbere doldurma, veri hattından üret ve doğrula. Aşama 1 verisinde fiil başına yalnızca sözlük biçimi, masdar, kök, kalıp (bab), tür var. Arapça çekim üretici Aşama 2/7'de yazılacak (düzensiz fiil kurallarıyla).
5. **Türkçe çekimli biçimler (`forms`) kural tabanlı üretildi** (`tools/build_forms.py`). Zeyrek yerine basit, denetlenebilir kurallar: belirli geçmiş, şimdiki, gelecek, geniş zaman, emir. Üretici 71 bilinen çekim grubuyla doğrulanır; bir doğrulama tutmazsa dosya yazılmaz. Olumsuz, ettirgen, edilgen, öğrenilen geçmiş gibi çekimler henüz yok.
6. **Cümleler elle hizalanmış.** Aşama 1'de ek çözümleme isim hâllerini (arabaya, doktora) kapsamaz; bu yüzden örnek cümleler kelime-kelime hizalamasıyla tohuma yazıldı. İsim hâl çözümlemesi Aşama 7'de (`forms` genişletme).
7. **Kelime kelime birleştirme dürüstçe "güvenilmez" gösterilir** (`confidence: low`, "~" işareti, uyarı notu). Çekimli fiil, çekilmiş Arapça yerine yalnızca sözlük biçimiyle gösterilir.
8. **Tüm tohum veri `verified: false`.** UI'da "Doğrulanmamış" rozeti ve turuncu çizgi (ayardan kapatılabilir). Arapça bilen kişilerle doğrulama sonrası `verified=1` yapılacak.
9. **Yazı tipi: Noto Naskh Arabic, `@fontsource` ile paketlenir (çevrimdışı).** Diğer yazı tipi seçenekleri Aşama 5.
10. **Okunuş çentiği tek kaynak:** `settings.showTransliteration` (`useShowTranslit`). Kapalıyken okunuş sütunu ve satırı hiç render edilmez.
11. **Arayüz metinleri `src/core/i18n/tr.ts` içinde** (İngilizce altyapısı sonra aynı anahtarlarla eklenir).
12. **Aşama 1 kapsamı dışında bırakılanlar:** fiil modalı (Aşama 2), mikrofon/TTS (Aşama 4), havuz (Aşama 3), tam ayarlar (Aşama 5). Fiile dokununca "Aşama 2'de eklenecek" bilgisi çıkar.

## Açık riskler

- Arapça tohum veri (200 kelime, 31 fiil, 14 cümle) elle yazıldı ve **doğrulanmadı**. Özellikle masdar biçimleri (ör. `أَحَبَّ` → `حُبّ`, `عَاشَ` → `عَيْش`) ve cümlelerdeki sonek/okunuş uyumu Arapça bilen biri tarafından gözden geçirilmeli (`tools/export_for_review.py`, Aşama 7).
- `ar-SA` konuşma tanıma lehçeli konuşmada zayıflayabilir (Aşama 4'te ayarda belirtilecek).

## Aşama 2 teknik kararları (fiil sistemi)

1. **Çekim kaynağı: Wiktionary (kaikki.org dökümü, CC-BY-SA 4.0).** Her hücre için harekeli yazım + bilimsel okunuş alınır (`tools/fetch_wiktionary_verbs.ts` → `data/raw/kaikki/`, git dışı önbellek). *Neden:* Prompt kuralı "ezbere doldurma, veri hattından üret ve doğrula". Wiktionary'nin `ar-conj` modülü 13 şahıs × etken/edilgen × kip tablolarını düzenli fiil türleriyle birlikte üretir. *Alternatif:* CAMeL Tools / Qalsadi — bu bilgisayarda **Python kurulu değil**; Aşama 7'de değerlendirilecek.
2. **Bağımsız çapraz doğrulama: kendi kural motorumuz** (`tools/arabic/conjugate.ts` + `orthography.ts`). Babları (I–X, IX hariç) sağlam şablonla kurar, sonra mudaaf, ecvef, nakıs, hemzeli ve özel fiil (رأى، أخذ، أكل) kurallarını uygular; hemze kürsüsünü ve elif maksûreyi yazım kuralıyla seçer. Sonuç: **1621/1621 hücre birebir aynı** (`docs/VERB_CROSSCHECK.md`). Testler (`tests/verbs.test.ts`) motoru git'teki `conjugations.json` üzerinden yeniden çalıştırır, yani ham veri olmadan da CI'da kontrol edilir. Mithal (و/ي ile başlayan) ve lefif henüz desteklenmez; motor bunları `unsupported` olarak raporlar.
3. **`verified` hâlâ `false`.** Çapraz doğrulama yalnızca makine kontrolüdür (`crossCheck: 'match'`); insan doğrulamasının yerini tutmaz.
4. **Aynı hücrede birden çok geçerli yazım varsa** (ör. جَاؤُوا / جَائُوا, أَحْبِبْ / أَحِبَّ) motorla tutarlı olan ana biçim olur, diğerleri `alt` alanında gösterilir.
5. **Python yerine Node/TypeScript araçları** (`node tools/build_verbs.ts`; Node 24 TS'yi doğrudan çalıştırır). *Neden:* Bilgisayarda Python yok, yazım/okunuş motorları uygulamayla aynı kodu paylaşır. `tools/build_forms.py` olduğu gibi duruyor (Python kurulunca çalışır). *Alternatif:* Python kurmak — sistem değişikliği, kullanıcı onayı gerekir.
6. **Okunuş `rom` (bilimsel) alanından çalışma anında üretilir**, `conjugations_json` içinde Türkçe okunuşun 3–4 varyantı (sade/ayrıntılı × i'rab) saklanmaz. Dönüşüm saf bir harf eşlemesi; okunuş kapalıyken hiç çağrılmaz. *Alternatif:* her varyantı ayrı alan olarak saklamak — dosya 2–3 kat büyür.
7. **Gelecek zaman** veri hattında سَ + muḍāriʿ ve سَوْفَ + muḍāriʿ olarak iki tablo (`future`, `futureSawfa`) üretilir. Pencerede سَـ / سَوْفَ seçici var, seçim ayarlarda saklanır.
8. **Edilgen yalnızca geçişli fiillerde ve yalnızca geçmiş + muḍāriʿ'de.** Geçişsiz fiillerin edilgeni yalnızca kişisiz kullanılır (ذُهِبَ بِهِ); tabloya koymak yanıltıcı olur.
9. **Prompt düzeltmesi:** Promptta "onlar ikisi (dişil) yalnızca geçmişte ayrı" yazıyor. Doğrusu: 3. şahıs ikil dişil şimdiki zamanda da ayrı biçimdir (تَرْكَبَانِ ≠ يَرْكَبَانِ; 2. şahıs ikille aynı yazılır). Kaynak verisi böyle; tablo 13 şahsı her zamanda gösterir.
10. **Türkçe sütun:** Türkçede ikil ve cinsiyet yok. İkil ve dişil satırlar Türkçenin ortak biçimini kullanır (siz ikiniz → "bindiniz"). Şimdiki zaman için Türkçe şimdiki zaman (-yor) gösterilir.
11. **Cümlede kullanılan çekim:** Önce satırın Arapçasındaki kelimeler (لَا gibi ekler dahil) tablo hücreleriyle birebir karşılaştırılır. Eşleşme yoksa Türkçe zaman/şahıstan aday hücreler işaretlenir ve "tahmin" notu gösterilir. Masdar kullanımında masdar alanı vurgulanır.
12. **Kelime kelime çeviride çekimli fiil** artık sözlük biçimi yerine tablodaki doğru hücreden gelir (gidiyorum → أَذْهَبُ). Türkçe şahıs Arapçada belirsizse (o, siz, onlar) satır "~" alır; varsayılan eril tekil / eril çoğuldur.
13. **Modal: `<dialog closedby="any">` + `showModal()`.** Odak tuzağı, Esc ve Android geri hareketi yerleşik. `closedby` desteklemeyen tarayıcı için dışarı dokunma yedek kodu var. Bulanıklık `::backdrop` üzerine satır içi `<style>` ile yazılır (eski WebView'de `::backdrop` CSS değişkeni miras almayabilir). X ve aşağı kaydırma bileşeni doğrudan kapatır; `close` olayına bağlı kalmaz (sayfa arka plandayken bu olay gecikebiliyor).
14. **Ayarlar v2:** okunuş stili, i'rab, hitap ve fiil penceresi ayarları eklendi; `migrateSettings` geçersiz seçenek/aralık değerlerini varsayılana düşürür.
15. **Ana ekran sekme değişiminde korunur** (Ayarlar'a gidip dönünce çeviri kaybolmuyordu → iki ekran da bağlı, gizle/göster).
16. **Paket boyutu:** `conjugations.json` ~170 KB (gzip'li toplam JS 116 KB). 150 fiile çıkınca (Aşama 7) SQLite'a taşınacak; o zamana kadar bundle içinde.

### Açık riskler (Aşama 2)

- Wiktionary tabloları da insan yapımıdır. 31 fiil Arapça bilen biri tarafından `docs/VERB_CROSSCHECK.md` + uygulama üzerinden gözden geçirilmeli.
- Tohum okunuşları motorla: kelimelerde 193/200, cümlelerde 7/14 aynı. Farklar kural farkıdır: tohum vasl yapmıyor (`rakibtu es-sayyara` ↔ motor `rakibtus-sayyara`) ve diftongu `hayr` yazıyor (kural `heyr`). Kütüphane alanı öncelikli olduğu için ekranda tohum biçimi görünür. Doğrulama sırasında tek kurala çekilmeli.

## Fiil penceresi düzeni (kullanıcı iskeleti, 2026-10-05)

1. **Sekmeler:** Geçmiş zaman · Şimdiki / geniş zaman · Gelecek zaman · Emir kipi (eşit kutular, dar ekranda iki satıra iner).
2. **Şimdiki ve geniş zaman tek sekme** (kullanıcı kararı): Arapçada ikisi aynı biçimdir (muḍāriʿ). Her kutuda iki Türkçe anlam birlikte verilir ("biniyor / biner"; `tr` + `trAorist`). Önceki ayrı "Geniş zaman" sekmesi ve `verbShowAorist` ayarı kaldırıldı (ayarlar v4).
3. **Izgara:** satırlar [çoğul | ikil | tekil] → hum/huma/hüve · hunne/huma/hiye · entum/entuma/ente · entunne/entuma/enti · nahnu/nahnu/ene. Entuma (eril/dişil aynı) 3. ve 4. satırda, nahnu (1. şahısta ikil yok) 5. satırın iki hücresinde tekrar eder. Her kutuda: zamir (Türkçe harfli + Arapça), Arapça çekim, Türkçe okunuş (ayara bağlı), Türkçe anlam.
4. Ayarlar: "Müsenna" kapalıyken ikil sütunu, "Eril/dişil ayrımı" kapalıyken dişil satırlar gizlenir. Emir kipinde yalnızca 2. şahıs satırları gösterilir.
