# Çeviri proxy'si (Cloudflare Worker)

Uygulamadaki **Sohbet** sekmesi (Türkçe ⇄ Fusha) bu Worker üzerinden Claude'u çağırır.
Kütüphanede olan cümle ve kelimeler Worker'a hiç gitmez (yerelde, ücretsiz çevrilir); yalnızca kütüphanede olmayanlar ve "karşımdaki dedi" (Arapça → Türkçe) metinleri buraya gelir.
Claude API anahtarı **yalnızca burada** durur; uygulamaya, APK'ya ve GitHub'a girmez.

| Uç nokta | İş |
|---|---|
| `GET /health` | Bağlantı denemesi (Ayarlar → Sohbet → "Bağlantıyı dene") |
| `POST /translate` | Bir sohbet turunu çevirir (Fusha, tam harekeli) + öğrenilecek kelimeleri çıkarır |

## Kurulum (bir kez, ~10 dakika)

Gerekenler: ücretsiz [Cloudflare hesabı](https://dash.cloudflare.com/sign-up), [Anthropic API anahtarı](https://platform.claude.com/), Node.js.

```bash
cd workers/translate-proxy
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # anahtarı yapıştır (ekranda görünmez)
npx wrangler deploy
```

`deploy` sonunda bir adres yazar: `https://mechi-translate-proxy.<hesabın>.workers.dev`

Uygulamada: **Ayarlar → Sohbet (Fusha)** → adresi yapıştır → **Bağlantıyı dene** → "Metni Claude'a göndermeye izin ver"i aç.

### İsteğe bağlı: uygulama anahtarı

Adresi bilen herkes Worker'ı (ve senin API krediini) kullanabilir. Küçük bir engel için:

```bash
npx wrangler secret put APP_TOKEN        # rastgele uzun bir metin
```

Aynı değeri uygulamada **Uygulama anahtarı** alanına yaz. Not: bu anahtar telefondaki uygulamada durur, bu yüzden güçlü bir koruma değildir.
Asıl koruma: Cloudflare panelinde **Security → WAF → Rate limiting** ile bu Worker için dakikada istek sınırı koy,
Anthropic konsolunda da aylık harcama sınırı belirle.

## Yapılandırma (`wrangler.toml`)

| Değişken | Anlamı |
|---|---|
| `MODEL` | Varsayılan `claude-opus-5-5`. Daha hızlı/ucuz için `claude-sonnet-5-5` yazabilirsin. |
| `ALLOWED_ORIGINS` | Hangi kaynaklar çağırabilir. Android uygulaması `https://localhost` olarak görünür; geliştirme sunucusu `http://localhost:5173`. Kendi LAN adresinle denemek istersen ekle (ör. `http://192.168.0.116:5173`). |

## Maliyet (tahmini)

Her tur bir Claude çağrısıdır: ~1.000 giriş + ~500 çıkış token. Claude Opus 5.5 fiyatıyla ($4 / $20 milyon token) tur başına yaklaşık **1–2 cent**;
Sonnet 5.5 ile yaklaşık yarısı. Gerçek rakam için Anthropic konsolundaki kullanım ekranına bak.

## Güvenlik notları

- İstemci sistem istemini değiştiremez: istem Worker'da sabittir, uç nokta yalnızca çeviri yapar.
- İstek sınırları: metin ≤ 600 karakter (aşarsa **reddedilir**, sessizce kesilmez), bağlam ≤ 6 tur, gövde ≤ 12 KB.
- Hata ayrıntıları (anahtar/hesap bilgisi olabilir) istemciye sızdırılmaz, yalnızca hata kodu döner.
- Kullanıcı metni her zaman "çevrilecek veri"dir; model içindeki talimatlara uymaz.
- Sunucu hiçbir şeyi saklamaz (veritabanı/log yok). Metin yalnızca Claude'a iletilir.

## Yerelde deneme

```bash
npx wrangler dev        # http://localhost:8787
```

`ANTHROPIC_API_KEY` için `.dev.vars` dosyası oluştur (git'e girmez): `ANTHROPIC_API_KEY=sk-ant-...`
