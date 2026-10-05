/**
 * Sohbet okunuşu: modelden değil, uygulamanın kendi (test edilmiş) Fusha okunuş motorundan gelir.
 * Motor harekeli yazım ister; hareke yetersizse yanlış okunuş göstermek yerine hiç göstermeyiz.
 */
import { translitAr } from '../translit/index.ts';
import type { TranslitPrefs } from '../verbs/translit';
import type { ModelResult } from './types.ts';

const LETTER = /[ء-ي]/g;
const MARK = /[ً-ْٰ]/g;
/**
 * Tam harekeli metinde bile oran düşük çıkabilir: uzun ünlü harfleri (ا و ي) ve sondaki ünsüz hareke taşımaz
 * (`حَال` = 3 harf, 1 hareke). Bu yüzden ölçüt iki parçalı: toplam oran ≥ %30 VE 3+ harfli her kelimede en az bir hareke
 * (harekesiz kelime içeren cümle okunuşu yanlış olur).
 */
export const MIN_VOCALIZATION = 0.3;

export function vocalization(ar: string): number {
  const letters = (ar.match(LETTER) ?? []).length;
  return letters ? (ar.match(MARK) ?? []).length / letters : 0;
}

/** Okunuş için hareke yeterli mi? */
export function vocalizedEnough(ar: string): boolean {
  const words = ar.split(/\s+/).filter((w) => (w.match(LETTER) ?? []).length > 0);
  if (words.length === 0) return false;
  if (words.some((w) => (w.match(LETTER) ?? []).length >= 3 && (w.match(MARK) ?? []).length === 0)) return false;
  return vocalization(ar) >= MIN_VOCALIZATION;
}

/** Okunuş; hareke yetersizse boş döner. `prefs` verilmezse sade stil, duruş okunuşu. */
export function transliterate(ar: string, prefs?: TranslitPrefs): string {
  return vocalizedEnough(ar) ? translitAr(ar, prefs ?? { style: 'simple', irab: false }) : '';
}

/** Model sonucunun okunuş alanlarını (cümle ve kelimeler) motorla doldurur. */
export function withTranslit(r: ModelResult): ModelResult {
  return { ...r, translit: transliterate(r.ar), words: r.words.map((w) => ({ ...w, translit: transliterate(w.ar) })) };
}
