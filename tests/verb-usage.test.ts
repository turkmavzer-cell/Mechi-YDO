import { describe, expect, it } from 'vitest';
import { createSeedRepo } from '../src/core/library/seed';
import { translate } from '../src/core/translation/orchestrator';
import { findUsedForm } from '../src/core/verbs/usage';
import { cellTranslit } from '../src/core/verbs/translit';
import type { AlignRow } from '../src/types';

const repo = createSeedRepo();
const verbRow = (input: string, gender: 'm' | 'f' = 'm') =>
  translate(input, repo, { addressGender: gender }).rows.find((r) => r.verb) as AlignRow;

describe('Aşama 2 kabul: "bindim" → binmek, tüm zamanlar, kullanılan çekim', () => {
  it('"bindim" fiil olarak algılanır ve mastarı binmek', () => {
    for (const input of ['bindim', 'arabaya bindim']) {
      const row = verbRow(input);
      expect(row.tr).toBe('bindim');
      expect(row.lemma).toBe('binmek');
    }
  });
  it('fiil penceresi verisi: sözlük biçimi, masdar, kök, bab ve 4 zaman', () => {
    const verb = repo.findVerb('binmek')!;
    expect(verb.ar).toBe('رَكِبَ');
    expect(verb.masdar).toBe('رُكُوب');
    expect(verb.root).toBe('ر ك ب');
    expect(verb.form).toBe('I');
    const c = repo.findConjugations('binmek')!;
    expect(c.active.past.ana?.ar).toBe('رَكِبْتُ');
    expect(c.active.present.huwa?.ar).toBe('يَرْكَبُ');
    expect(c.active.future.huwa?.ar).toBe('سَيَرْكَبُ');
    expect(c.active.futureSawfa.huwa?.ar).toBe('سَوْفَ يَرْكَبُ');
    expect(c.active.imperative.anta?.ar).toBe('اِرْكَبْ');
  });
  it('cümledeki çekim işaretlenir: geçmiş, ben (رَكِبْتُ), birebir yazım eşleşmesi', () => {
    const u = findUsedForm(verbRow('arabaya bindim'), repo.findConjugations('binmek')!, 'm');
    expect(u).toEqual({ voice: 'active', tense: 'past', persons: ['ana'], exact: true });
  });
  it('kelime kelime "bindim" de aynı hücreyi işaretler', () => {
    const u = findUsedForm(verbRow('bindim'), repo.findConjugations('binmek')!, 'm');
    expect(u?.tense).toBe('past');
    expect(u?.persons).toEqual(['ana']);
  });
});

describe('kullanılan çekimin bulunması', () => {
  const conj = (lemma: string) => repo.findConjugations(lemma)!;
  it('olumsuzluk ekiyle (لَا أَفْهَمُ) şimdiki zaman, ben', () => {
    const u = findUsedForm(verbRow('anlamıyorum'), conj('anlamak'), 'm');
    expect(u).toMatchObject({ tense: 'present', persons: ['ana'], exact: true });
  });
  it('ضَاعَ: geçmiş, o (erkek)', () => {
    expect(findUsedForm(verbRow('telefonum kayboldu'), conj('kaybolmak'), 'm')).toMatchObject({
      tense: 'past', persons: ['huwa'], exact: true,
    });
  });
  it('aynı yazımlı hücreler Türkçe şahısla ayrışır: تَرْكَبُ = sen (erkek) veya o (kadın)', () => {
    const base: AlignRow = { tr: '', ar: 'تَرْكَبُ', translit: '', pos: 'verb', lemma: 'binmek', verb: true };
    expect(findUsedForm({ ...base, person: 'sen' }, conj('binmek'), 'm')?.persons).toEqual(['anta']);
    expect(findUsedForm({ ...base, person: 'o' }, conj('binmek'), 'm')?.persons).toEqual(['hiya']);
  });
  it('سَوْفَ ile yazılmış gelecek zaman tanınır', () => {
    const row: AlignRow = { tr: '', ar: 'سَوْفَ أَرْكَبُ', translit: '', pos: 'verb', lemma: 'binmek', verb: true, person: 'ben' };
    expect(findUsedForm(row, conj('binmek'), 'm')).toMatchObject({ tense: 'futureSawfa', persons: ['ana'] });
  });
  it('masdar (الذَّهَابِ) tabloda yoktur: hücre işaretlenmez', () => {
    const row = verbRow('doktora gitmem lazım');
    expect(row.tense).toBe('masdar');
    expect(findUsedForm(row, conj('gitmek'), 'm')).toBeUndefined();
  });
  it('yazım eşleşmezse Türkçe zaman/şahıstan tahmin edilir (exact: false)', () => {
    const row: AlignRow = { tr: 'gitti', ar: '', translit: '', pos: 'verb', lemma: 'gitmek', tense: 'past', person: 'o', verb: true };
    expect(findUsedForm(row, conj('gitmek'), 'm')).toEqual({ voice: 'active', tense: 'past', persons: ['huwa', 'hiya'], exact: false });
  });
});

describe('çekim hücresi okunuşu', () => {
  const c = repo.findConjugations('binmek')!;
  const prefs = { style: 'simple' as const, irab: false };
  it("geçmiş zaman sonu korunur, şimdiki zamanın kip ünlüsü i'rab kapalıyken düşer", () => {
    expect(cellTranslit(c.active.past.ana!, 'past', prefs)).toBe('rakibtu');
    expect(cellTranslit(c.active.present.huwa!, 'present', prefs)).toBe('yarkab');
    expect(cellTranslit(c.active.present.huwa!, 'present', { ...prefs, irab: true })).toBe('yarkabu');
  });
  it('dişil çoğul eki -na düşmez (yarkabna), -ūna duruşta -un', () => {
    expect(cellTranslit(c.active.present.hunna!, 'present', prefs)).toBe('yarkabna');
    expect(cellTranslit(c.active.present.hum!, 'present', prefs)).toBe('yarkabun');
  });
  it('gelecek: sa- bitişik, sawfa ayrı kelime', () => {
    expect(cellTranslit(c.active.future.ana!, 'future', prefs)).toBe("sa'arkab");
    expect(cellTranslit(c.active.futureSawfa.ana!, 'futureSawfa', prefs)).toBe('sevfa arkab');
  });
  it('ayrıntılı stil', () => {
    expect(cellTranslit(repo.findConjugations('içmek')!.active.past.huwa!, 'past', { style: 'detailed', irab: false })).toBe('şariba');
    expect(cellTranslit(repo.findConjugations('söylemek')!.active.present.huwa!, 'present', { style: 'detailed', irab: true })).toBe('yaḳûlu');
  });
});
