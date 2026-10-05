import { describe, expect, it } from 'vitest';
import { conjugate, IMP_PERSONS, PERSONS, type Cell } from '../tools/arabic/conjugate';
import { toArabic } from '../tools/arabic/orthography';
import { specFor } from '../tools/arabic/roots';
import conjRaw from '../src/data/seed/conjugations.json';
import verbsRaw from '../src/data/seed/verbs.json';
import type { Conjugations } from '../src/types';

const conj = conjRaw as unknown as Record<string, Conjugations>;
const verbs = verbsRaw as { tr: string; ar: string; root: string; form: string; transitive: number; type: string }[];

const engineFor = (tr: string) => {
  const v = verbs.find((x) => x.tr === tr)!;
  const c = conj[tr];
  return conjugate(specFor(v.root, v.form, c.active.past.huwa!.rom, c.active.present.huwa!.rom)!);
};
const ar = (c: Cell) => toArabic(c);

describe('çekim verisi bütünlüğü (conjugations.json)', () => {
  it('her tohum fiilin tablosu var ve çapraz doğrulama uyumlu', () => {
    for (const v of verbs) {
      expect(conj[v.tr], v.tr).toBeDefined();
      expect(conj[v.tr].crossCheck, v.tr).toBe('match');
    }
  });
  it('etken: 4 zamanda 13 şahıs (gelecek sa- ve sawfa), emirde 5 şahıs; Türkçe karşılık dolu', () => {
    for (const v of verbs) {
      const a = conj[v.tr].active;
      for (const t of ['past', 'present', 'future', 'futureSawfa'] as const) {
        for (const p of PERSONS) {
          expect(a[t][p]?.ar, `${v.tr} ${t} ${p}`).toBeTruthy();
          expect(a[t][p]?.tr, `${v.tr} ${t} ${p} tr`).toBeTruthy();
        }
      }
      for (const p of IMP_PERSONS) expect(a.imperative[p]?.ar, `${v.tr} emir ${p}`).toBeTruthy();
    }
  });
  it('muḍāriʿ hücrelerinde Türkçe şimdiki ve geniş zaman karşılığı ayrı', () => {
    for (const v of verbs) for (const p of PERSONS) expect(conj[v.tr].active.present[p]?.trAorist, `${v.tr} ${p}`).toBeTruthy();
    expect(conj['binmek'].active.present.ana).toMatchObject({ tr: 'biniyorum', trAorist: 'binerim' });
  });
  it('edilgen yalnızca geçişli fiillerde', () => {
    for (const v of verbs) expect(!!conj[v.tr].passive, v.tr).toBe(!!v.transitive);
  });
  it('gelecek = سَ / سَوْفَ + şimdiki zaman', () => {
    const b = conj['binmek'].active;
    expect(b.future.ana?.ar).toBe('سَ' + b.present.ana?.ar);
    expect(b.futureSawfa.hum?.ar).toBe('سَوْفَ ' + b.present.hum?.ar);
  });
  it('3. şahıs ikil dişil şimdiki zamanda da ayrı hücre (تَرْكَبَانِ ≠ يَرْكَبَانِ)', () => {
    const p = conj['binmek'].active.present;
    expect(p.huma_f?.ar).toBe('تَرْكَبَانِ');
    expect(p.huma_m?.ar).toBe('يَرْكَبَانِ');
  });
});

describe('bağımsız kural motoru veriyi hücre hücre yeniden üretir', () => {
  for (const v of verbs) {
    it(`${v.tr} (${v.ar}, ${v.type})`, () => {
      const e = engineFor(v.tr);
      const d = conj[v.tr];
      const cmp = (label: string, got: Cell, cell: { ar: string; rom: string; alt?: string[] } | undefined) => {
        if (!cell) return;
        expect(got.rom, `${label} okunuş`).toBe(cell.rom);
        expect([cell.ar, ...(cell.alt ?? [])].map((s) => s.normalize('NFC')), `${label} yazım`).toContain(ar(got));
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

describe('fiil türlerine göre bilinen çekimler (motor)', () => {
  const r = (tr: string) => engineFor(tr);
  it('sahih I: kataba / yaktubu / uktub', () => {
    const e = r('yazmak');
    expect(ar(e.active.past.ana)).toBe('كَتَبْتُ');
    expect(ar(e.active.past.hum)).toBe('كَتَبُوا');
    expect(ar(e.active.present.anti)).toBe('تَكْتُبِينَ');
    expect(ar(e.active.imperative.anta)).toBe('اُكْتُبْ');
    expect(ar(e.passive.past.huwa)).toBe('كُتِبَ');
    expect(ar(e.passive.present.huwa)).toBe('يُكْتَبُ');
  });
  it('ecvef (و, u): qāla / qultu / yaqūlu / qul', () => {
    const e = r('söylemek');
    expect(e.active.past.huwa.rom).toBe('qāla');
    expect(e.active.past.ana.rom).toBe('qultu');
    expect(e.active.past.hunna.rom).toBe('qulna');
    expect(e.active.present.huwa.rom).toBe('yaqūlu');
    expect(e.active.present.hunna.rom).toBe('yaqulna');
    expect(e.active.imperative.anta.rom).toBe('qul');
    expect(e.passive.past.huwa.rom).toBe('qīla');
  });
  it('ecvef (ي, i): bāʕa / biʕtu / yabīʕu / biʕ', () => {
    const e = r('satmak');
    expect(ar(e.active.past.ana)).toBe('بِعْتُ');
    expect(ar(e.active.present.huwa)).toBe('يَبِيعُ');
    expect(ar(e.active.imperative.anta)).toBe('بِعْ');
  });
  it('ecvef bab IV: ʔarāda / ʔaradtu / yurīdu / ʔarid', () => {
    const e = r('istemek');
    expect(ar(e.active.past.ana)).toBe('أَرَدْتُ');
    expect(ar(e.active.present.ana)).toBe('أُرِيدُ');
    expect(ar(e.active.imperative.anta)).toBe('أَرِدْ');
  });
  it('nakıs (i/a): baqiya / baqītu / yabqā / ibqa', () => {
    const e = r('kalmak');
    expect(ar(e.active.past.ana)).toBe('بَقِيتُ');
    expect(ar(e.active.past.hum)).toBe('بَقُوا');
    expect(ar(e.active.present.huwa)).toBe('يَبْقَى');
    expect(ar(e.active.present.hum)).toBe('يَبْقَوْنَ');
    expect(ar(e.active.imperative.anta)).toBe('اِبْقَ');
  });
  it('nakıs bab IV: ʔaʕṭā / ʔaʕṭaytu / yuʕṭī / ʔaʕṭi', () => {
    const e = r('vermek');
    expect(ar(e.active.past.huwa)).toBe('أَعْطَى');
    expect(ar(e.active.past.ana)).toBe('أَعْطَيْتُ');
    expect(ar(e.active.present.huwa)).toBe('يُعْطِي');
    expect(ar(e.active.imperative.anta)).toBe('أَعْطِ');
    expect(ar(e.passive.present.huwa)).toBe('يُعْطَى');
  });
  it('رأى: geçmişte hemze, şimdiki ve emirde hemze düşer (yarā, ra)', () => {
    const e = r('görmek');
    expect(ar(e.active.past.huwa)).toBe('رَأَى');
    expect(ar(e.active.past.ana)).toBe('رَأَيْتُ');
    expect(ar(e.active.present.huwa)).toBe('يَرَى');
    expect(ar(e.active.imperative.anta)).toBe('رَ');
    expect(ar(e.active.imperative.antum)).toBe('رَوْا');
  });
  it('hemzeli: ʔakala / ʔākulu / kul; qaraʔa / qaraʔtu / iqraʔ', () => {
    const y = r('yemek');
    expect(ar(y.active.present.ana)).toBe('آكُلُ');
    expect(ar(y.active.imperative.anta)).toBe('كُلْ');
    expect(ar(r('almak').active.imperative.anta)).toBe('خُذْ');
    const q = r('okumak');
    expect(ar(q.active.past.ana)).toBe('قَرَأْتُ');
    expect(ar(q.active.present.huwa)).toBe('يَقْرَأُ');
    expect(ar(q.active.imperative.anta)).toBe('اِقْرَأْ');
    expect(ar(q.active.imperative.anti)).toBe('اِقْرَئِي');
  });
  it('ecvef + son hemze: jāʔa / jiʔtu / yajīʔu', () => {
    const e = r('gelmek');
    expect(ar(e.active.past.huwa)).toBe('جَاءَ');
    expect(ar(e.active.past.ana)).toBe('جِئْتُ');
    expect(ar(e.active.present.huwa)).toBe('يَجِيءُ');
    expect(ar(e.active.present.huma_m)).toBe('يَجِيئَانِ');
  });
  it('mudaaf bab IV: ʔaḥabba / ʔaḥbabtu / yuḥibbu / yuḥbibna', () => {
    const e = r('sevmek');
    expect(ar(e.active.past.huwa)).toBe('أَحَبَّ');
    expect(ar(e.active.past.ana)).toBe('أَحْبَبْتُ');
    expect(ar(e.active.present.huwa)).toBe('يُحِبُّ');
    expect(ar(e.active.present.hunna)).toBe('يُحْبِبْنَ');
  });
  it('bab V ve VIII: takallama / yatakallamu; intaẓara / yantaẓiru / intaẓir', () => {
    expect(ar(r('konuşmak').active.present.huwa)).toBe('يَتَكَلَّمُ');
    const b = r('beklemek');
    expect(ar(b.active.past.huwa)).toBe('اِنْتَظَرَ');
    expect(ar(b.active.present.huwa)).toBe('يَنْتَظِرُ');
    expect(ar(b.active.imperative.anta)).toBe('اِنْتَظِرْ');
  });
});
