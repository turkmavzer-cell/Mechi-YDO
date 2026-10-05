import type { AlignRow, Gender, TranslationResult, Word } from '../../types';
import type { LibraryRepo } from '../library/repo';
import { normTr, tokenizeTr } from '../tokenizer/normalize';
import { translitAr } from '../translit/index.ts';
import { isAmbiguousTrPerson } from '../verbs/persons';
import { cellTranslit, type TranslitPrefs } from '../verbs/translit';
import { cellForTrForm } from '../verbs/usage';

export interface TranslateOptions {
  /** "sen" gibi cinsiyete göre değişen sözcüklerde varsayılan hitap. */
  addressGender?: Gender;
  /**
   * Okunuş tercihleri. `false`: okunuş kapalı, hiç hesaplanmaz.
   * Verilmezse kütüphanedeki elle yazılmış okunuş (sade, duruş) kullanılır.
   */
  translit?: TranslitPrefs | false;
}

const MAX_PHRASE = 3;
const DEFAULT_PREFS: TranslitPrefs = { style: 'simple', irab: false };

function pickWord(words: Word[], gender: Gender): Word {
  return words.find((w) => w.gender === gender) ?? words.find((w) => !w.gender) ?? words[0];
}

/**
 * Kütüphane okunuşu önceliklidir (elle yazılmış, sade + duruş). Ayrıntılı stil veya i'rab istenirse
 * kütüphanede o alan olmadığı için okunuş motoru harekeli Arapçadan üretir.
 */
function libTranslit(stored: string, ar: string, prefs: TranslitPrefs | false | undefined): string {
  if (prefs === false) return '';
  if (!prefs || (prefs.style === 'simple' && !prefs.irab) || !ar) return stored;
  return translitAr(ar, prefs);
}

/**
 * Aşama 2: yalnızca kütüphane katmanı.
 * 1) tam cümle eşleşmesi  2) kelime kelime (en uzun kalıp önce; çekimli fiil → hazır çekim tablosu)
 * 3) eşleşmeyenler "missingWords". Çevrimiçi/çevrimdışı motor ve havuz yazımı Aşama 3'te eklenir.
 */
export function translate(input: string, repo: LibraryRepo, opts: TranslateOptions = {}): TranslationResult {
  const gender = opts.addressGender ?? 'm';
  const prefs = opts.translit;
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
      translit: libTranslit(sentence.translit, sentence.ar, prefs),
      matchKind: 'sentence',
      confidence: 'high',
      verified: sentence.verified,
      rows: sentence.align.map((r) => ({ ...r, translit: libTranslit(r.translit, r.ar, prefs) })),
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
        rows.push({ tr: key, ar: w.ar, translit: libTranslit(w.translit, w.ar, prefs), pos: w.pos });
        i += n;
        matched = true;
        break;
      }
      if (n === 1) {
        const forms = repo.findForms(key);
        const form = forms.find((f) => repo.findVerb(f.lemma));
        const verb = form ? repo.findVerb(form.lemma) : undefined;
        if (form && verb) {
          const base = { tr: key, pos: 'verb', lemma: form.lemma, tense: form.tense, person: form.person, verb: true };
          const conj = repo.findConjugations(form.lemma);
          const hit = conj ? cellForTrForm(conj, form.tense, form.person, gender) : undefined;
          if (hit) {
            // Çekim hazır tablodan gelir; Türkçe şahıs Arapçada birden çok hücreye denk geliyorsa "emin değil".
            rows.push({
              ...base, ar: hit.cell.ar, rom: hit.cell.rom,
              translit: prefs === false ? '' : cellTranslit(hit.cell, hit.tense, prefs ?? DEFAULT_PREFS),
              uncertain: isAmbiguousTrPerson(form.person) || undefined,
            });
          } else {
            // Mastar vb. tabloda olmayan biçim: yalnızca sözlük biçimi gösterilir.
            rows.push({ ...base, ar: verb.ar, translit: libTranslit(verb.translit, verb.ar, prefs), uncertain: true });
          }
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
    translit: found.map((r) => r.translit).filter(Boolean).join(' '),
    matchKind: 'word-by-word',
    confidence: 'low',
    rows,
    missingWords: missing,
  };
}
