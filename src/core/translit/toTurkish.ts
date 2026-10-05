/**
 * Bilimsel Latin okunuşu (romanize.ts çıktısı veya Wiktionary "roman") Türkçe harflere çevirir.
 * Kurallar: docs/TRANSLIT_RULES.md.
 */
export type TranslitStyle = 'simple' | 'detailed';

export interface TurkishOptions {
  style?: TranslitStyle;
  /**
   * Duruş okunuşu. `true`: son kısa ünlü her durumda düşer (fiil çekim hücreleri: yarkabu → yarkab).
   * `'irab'`: yalnızca i'rab olduğu kesin sonlar düşer (tanımlıklı kelime, tenvin, tā marbūṭa);
   * huwa, maʕa, hāḏihi gibi çekimsiz (mebni) kelimeler korunur.
   */
  pausal?: boolean | 'irab';
}

const SIMPLE: Record<string, string> = {
  'ṯ': 's', 'j': 'c', 'ḥ': 'h', 'ḵ': 'h', 'ḏ': 'z', 'š': 'ş', 'ṣ': 's', 'ḍ': 'd', 'ṭ': 't',
  'ẓ': 'z', 'ʕ': "'", 'ḡ': 'ğ', 'q': 'k', 'w': 'v', 'ʔ': "'", 'ā': 'a', 'ī': 'i', 'ū': 'u', 'č': 'ç',
};
const DETAILED: Record<string, string> = {
  ...SIMPLE,
  'ṯ': 's̱', 'ḥ': 'ḥ', 'ḵ': 'ḫ', 'ḏ': 'ẕ', 'ṣ': 'ṣ', 'ḍ': 'ḍ', 'ṭ': 'ṭ', 'ẓ': 'ẓ', 'ʕ': 'ʿ',
  'q': 'ḳ', 'ʔ': 'ʾ', 'ā': 'â', 'ī': 'î', 'ū': 'û',
};

const VOWELS = new Set([...'aiuāīū']);
const SHORT = new Set([...'aiu']);

/** Tenvin ve tā marbūṭa duruşu: -aⁿ → -an, -uⁿ/-iⁿ düşer, -ŧ(v) → (madrasa). Değişiklik olduysa true. */
function caseEnding(rom: string): [string, boolean] {
  if (/ŧ(?:[aiu]ⁿ?)?$/.test(rom)) return [rom.replace(/ŧ(?:[aiu]ⁿ?)?$/, ''), true];
  if (rom.endsWith('aⁿ')) return [rom.replace(/aⁿ$/, 'an'), true];
  if (/[iu]ⁿ$/.test(rom)) return [rom.replace(/[iu]ⁿ$/, ''), true];
  return [rom, false];
}

/** Duruş okunuşu: tenvin (-aⁿ hariç) ve son kısa ünlü düşer; tā marbūṭa "a" okunur. */
export function pausalForm(rom: string): string {
  const [s0, done] = caseEnding(rom);
  if (done) return s0;
  return dropFinalVowel(s0);
}

/** I'rab duruşu: yalnızca tanımlıklı kelimenin son ünlüsü ve tenvin/tā marbūṭa. */
export function irabPausalForm(rom: string): string {
  const [s0, done] = caseEnding(rom);
  if (done) return s0;
  // Tanımlıklı isimde son kısa ünlü kesinlikle i'rabdır: ünsüz kümesinden sonra da düşer (al-yawma → al-yawm).
  return /^a[^-\s]{1,2}-/.test(s0) && /[^aiuāīū][aiu]$/.test(s0) ? s0.slice(0, -1) : s0;
}

function dropFinalVowel(s: string): string {
  const c = [...s];
  const n = c.length;
  // Son kısa ünlü, önünde tek ünsüz (VCv: yarkabu → yarkab) veya şeddeli ünsüz (ḥubbu → ḥubb) varsa düşer.
  // Ünsüz kümesinden sonra düşmez: yarkabna (dişil çoğul eki -na) olduğu gibi kalır.
  if (n > 2 && SHORT.has(c[n - 1]) && !VOWELS.has(c[n - 2]) && (VOWELS.has(c[n - 3]) || c[n - 3] === c[n - 2])) {
    s = c.slice(0, -1).join('');
  }
  return s;
}

/** Kelime başı tanımlık ("al-", "aš-") Türkçede "el-", "eş-" yazılır. */
const ARTICLE = /^a([^-\s])-/;

export function wordToTurkish(rom: string, opts: TurkishOptions = {}): string {
  const map = opts.style === 'detailed' ? DETAILED : SIMPLE;
  let s = opts.pausal === 'irab' ? irabPausalForm(rom) : opts.pausal ? pausalForm(rom) : rom;
  s = s.replace(/ŧ/g, 't').replace(/([aiu])ⁿ/g, '$1n');
  // Kelime başındaki ve tanımlıktan sonraki hemze yazılmaz (ʔakala → akala, al-ʔān → el-an).
  s = s.replace(/^ʔ/, '').replace(/^al-ʔ/, 'al-');
  const chars = [...s];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];
    // Diftong yalnızca kısa a'dan sonra (šāy → şay, bayt → beyt).
    if ((c === 'w' || c === 'y') && chars[i - 1] === 'a' && next !== c && (next === undefined || !VOWELS.has(next))) {
      // Diftong: aw → ev, ay → ey (yawm → yevm, bayt → beyt).
      out = out.slice(0, -1) + (c === 'w' ? 'ev' : 'ey');
      continue;
    }
    out += map[c] ?? c;
  }
  return out.replace(ARTICLE, 'e$1-');
}

export interface SentenceOptions extends TurkishOptions {
  /** Kelime sonu harekelerini (i'rab) oku. Kapalıyken i'rab sonları düşer (bkz. irabPausalForm). */
  irab?: boolean;
}

/**
 * Romanize edilmiş kelimeleri cümle okunuşuna birleştirir.
 * I'rab kapalıyken: cümle içinde yalnızca kesin i'rab sonları düşer; cümle sonu gerçek duruştur (waqf),
 * orada son kısa ünlü her kelimede düşer (lā ʔafhamu → la afham). Tek kelimelik girdi sözlük biçimidir.
 * Vasl: ünlüyle biten kelimeden sonra gelen tanımlık önceki kelimeye bağlanır (fī al-bayt → fil-beyt).
 */
export function sentenceToTurkish(words: string[], opts: SentenceOptions = {}): string {
  const parts: string[] = [];
  /** Her parçanın duruşa girmemiş tam hâli: vaslda bir sonraki tanımlık buna bağlanır. */
  const full: string[] = [];
  const shortenLong = (s: string) => s.replace(/ā$/, 'a').replace(/ī$/, 'i').replace(/ū$/, 'u');
  words.forEach((w, idx) => {
    const isLast = idx === words.length - 1;
    // Tek kelime sözlük biçimidir (huwa, maʕa korunur); çok kelimeli cümlenin sonu ise duruştur.
    const ir = irabPausalForm(w);
    const rom = opts.irab ? w : isLast && words.length > 1 && ir === w ? pausalForm(w) : ir;
    const m = /^a([^-\s]+)-/.exec(w);
    const prevFull = full[full.length - 1];
    // Vasl: ünlüyle biten önceki parça duruşa girmez, tanımlık ona bağlanır
    // (fī al-bayt → fil-beyt, biṭāqatu l-huwiyya → bitakatul-huviyya). Uzun ünlü kısalır.
    if (m && prevFull !== undefined && /[aiuāīū]$/.test(prevFull)) {
      const head = shortenLong(prevFull) + m[1] + '-';
      full[full.length - 1] = head + w.slice(m[0].length);
      parts[parts.length - 1] = wordToTurkish(head + rom.slice(m[0].length), { style: opts.style });
      return;
    }
    full.push(w);
    parts.push(wordToTurkish(rom, { style: opts.style }));
  });
  return parts.join(' ');
}
