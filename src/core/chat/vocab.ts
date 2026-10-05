import type { ModelWord, VocabEntry } from './types.ts';

const HARAKAT = /[ً-ٰٟـ]/g;

/**
 * Kelime anahtarı: hareke/tatweel atılır, elif/ya/ta marbuta varyantları birleştirilir, boşluk tekilleşir.
 * Yalnızca aynı kelimeyi tekrar tanımak içindir; görüntülenen yazım orijinal kalır.
 */
export function vocabKey(ar: string): string {
  return ar
    .normalize('NFC')
    .replace(HARAKAT, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_ALT = 3;
const sameText = (a: string, b: string) => a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');

export interface MergeResult {
  entries: VocabEntry[];
  /** Bu çağrıda ilk kez eklenenler. */
  added: VocabEntry[];
  /** Zaten var olup sayacı artanların anahtarları. */
  seen: string[];
}

/**
 * Yeni kelimeleri sözlüğe birleştirir. Aynı anahtar tekrar gelirse yeni kayıt açılmaz: `count` artar,
 * `lastSeen` güncellenir, farklı bir Türkçe anlam `altTr`'ye eklenir, boş örnek varsa doldurulur.
 * Girdi diziyi değiştirmez.
 */
export function mergeVocab(entries: VocabEntry[], words: ModelWord[], nowIso: string): MergeResult {
  const next = entries.map((e) => ({ ...e, altTr: [...e.altTr] }));
  const index = new Map(next.map((e) => [e.key, e]));
  const added: VocabEntry[] = [];
  const seen: string[] = [];
  const touched = new Set<string>();

  for (const w of words) {
    const key = vocabKey(w.ar);
    if (!key || touched.has(key)) continue; // aynı turda tekrarlayan kelime iki kez sayılmaz
    touched.add(key);
    const existing = index.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = nowIso;
      if (!sameText(existing.tr, w.tr) && !existing.altTr.some((a) => sameText(a, w.tr)) && existing.altTr.length < MAX_ALT) {
        existing.altTr.push(w.tr);
      }
      if (!existing.exampleAr && w.example_ar) {
        existing.exampleAr = w.example_ar;
        existing.exampleTr = w.example_tr;
      }
      if (!existing.translit && w.translit) existing.translit = w.translit;
      seen.push(key);
    } else {
      const entry: VocabEntry = {
        key, ar: w.ar, translit: w.translit, tr: w.tr, altTr: [], pos: w.pos,
        exampleAr: w.example_ar, exampleTr: w.example_tr, count: 1, firstSeen: nowIso, lastSeen: nowIso,
        verified: false, source: 'chat-ar',
      };
      index.set(key, entry);
      next.push(entry);
      added.push(entry);
    }
  }
  return { entries: next, added, seen };
}
