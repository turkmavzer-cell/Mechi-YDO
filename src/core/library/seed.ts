import type { AlignRow, Conjugations, FormEntry, Gender, Pos, Sentence, Verb, Word } from '../../types';
import { foldTr, normAr, normTr } from '../tokenizer/normalize';
import type { LibraryRepo } from './repo';
// Elle yazılmış tohum (src/data/seed) — çakışmada önceliklidir.
import wordsRaw from '../../data/seed/words.json';
import verbsRaw from '../../data/seed/verbs.json';
import sentencesRaw from '../../data/seed/sentences.json';
import formsRaw from '../../data/seed/forms.json';
import conjugationsRaw from '../../data/seed/conjugations.json';
// Wiktionary'den üretilen kütüphane (tools/build_content.ts, tools/build_verbs.ts).
import libWordsRaw from '../../data/library/words.json';
import libVerbsRaw from '../../data/library/verbs.json';
import libSentencesRaw from '../../data/library/sentences.json';
import libFormsRaw from '../../data/library/forms.json';
import libConjugationsRaw from '../../data/library/conjugations.json';

type WordRow = [string, string, string, string, string, string?];
interface VerbRaw {
  tr: string; ar: string; masdar: string; root: string; form: string; type: string;
  transitive: number; translit: string;
}
interface SentenceRaw {
  tr: string; ar: string; translit: string; category: string; align: AlignRow[];
}
interface LibWordRaw {
  tr: string; ar: string; translit: string; pos: string; category: string; gender?: Gender;
}
interface LibSentenceRaw {
  tr: string; trAlt: string[]; ar: string; arF?: string; arFKind?: 'addressee' | 'speaker';
  translit: string; translitF?: string; category: string;
}
interface FormRaw { form: string; lemma: string; tense: string; person: string }

export const SEED_LIBRARY_VERSION = 0; // 0 = gömülü veri; build_library.py sürüm numarası verir.

export function createSeedRepo(): LibraryRepo {
  // Hiçbir kayıt doğrulanmış değildir (verified: false): Arapça bilen biriyle doğrulanana kadar.
  const words: Word[] = (wordsRaw as unknown as WordRow[]).map(([tr, ar, translit, pos, category, gender]) => ({
    tr, trNorm: normTr(tr), ar, arPlain: normAr(ar), translit, pos: pos as Pos, category,
    gender: gender as Gender | undefined, variant: 'msa', verified: false,
  }));
  const seedWordKeys = new Set(words.map((w) => w.trNorm));
  for (const w of libWordsRaw as unknown as LibWordRaw[]) {
    const trNorm = normTr(w.tr);
    if (seedWordKeys.has(trNorm)) continue; // tohum önceliklidir (üretici de zaten atlar)
    words.push({
      tr: w.tr, trNorm, ar: w.ar, arPlain: normAr(w.ar), translit: w.translit, pos: w.pos as Pos, category: w.category,
      gender: w.gender, variant: 'msa', verified: false,
    });
  }

  const verbs: Verb[] = [...(verbsRaw as unknown as VerbRaw[]), ...(libVerbsRaw as unknown as VerbRaw[])].map((v) => ({
    tr: v.tr, ar: v.ar, masdar: v.masdar, root: v.root, form: v.form, type: v.type,
    transitive: !!v.transitive, translit: v.translit, variant: 'msa', verified: false,
  }));

  const sentences: Sentence[] = (sentencesRaw as unknown as SentenceRaw[]).map((s) => ({
    tr: s.tr, trNorm: normTr(s.tr), ar: s.ar, translit: s.translit, category: s.category,
    align: s.align, variant: 'msa', verified: false,
  }));
  // Kütüphane cümleleri kelime hizalaması taşımaz (align: []); orkestratör satırları sözlükten türetir.
  const sentKeys = new Set(sentences.map((s) => s.trNorm));
  const libSentences: Sentence[] = [];
  for (const s of libSentencesRaw as unknown as LibSentenceRaw[]) {
    if (sentKeys.has(normTr(s.tr))) continue;
    libSentences.push({
      tr: s.tr, trNorm: normTr(s.tr), trAlt: s.trAlt.map(normTr), ar: s.ar, translit: s.translit,
      arF: s.arF, translitF: s.translitF, arFKind: s.arFKind, category: s.category, align: [],
      variant: 'msa', verified: false,
    });
  }
  sentences.push(...libSentences);

  const forms = [...(formsRaw as unknown as FormRaw[]), ...(libFormsRaw as unknown as FormRaw[])];
  const conjugations = {
    ...(libConjugationsRaw as unknown as Record<string, Conjugations>),
    ...(conjugationsRaw as unknown as Record<string, Conjugations>),
  };

  // İki ayrı dizin: tam (normTr) ve Türkçe karakter katlanmış (foldTr). Tam eşleşme her zaman önce aranır;
  // yoksa "su" (su) girdisi "şu" (foldTr: "su") ile karışırdı.
  const add = <T,>(idx: Map<string, T[]>, key: string, item: T) => {
    const list = idx.get(key) ?? [];
    list.push(item);
    idx.set(key, list);
  };
  const wordExact = new Map<string, Word[]>();
  const wordFold = new Map<string, Word[]>();
  for (const w of words) {
    add(wordExact, w.trNorm, w);
    add(wordFold, foldTr(w.tr), w);
  }
  const verbIdx = new Map(verbs.map((v) => [v.tr, v]));
  const sentExact = new Map<string, Sentence>();
  const sentFold = new Map<string, Sentence>();
  for (const s of sentences) {
    // İlk kayıt kazanır: tohum, sonra kütüphane; Türkçe söyleyiş alternatifleri de aynı cümleye gider.
    for (const key of [s.trNorm, ...(s.trAlt ?? [])]) {
      if (!sentExact.has(key)) sentExact.set(key, s);
      if (!sentFold.has(foldTr(key))) sentFold.set(foldTr(key), s);
    }
  }
  const formExact = new Map<string, FormEntry[]>();
  const formFold = new Map<string, FormEntry[]>();
  for (const f of forms) {
    add(formExact, normTr(f.form), f);
    add(formFold, foldTr(f.form), f);
  }

  return {
    version: SEED_LIBRARY_VERSION,
    findSentence: (n) => sentExact.get(n) ?? sentFold.get(foldTr(n)),
    findWords: (n) => wordExact.get(n) ?? wordFold.get(foldTr(n)) ?? [],
    findVerb: (inf) => verbIdx.get(inf),
    findConjugations: (inf) => conjugations[inf],
    exampleFor: (inf) => sentences.find((s) => s.align.some((r) => r.verb && r.lemma === inf)),
    findForms: (n) => formExact.get(n) ?? formFold.get(foldTr(n)) ?? [],
    stats: () => ({
      words: words.length, verbs: verbs.length, sentences: sentences.length, forms: forms.length,
    }),
  };
}
