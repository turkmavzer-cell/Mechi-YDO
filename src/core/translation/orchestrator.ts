import type { AlignRow, Gender, TranslationResult, Word } from '../../types';
import type { LibraryRepo } from '../library/repo';
import { normTr, tokenizeTr } from '../tokenizer/normalize';

export interface TranslateOptions {
  /** "sen" gibi cinsiyete göre değişen sözcüklerde varsayılan hitap. */
  addressGender?: Gender;
}

const MAX_PHRASE = 3;

function pickWord(words: Word[], gender: Gender): Word {
  return words.find((w) => w.gender === gender) ?? words.find((w) => !w.gender) ?? words[0];
}

/**
 * Aşama 1: yalnızca kütüphane katmanı.
 * 1) tam cümle eşleşmesi  2) kelime kelime (en uzun kalıp önce)  3) eşleşmeyenler "missingWords".
 * Çevrimiçi/çevrimdışı motor ve havuz yazımı Aşama 3'te bu işlevin ardına eklenir.
 */
export function translate(input: string, repo: LibraryRepo, opts: TranslateOptions = {}): TranslationResult {
  const gender = opts.addressGender ?? 'm';
  const tokens = tokenizeTr(input);
  const empty: TranslationResult = {
    input, tokens, arabic: '', translit: '', source: 'library', matchKind: 'none',
    confidence: 'none', verified: false, rows: [], missingWords: [],
  };
  if (tokens.length === 0) return empty;

  const sentence = repo.findSentence(normTr(input));
  if (sentence) {
    return {
      ...empty,
      arabic: sentence.ar,
      translit: sentence.translit,
      matchKind: 'sentence',
      confidence: 'high',
      verified: sentence.verified,
      rows: sentence.align.map((r) => ({ ...r })),
    };
  }

  const rows: AlignRow[] = [];
  const missing: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let matched = false;
    for (let n = Math.min(MAX_PHRASE, tokens.length - i); n >= 1 && !matched; n--) {
      const key = tokens.slice(i, i + n).join(' ');
      const words = repo.findWords(key);
      if (words.length > 0) {
        const w = pickWord(words, gender);
        rows.push({ tr: key, ar: w.ar, translit: w.translit, pos: w.pos });
        i += n;
        matched = true;
        break;
      }
      if (n === 1) {
        const forms = repo.findForms(key);
        const form = forms.find((f) => repo.findVerb(f.lemma));
        const verb = form ? repo.findVerb(form.lemma) : undefined;
        if (form && verb) {
          // Çekim üretimi Aşama 2'de; burada yalnızca sözlük biçimi gösterilir, bu yüzden "emin değil".
          rows.push({
            tr: key, ar: verb.ar, translit: verb.translit, pos: 'verb', lemma: form.lemma,
            tense: form.tense, person: form.person, verb: true, uncertain: true,
          });
          i += 1;
          matched = true;
        }
      }
    }
    if (!matched) {
      missing.push(tokens[i]);
      rows.push({ tr: tokens[i], ar: '', translit: '', pos: 'unknown', uncertain: true });
      i += 1;
    }
  }

  const found = rows.filter((r) => r.ar);
  if (found.length === 0) return { ...empty, rows, missingWords: missing };
  return {
    ...empty,
    arabic: found.map((r) => r.ar).join(' '),
    translit: found.map((r) => r.translit).join(' '),
    matchKind: 'word-by-word',
    confidence: 'low',
    rows,
    missingWords: missing,
  };
}
