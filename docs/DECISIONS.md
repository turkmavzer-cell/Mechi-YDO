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
