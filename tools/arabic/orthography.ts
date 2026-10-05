/**
 * Bilimsel Latin okunuş → harekeli Arap yazısı (fiil çekimleri için).
 * Kurallar: ikizlenmiş ünsüz = şedde, harekesiz ünsüz = sükûn, kelime başı ünlü = vasl elifi (اِ / اُ),
 * hemze kürsüsü (أ إ ؤ ئ ء آ) ünlü önceliğine göre (i > u > a), uzun ā sonda kökten geliyorsa ى,
 * cemi vavından sonra elif.
 */
import type { Cell } from './conjugate.ts';

const LETTER: Record<string, string> = {
  b: 'ب', t: 'ت', 'ṯ': 'ث', j: 'ج', 'ḥ': 'ح', 'ḵ': 'خ', d: 'د', 'ḏ': 'ذ', r: 'ر', z: 'ز', s: 'س',
  'š': 'ش', 'ṣ': 'ص', 'ḍ': 'ض', 'ṭ': 'ط', 'ẓ': 'ظ', 'ʕ': 'ع', 'ḡ': 'غ', f: 'ف', q: 'ق', k: 'ك',
  l: 'ل', m: 'م', n: 'ن', h: 'ه', w: 'و', y: 'ي',
};
const FATHA = 'َ', DAMMA = 'ُ', KASRA = 'ِ', SUKUN = 'ْ', SHADDA = 'ّ';
const SHORT_MARK: Record<string, string> = { a: FATHA, i: KASRA, u: DAMMA };

type Vow = '' | 'a' | 'i' | 'u' | 'ā' | 'ī' | 'ū';
interface Syl { c: string; gem: boolean; v: Vow }

const isV = (ch: string | undefined): ch is Vow => !!ch && 'aiuāīū'.includes(ch);

function parse(rom: string): { lead: Vow; syl: Syl[] } {
  const ch = [...rom];
  let i = 0;
  let lead: Vow = '';
  if (isV(ch[0])) {
    lead = ch[0];
    i = 1;
  }
  const syl: Syl[] = [];
  while (i < ch.length) {
    const c = ch[i];
    if (isV(c)) throw new Error(`Beklenmeyen ünlü: ${rom}`);
    let gem = false;
    if (ch[i + 1] === c) {
      gem = true;
      i++;
    }
    const v = isV(ch[i + 1]) ? (ch[i + 1] as Vow) : '';
    syl.push({ c, gem, v });
    i += v ? 2 : 1;
  }
  return { lead, syl };
}

/** Hemze kürsüsü. prev = önceki hecenin ünlüsü ('' = sükûn). */
function hamzaSeat(prev: Vow | 'start', own: Vow, isFinal: boolean): string {
  if (prev === 'start') return own === 'i' || own === 'ī' ? 'إ' : own === 'ā' ? 'آ' : 'أ';
  // ʔā → آ; ancak kesreden sonra ئَا (tajīʔāni → تَجِيئَانِ, quriʔā → قُرِئَا), ā'dan sonra ءَا.
  if (own === 'ā' && prev !== 'ā' && prev !== 'i' && prev !== 'ī') return 'آ';
  if (isFinal && (own === '' || own === 'a' || own === 'i' || own === 'u')) {
    if (prev === 'a') return 'أ';
    if (prev === 'i') return 'ئ';
    if (prev === 'u') return 'ؤ';
    return 'ء';
  }
  if (prev === 'ā' || prev === 'ū') {
    if (own === 'a' || own === 'ā') return 'ء';
  }
  const set = new Set([prev, own]);
  if (set.has('i') || set.has('ī')) return 'ئ';
  if (set.has('u') || set.has('ū')) return 'ؤ';
  return 'أ';
}

export function toArabic(cell: Cell): string {
  const { lead, syl } = parse(cell.rom);
  let out = '';
  if (lead) out += 'ا' + (SHORT_MARK[lead] ?? '');
  let prevV: Vow | 'start' = lead ? lead : 'start';
  syl.forEach((s, idx) => {
    const isLast = idx === syl.length - 1;
    let letter = LETTER[s.c];
    // Sonda elif maksûre varsa hemze kendi fethasıyla oturur (raʔā → رَأَى).
    const maqsura = isLast && s.v === 'ā' && !!cell.finalAlifMaqsura;
    if (s.c === 'ʔ') letter = hamzaSeat(idx === 0 && !lead ? 'start' : (prevV as Vow), maqsura ? 'a' : s.v, isLast && !maqsura);
    if (!letter) throw new Error(`Bilinmeyen harf ${s.c} (${cell.rom})`);
    out += letter;
    if (s.gem) out += SHADDA;
    if (letter === 'آ') {
      // آ hem hemzeyi hem uzun ā'yı taşır.
    } else if (s.v === '') {
      out += SUKUN;
    } else if (s.v in SHORT_MARK) {
      out += SHORT_MARK[s.v];
    } else if (s.v === 'ā') {
      out += FATHA + (isLast && cell.finalAlifMaqsura ? 'ى' : 'ا');
    } else if (s.v === 'ī') {
      out += KASRA + 'ي';
    } else if (s.v === 'ū') {
      out += DAMMA + 'و';
    }
    prevV = s.v;
  });
  if (cell.wawAlif && /(ū|w)$/.test(cell.rom)) out += 'ا';
  return out.normalize('NFC');
}
