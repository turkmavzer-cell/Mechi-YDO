# Mechi-YDO — Yurt Dışı Asistanı (Türkçe ⇄ Standart Arapça)

React + Vite + TypeScript + Capacitor (Android, minSdk 29). Çevrimdışı öncelikli.

```bash
npm install
npm run dev        # tarayıcıda dene
npm test           # birim testleri
npm run build      # tsc + vite build
npx cap sync android
npm run typecheck  # src + tools + worker tip kontrolü
npm run build:content  # Wiktionary'den kelime/fiil/cümle üretir (docs/LIBRARY_REPORT.md)
npm run build:verbs   # Wiktionary'den fiil çekimleri + çapraz doğrulama raporu (docs/VERB_CROSSCHECK.md)
python3 tools/build_forms.py   # Türkçe çekim tablosunu yeniden üretir (doğrulamalı, Python gerekir)
```

Sohbet (Mısır Arapçası) için çeviri proxy'si kurulumu: `workers/translate-proxy/README.md`.

Ayrıntılar için `CLAUDE.md` ve `docs/DECISIONS.md`.
