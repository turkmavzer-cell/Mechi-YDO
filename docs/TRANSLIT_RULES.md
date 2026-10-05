# Türkçe okunuş kuralları (Sade stil, duruş/waqf)

Aşama 1'de okunuşlar elle yazıldı ve aşağıdaki kurala uyar. Aşama 2+ okunuş motoru bu kuralları uygular; kütüphanedeki elle doğrulanmış `translit_tr` alanı her zaman kuraldan önceliklidir.

## Harfler

| Arapça | Okunuş | Arapça | Okunuş |
|---|---|---|---|
| ب | b | ص | s |
| ت | t | ض | d |
| ث | s | ط | t |
| ج | c | ظ | z |
| ح | h | ع | ' |
| خ | h | غ | ğ |
| د | d | ف | f |
| ذ | z | ق | k |
| ر | r | ك | k |
| ز | z | ل | l |
| س | s | م | m |
| ش | ş | ن | n |
| ه | h | ء أ إ ؤ ئ | ' |

## Ünlüler

- **Fetha → `a`, kesre → `i`, damme → `u`.** (`kitab`, `katabe` değil `kataba`.)
- Uzun ünlüler sade stilde de `a i u` (şapka yok); ayrıntılı stil Aşama 2+.
- **Ünlü değil ünsüz olan و ي:** ünlü işaretli ise `v` / `y` (`vahid`, `yad`).
- **İkiz ünlü (diftong):** sükûnlu `ي` önünde fetha → `ey` (`beyt`, `'eyn`); sükûnlu `و` önünde fetha → `ev` (`yevm`, `ev`).
- **Şedde:** ünsüz ikilenir (`sayyara`, `sukkar`).
- **Tā marbūta:** duruşta `a` (`madrasa`), bağlamda `at`.
- **Tenvin:** **fethatan (`ـًا`) günlük Fusha'da `-an` okunur** (`şukran`, `'afvan`, `ğadan`, `ciddan`, `ma'an`). Damme ve kesre tenvini duruşta düşer (`غَالٍ` → `ğali`). Aşama 5'te "Tenvini yaz" ayarı eklenebilir.
- **Kelime sonu (i'rab):** varsayılan **duruş** okunuşu (`kitab`, `kitabun` değil).

## Tanımlık `ال`

- Güneş harflerinde asimile: `eş-şems`, `es-sayyara`, `et-tabib`, `ez-zahab`, `es-sabt`.
- Ay harflerinde: `el-beyt`, `el-hisab`, `el-yevm`.
- Vasl hemzesi (`فِي الْبَيْتِ` → `fil-beyt`) için kural Aşama 2'de motorla birlikte eklenecek.

## Bilinen tutarsızlıklar (Aşama 1 elle verisi)

- Ayrıntılı stil (`ḥ ʿ ṣ â î û`) henüz yok; `translitStyle: 'detailed'` seçilse bile sade gösterilir.
- Aşama 2'de en az 100 örnekli birim testiyle bu kurallar motor tarafından üretilip tohum veriyle karşılaştırılacak; fark çıkan kayıtlar elle incelenecek.
