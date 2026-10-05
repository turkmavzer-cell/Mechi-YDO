/** Wiktionary İngilizce maddesinden kavram için Türkçe ↔ Arapça çifti seçer. */
import type { Concept } from './concepts.ts';
import { kaikkiEntries, type KEntry, type KTranslation } from './kaikki.ts';

const HARAKAT = /[ً-ْ]/;
const POS: Record<Concept['pos'], string[]> = {
  n: ['noun'], v: ['verb'], adj: ['adj'], adv: ['adv'], phr: ['conj', 'prep', 'adv', 'intj', 'phrase', 'particle'],
};

export interface Pick {
  concept: Concept;
  sense: string;
  tr: string;
  trAll: string[];
  ar: string;
  arRoman?: string;
  arTags: string[];
  arAll: string[];
  /** İnceleme gerektiren durumlar. */
  flags: string[];
}

const lc = (s: string) => s.toLocaleLowerCase('tr-TR');

/** Yalnızca Arap harfi, hareke ve boşluk: "دُكْتُور m or …", "تَغَيَّرَƒ" gibi bozuk kayıtlar reddedilir. */
const CLEAN_AR = /^[؀-ۿ ]+$/;

function isMsa(t: KTranslation): boolean {
  if (t.lang !== 'Arabic' || !t.word || !CLEAN_AR.test(t.word.trim())) return false;
  // Çoğul biçim tekil madde yerine alınmaz (door → أَبْوَاب hatası).
  if ((t.tags ?? []).includes('plural')) return false;
  // Lehçe/argo işaretli çeviriler alınmaz (proje yalnızca Fusha).
  const bad = ['Egyptian', 'Gulf', 'Levantine', 'Moroccan', 'Iraqi', 'Hijazi', 'colloquial', 'dialectal', 'slang', 'vulgar', 'archaic', 'obsolete'];
  return !(t.tags ?? []).some((tag) => bad.some((b) => tag.includes(b))) && !bad.some((b) => (t.note ?? '').includes(b));
}

export async function pick(concept: Concept): Promise<Pick | { concept: Concept; error: string }> {
  const entries = (await kaikkiEntries('English', concept.en)).filter((e: KEntry) => POS[concept.pos].includes(e.pos));
  if (!entries.length) return { concept, error: 'madde yok' };

  type Group = { sense: string; ar: KTranslation[]; tr: KTranslation[] };
  const groups: Group[] = [];
  for (const e of entries) {
    const bySense = new Map<string, Group>();
    for (const t of e.translations ?? []) {
      const sense = t.sense ?? '';
      const g = bySense.get(sense) ?? { sense, ar: [], tr: [] };
      if (isMsa(t)) g.ar.push(t);
      else if (t.lang === 'Turkish' && t.word) g.tr.push(t);
      bySense.set(sense, g);
    }
    groups.push(...[...bySense.values()].filter((g) => g.ar.length && g.tr.length));
  }
  if (!groups.length) return { concept, error: 'Türkçe+Arapça çeviri tablosu yok' };

  const flags: string[] = [];
  const want = lc(concept.trPrefer);
  const hasTr = (x: Group) => x.tr.some((t) => lc(t.word!.trim()) === want);
  const hintOk = (x: Group) => !!concept.hint && lc(x.sense).includes(lc(concept.hint));
  // Anlam seçimi (en güvenilirden): istenen Türkçe + ipucu; istenen Türkçe tabloda ilk sırada;
  // istenen Türkçe herhangi bir sırada; yalnızca ipucu (Türkçe tablodan alınır).
  if (concept.trForce) {
    // Türkçe elle verilmiş: anlam tablosu yalnızca ipucuyla seçilir, Arapça o tablodan alınır.
    const gf = groups.find(hintOk);
    if (!gf) return { concept, error: `ipucu tutmadı ("${concept.hint}")` };
    const arF = chooseAr(gf.ar, concept.arPrefer);
    return { concept, sense: gf.sense, tr: concept.trPrefer, trAll: [concept.trPrefer], ar: arF.word!.trim(), arRoman: arF.roman,
      arTags: arF.tags ?? [], arAll: gf.ar.map((t) => t.word!.trim()), flags: ['Türkçe elle verildi'] };
  }
  let g =
    groups.find((x) => hasTr(x) && hintOk(x)) ??
    groups.find((x) => lc(x.tr[0].word!.trim()) === want) ??
    groups.find(hasTr);
  if (!g && want) {
    g = groups.find(hintOk);
    if (!g) return { concept, error: `"${concept.trPrefer}" hiçbir anlam tablosunda yok, ipucu da tutmadı` };
    flags.push(`"${concept.trPrefer}" tabloda yok; ipucuyla "${g.sense}" tablosunun Türkçesi alındı`);
  }
  g ??= groups.find(hintOk) ?? groups[0];
  const trAll = g.tr.map((t) => t.word!.trim());
  const tr = trAll.find((t) => lc(t) === want) ?? trAll[0];
  const ar = chooseAr(g.ar, concept.arPrefer);
  if (concept.arPrefer && ar.word!.trim().normalize('NFC') !== concept.arPrefer.normalize('NFC')) {
    flags.push(`tercih edilen Arapça (${concept.arPrefer}) tabloda yok`);
  }
  if (!HARAKAT.test(ar.word!)) flags.push('Arapça harekesiz');
  return {
    concept, sense: g.sense, tr, trAll, ar: ar.word!.trim(), arRoman: ar.roman, arTags: ar.tags ?? [],
    arAll: g.ar.map((t) => t.word!.trim()), flags,
  };
}

/** Tercih edilen Arapça tabloda varsa o; yoksa harekeli ilk Fusha karşılık (lehçe yazımlar genelde harekesizdir). */
function chooseAr(list: KTranslation[], prefer: string): KTranslation {
  const p = prefer.normalize('NFC');
  return (p && list.find((t) => t.word!.trim().normalize('NFC') === p)) || list.find((t) => HARAKAT.test(t.word!)) || list[0];
}
