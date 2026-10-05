import { romanize } from './romanize.ts';
import { sentenceToTurkish, wordToTurkish, type SentenceOptions, type TurkishOptions } from './toTurkish.ts';

export type { TranslitStyle } from './toTurkish.ts';
export { romanize, romanizeWord } from './romanize.ts';
export { wordToTurkish, pausalForm, irabPausalForm } from './toTurkish.ts';

/** Harekeli Arapça metin → Türkçe harflerle okunuş. */
export function translitAr(text: string, opts: SentenceOptions = {}): string {
  return sentenceToTurkish(romanize(text), opts);
}

/** Bilimsel okunuş (ör. Wiktionary "roman" alanı) → Türkçe harfler. */
export function romanToTurkish(rom: string, opts: TurkishOptions = {}): string {
  return rom.split(' ').map((w, i, all) => wordToTurkish(w, { ...opts, pausal: opts.pausal && i === all.length - 1 })).join(' ');
}
