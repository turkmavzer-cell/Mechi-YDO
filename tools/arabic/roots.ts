/** Arap harfli kök ("ر ك ب") ve sözlük başlığından motor girdisi üretir. */
import type { Form, VerbSpec } from './conjugate.ts';

const LATIN: Record<string, string> = {
  'ب': 'b', 'ت': 't', 'ث': 'ṯ', 'ج': 'j', 'ح': 'ḥ', 'خ': 'ḵ', 'د': 'd', 'ذ': 'ḏ', 'ر': 'r', 'ز': 'z', 'س': 's',
  'ش': 'š', 'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ', 'ع': 'ʕ', 'غ': 'ḡ', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
  'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'أ': 'ʔ', 'ء': 'ʔ', 'إ': 'ʔ',
};

export function rootLatin(rootAr: string): [string, string, string] | undefined {
  const r = rootAr.split(' ').map((c) => LATIN[c]);
  return r.length === 3 && r.every(Boolean) ? (r as [string, string, string]) : undefined;
}

type V = 'a' | 'i' | 'u';
const short = (c: string | undefined): V => (({ ā: 'a', ī: 'i', ū: 'u', a: 'a', i: 'i', u: 'u' } as Record<string, V>)[c ?? ''] ?? 'a');

/**
 * Bab I ünlü sınıfı, sözlük başlığının okunuşundan (geçmiş ve şimdiki 3. tekil eril) okunur:
 * rakiba / yarkabu → i / a; qāla / yaqūlu → a / u; raʔā / yarā → a / a.
 */
export function vowelClass(pastRom: string, presRom: string): { pastVowel: V; presVowel: V } {
  const p = [...pastRom];
  const pastVowel = 'āīū'.includes(p[1]) ? short(p[1]) : short(p[3]);
  const s = [...presRom.slice(2)];
  const presVowel = 'aiuāīū'.includes(s[1]) ? short(s[1]) : short(s[2]);
  return { pastVowel, presVowel };
}

export function specFor(rootAr: string, form: string, past3: string, pres3: string): VerbSpec | undefined {
  const root = rootLatin(rootAr);
  if (!root) return undefined;
  return { root, form: form as Form, ...(form === 'I' ? vowelClass(past3, pres3) : {}) };
}
