#!/usr/bin/env python3
"""Türkçe mastarlardan çekimli hâlleri üretir ve src/data/seed/forms.json dosyasına yazar.

Telefonda ağır hesap yapılmaz: uygulama yalnızca bu hazır tabloyu sorgular.
Kural tabanlıdır (Zeyrek yerine basit ve denetlenebilir). Bilinen çekimler
KNOWN altında doğrulanır; doğrulama başarısızsa dosya yazılmaz.

Kapsam: tek sözcüklü mastarlar; belirli geçmiş, şimdiki, gelecek, geniş zaman, emir.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERBS = ROOT / "src/data/seed/verbs.json"
OUT = ROOT / "src/data/seed/forms.json"

BACK = set("aıou")
ROUND = set("oöuü")
VOWELS = set("aeıioöuü")
VOICELESS = set("fstkçşhp")

# Kökü düzensiz olan mastarlar: şimdiki/gelecekte ünlü öncesi kök değişir.
SOFT = {"gitmek": "gid"}            # gidiyorum, gideceğim, gider; geçmiş: gittim
YI_DI = {"yemek": "yi", "demek": "di"}  # yiyorum, diyorum, yiyeceğim
# Tek heceli, geniş zamanı -ır/-ir/-ur/-ür alan kökler
AORIST_I = {"al", "bil", "bul", "dur", "gel", "gör", "kal", "ol", "öl", "san", "var", "ver", "vur"}


def last_vowel(s: str) -> str:
    for ch in reversed(s):
        if ch in VOWELS:
            return ch
    return "e"


def h2(v: str) -> str:
    """İki yönlü ünlü uyumu: a/e."""
    return "a" if v in BACK else "e"


def h4(v: str) -> str:
    """Dört yönlü ünlü uyumu: ı/i/u/ü."""
    if v in "aı":
        return "ı"
    if v in "ei":
        return "i"
    if v in "ou":
        return "u"
    return "ü"


def conjugate(inf: str) -> dict[str, dict[str, str]]:
    assert inf.endswith(("mek", "mak")), inf
    stem = inf[:-3]
    lv = last_vowel(stem)
    ends_vowel = stem[-1] in VOWELS
    out: dict[str, dict[str, str]] = {}

    # --- Belirli geçmiş: -dı/-di/-du/-dü (ünsüz sertleşmesi: -tı...)
    d = "t" if stem[-1] in VOICELESS else "d"
    past_base = stem + d + h4(lv)
    out["past"] = {
        "ben": past_base + "m", "sen": past_base + "n", "o": past_base,
        "biz": past_base + "k", "siz": past_base + "n" + h4(lv) + "z",
        "onlar": stem + d + h4(lv) + "l" + h2(lv) + "r",
    }

    # --- Şimdiki zaman: -(ı)yor
    if inf in YI_DI:
        pstem = YI_DI[inf]
        pres_base = pstem + "yor"
        yor_v = "o"
    elif inf in SOFT:
        pres_base = SOFT[inf] + h4(lv) + "yor"
        yor_v = "o"
    elif ends_vowel and stem[-1] in "ae":
        pres_base = stem[:-1] + h4(last_vowel(stem[:-1])) + "yor"
        yor_v = "o"
    elif ends_vowel:
        pres_base = stem + "yor"
        yor_v = "o"
    else:
        pres_base = stem + h4(lv) + "yor"
        yor_v = "o"
    u = h4(yor_v)  # 'o' -> 'u'
    out["present"] = {
        "ben": pres_base + u + "m", "sen": pres_base + "s" + u + "n", "o": pres_base,
        "biz": pres_base + u + "z", "siz": pres_base + "s" + u + "n" + u + "z",
        "onlar": pres_base + "l" + "a" + "r",
    }

    # --- Gelecek zaman: -acak/-ecek (k -> ğ ünlü önünde)
    if inf in YI_DI:
        fstem = YI_DI[inf] + "y"
        fv = last_vowel(YI_DI[inf])
        fv = "e" if inf == "demek" or inf == "yemek" else fv
    elif inf in SOFT:
        fstem, fv = SOFT[inf], lv
    elif ends_vowel:
        fstem, fv = stem + "y", lv
    else:
        fstem, fv = stem, lv
    fut_base = fstem + h2(fv) + "c" + h2(fv)
    fut_soft = fut_base + "ğ"
    fh = h4(h2(fv))  # -acak/-ecek'in kendi ünlüsüne uyar: ı / i
    out["future"] = {
        "ben": fut_soft + fh + "m", "sen": fut_base + "k" + "s" + fh + "n", "o": fut_base + "k",
        "biz": fut_soft + fh + "z", "siz": fut_base + "k" + "s" + fh + "n" + fh + "z",
        "onlar": fut_base + "k" + "l" + h2(fv) + "r",
    }
    # Not: "-acak" + "sın" => "acaksın" (k korunur); "-acağım" (ğ).

    # --- Geniş zaman
    astem = SOFT.get(inf, stem)
    if ends_vowel:
        aor_base = astem + "r"                 # okur, anlar, yaşar
    elif stem in AORIST_I or sum(ch in VOWELS for ch in stem) > 1:
        aor_base = astem + h4(lv) + "r"        # gelir, alır; çok heceli: çalışır, oturur, kapatır
    else:
        aor_base = astem + h2(lv) + "r"        # yapar, biner, içer
    # kişi ekleri 4 yönlü: -ım/-sın/-∅/-ız/-sınız/-lar
    pv = h4(last_vowel(aor_base))
    out["aorist"] = {
        "ben": aor_base + pv + "m", "sen": aor_base + "s" + pv + "n", "o": aor_base,
        "biz": aor_base + pv + "z", "siz": aor_base + "s" + pv + "n" + pv + "z",
        "onlar": aor_base + "l" + h2(last_vowel(aor_base)) + "r",
    }

    # --- Emir
    out["imperative"] = {
        "sen": stem,
        "siz": stem + ("y" if ends_vowel else "") + h4(lv) + "n",
    }
    return out


# Elle bilinen/denetlenen doğru çekimler (regresyon testi).
KNOWN = {
    "binmek": [("past", "ben", "bindim"), ("past", "sen", "bindin"), ("past", "o", "bindi"),
               ("past", "biz", "bindik"), ("past", "siz", "bindiniz"), ("past", "onlar", "bindiler"),
               ("present", "ben", "biniyorum"), ("future", "ben", "bineceğim"), ("aorist", "ben", "binerim"),
               ("imperative", "sen", "bin")],
    "gitmek": [("past", "ben", "gittim"), ("present", "ben", "gidiyorum"), ("future", "ben", "gideceğim"),
               ("aorist", "ben", "giderim"), ("present", "onlar", "gidiyorlar")],
    "gelmek": [("past", "ben", "geldim"), ("present", "sen", "geliyorsun"), ("future", "o", "gelecek"),
               ("aorist", "ben", "gelirim")],
    "yemek": [("past", "ben", "yedim"), ("present", "ben", "yiyorum"), ("future", "ben", "yiyeceğim"),
              ("aorist", "ben", "yerim")],
    "almak": [("past", "ben", "aldım"), ("present", "ben", "alıyorum"), ("future", "ben", "alacağım"),
              ("aorist", "ben", "alırım")],
    "vermek": [("past", "ben", "verdim"), ("present", "biz", "veriyoruz"), ("aorist", "ben", "veririm")],
    "görmek": [("past", "ben", "gördüm"), ("present", "ben", "görüyorum"), ("aorist", "ben", "görürüm"),
               ("future", "ben", "göreceğim")],
    "okumak": [("past", "ben", "okudum"), ("present", "ben", "okuyorum"), ("future", "ben", "okuyacağım"),
               ("aorist", "ben", "okurum")],
    "yaşamak": [("present", "ben", "yaşıyorum"), ("future", "ben", "yaşayacağım"), ("aorist", "ben", "yaşarım")],
    "yapmak": [("past", "ben", "yaptım"), ("present", "ben", "yapıyorum"), ("aorist", "ben", "yaparım")],
    "içmek": [("past", "ben", "içtim"), ("present", "ben", "içiyorum"), ("aorist", "ben", "içerim")],
    "beklemek": [("aorist", "ben", "beklerim"), ("past", "ben", "bekledim"), ("present", "ben", "bekliyorum"), ("future", "ben", "bekleyeceğim")],
    "anlamak": [("past", "ben", "anladım"), ("present", "ben", "anlıyorum"), ("aorist", "ben", "anlarım")],
    "çalışmak": [("past", "ben", "çalıştım"), ("present", "ben", "çalışıyorum"), ("aorist", "ben", "çalışırım")],
    "oturmak": [("aorist", "ben", "otururum"), ("past", "ben", "oturdum")],
    "kapatmak": [("aorist", "ben", "kapatırım"), ("past", "ben", "kapattım")],
    "öğrenmek": [("aorist", "ben", "öğrenirim"), ("future", "ben", "öğreneceğim")],
    "açmak": [("past", "ben", "açtım"), ("present", "ben", "açıyorum")],
    "söylemek": [("past", "ben", "söyledim"), ("present", "ben", "söylüyorum"), ("future", "ben", "söyleyeceğim")],
    "demek": [("past", "ben", "dedim"), ("present", "ben", "diyorum"), ("future", "ben", "diyeceğim")],
}


def main() -> int:
    verbs = json.loads(VERBS.read_text(encoding="utf-8"))
    infs = [v["tr"] for v in verbs]

    # Bilinen çekimleri doğrula (listede olmayan mastarlar da test edilir).
    errors = []
    for inf, checks in KNOWN.items():
        conj = conjugate(inf)
        for tense, person, expected in checks:
            got = conj[tense][person]
            if got != expected:
                errors.append(f"{inf} {tense} {person}: beklenen {expected!r}, üretilen {got!r}")
    if errors:
        print("DOĞRULAMA BAŞARISIZ:\n  " + "\n  ".join(errors), file=sys.stderr)
        return 1

    forms = []
    seen: set[tuple[str, str]] = set()
    for inf in infs:
        conj = conjugate(inf)
        for tense, persons in conj.items():
            for person, form in persons.items():
                key = (form, inf)
                if key in seen:
                    continue
                seen.add(key)
                forms.append({"form": form, "lemma": inf, "tense": tense, "person": person})
        # mastarın kendisi de bir "form"dur
        if (inf, inf) not in seen:
            seen.add((inf, inf))
            forms.append({"form": inf, "lemma": inf, "tense": "infinitive", "person": ""})

    OUT.write_text(json.dumps(forms, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"{len(infs)} mastar, {len(forms)} form yazıldı; {sum(len(c) for c in KNOWN.values())} bilinen grup doğrulandı.")
    # Rastgele örnek raporu
    import random
    random.seed(1)
    for f in random.sample(forms, min(15, len(forms))):
        print("  ", f["form"], "→", f["lemma"], f"({f['tense']}/{f['person']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
