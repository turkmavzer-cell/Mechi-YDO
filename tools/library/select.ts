/** Wiktionary İngilizce maddesinden kavram için Türkçe ↔ Arapça çifti seçer. */
import type { Concept } from './concepts.ts';
import { kaikkiEntries, type KEntry, type KTranslation } from './kaikki.ts';

const HARAKAT = /[ً-ْٰ]/;
const POS: Record<Concept['pos'], string[]> = {
  // "name": ay adları gibi özel ad olarak işaretli maddeler (January, May).
  n: ['noun', 'name'], v: ['verb'], adj: ['adj'], adv: ['adv'], num: ['num'],
  phr: ['conj', 'prep', 'adv', 'intj', 'phrase', 'particle'],
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

/** Yalnızca Arap harfi, hareke ve boşluk. Rakam (١٠٠), Latin harf ve bozuk işaretler reddedilir. */
const CLEAN_AR = /^[ء-يً-ْٰٱ ]+$/;

/**
 * Wiktionary Arapça kaydını temizler:
 *  - "مُوسِيقَى f or مُوسِيقَا" gibi cins/alternatif notlu kayıttan ilk Arapça kısmı alır,
 *  - tā marbūṭa üzerindeki durak sükûnunu ve tanımlık elifindeki fethayı atar (حَالَةْ اَلطَّوَارِئ → حَالَة الطَّوَارِئ).
 * Temizlenemeyen kayıt undefined döner.
 */
export function cleanArabic(raw: string): string | undefined {
  let w = raw.normalize('NFC').trim();
  if (/[A-Za-z]/.test(w)) {
    const m = /^([ء-يً-ْٰٱ][ء-يً-ْٰٱ ]*?)\s+(?:[mf]\b|or\b|\(|,)/.exec(w);
    if (!m) return undefined;
    w = m[1].trim();
  }
  w = w.replace(/ةْ/g, 'ة').replace(/(^|\s)اَل/g, '$1ال').replace(/\s+/g, ' ').trim();
  return CLEAN_AR.test(w) ? w : undefined;
}

const BAD_TAGS = ['Egyptian', 'Gulf', 'Levantine', 'Moroccan', 'Iraqi', 'Hijazi', 'colloquial', 'dialectal', 'slang', 'vulgar', 'archaic', 'obsolete'];

function isMsa(t: KTranslation): boolean {
  if (t.lang !== 'Arabic' || !t.word || !cleanArabic(t.word)) return false;
  // Çoğul biçim tekil madde yerine alınmaz (door → أَبْوَاب hatası).
  if ((t.tags ?? []).includes('plural')) return false;
  // Lehçe/argo işaretli çeviriler alınmaz (proje yalnızca Fusha).
  return !(t.tags ?? []).some((tag) => BAD_TAGS.some((b) => tag.includes(b))) && !BAD_TAGS.some((b) => (t.note ?? '').includes(b));
}

/** Tercih edilen Arapça tabloda varsa o; yoksa harekeli ilk Fusha karşılık (lehçe yazımlar genelde harekesizdir). */
function chooseAr(list: KTranslation[], prefer: string): KTranslation {
  const p = prefer.normalize('NFC');
  const clean = (t: KTranslation) => cleanArabic(t.word!)!;
  return (p && list.find((t) => clean(t) === p)) || list.find((t) => HARAKAT.test(clean(t))) || list[0];
}

export async function pick(concept: Concept): Promise<Pick | { concept: Concept; error: string }> {
  const entries = (await kaikkiEntries('English', concept.en)).filter((e: KEntry) => POS[concept.pos].includes(e.pos));
  if (!entries.length) return { concept, error: 'madde yok' };

  type Group = { sense: string; ar: KTranslation[]; tr: KTranslation[] };
  const all: Group[] = [];
  for (const e of entries) {
    const bySense = new Map<string, Group>();
    for (const t of e.translations ?? []) {
      const sense = t.sense ?? '';
      const g = bySense.get(sense) ?? { sense, ar: [], tr: [] };
      if (isMsa(t)) g.ar.push(t);
      else if (t.lang === 'Turkish' && t.word) g.tr.push(t);
      bySense.set(sense, g);
    }
    all.push(...bySense.values());
  }
  // Türkçe elle verilmiş maddelerde Türkçe tablo aranmaz (yalnızca Arapça tablosu yeterli); diğerlerinde ikisi de gerekir.
  const groups = all.filter((g) => g.ar.length && (concept.trForce || g.tr.length));
  if (!groups.length) return { concept, error: 'Türkçe+Arapça çeviri tablosu yok' };

  const flags: string[] = [];
  const want = lc(concept.trPrefer);
  const hasTr = (x: Group) => x.tr.some((t) => lc(t.word!.trim()) === want);
  const hintOk = (x: Group) => !!concept.hint && lc(x.sense).includes(lc(concept.hint));

  const finish = (g: Group, tr: string, trAll: string[]): Pick | { concept: Concept; error: string } => {
    const arT = chooseAr(g.ar, concept.arPrefer);
    const ar = cleanArabic(arT.word!)!;
    // Harekesiz Arapça alınmaz: okunuş üretilemez ve öğrenene yanlış okuma öğretir.
    if (!HARAKAT.test(ar) && ar.replace(/ /g, '').length > 2) return { concept, error: `Arapça harekesiz (${ar})` };
    if (concept.arPrefer && ar !== concept.arPrefer.normalize('NFC')) flags.push(`tercih edilen Arapça (${concept.arPrefer}) tabloda yok`);
    return { concept, sense: g.sense, tr, trAll, ar, arRoman: arT.roman, arTags: arT.tags ?? [], arAll: g.ar.map((t) => cleanArabic(t.word!)!), flags };
  };

  if (concept.trForce) {
    // Türkçe elle verilmiş: anlam tablosu yalnızca ipucuyla (yoksa ilk tablo) seçilir, Arapça o tablodan alınır.
    const gf = concept.hint ? groups.find(hintOk) : groups[0];
    if (!gf) return { concept, error: `ipucu tutmadı ("${concept.hint}")` };
    flags.push('Türkçe elle verildi');
    return finish(gf, concept.trPrefer, [concept.trPrefer]);
  }

  // Anlam seçimi (en güvenilirden): istenen Türkçe + ipucu; istenen Türkçe tabloda ilk sırada;
  // istenen Türkçe herhangi bir sırada; yalnızca ipucu (Türkçe tablodan alınır).
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
  return finish(g, trAll.find((t) => lc(t) === want) ?? trAll[0], trAll);
}
