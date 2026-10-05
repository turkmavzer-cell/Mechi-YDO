# Veri kaynakları ve lisanslar

| Aşama | Kaynak | Lisans | Durum |
|---|---|---|---|
| 1 | Elle yazılmış tohum veri (`src/data/seed/words.json`, `verbs.json`, `sentences.json`) | Proje içi | **Doğrulanmadı** (`verified: false`) |
| 1 | `forms.json` — `tools/build_forms.py` ile kural tabanlı üretim | Proje içi | Bilinen 71 çekim grubuyla doğrulandı |
| 2 | **Wiktionary Arapça fiil çekim tabloları** (kaikki.org / wiktextract dökümü) → `src/data/seed/conjugations.json` | **CC-BY-SA 4.0 — atıf zorunlu** (fiil penceresinde ve Hakkında ekranında) | Kendi kural motorumuzla 1621/1621 hücre uyumlu; **insan doğrulaması bekliyor** |
| 2 | Tohum fiillerin anlam ve masdar kontrolü (Wiktionary) | CC-BY-SA 4.0 | 31/31 anlam uyumlu; tohumdaki masdarların hepsi Wiktionary masdar listesinde |
| 7 | Wiktionary sözlük dökümleri (kaikki.org) | CC-BY-SA | Planlandı; **atıf zorunlu** |
| 7 | Tatoeba TR–AR cümleleri | CC-BY 2.0 FR | Planlandı; **atıf zorunlu** |
| — | Noto Naskh Arabic (`@fontsource`) | SIL OFL 1.1 | Kullanımda |

Atıf metni (Hakkında, Aşama 5/8): "Arapça fiil çekimleri Wiktionary'den (https://en.wiktionary.org) alınmıştır, CC BY-SA 4.0. Döküm: kaikki.org (Tatu Ylonen, wiktextract)."

Ham indirmeler `data/raw/kaikki/` altındadır (git dışı). Yeniden üretmek için: `npm run build:verbs`.

## Sohbet kelime defteri (Mısır Arapçası)

| Kaynak | Lisans / koşul | Durum |
|---|---|---|
| Claude (Anthropic API) çıktısı: çeviri, okunuş, örnek cümle | Üretilen metin kullanıcıya aittir; Anthropic kullanım koşulları geçerlidir | **Doğrulanmamış**; Mısırlı konuşmacıyla doğrulanmadan kütüphaneye girmez |
