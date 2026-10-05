/**
 * Türkçe isim ek çözümleyici: "arabaya → araba + yönelme", "anahtarlarımı → anahtar + çoğul + benim + -i hâli".
 *
 * Yöntem "üretip karşılaştırma" (analysis by synthesis): kelimenin olası köklerini sözlükte ararız, her kök için
 * olası tüm ek dizilerini (çoğul × iyelik × hâl = 98 biçim) kurallarla ÜRETİRİZ ve yazılışla birebir eşleşeni alırız.
 * Böylece kural hatası yanlış çözümleme değil, "çözümlenemedi" olur. Telefonda yalnızca birkaç kök adayı denenir.
 *
 * Kapsam: isim çekimi (çoğul, iyelik, 6 hâl). Fiil çekimi `forms` tablosundadır; sıfat/zamir/edat burada yok.
 */

export type Possessive = 'ben' | 'sen' | 'o' | 'biz' | 'siz' | 'onlar';
export type CaseName = 'nom' | 'acc' | 'dat' | 'loc' | 'abl' | 'gen' | 'ins';

export interface NounAnalysis {
  /** Sözlükteki kök (normalize edilmiş Türkçe anahtar). */
  lemma: string;
  plural: boolean;
  possessive?: Possessive;
  case: CaseName;
  /** Kökten sonraki ekler, yazıldığı gibi ("lar", "ım", "ı"). */
  suffixes: string[];
}

export const CASE_LABEL: Record<CaseName, string> = {
  nom: '', acc: '-i hâli', dat: '-e hâli (yönelme)', loc: '-de hâli (bulunma)', abl: '-den hâli (ayrılma)',
  gen: '-in (ilgi)', ins: '-le (ile)',
};
export const POSSESSIVE_LABEL: Record<Possessive, string> = {
  ben: 'benim', sen: 'senin', o: 'onun', biz: 'bizim', siz: 'sizin', onlar: 'onların',
};

const VOWELS = new Set([...'aeıioöuü']);
const BACK = new Set([...'aıou']);
const VOICELESS = new Set([...'fstkçşhp']);
/** Son ünlüsü kalın olsa da ince ekler alan kelimeler (kalp → kalbe, saat → saate). */
const FRONT_EXCEPTIONS = new Set(['saat', 'kalp', 'hal', 'alkol', 'rol', 'gol', 'harf', 'dikkat', 'usul', 'ihtimal', 'meşgul']);

const isVowel = (c: string | undefined) => !!c && VOWELS.has(c);

function lastVowel(s: string): string {
  for (let i = s.length - 1; i >= 0; i--) if (VOWELS.has(s[i])) return s[i];
  return 'e';
}
/** İki yönlü uyum: a / e. */
const a2 = (v: string) => (BACK.has(v) ? 'a' : 'e');
/** Dört yönlü uyum: ı / i / u / ü. */
function i4(v: string): string {
  if ('aı'.includes(v)) return 'ı';
  if ('ei'.includes(v)) return 'i';
  if ('ou'.includes(v)) return 'u';
  return 'ü';
}

const POSSESSIVES: Possessive[] = ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'];
const CASES: CaseName[] = ['nom', 'acc', 'dat', 'loc', 'abl', 'gen', 'ins'];

interface Built {
  surface: string;
  suffixes: string[];
}

/** Bir kök biçimine (yumuşamış/ünlü düşmüş olabilir) çoğul, iyelik ve hâl eklerini kurallarla ekler. */
function build(stem: string, lemma: string, plural: boolean, poss: Possessive | undefined, kase: CaseName): Built {
  let cur = stem;
  const suffixes: string[] = [];
  // Uyum, ilk ek gelene kadar kelimenin kendi ünlüsüne göredir; istisna kelimelerde ince sayılır.
  let override = FRONT_EXCEPTIONS.has(lemma);
  const harmony = () => (override ? 'e' : lastVowel(cur));
  const add = (s: string) => {
    if (!s) return;
    cur += s;
    suffixes.push(s);
    if ([...s].some((c) => VOWELS.has(c))) override = false;
  };

  if (plural) add(`l${a2(harmony())}r`);

  let third = false;
  if (poss) {
    const v = isVowel(cur[cur.length - 1]);
    const I = i4(harmony());
    switch (poss) {
      case 'ben': add(v ? 'm' : `${I}m`); break;
      case 'sen': add(v ? 'n' : `${I}n`); break;
      case 'o': add(v ? `s${I}` : I); third = true; break;
      case 'biz': add(v ? `m${I}z` : `${I}m${I}z`); break;
      case 'siz': add(v ? `n${I}z` : `${I}n${I}z`); break;
      case 'onlar': add(`l${a2(harmony())}r${I}`); third = true; break;
    }
  }

  const v = isVowel(cur[cur.length - 1]);
  const I = i4(harmony());
  const A = a2(harmony());
  // 3. kişi iyelikten sonra "n" kaynaştırması gelir (evi → evine); ünlüyle biten kökte "y" (araba → arabaya).
  const buf = third ? 'n' : v ? 'y' : '';
  const d = !third && VOICELESS.has(cur[cur.length - 1]) ? 't' : 'd';
  switch (kase) {
    case 'nom': break;
    case 'acc': add(`${buf}${I}`); break;
    case 'dat': add(`${buf}${A}`); break;
    case 'loc': add(`${third ? 'n' : ''}${d}${A}`); break;
    case 'abl': add(`${third ? 'n' : ''}${d}${A}n`); break;
    case 'gen': add(`${v || third ? 'n' : ''}${I}n`); break;
    case 'ins': add(`${v ? 'y' : ''}l${A}`); break;
  }
  return { surface: cur, suffixes };
}

/** Kök adayından olası "yumuşamış/ünlü düşmüş" kök biçimleri: kitap → kitab, mutfak → mutfağ, şehir → şehr. */
export function stemVariants(lemma: string): string[] {
  const out = new Set<string>([lemma]);
  const last = lemma[lemma.length - 1];
  const head = lemma.slice(0, -1);
  const soft: Record<string, string> = { p: 'b', ç: 'c', t: 'd', k: 'ğ' };
  if (soft[last]) out.add(head + soft[last]);
  if (lemma.endsWith('nk')) out.add(`${lemma.slice(0, -2)}ng`);
  // Ünlü düşmesi: şehir → şehr, ağız → ağz, burun → burn (son hecenin ünlüsü ek ünlüsüyle çarpışınca atılır).
  if (lemma.length >= 4 && isVowel(lemma[lemma.length - 2]) && !isVowel(last) && !isVowel(lemma[lemma.length - 3])) {
    out.add(lemma.slice(0, -2) + last);
  }
  return [...out];
}

/** Bir kelime kök olabilir mi? Çözümleyici yalnızca sözlükte bulunan kökleri kabul eder. */
export type LemmaLookup = (lemma: string) => boolean;

/** Kök adayları: sondaki yumuşamayı geri alır (kitab → kitap) ve düşen ünlüyü geri koyar (şehr → şehir). */
function lemmaCandidates(prefix: string): string[] {
  const out = new Set<string>([prefix]);
  const last = prefix[prefix.length - 1];
  const head = prefix.slice(0, -1);
  const hard: Record<string, string> = { b: 'p', c: 'ç', d: 't', ğ: 'k' };
  if (hard[last]) out.add(head + hard[last]);
  if (prefix.endsWith('ng')) out.add(`${prefix.slice(0, -2)}nk`);
  if (prefix.length >= 3 && !isVowel(last) && !isVowel(prefix[prefix.length - 2])) {
    for (const v of 'ıiuü') {
      out.add(head + v + last);
      if (hard[last]) out.add(head + v + hard[last]);
    }
  }
  return [...out];
}

const MAX_SUFFIX_LEN = 14;

/**
 * Kelimeyi isim olarak çözümler; olası tüm çözümlemeleri sade → karmaşık sırasıyla döndürür (bulunamazsa boş).
 * Çıplak kökün kendisi (ek yok) döndürülmez: o durum doğrudan sözlük aramasıdır.
 */
export function analyzeNoun(token: string, isLemma: LemmaLookup): NounAnalysis[] {
  const word = token.normalize('NFC').toLocaleLowerCase('tr-TR');
  const found = new Map<string, NounAnalysis & { rank: number }>();
  const tried = new Set<string>();

  for (let i = word.length - 1; i >= Math.max(2, word.length - MAX_SUFFIX_LEN); i--) {
    for (const lemma of lemmaCandidates(word.slice(0, i))) {
      if (tried.has(lemma)) continue;
      tried.add(lemma);
      if (!isLemma(lemma)) continue;
      for (const stem of stemVariants(lemma)) {
        for (const plural of [false, true]) {
          for (const poss of [undefined, ...POSSESSIVES]) {
            for (const kase of CASES) {
              if (!plural && !poss && kase === 'nom') continue;
              const b = build(stem, lemma, plural, poss, kase);
              if (b.surface !== word) continue;
              const key = `${lemma}|${plural}|${poss ?? ''}|${kase}`;
              if (found.has(key)) continue;
              // Sade çözümleme önce: ek sayısı az, sonra iyelik içermeyen, sonra çoğulsuz.
              const rank = b.suffixes.length * 10 + (poss ? 3 : 0) + (plural ? 1 : 0) + (stem === lemma ? 0 : 0.5);
              found.set(key, { lemma, plural, possessive: poss, case: kase, suffixes: b.suffixes, rank });
            }
          }
        }
      }
    }
  }
  return [...found.values()].sort((x, y) => x.rank - y.rank).map(({ rank: _r, ...a }) => a);
}

/** Çözümlemenin kısa Türkçe açıklaması: "araba + yönelme". */
export function describeAnalysis(a: NounAnalysis): string {
  const parts: string[] = [];
  if (a.plural) parts.push('çoğul');
  if (a.possessive) parts.push(POSSESSIVE_LABEL[a.possessive]);
  if (a.case !== 'nom') parts.push(CASE_LABEL[a.case]);
  return `${a.lemma} + ${parts.join(' + ')}`;
}
