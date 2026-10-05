/**
 * Harekeli Arapça yazıyı bilimsel Latin okunuşa çevirir (Wiktionary/kaikki biçimiyle uyumlu):
 *   ʔ hemze, ʕ ayn, ā ī ū uzun ünlü, ikizlenmiş ünsüz (şedde) iki harf, ḥ ḵ ṯ ḏ š ṣ ḍ ṭ ẓ ḡ q j.
 * Ek işaretler: ŧ = tā marbūṭa (duruşta düşer), ⁿ = tenvin (ör. "kitābuⁿ"),
 *   tanımlık "al-" / güneş harfinde "aš-" gibi tire ile ayrılır.
 * Türkçe harflere çeviri `toTurkish.ts` içindedir. Harekesiz metinde ünlü tahmin edilmez.
 */

const CONS: Record<string, string> = {
  'ب': 'b', 'ت': 't', 'ث': 'ṯ', 'ج': 'j', 'ح': 'ḥ', 'خ': 'ḵ', 'د': 'd', 'ذ': 'ḏ', 'ر': 'r',
  'ز': 'z', 'س': 's', 'ش': 'š', 'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ', 'ع': 'ʕ', 'غ': 'ḡ',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
  'أ': 'ʔ', 'إ': 'ʔ', 'ؤ': 'ʔ', 'ئ': 'ʔ', 'ء': 'ʔ', 'پ': 'p', 'چ': 'č', 'ڤ': 'v', 'گ': 'g',
};

/** Arapça noktalama → Latin karşılığı. */
const PUNCT: Record<string, string> = { '؟': '?', '،': ',', '؛': ';', '۔': '.' };

/** Güneş harfleri: tanımlık ل bu harflerde okunmaz, harf ikizlenir. */
export const SUN_LETTERS = new Set([...'تثدذرزسشصضطظلن']);

const FATHA = 'َ', DAMMA = 'ُ', KASRA = 'ِ', SUKUN = 'ْ', SHADDA = 'ّ';
const FATHATAN = 'ً', DAMMATAN = 'ٌ', KASRATAN = 'ٍ';
const DAGGER = 'ٰ', MADDA = 'ٓ', HAMZA_ABOVE = 'ٔ', HAMZA_BELOW = 'ٕ';
const TATWEEL = 'ـ';
const MARKS = new Set([FATHA, DAMMA, KASRA, SUKUN, SHADDA, FATHATAN, DAMMATAN, KASRATAN, DAGGER, MADDA, HAMZA_ABOVE, HAMZA_BELOW]);

interface Unit {
  ch: string;
  vowel: '' | 'a' | 'i' | 'u' | 'aⁿ' | 'iⁿ' | 'uⁿ' | 'sukun';
  shadda: boolean;
  dagger: boolean;
}

function parse(word: string): Unit[] {
  const units: Unit[] = [];
  for (const c of word.normalize('NFC')) {
    if (c === TATWEEL) continue;
    if (MARKS.has(c)) {
      const u = units[units.length - 1];
      if (!u) continue;
      if (c === SHADDA) u.shadda = true;
      else if (c === FATHA) u.vowel = 'a';
      else if (c === KASRA) u.vowel = 'i';
      else if (c === DAMMA) u.vowel = 'u';
      else if (c === SUKUN) u.vowel = 'sukun';
      else if (c === FATHATAN) u.vowel = 'aⁿ';
      else if (c === KASRATAN) u.vowel = 'iⁿ';
      else if (c === DAMMATAN) u.vowel = 'uⁿ';
      else if (c === DAGGER) u.dagger = true;
      else if (c === MADDA && u.ch === 'ا') u.ch = 'آ';
      else if (c === HAMZA_ABOVE) u.ch = u.ch === 'ا' ? 'أ' : u.ch === 'و' ? 'ؤ' : u.ch === 'ي' || u.ch === 'ى' ? 'ئ' : u.ch;
      else if (c === HAMZA_BELOW && u.ch === 'ا') u.ch = 'إ';
      continue;
    }
    units.push({ ch: c, vowel: '', shadda: false, dagger: false });
  }
  return units;
}

const vowelOut = (v: Unit['vowel']) => (v === 'sukun' ? '' : v);

/** Tek bir Arapça kelimeyi Latin okunuşa çevirir. Arap harfi olmayan karakterler olduğu gibi kalır. */
export function romanizeWord(word: string): string {
  const units = parse(word);
  let out = '';
  let i = 0;

  // Tanımlık "ال": güneş harfinde asimilasyon (aš-šams), ay harfinde al-.
  // Tek harfli ön ek (ب ك ف و ل) + tanımlıkta elif düşer: بِالْبَيْت → bil-bayt, بِالتَّأْكِيد → bit-taʔkīd.
  const isAlif = (c?: string) => c === 'ا' || c === 'ٱ';
  const PROCLITIC = new Set(['ب', 'ك', 'ف', 'و', 'ل']);
  const hasPrefix =
    PROCLITIC.has(units[0]?.ch) && ['a', 'i', 'u'].includes(units[0].vowel) && !units[0].shadda &&
    isAlif(units[1]?.ch) && units[2]?.ch === 'ل' && units.length > 3;
  const at = hasPrefix ? 1 : 0;
  const lead = hasPrefix ? CONS[units[0].ch] + units[0].vowel : '';
  if (isAlif(units[at]?.ch) && units[at + 1]?.ch === 'ل' && units.length > at + 2) {
    const lamVowel = units[at + 1].vowel;
    const next = units[at + 2];
    // Ön ekli biçimde elif düştüğü için tanımlık "l-" / "š-" olarak başlar ("a" yalnızca ön eksizde).
    const art = (x: string) => (hasPrefix ? x : 'a' + x);
    if (lamVowel === 'i' && isAlif(next.ch)) {
      // الِاسْم / الِاثْنَيْن: tanımlıktan sonra vasl elifi, lam kesreyle bağlanır → al-ism.
      out = lead + art('l-') + 'i';
      i = at + 3;
    } else if (lamVowel === '' || lamVowel === 'sukun') {
      if (SUN_LETTERS.has(next.ch) && next.shadda) {
        // Güneş harfi: ل okunmaz, harf ikizlenir (aš-šams). Şedde tanımlığa aittir, bir kez yazılır.
        out = lead + art(CONS[next.ch] + '-');
        next.shadda = false;
      } else {
        out = lead + art('l-');
      }
      i = at + 2;
    }
  }

  for (; i < units.length; i++) {
    const u = units[i];
    const prev = units[i - 1];
    const atStart = out === '' || out.endsWith('-');
    const c = u.ch;

    if (c === 'ا' || c === 'ٱ') {
      if (out === '') {
        // Kelime başı vasl elifi: harekesi okunur; yoksa "i" varsayılır (اسْم → ism).
        const v = vowelOut(u.vowel);
        out += v === 'a' || v === 'u' ? v : 'i';
      } else if (prev && prev.vowel === 'aⁿ') {
        // ـًا: tenvin elifi okunmaz.
      } else if (out.endsWith('ū') && i === units.length - 1) {
        // كَتَبُوا: cemi vavından sonraki elif okunmaz.
      } else if (out.endsWith('w') && prev?.ch === 'و' && i === units.length - 1) {
        // رَمَوْا: aynı kural (diftong sonrası).
      } else if (u.vowel === 'aⁿ') {
        out += 'aⁿ';
      } else if (out.endsWith('i') && units[i + 1]?.ch === 'ئ') {
        // مِائَة: yazılıp okunmayan elif (mi'a).
      } else if (out.endsWith('a')) {
        out = out.slice(0, -1) + 'ā';
      } else {
        out += 'ā';
      }
      continue;
    }
    if (c === 'آ') {
      out += 'ʔā';
      continue;
    }
    if (c === 'ى') {
      if (u.vowel === 'aⁿ' || prev?.vowel === 'aⁿ') {
        if (!out.endsWith('aⁿ')) out += 'aⁿ';
      } else if (out.endsWith('a')) out = out.slice(0, -1) + 'ā';
      else if (out.endsWith('i')) out = out.slice(0, -1) + 'ī';
      else out += 'ā';
      continue;
    }
    if (c === 'ة') {
      const v = vowelOut(u.vowel);
      out += 'ŧ' + v;
      continue;
    }
    if ((c === 'و' || c === 'ي') && !u.shadda && (u.vowel === '' || u.vowel === 'sukun') && !atStart) {
      const longFrom = c === 'و' ? 'u' : 'i';
      if (out.endsWith(longFrom)) {
        out = out.slice(0, -1) + (c === 'و' ? 'ū' : 'ī');
        continue;
      }
      out += CONS[c];
      if (u.dagger) out += 'ā';
      continue;
    }
    const cons = CONS[c];
    if (!cons) {
      out += PUNCT[c] ?? c;
      continue;
    }
    out += u.shadda ? cons + cons : cons;
    let v: string = vowelOut(u.vowel);
    if (c === 'إ' && !v) v = 'i';
    if (u.dagger) v = 'ā';
    out += v;
  }
  return out;
}

/** Cümleyi kelime kelime romanize eder (boşluklar korunur). */
export function romanize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean).map(romanizeWord);
}
