import { describe, expect, it } from 'vitest';
import { createSeedRepo } from '../src/core/library/seed';
import { translate } from '../src/core/translation/orchestrator';

const repo = createSeedRepo();

describe('Aşama 1 kabul: "arabaya bindim"', () => {
  const r = translate('arabaya bindim', repo);
  it('üç alan dolu: Türkçe jetonlar, Arapça çeviri, kelime tablosu', () => {
    expect(r.tokens).toEqual(['arabaya', 'bindim']);
    expect(r.arabic).toBe('رَكِبْتُ السَّيَّارَةَ');
    expect(r.translit).toBe('rakibtu es-sayyara');
    expect(r.rows).toHaveLength(2);
  });
  it('fiil algılanır (yanıp sönecek satır) ve çekim bilgisi taşır', () => {
    const verb = r.rows.find((x) => x.verb);
    expect(verb?.tr).toBe('bindim');
    expect(verb?.lemma).toBe('binmek');
    expect(verb?.tense).toBe('past');
  });
  it('kaynak kütüphane, doğrulanmamış', () => {
    expect(r.source).toBe('library');
    expect(r.matchKind).toBe('sentence');
    expect(r.verified).toBe(false);
  });
  it('büyük harf, noktalama ve Türkçe karakter eksikliğine toleranslı', () => {
    expect(translate('Arabaya Bindim.', repo).matchKind).toBe('sentence');
    expect(translate('NE KADAR?', repo).arabic).toBe('بِكَمْ');
  });
});

describe('kelime kelime ve eksikler', () => {
  it('cümle kütüphanede yoksa en uzun kalıp önce eşleşir', () => {
    const r = translate('ne zaman taksi', repo);
    expect(r.matchKind).toBe('word-by-word');
    expect(r.rows.map((x) => x.tr)).toEqual(['ne zaman', 'taksi']);
    expect(r.confidence).toBe('low');
  });
  it('çekimli fiil mastara bağlanır ve hazır çekim tablosundan doğru şahıs gelir', () => {
    const r = translate('gidiyorum', repo);
    const row = r.rows[0];
    expect(row.lemma).toBe('gitmek');
    expect(row.verb).toBe(true);
    expect(row.ar).toBe('أَذْهَبُ');
    expect(row.translit).toBe('azhab'); // i'rab kapalı: kip ünlüsü düşer
    expect(row.uncertain).toBeUndefined();
  });
  it('şahsı Arapçada belirsiz Türkçe çekim "emin değil" işaretlenir', () => {
    const row = translate('gitti', repo).rows[0];
    expect(row.ar).toBe('ذَهَبَ'); // varsayılan: o (erkek)
    expect(row.uncertain).toBe(true);
  });
  it('"sen" çekimi hitap cinsiyetine göre seçilir', () => {
    expect(translate('gittin', repo, { addressGender: 'm' }).rows[0].ar).toBe('ذَهَبْتَ');
    expect(translate('gittin', repo, { addressGender: 'f' }).rows[0].ar).toBe('ذَهَبْتِ');
  });
  it('gelecek zaman sa- önekiyle, okunuş kapalıyken hesaplanmaz', () => {
    const row = translate('gideceğim', repo, { translit: false }).rows[0];
    expect(row.ar).toBe('سَأَذْهَبُ');
    expect(row.translit).toBe('');
  });
  it('bilinmeyen kelime missingWords içine düşer', () => {
    const r = translate('su zzzxyz', repo);
    expect(r.missingWords).toEqual(['zzzxyz']);
    expect(r.matchKind).toBe('word-by-word');
  });
  it('hiç eşleşme yoksa boş Arapça ve eksik listesi', () => {
    const r = translate('qwerty asdf', repo);
    expect(r.arabic).toBe('');
    expect(r.matchKind).toBe('none');
    expect(r.missingWords).toEqual(['qwerty', 'asdf']);
  });
  it('boş girdi güvenli', () => {
    expect(translate('   ', repo).matchKind).toBe('none');
  });
  it('"sen" hitap cinsiyetine göre seçilir', () => {
    expect(translate('sen', repo, { addressGender: 'm' }).arabic).toBe('أَنْتَ');
    expect(translate('sen', repo, { addressGender: 'f' }).arabic).toBe('أَنْتِ');
  });
});
