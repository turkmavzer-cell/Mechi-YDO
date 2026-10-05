import { describe, expect, it } from 'vitest';
import { createSeedRepo } from '../src/core/library/seed';
import { translate } from '../src/core/translation/orchestrator';
import { normTr } from '../src/core/tokenizer/normalize';
import { conjugate, IMP_PERSONS, PERSONS, type Cell } from '../tools/arabic/conjugate';
import { toArabic } from '../tools/arabic/orthography';
import { specFor } from '../tools/arabic/roots';
import libWords from '../src/data/library/words.json';
import libVerbs from '../src/data/library/verbs.json';
import libSentences from '../src/data/library/sentences.json';
import libConj from '../src/data/library/conjugations.json';
import libForms from '../src/data/library/forms.json';
import seedWords from '../src/data/seed/words.json';
import type { Conjugations } from '../src/types';

const repo = createSeedRepo();
const HARAKAT = /[ً-ْٰ]/;
const ARABIC_ONLY = /^[؀-ۿ\s!.,،؟?\-]+$/;
const CORE = ['günlük', 'alışveriş', 'yolculuk', 'tartışma', 'iş'];
const EXTRA = ['sağlık', 'banka', 'ev', 'tamir', 'yön', 'sayılar', 'zaman'];
const CATEGORIES = [...CORE, ...EXTRA];
const conj = libConj as unknown as Record<string, Conjugations>;

interface W { tr: string; ar: string; translit: string; pos: string; category: string }
interface S { tr: string; trAlt: string[]; ar: string; arF?: string; arFKind?: string; translit: string; translitF?: string; category: string }
interface V { tr: string; ar: string; masdar: string; root: string; form: string; type: string; transitive: number; translit: string }

describe('kütüphane genişletmesi: veri bütünlüğü', () => {
  it('tüm kategoriler dolu ve hedef sayılara ulaşıldı', () => {
    const words = libWords as W[];
    for (const c of CORE) expect(words.filter((w) => w.category === c).length, c).toBeGreaterThanOrEqual(25);
    for (const c of EXTRA) expect(words.filter((w) => w.category === c).length, c).toBeGreaterThanOrEqual(10);
    expect(words.length).toBeGreaterThanOrEqual(400);
    expect((libVerbs as V[]).length).toBeGreaterThanOrEqual(80);
    expect((libSentences as S[]).length).toBeGreaterThanOrEqual(100);
  });
  it('her kelime: temiz Arapça (harf+hareke), harekeli, okunuş var ve Arapça harf içermiyor', () => {
    for (const w of libWords as W[]) {
      expect(ARABIC_ONLY.test(w.ar), `${w.tr}: ${w.ar}`).toBe(true);
      expect(HARAKAT.test(w.ar), `${w.tr} harekesiz`).toBe(true);
      expect(w.translit.length, w.tr).toBeGreaterThan(0);
      expect(/[؀-ۿ]/.test(w.translit), `${w.tr} okunuş`).toBe(false);
      expect(CATEGORIES).toContain(w.category);
    }
  });
  it('kelimelerin Türkçe anahtarı tekil ve tohumla çakışmıyor', () => {
    const seen = new Set((seedWords as string[][]).map((w) => normTr(w[0])));
    for (const w of libWords as W[]) {
      const k = normTr(w.tr);
      expect(seen.has(k), `${w.tr} tekrar`).toBe(false);
      seen.add(k);
    }
  });
  it('her cümle: harekeli temiz Arapça; okunuşta Arapça harf ve çözülmemiş "ŧ/ⁿ" işareti yok', () => {
    for (const s of libSentences as S[]) {
      for (const ar of [s.ar, s.arF].filter(Boolean) as string[]) {
        expect(ARABIC_ONLY.test(ar), `${s.tr}: ${ar}`).toBe(true);
        const letters = (ar.match(/[ء-ي]/g) ?? []).length;
        const marks = (ar.match(/[ً-ْٰ]/g) ?? []).length;
        expect(marks / letters, `${s.tr} yeterince harekeli değil`).toBeGreaterThanOrEqual(0.5);
      }
      for (const t of [s.translit, s.translitF].filter(Boolean) as string[]) {
        expect(/[؀-ۿ]|[ŧⁿʔʕ]/.test(t), `${s.tr}: ${t}`).toBe(false);
      }
      expect(CATEGORIES).toContain(s.category);
      if (s.arF) expect(['addressee', 'speaker']).toContain(s.arFKind);
    }
  });
  it('cümle anahtarları (ana + alternatifler) birbirini ezmiyor', () => {
    const owner = new Map<string, string>();
    for (const s of libSentences as S[]) {
      for (const t of [s.tr, ...s.trAlt]) {
        const k = normTr(t);
        const prev = owner.get(k);
        expect(prev === undefined || prev === s.tr, `${t} → ${prev} / ${s.tr}`).toBe(true);
        owner.set(k, s.tr);
      }
    }
  });
  it('her fiil: kök 3-4 harf, bab, masdar, okunuş; çekim tablosu ve Türkçe çekimli hâller var', () => {
    for (const v of libVerbs as V[]) {
      expect(v.root.split(' ').length, v.tr).toBeGreaterThanOrEqual(3);
      expect(v.form, v.tr).toBeTruthy();
      expect(HARAKAT.test(v.ar) && HARAKAT.test(v.masdar), v.tr).toBe(true);
      expect(v.translit.length).toBeGreaterThan(0);
      expect(conj[v.tr], `${v.tr} çekim`).toBeDefined();
      // Edilgen-only kalıplar (شُفِيَ) etken tablosu vermez: fiil penceresi boş kalırdı.
      expect(conj[v.tr].active.past.huwa, `${v.tr} etken tablosu`).toBeDefined();
      expect(repo.findForms(v.tr).length, `${v.tr} forms`).toBeGreaterThan(0);
      expect((libForms as { lemma: string }[]).some((f) => f.lemma === v.tr)).toBe(true);
    }
  });
  it('çapraz doğrulama: motorun desteklediği her fiil Wiktionary ile birebir uyumlu', () => {
    for (const v of libVerbs as V[]) {
      expect(['match', 'unsupported'], v.tr).toContain(conj[v.tr].crossCheck);
    }
  });
});

describe('kütüphane fiilleri: kural motoru veriyi yeniden üretir', () => {
  for (const v of libVerbs as V[]) {
    const d = conj[v.tr];
    if (d.crossCheck === 'unsupported') continue; // mithal/lefif/dörtlü kök: motor yok, veri yalnızca Wiktionary
    it(`${v.tr} (${v.ar}, bab ${v.form}, ${v.type})`, () => {
      const e = conjugate(specFor(v.root, v.form, d.active.past.huwa!.rom, d.active.present.huwa!.rom)!);
      const cmp = (label: string, got: Cell, cell?: { ar: string; rom: string; alt?: string[] }) => {
        if (!cell) return;
        expect(got.rom, `${label} okunuş`).toBe(cell.rom);
        expect([cell.ar, ...(cell.alt ?? [])].map((x) => x.normalize('NFC')), `${label} yazım`).toContain(toArabic(got));
      };
      for (const p of PERSONS) {
        cmp(`geçmiş ${p}`, e.active.past[p], d.active.past[p]);
        cmp(`şimdiki ${p}`, e.active.present[p], d.active.present[p]);
        if (d.passive) {
          cmp(`edilgen geçmiş ${p}`, e.passive.past[p], d.passive.past[p]);
          cmp(`edilgen şimdiki ${p}`, e.passive.present[p], d.passive.present[p]);
        }
      }
      for (const p of IMP_PERSONS) cmp(`emir ${p}`, e.active.imperative[p], d.active.imperative[p]);
    });
  }
});

describe('kütüphane çevirisi: orkestratör', () => {
  it('kelime: kütüphaneden gelir, kaynak kütüphane, doğrulanmamış', () => {
    const r = translate('maaş', repo);
    expect(r.arabic).toBe('رَاتِب');
    expect(r.source).toBe('library');
    expect(r.verified).toBe(false);
  });
  it('tohum, çakışan kütüphane kaydına üstündür', () => {
    expect(translate('banka', repo).arabic).toBe('بَنْك'); // tohum; Wiktionary مَصْرِف der
  });
  it('tam eşleşme Türkçe karakter katlamasına üstündür: su ≠ şu', () => {
    expect(translate('su', repo).arabic).toBe('مَاء');
    expect(translate('şu', repo).arabic).toBe('ذٰلِكَ');
    expect(translate('SU', repo).arabic).toBe('مَاء');
    // Türkçe karakter eksik yazılırsa katlanmış anahtar devreye girer.
    expect(translate('cay', repo).arabic).toBe('شَاي');
  });
  it('Türkçe söyleyiş alternatifi aynı cümleye gider (siz/sen biçimi)', () => {
    const a = translate('evli misin?', repo);
    const b = translate('evli misiniz', repo);
    expect(a.arabic).toBe('هَلْ أَنْتَ مُتَزَوِّج؟');
    expect(b.arabic).toBe(a.arabic);
    expect(a.matchKind).toBe('sentence');
  });
  it('karşıdakine söylenen cümle hitap cinsiyetine göre (karşıdaki kadın → dişil)', () => {
    expect(translate('iyi misin?', repo, { addressGender: 'm' }).arabic).toBe('هَلْ أَنْتَ بِخَيْر؟');
    expect(translate('iyi misin?', repo, { addressGender: 'f' }).arabic).toBe('هَلْ أَنْتِ بِخَيْر؟');
    // Konuşanın cinsiyeti hitap cümlesini değiştirmez.
    expect(translate('iyi misin?', repo, { addressGender: 'm', speakerGender: 'f' }).arabic).toBe('هَلْ أَنْتَ بِخَيْر؟');
  });
  it('konuşanın kendini anlattığı cümle konuşanın cinsiyetine göre (ben kadınım → dişil)', () => {
    expect(translate('acıktım', repo, { speakerGender: 'm' }).arabic).toBe('أَنَا جَائِع');
    expect(translate('acıktım', repo, { speakerGender: 'f' }).arabic).toBe('أَنَا جَائِعَة');
    // Hitap cinsiyeti kendini anlatan cümleyi değiştirmez.
    expect(translate('acıktım', repo, { speakerGender: 'm', addressGender: 'f' }).arabic).toBe('أَنَا جَائِع');
  });
  it('dişil biçimin okunuşu da dişil (okunuşta -a)', () => {
    expect(translate('acıktım', repo, { speakerGender: 'f' }).translit).toBe("ana ca'i'a");
  });
  it('hizalaması olmayan kütüphane cümlesinde tablo sözlükten türetilir ve tümü "~" işaretlidir', () => {
    const r = translate('kaybettim', repo);
    expect(r.rows[0]).toMatchObject({ lemma: 'kaybetmek', verb: true, ar: 'خَسِرْتُ' });
    const s = translate('anahtarlarımı kaybettim', repo);
    expect(s.matchKind).toBe('sentence');
    expect(s.rows.length).toBeGreaterThan(0);
    expect(s.rows.every((x) => x.uncertain && x.ar)).toBe(true); // bulunamayan kelimeler tabloya girmez
    expect(s.rows.some((x) => x.verb && x.lemma === 'kaybetmek')).toBe(true);
  });
  it('tohum cümlesinin elle hizalaması korunur (uncertain yok)', () => {
    const r = translate('arabaya bindim', repo);
    expect(r.rows.every((x) => !x.uncertain || x.verb)).toBe(true);
  });
  it('yeni fiil: Türkçe çekimli hâl mastara ve doğru Arapça çekime bağlanır', () => {
    const r = translate('hatırlıyorum', repo).rows[0];
    expect(r.lemma).toBe('hatırlamak');
    expect(r.ar).toBe('أَتَذَكَّرُ');
    expect(r.person).toBe('ben');
    const g = translate('kaybederim', repo).rows[0];
    expect(g.lemma).toBe('kaybetmek');
    expect(g.tense).toBe('aorist');
  });
  it('kategori kapsamı: her kategoriden bir kelime çevrilir', () => {
    for (const w of ['mutfak', 'cüzdan', 'havalimanı', 'çözüm', 'sözleşme', 'hastane', 'kredi', 'kiracı', 'çekiç', 'kavşak', 'otuz', 'şubat']) {
      expect(translate(w, repo).matchKind, w).toBe('word-by-word');
      expect(translate(w, repo).arabic, w).toBeTruthy();
    }
  });
});
