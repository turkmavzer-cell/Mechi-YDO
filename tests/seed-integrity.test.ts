import { describe, expect, it } from 'vitest';
import { createSeedRepo } from '../src/core/library/seed';
import wordsRaw from '../src/data/seed/words.json';
import verbsRaw from '../src/data/seed/verbs.json';
import sentencesRaw from '../src/data/seed/sentences.json';

const repo = createSeedRepo();
const HARAKAT = /[\u064B-\u0652]/;
const ARABIC = /[\u0600-\u06FF]/;

describe('tohum veri bütünlüğü', () => {
  it('Aşama 1 hedefi: en az 200 kelime ve 30 fiil', () => {
    const s = repo.stats();
    expect(s.words).toBeGreaterThanOrEqual(200);
    expect(s.verbs).toBeGreaterThanOrEqual(30);
  });
  it('her kelimede Arapça harf, okunuş ve tür var; Arapça harekeli', () => {
    for (const [tr, ar, translit, pos] of wordsRaw as unknown as string[][]) {
      expect(ARABIC.test(ar), tr).toBe(true);
      expect(translit.length, tr).toBeGreaterThan(0);
      expect(pos, tr).toBeTruthy();
      expect(HARAKAT.test(ar) || ar.length <= 2, `${tr} harekesiz`).toBe(true);
    }
  });
  it('okunuşta Arapça harf veya hatalı sembol yok', () => {
    for (const [tr, , translit] of wordsRaw as unknown as string[][]) {
      expect(ARABIC.test(translit), tr).toBe(false);
    }
  });
  it('her fiilin Türkçe mastarı için çekim formları üretilmiş', () => {
    for (const v of verbsRaw as { tr: string }[]) {
      expect(repo.findForms(v.tr).length, v.tr).toBeGreaterThan(0);
    }
  });
  it('cümlelerdeki her fiil satırının mastarı fiil tablosunda var', () => {
    for (const s of sentencesRaw as { tr: string; align: { verb?: boolean; lemma?: string }[] }[]) {
      for (const r of s.align) {
        if (r.verb) expect(repo.findVerb(r.lemma!), `${s.tr}: ${r.lemma}`).toBeDefined();
      }
    }
  });
  it('tohum verinin hiçbir kaydı doğrulanmış sayılmaz', () => {
    expect(repo.findSentence('arabaya bindim')?.verified).toBe(false);
    expect(repo.findWords('su')[0].verified).toBe(false);
  });
});
