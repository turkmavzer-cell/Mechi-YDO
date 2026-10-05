/**
 * Wiktionary Arapça fiil maddesinden kütüphane fiil kaydı: sözlük biçimi, bab, kök, masdar, geçişlilik, tür.
 * Kök, Wiktionary çekim şablonundan (ör. "I/i~a.II:و.ipass") ve sözlük biçiminin iskeletinden kurallı çıkarılır.
 */
import { kaikkiEntries, type KEntry } from './kaikki.ts';

const HARAKAT = /[\u064B-\u0652\u0670]/g;
const plain = (s: string) => s.normalize('NFC').replace(HARAKAT, '').replace(/\u0640/g, '');
/** Hemze kürsüleri tek "ء"ye; kök harfi olarak karşılaştırma için. */
const HAMZA = (c: string) => ('أإؤئآ'.includes(c) ? 'ء' : c);

export interface LibVerb {
  tr: string;
  ar: string;
  masdar: string;
  root: string;
  form: string;
  type: string;
  transitive: number;
  source: string;
  en: string;
}

const FORMS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Iq'];

/** Bab iskeletinden kök harflerini çıkarır (zayıf harfler şablondaki "I:/II:/III:" ile ezilir). */
export function deriveRoot(lemma: string, form: string, spec: string): string[] | undefined {
  let s = [...plain(lemma)].map(HAMZA);
  // Bab eklerini sök.
  const drop = (prefix: string) => {
    const p = [...prefix];
    if (p.every((c, i) => s[i] === c || (c === 'ا' && s[i] === 'ء'))) s = s.slice(p.length);
    else return false;
    return true;
  };
  switch (form) {
    case 'I': case 'II': case 'Iq': break;
    case 'III': s = s.filter((c, i) => !(i === 1 && c === 'ا')); break;
    case 'IV': if (s[0] === 'ء') s = s.slice(1); break;
    case 'V': drop('ت'); break;
    case 'VI': drop('ت'); s = s.filter((c, i) => !(i === 1 && c === 'ا')); break;
    case 'VII': drop('ان'); break;
    case 'VIII': {
      drop('ا');
      // افتعل: F'den sonraki ت (benzeşmiş ط/د) atılır; اتّصل gibi misal fiillerde ilk ت kökün و/ي'sinin yerindedir.
      if (s[0] === 'ت' && s[1] === 'ت') s = ['و', ...s.slice(2)];
      else if (['ت', 'ط', 'د'].includes(s[1])) s = [s[0], ...s.slice(2)];
      break;
    }
    case 'X': drop('است'); break;
    default: return undefined;
  }
  // Orta uzun ünlü (ecvef: نام، اراد، استفاد) ve son elif/ى (nakıs) zayıf harf yer tutucusudur.
  const want = form === 'Iq' ? 4 : 3;
  if (s.length === want - 1 && s.length >= 2) {
    // Son harf şeddeliyse mudaaf (أَحَبَّ → ح ب ب); değilse ecvef, orta harf düşmüştür (نَامَ → ن ? م).
    s = /ّ[َ-ِ]?$/.test(lemma.normalize('NFC')) ? [s[0], s[1], s[1]] : [s[0], '?', s[1]];
  }
  if (s.length === want && (s[1] === 'ا') && form !== 'Iq') s[1] = '?';
  if (s.length === want && (s[s.length - 1] === 'ى' || s[s.length - 1] === 'ا')) s[s.length - 1] = s[s.length - 1] === 'ى' ? 'ي' : 'و';
  // Şablondaki açık radikal bilgisi her zaman önceliklidir.
  for (const [k, idx] of [['I', 0], ['II', 1], ['III', 2], ['IV', 3]] as const) {
    const m = new RegExp(`(?:^|\\.)${k}:([\\u0621-\\u064A])`).exec(spec);
    if (m && idx < s.length) s[idx] = HAMZA(m[1]);
  }
  if (s.includes('?')) {
    // Şablon belirtmemişse ecvef varsayılanı: şimdiki ünlü u → و, i → ي (Wiktionary kuralı).
    const pres = /~([aiu])/.exec(spec)?.[1];
    s = s.map((c) => (c === '?' ? (pres === 'i' ? 'ي' : 'و') : c));
  }
  if (s.length !== want || s.some((c) => !/[\u0621-\u064A]/.test(c))) return undefined;
  return s;
}

export function verbType(root: string[]): string {
  const weak = (c: string) => c === 'و' || c === 'ي';
  if (root.length === 4) return 'rubai';
  const [F, E, L] = root;
  const weakCount = [F, E, L].filter(weak).length;
  if (weakCount >= 2) return 'lefif';
  if (weak(F)) return 'mithal';
  if (weak(E)) return 'ecvef';
  if (weak(L)) return 'nakis';
  if (E === L) return 'mudaaf';
  if (root.includes('ء')) return 'hemzeli';
  return 'sahih';
}

/** Türkçe mastar + Wiktionary çevirisindeki Arapça fiil → kütüphane fiil kaydı (bulunamazsa hata mesajı). */
export async function arabicVerb(tr: string, arFromTable: string, en: string): Promise<LibVerb | { error: string }> {
  // "اِتَّصَلَ بِـ" → fiil "اِتَّصَلَ" (edat ayrı).
  const lemma = arFromTable.split(/\s+/)[0].normalize('NFC');
  const entries: KEntry[] = (await kaikkiEntries('Arabic', plain(lemma))).filter((e) => e.pos === 'verb');
  const canon = (e: KEntry) => e.forms?.find((f) => f.tags?.includes('canonical'))?.form?.normalize('NFC');
  // Tam harekeli eşleşme; olmazsa son harekesi eksik yazım (سَمِع ↔ سَمِعَ).
  const e =
    entries.find((x) => canon(x) === lemma) ??
    entries.find((x) => canon(x)?.replace(/[\u064E-\u0650]$/, '') === lemma.replace(/[\u064E-\u0650]$/, ''));
  if (!e) return { error: `Wiktionary fiil maddesi yok/eşleşmedi: ${lemma}` };
  const tmpl = e.head_templates?.find((t) => t.name === 'ar-verb')?.args?.['1'] ?? '';
  const form = /^(Iq|I{1,3}|IV|VI{0,3}|IX|X)\b/.exec(tmpl)?.[1] ?? FORMS.find((f) => e.forms?.some((x) => x.tags?.includes(`form-${f.toLowerCase()}`)));
  if (!form) return { error: `bab okunamadı: ${lemma} (${tmpl})` };
  const root = deriveRoot(canon(e)!, form, tmpl);
  if (!root) return { error: `kök çıkarılamadı: ${lemma} (${form}, ${tmpl})` };
  const masdar = e.forms?.find((f) => f.tags?.length === 1 && f.tags[0] === 'noun-from-verb')?.form;
  if (!masdar) return { error: `masdar yok: ${lemma}` };
  // "ipass" (yalnız kişisiz edilgen) ve "nopass" geçişsizlik işaretidir.
  const transitive = /(^|\.)(ipass|nopass)(\.|$)/.test(tmpl) ? 0 : 1;
  return {
    tr, ar: canon(e)!, masdar, root: root.join(' '), form, type: verbType(root), transitive,
    source: 'wiktionary', en,
  };
}
