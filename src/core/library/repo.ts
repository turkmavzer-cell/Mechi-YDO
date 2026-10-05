import type { FormEntry, Sentence, Verb, Word } from '../../types';

/**
 * Kütüphane erişim arayüzü. Aşama 1: gömülü tohum verisi (SeedRepo).
 * Aşama 3/6: aynı arayüzü SQLite (library_v{N}.sqlite) uygular; üst katmanlar değişmez.
 */
export interface LibraryRepo {
  readonly version: number;
  findSentence(trNorm: string): Sentence | undefined;
  /** Aynı Türkçe karşılığın birden çok Arapça varyantı olabilir (sen m/f). */
  findWords(trNorm: string): Word[];
  findVerb(infinitive: string): Verb | undefined;
  /** Çekimli Türkçe biçim -> mastar. */
  findForms(formNorm: string): FormEntry[];
  stats(): { words: number; verbs: number; sentences: number; forms: number };
}
