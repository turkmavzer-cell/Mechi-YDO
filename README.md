# Mechi-YDO — Yurt Dışı Asistanı (Türkçe ⇄ Standart Arapça)

React + Vite + TypeScript + Capacitor (Android, minSdk 29). Çevrimdışı öncelikli.

```bash
npm install
npm run dev        # tarayıcıda dene
npm test           # birim testleri
npm run build      # tsc + vite build
npx cap sync android
npm run typecheck  # src + tools tip kontrolü
npm run build:verbs   # Wiktionary'den fiil çekimleri + çapraz doğrulama raporu (docs/VERB_CROSSCHECK.md)
python3 tools/build_forms.py   # Türkçe çekim tablosunu yeniden üretir (doğrulamalı, Python gerekir)
```

Ayrıntılar için `CLAUDE.md` ve `docs/DECISIONS.md`.
