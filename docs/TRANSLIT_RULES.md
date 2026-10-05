# Türkçe okunuş kuralları

Motor: `src/core/translit/` — iki adım:
1. `romanize.ts`: harekeli Arapça → bilimsel Latin okunuş (Wiktionary biçimi: ʔ ʕ ā ī ū ḥ ḵ ṯ ḏ š ṣ ḍ ṭ ẓ ḡ q j).
   Wiktionary'nin 31 fiildeki ~6500 yazım–okunuş çiftiyle birebir test edilir.
2. `toTurkish.ts`: bilimsel okunuş → Türkçe harfler (sade / ayrıntılı), duruş ve vasl kuralları.

Kütüphanedeki elle yazılmış `translit_tr` alanı (sade + duruş) **her zaman önceliklidir**. Ayrıntılı stil veya i'rab
istenirse kütüphanede o alan olmadığı için motor harekeli Arapçadan üretir. Testler: `tests/translit.test.ts` (140+ örnek).

## Harfler

| Arapça | Sade | Ayrıntılı | Arapça | Sade | Ayrıntılı |
|---|---|---|---|---|---|
| ب | b | b | ص | s | ṣ |
| ت | t | t | ض | d | ḍ |
| ث | s | s̱ | ط | t | ṭ |
| ج | c | c | ظ | z | ẓ |
| ح | h | ḥ | ع | ' | ʿ |
| خ | h | ḫ | غ | ğ | ğ |
| د | d | d | ف | f | f |
| ذ | z | ẕ | ق | k | ḳ |
| ر | r | r | ك | k | k |
| ز | z | z | ل م ن ه | l m n h | aynı |
| س | s | s | و (ünsüz) | v | v |
| ش | ş | ş | ي (ünsüz) | y | y |
| ء أ إ ؤ ئ | ' | ʾ | | | |

## Ünlüler

- Fetha `a`, kesre `i`, damme `u` (`kataba`, `kitab`).
- Uzun ünlü: sade `a i u`, ayrıntılı `â î û`.
- **Diftong** yalnızca kısa fethadan sonra: `ay → ey`, `aw → ev` (`beyt`, `yevm`, `keyfa`, `sevfa`). Uzun ā'dan sonra diftong yok (`شَاي → şay`). Şeddeli y/w diftong değildir (`sayyara`).
- **Şedde:** ünsüz ikilenir (`sukkar`, `mudarris`).
- **Kelime başı hemze yazılmaz** (`أَكَلَ → akala`). Tanımlıktan sonra da yazılmaz (`الْآنَ → el-an`). Kelime içinde `'` (`sa'ala`, `kur'an`).
- مِائَة'deki okunmayan elif atlanır (`mi'a`). Cemi vavından sonraki elif okunmaz (`katabu`).

## Tanımlık `ال`, vasl

- Güneş harflerinde ل okunmaz, harf ikizlenir: `eş-şams`, `es-sayyara`, `et-tabib`.
- Ay harflerinde: `el-beyt`, `el-kamar`. Lam kesreli + vasl elifi: `الِاسْم → el-ism`.
- **Vasl:** ünlüyle biten kelimeden sonraki tanımlık o kelimeye bağlanır, uzun ünlü kısalır: `فِي الْبَيْتِ → fil-beyt`, `رَكِبْتُ السَّيَّارَةَ → rakibtus-sayyara`, `بِطَاقَةُ الْهُوِيَّةِ → bitakatul-huviyya`. Vaslda önceki kelime duruşa girmez.
- Tanımlık olmayan kelime başı vasl elifi: harekesi okunur, yoksa `i` (`اسْم → ism`).

## Kelime sonu: i'rab ve duruş (waqf)

Ayar: **"Kelime sonu (i'rab) harekelerini oku"** (varsayılan kapalı).

- **Açık:** Her şey yazıldığı gibi okunur (`kitabun`, `el-hisaba min fadlika`, `madrasatun`).
- **Kapalı:**
  - Tenvin: `-an` okunur (`şukran`, `ciddan`, `ma'an`); `-un / -in` düşer (`kitab`, `beyt`).
  - Tā marbūṭa: `a` (`madrasa`); harekesizse cümle içinde de `a` (`bitaka i'timan`).
  - Tanımlıklı ismin son kısa ünlüsü düşer (`el-yevm`, `el-hisab`).
  - Çok kelimeli cümlenin **son kelimesi** gerçek duruştur, son kısa ünlü düşer (`la afham`, `keyfa haluk`). Ünsüz kümesinden sonra düşmez (`-na` eki korunur).
  - **Tek kelimelik girdi sözlük biçimidir:** mebni kelimeler korunur (`huva`, `hiya`, `ma'a`, `hazihi`). Cümle içindeki tanımlıksız ve tenvinsiz kelimeler değişmez (`uridu ma'an`). Harekeli metinde yalnız yazıya bakarak i'rab ile mebni sonu ayırt etmek mümkün değil, bu yüzden motor emin olmadığı sonları silmez.
- **Fiil tabloları:** geçmiş ve emir sonları kalıbın parçasıdır, korunur (`rakiba`, `rakibtu`). Muḍāriʿ'nin kip ünlüsü i'rab kapalıyken düşer (`yarkabu → yarkab`, `yarkabūna → yarkabun`). Dişil çoğul `-na` korunur (`yarkabna`).

## Bilinen farklar (tohum veri ↔ motor)

Tohumdaki elle yazılmış okunuşlar önceliklidir; motorla farkları (kelimelerde 193/200 aynı):

- Mebni kelimelerde tohum duruş okunuşu kullanıyor (`ams`, `hunak`, `zalik`); motor sözlük biçimini (`amsi`, `hunaka`, `zalika`).
- `الْجُمُعَة`: tohum `el-cum'a` (konuşma dili), harekeye göre `el-cumu'a`.
- `غَالٍ`: tohum `ğali`, motor klasik duruş `ğal`.
- Alıntı kelime `إِنْتَرْنِت`: tohum `internet`, harekeye göre `intarnit`.
- Cümlelerde tohum vasl yapmıyor (`rakibtu es-sayyara`) ve diftongu `hayr` yazıyor; kural `rakibtus-sayyara`, `heyr`.
- Düzeltilen tohum hatası: `صَغِير` `sagir` → `sağir` (غ = ğ).
