/**
 * Standart Arapça fiil çekim motoru (bilgisayar tarafı, bağımsız çapraz doğrulama için).
 *
 * Çıktı bilimsel Latin okunuştur (Wiktionary "roman" biçimi: ʔ ʕ ā ī ū, ikizlenmiş ünsüz = iki harf).
 * Arap yazısına çeviri `orthography.ts` içindedir. Yöntem:
 *   1) Fiil kalıbına (bab I–X) göre sağlam (sahih) şablon kurulur.
 *   2) Kök türüne göre ses kuralları uygulanır: mudaaf (ikizleşme), ecvef (orta illetli),
 *      nakıs (son illetli, ek tablosuyla), hemzeli (ʔaʔ → ʔā), özel fiiller (رأى, أخذ, أكل).
 * Mithal (ilk harf و/ي) ve lefif henüz desteklenmez: `unsupported` döner.
 */

export type Person =
  | 'ana' | 'anta' | 'anti' | 'huwa' | 'hiya' | 'antuma' | 'huma_m' | 'huma_f'
  | 'nahnu' | 'antum' | 'antunna' | 'hum' | 'hunna';
export type ImpPerson = 'anta' | 'anti' | 'antuma' | 'antum' | 'antunna';

export const PERSONS: Person[] = [
  'ana', 'anta', 'anti', 'huwa', 'hiya', 'antuma', 'huma_m', 'huma_f',
  'nahnu', 'antum', 'antunna', 'hum', 'hunna',
];
export const IMP_PERSONS: ImpPerson[] = ['anta', 'anti', 'antuma', 'antum', 'antunna'];

export type Form = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'X';
type V = 'a' | 'i' | 'u';

export interface VerbSpec {
  root: [string, string, string]; // Latin radikaller: ['r','k','b']
  form: Form;
  pastVowel?: V; // yalnız I: rakiba → i
  presVowel?: V; // yalnız I: yarkabu → a
}

/** Hücre: roman okunuş + yazım ipuçları (orthography için). */
export interface Cell {
  rom: string;
  /** Kelime sonundaki ā, kökün 3. harfinden gelir (ى ile yazılabilir). */
  finalAlifMaqsura?: boolean;
  /** Sondaki ū / aw cemi vavıdır: ardından elif yazılır (كَتَبُوا). */
  wawAlif?: boolean;
}

export interface Conjugation {
  active: { past: Record<Person, Cell>; present: Record<Person, Cell>; imperative: Record<ImpPerson, Cell> };
  passive: { past: Record<Person, Cell>; present: Record<Person, Cell> };
}

export class UnsupportedVerb extends Error {}

const VOWELS = 'aiuāīū';
const isVowel = (c: string | undefined) => !!c && VOWELS.includes(c);
const LONG: Record<V, string> = { a: 'ā', i: 'ī', u: 'ū' };
const SHORT: Record<string, string> = { ā: 'a', ī: 'i', ū: 'u' };

const PAST_SUFFIX: Record<Person, string> = {
  ana: 'tu', anta: 'ta', anti: 'ti', huwa: 'a', hiya: 'at', antuma: 'tumā', huma_m: 'ā', huma_f: 'atā',
  nahnu: 'nā', antum: 'tum', antunna: 'tunna', hum: 'ū', hunna: 'na',
};
const PRES_PREFIX: Record<Person, string> = {
  ana: 'ʔ', anta: 't', anti: 't', huwa: 'y', hiya: 't', antuma: 't', huma_m: 'y', huma_f: 't',
  nahnu: 'n', antum: 't', antunna: 't', hum: 'y', hunna: 'y',
};
const PRES_SUFFIX: Record<Person, string> = {
  ana: 'u', anta: 'u', anti: 'īna', huwa: 'u', hiya: 'u', antuma: 'āni', huma_m: 'āni', huma_f: 'āni',
  nahnu: 'u', antum: 'ūna', antunna: 'na', hum: 'ūna', hunna: 'na',
};
const JUSS_SUFFIX: Record<ImpPerson, string> = { anta: '', anti: 'ī', antuma: 'ā', antum: 'ū', antunna: 'na' };
const PLURAL_WAW: Set<string> = new Set(['hum', 'antum']);

// --- Nakıs (son harf illetli) ek tabloları. "Ā" = kökten gelen son elif (ى/ا ile yazılır).
const DEF_PAST_A_Y: Record<Person, string> = {
  ana: 'aytu', anta: 'ayta', anti: 'ayti', huwa: 'Ā', hiya: 'at', antuma: 'aytumā', huma_m: 'ayā', huma_f: 'atā',
  nahnu: 'aynā', antum: 'aytum', antunna: 'aytunna', hum: 'aw', hunna: 'ayna',
};
const DEF_PAST_A_W: Record<Person, string> = {
  ...DEF_PAST_A_Y, ana: 'awtu', anta: 'awta', anti: 'awti', antuma: 'awtumā', huma_m: 'awā',
  nahnu: 'awnā', antum: 'awtum', antunna: 'awtunna', hunna: 'awna',
};
const DEF_PAST_I: Record<Person, string> = {
  ana: 'ītu', anta: 'īta', anti: 'īti', huwa: 'iya', hiya: 'iyat', antuma: 'ītumā', huma_m: 'iyā', huma_f: 'iyatā',
  nahnu: 'īnā', antum: 'ītum', antunna: 'ītunna', hum: 'ū', hunna: 'īna',
};
const DEF_PRES: Record<'ā' | 'ī' | 'ū', Record<Person, string>> = {
  ā: {
    ana: 'Ā', anta: 'Ā', anti: 'ayna', huwa: 'Ā', hiya: 'Ā', antuma: 'ayāni', huma_m: 'ayāni', huma_f: 'ayāni',
    nahnu: 'Ā', antum: 'awna', antunna: 'ayna', hum: 'awna', hunna: 'ayna',
  },
  ī: {
    ana: 'ī', anta: 'ī', anti: 'īna', huwa: 'ī', hiya: 'ī', antuma: 'iyāni', huma_m: 'iyāni', huma_f: 'iyāni',
    nahnu: 'ī', antum: 'ūna', antunna: 'īna', hum: 'ūna', hunna: 'īna',
  },
  ū: {
    ana: 'ū', anta: 'ū', anti: 'īna', huwa: 'ū', hiya: 'ū', antuma: 'uwāni', huma_m: 'uwāni', huma_f: 'uwāni',
    nahnu: 'ū', antum: 'ūna', antunna: 'ūna', hum: 'ūna', hunna: 'ūna',
  },
};
const DEF_IMP: Record<'ā' | 'ī' | 'ū', Record<ImpPerson, string>> = {
  ā: { anta: 'a', anti: 'ay', antuma: 'ayā', antum: 'aw', antunna: 'ayna' },
  ī: { anta: 'i', anti: 'ī', antuma: 'iyā', antum: 'ū', antunna: 'īna' },
  ū: { anta: 'u', anti: 'ī', antuma: 'uwā', antum: 'ū', antunna: 'ūna' },
};

interface Stems {
  /** Geçmiş kök gövdesi, son radikalin ünlüsü hariç (rakib, ʔaʕṭ+). */
  pastA: string;
  pastP: string;
  /** Şimdiki zaman: önek ünlüsü ve önekten sonraki gövde (son radikal dahil, ek hariç). */
  presPrefixVowelA: V;
  presA: string;
  presP: string;
  /** Emir: önek (vasl ünlüsü veya ʔa) */
  impPrefix: 'wasl' | 'ʔa' | 'none';
  impWaslVowel: V;
}

function stems(spec: VerbSpec): Stems {
  const [F, E, L] = spec.root;
  const pv = spec.pastVowel ?? 'a';
  const nv = spec.presVowel ?? 'a';
  switch (spec.form) {
    case 'I':
      return { pastA: `${F}a${E}${pv}${L}`, pastP: `${F}u${E}i${L}`, presPrefixVowelA: 'a', presA: `${F}${E}${nv}${L}`,
        presP: `${F}${E}a${L}`, impPrefix: 'wasl', impWaslVowel: nv === 'u' ? 'u' : 'i' };
    case 'II':
      return { pastA: `${F}a${E}${E}a${L}`, pastP: `${F}u${E}${E}i${L}`, presPrefixVowelA: 'u', presA: `${F}a${E}${E}i${L}`,
        presP: `${F}a${E}${E}a${L}`, impPrefix: 'none', impWaslVowel: 'i' };
    case 'III':
      return { pastA: `${F}ā${E}a${L}`, pastP: `${F}ū${E}i${L}`, presPrefixVowelA: 'u', presA: `${F}ā${E}i${L}`,
        presP: `${F}ā${E}a${L}`, impPrefix: 'none', impWaslVowel: 'i' };
    case 'IV':
      return { pastA: `ʔa${F}${E}a${L}`, pastP: `ʔu${F}${E}i${L}`, presPrefixVowelA: 'u', presA: `${F}${E}i${L}`,
        presP: `${F}${E}a${L}`, impPrefix: 'ʔa', impWaslVowel: 'i' };
    case 'V':
      return { pastA: `ta${F}a${E}${E}a${L}`, pastP: `tu${F}u${E}${E}i${L}`, presPrefixVowelA: 'a', presA: `ta${F}a${E}${E}a${L}`,
        presP: `ta${F}a${E}${E}a${L}`, impPrefix: 'none', impWaslVowel: 'i' };
    case 'VI':
      return { pastA: `ta${F}ā${E}a${L}`, pastP: `tu${F}ū${E}i${L}`, presPrefixVowelA: 'a', presA: `ta${F}ā${E}a${L}`,
        presP: `ta${F}ā${E}a${L}`, impPrefix: 'none', impWaslVowel: 'i' };
    case 'VII':
      return { pastA: `in${F}a${E}a${L}`, pastP: `un${F}u${E}i${L}`, presPrefixVowelA: 'a', presA: `n${F}a${E}i${L}`,
        presP: `n${F}a${E}a${L}`, impPrefix: 'wasl', impWaslVowel: 'i' };
    case 'VIII': {
      const t = infixT(F);
      return { pastA: `i${F}${t}a${E}a${L}`, pastP: `u${F}${t}u${E}i${L}`, presPrefixVowelA: 'a', presA: `${F}${t}a${E}i${L}`,
        presP: `${F}${t}a${E}a${L}`, impPrefix: 'wasl', impWaslVowel: 'i' };
    }
    case 'X':
      return { pastA: `ista${F}${E}a${L}`, pastP: `ustu${F}${E}i${L}`, presPrefixVowelA: 'a', presA: `sta${F}${E}i${L}`,
        presP: `sta${F}${E}a${L}`, impPrefix: 'wasl', impWaslVowel: 'i' };
  }
}

/** VIII. babda araya giren t'nin benzeşmesi. */
function infixT(F: string): string {
  if ('ṣḍṭẓ'.includes(F)) return 'ṭ';
  if ('dḏz'.includes(F)) return 'd';
  if ('wy'.includes(F)) throw new UnsupportedVerb('VIII mithal');
  return 't';
}

// ---------------------------------------------------------------- ses kuralları

/** Mudaaf: E=L ve L'den sonra ünlü varsa E'nin ünlüsü öne geçer, ikizleşir (ʔaḥbaba → ʔaḥabba). */
function geminate(s: string, E: string): string {
  const re = new RegExp(`(.)${E}([aiu])${E}(?=[${VOWELS}])`);
  return s.replace(re, (_m, before: string, v: string) => (isVowel(before) ? `${before}${E}${E}` : `${before}${v}${E}${E}`));
}

/**
 * Ecvef: orta radikal w/y.
 *   C1 a G a/i → C1 ā (qawala → qāla); C1 u G i → C1 ī (quwila → qīla);
 *   C1(ünsüz) G v → C1 v̄ (yaqwulu → yaqūlu, ʔaqwama → ʔaqāma).
 * Ardından kapalı hecede uzun ünlü kısalır.
 */
function hollow(s: string, F: string, G: string, closedVowel?: V): string {
  let r = s;
  const reA = new RegExp(`${F}a${G}[ai]`);
  const reP = new RegExp(`${F}u${G}i`);
  const reS = new RegExp(`${F}${G}([aiu])`);
  if (reA.test(r)) r = r.replace(reA, `${F}ā`);
  else if (reP.test(r)) r = r.replace(reP, `${F}ī`);
  else if (reS.test(r)) r = r.replace(reS, (_m, v: V) => `${F}${LONG[v]}`);
  return shortenClosed(r, F, closedVowel);
}

/** Kapalı hecede (uzun ünlü + ünsüz + ünsüz/son) uzun ünlü kısalır. */
function shortenClosed(s: string, F: string, closedVowel?: V): string {
  const re = new RegExp(`${F}([āīū])([^${VOWELS}])(?=[^${VOWELS}]|$)`);
  return s.replace(re, (_m, v: string, c: string) => `${F}${closedVowel ?? SHORT[v]}${c}`);
}

/** Hemze: ʔaʔ → ʔā, ʔuʔ → ʔū, ʔiʔ → ʔī (ünsüzden önce). */
function hamzaFix(s: string): string {
  return s.replace(/ʔ([aiu])ʔ(?=[^aiuāīū])/g, (_m, v: V) => `ʔ${LONG[v]}`);
}

const WEAK = new Set(['w', 'y']);

/** Özel fiiller: رأى şimdiki/emirde hemzeyi düşürür; أخذ ve أكل emirde ʔ düşer (خُذْ، كُلْ). */
function special(spec: VerbSpec) {
  const key = spec.root.join('');
  return {
    raa: key === 'rʔy' && spec.form === 'I',
    dropHamzaImperative: spec.form === 'I' && (key === 'ʔḵḏ' || key === 'ʔkl'),
  };
}

export function conjugate(spec: VerbSpec): Conjugation {
  const [F, E, L] = spec.root;
  if (WEAK.has(F)) throw new UnsupportedVerb('mithal/lefif');
  if (WEAK.has(E) && WEAK.has(L)) throw new UnsupportedVerb('lefif');
  const st = stems(spec);
  const sp = special(spec);
  const isHollow = WEAK.has(E) && ['I', 'IV', 'VII', 'VIII', 'X'].includes(spec.form);
  const isDefective = WEAK.has(L);
  const isDoubled = E === L;
  const nv = spec.presVowel ?? 'a';

  const fix = (s: string, kind: 'pastA' | 'pastP' | 'other') => {
    let r = s;
    if (isDoubled) r = geminate(r, E);
    if (isHollow) {
      const closed = spec.form === 'I' && kind === 'pastA' ? (nv === 'u' ? 'u' : 'i') : spec.form === 'I' && kind === 'pastP' ? 'i' : undefined;
      r = hollow(r, F, E, closed);
    }
    return hamzaFix(r);
  };

  const strip = (stem: string) => stem.slice(0, -L.length); // son radikali at
  const dropLastVowel = (stem: string) => stem.replace(/[aiu](?=[^aiuāīū]*$)/, ''); // rakib → rakb? değil: yalnız defective için

  const pastA = {} as Record<Person, Cell>;
  const pastP = {} as Record<Person, Cell>;
  const presA = {} as Record<Person, Cell>;
  const presP = {} as Record<Person, Cell>;
  const imp = {} as Record<ImpPerson, Cell>;

  for (const p of PERSONS) {
    const waw = PLURAL_WAW.has(p) ? { wawAlif: true } : {};
    if (isDefective) {
      // Geçmiş: E'nin ünlüsüne göre (baqiya → i tipi, ramā/ʔaʕṭā → a tipi).
      const baseA = dropLastVowel(strip(st.pastA));
      const lastVA = st.pastA.slice(-L.length - 1, -L.length) as V;
      const tableA = lastVA === 'i' ? DEF_PAST_I : L === 'w' && spec.form === 'I' ? DEF_PAST_A_W : DEF_PAST_A_Y;
      pastA[p] = defCell(fix(baseA, 'pastA'), tableA[p], L, spec.form, p);
      pastP[p] = defCell(fix(dropLastVowel(strip(st.pastP)), 'pastP'), DEF_PAST_I[p], L, spec.form, p);
      const presType = presTypeOf(st.presA, L);
      let pa = PRES_PREFIX[p] + st.presPrefixVowelA + dropLastVowel(strip(st.presA));
      if (sp.raa) pa = pa.replace('rʔ', 'r');
      presA[p] = defCell(fix(pa, 'other'), DEF_PRES[presType][p], L, spec.form, p);
      let pp = PRES_PREFIX[p] + 'u' + dropLastVowel(strip(st.presP));
      if (sp.raa) pp = pp.replace('rʔ', 'r');
      presP[p] = defCell(fix(pp, 'other'), DEF_PRES.ā[p], L, spec.form, p);
    } else {
      pastA[p] = { rom: fix(st.pastA + PAST_SUFFIX[p], 'pastA'), ...waw };
      pastP[p] = { rom: fix(st.pastP + PAST_SUFFIX[p], 'pastP'), ...waw };
      presA[p] = { rom: fix(PRES_PREFIX[p] + st.presPrefixVowelA + st.presA + PRES_SUFFIX[p], 'other') };
      presP[p] = { rom: fix(PRES_PREFIX[p] + 'u' + st.presP + PRES_SUFFIX[p], 'other') };
    }
  }

  for (const p of IMP_PERSONS) {
    const waw = p === 'antum' ? { wawAlif: true } : {};
    let core: string;
    let cell: Cell;
    if (isDefective) {
      const presType = presTypeOf(st.presA, L);
      let base = dropLastVowel(strip(st.presA));
      if (sp.raa) base = base.replace('rʔ', 'r');
      core = fix('t' + st.presPrefixVowelA + base + DEF_IMP[presType][p], 'other').slice(2);
      cell = { rom: core, ...(p === 'antum' && /[ūw]$/.test(core) ? { wawAlif: true } : {}) };
    } else {
      // Cezm (jussive) gövdesi üzerinden: t + a + gövde + ek, sonra önek atılır.
      core = fix('t' + st.presPrefixVowelA + st.presA + JUSS_SUFFIX[p], 'other').slice(2);
      cell = { rom: core, ...waw };
    }
    cell.rom = impPrefix(cell.rom, st, sp.dropHamzaImperative);
    imp[p] = cell;
  }

  return { active: { past: pastA, present: presA, imperative: imp }, passive: { past: pastP, present: presP } };
}

function presTypeOf(presA: string, L: string): 'ā' | 'ī' | 'ū' {
  const v = presA.slice(-L.length - 1, -L.length);
  return v === 'a' ? 'ā' : v === 'u' ? 'ū' : 'ī';
}

function defCell(base: string, ending: string, L: string, form: Form, p: Person): Cell {
  const maqsura = ending.endsWith('Ā') && (L === 'y' || form !== 'I');
  const rom = base + ending.replace('Ā', 'ā');
  const wawAlif = PLURAL_WAW.has(p) && /(ū|aw)$/.test(rom);
  return { rom, ...(maqsura ? { finalAlifMaqsura: true } : {}), ...(wawAlif ? { wawAlif: true } : {}) };
}

function impPrefix(core: string, st: Stems, dropHamza: boolean): string {
  if (dropHamza) return core.replace(/^ʔ/, '');
  if (st.impPrefix === 'ʔa') return 'ʔa' + core;
  const startsCluster = !isVowel(core[0]) && !isVowel(core[1]);
  if (st.impPrefix === 'wasl' && startsCluster) return st.impWaslVowel + core;
  return core;
}
