import type { AlignRow, FormEntry, Gender, Pos, Sentence, Verb, Word } from '../../types';
import { foldTr, normAr, normTr } from '../tokenizer/normalize';
import type { LibraryRepo } from './repo';
import wordsRaw from '../../data/seed/words.json';
import verbsRaw from '../../data/seed/verbs.json';
import sentencesRaw from '../../data/seed/sentences.json';
import formsRaw from '../../data/seed/forms.json';

type WordRow = [string, string, string, string, string, string?];
interface VerbRaw {
  tr: string; ar: string; masdar: string; root: string; form: string; type: string;
  transitive: number; translit: string;
}
interface SentenceRaw {
  tr: string; ar: string; translit: string; category: string; align: AlignRow[];
}
interface FormRaw { form: string; lemma: string; tense: string; person: string }

export const SEED_LIBRARY_VERSION = 0; // 0 = gömülü tohum; build_library.py sürüm numarası verir.

export function createSeedRepo(): LibraryRepo {
  // Tohum veride hiçbir kayıt doğrulanmış değildir (verified: false).
  const words: Word[] = (wordsRaw as unknown as WordRow[]).map(([tr, ar, translit, pos, category, gender]) => ({
    tr, trNorm: normTr(tr), ar, arPlain: normAr(ar), translit, pos: pos as Pos, category,
    gender: gender as Gender | undefined, variant: 'msa', verified: false,
  }));
  const verbs: Verb[] = (verbsRaw as unknown as VerbRaw[]).map((v) => ({
    tr: v.tr, ar: v.ar, masdar: v.masdar, root: v.root, form: v.form, type: v.type,
    transitive: !!v.transitive, translit: v.translit, variant: 'msa', verified: false,
  }));
  const sentences: Sentence[] = (sentencesRaw as unknown as SentenceRaw[]).map((s) => ({
    tr: s.tr, trNorm: normTr(s.tr), ar: s.ar, translit: s.translit, category: s.category,
    align: s.align, variant: 'msa', verified: false,
  }));
  const forms = formsRaw as unknown as FormRaw[];

  const wordIdx = new Map<string, Word[]>();
  for (const w of words) {
    for (const key of new Set([w.trNorm, foldTr(w.tr)])) {
      const list = wordIdx.get(key) ?? [];
      list.push(w);
      wordIdx.set(key, list);
    }
  }
  const verbIdx = new Map(verbs.map((v) => [v.tr, v]));
  const sentIdx = new Map<string, Sentence>();
  for (const s of sentences) {
    sentIdx.set(s.trNorm, s);
    sentIdx.set(foldTr(s.tr), s);
  }
  const formIdx = new Map<string, FormEntry[]>();
  for (const f of forms) {
    for (const key of new Set([normTr(f.form), foldTr(f.form)])) {
      const list = formIdx.get(key) ?? [];
      list.push(f);
      formIdx.set(key, list);
    }
  }

  return {
    version: SEED_LIBRARY_VERSION,
    findSentence: (n) => sentIdx.get(n) ?? sentIdx.get(foldTr(n)),
    findWords: (n) => wordIdx.get(n) ?? wordIdx.get(foldTr(n)) ?? [],
    findVerb: (inf) => verbIdx.get(inf),
    findForms: (n) => formIdx.get(n) ?? formIdx.get(foldTr(n)) ?? [],
    stats: () => ({
      words: words.length, verbs: verbs.length, sentences: sentences.length, forms: forms.length,
    }),
  };
}
