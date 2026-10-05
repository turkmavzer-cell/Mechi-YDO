import type { AlignRow, Gender, TranslationResult, Word } from '../../types';
import type { LibraryRepo } from '../library/repo';
import { normTr, tokenizeTr } from '../tokenizer/normalize';
import { translitAr } from '../translit/index.ts';
import { isAmbiguousTrPerson } from '../verbs/persons';
import { cellTranslit, type TranslitPrefs } from '../verbs/translit';
import { cellForTrForm } from '../verbs/usage';

export interface TranslateOptions {
  /** "sen" gibi cinsiyete göre değişen sözcüklerde ve karşıdakine söylenen cümlelerde hitap edilen kişinin cinsiyeti. */
  addressGender?: Gender;
  /** Konuşanın (kullanıcının) cinsiyeti: "yorgunum", "acıktım" gibi cümlelerde Arapça fiil/sıfat buna göre değişir. */
  speakerGender?: Gender;
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
 * kütüphanede o alan olmadığı için motor harekeli Arapçadan üretir.
 */
function libTranslit(stored: string, ar: string, prefs: TranslitPrefs | false | undefined): string {
  if (prefs === false) return '';
  if (!prefs || (prefs.style === 'simple' && !prefs.irab) || !ar) return stored;
  return translitAr(ar, prefs);
}

/** Türkçe jetonları kelime kelime sözlükten çevirir (en uzun kalıp önce; çekimli fiil → hazır çekim tablosu). */
function wordRows(
  tokens: string[], repo: LibraryRepo, gender: Gender, prefs: TranslitPrefs | false | undefined,
): { rows: AlignRow[]; missing: string[] } {
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
  return { rows, missing };
}

/**
 * Aşama 2: yalnızca kütüphane katmanı.
 * 1) tam cümle eşleşmesi  2) kelime kelime  3) eşleşmeyenler "missingWords".
 * Çevrimiçi/çevrimdışı motor ve havuz yazımı Aşama 3'te bu işlevin ardına eklenir.
 */
export function translate(input: string, repo: LibraryRepo, opts: TranslateOptions = {}): TranslationResult {
  const addressGender = opts.addressGender ?? 'm';
  const speakerGender = opts.speakerGender ?? 'm';
  const prefs = opts.translit;
  const tokens = tokenizeTr(input);
  const empty: TranslationResult = {
    input, tokens, arabic: '', translit: '', source: 'library', matchKind: 'none',
    confidence: 'none', verified: false, rows: [], missingWords: [],
  };
  if (tokens.length === 0) return empty;

  const sentence = repo.findSentence(normTr(input));
  if (sentence) {
    // Dişil biçim: karşıdakine söylenen cümlede hitap cinsiyeti, konuşanın kendisini anlattığı cümlede konuşan cinsiyeti.
    const feminine = !!sentence.arF && (sentence.arFKind === 'speaker' ? speakerGender : addressGender) === 'f';
    const ar = feminine ? sentence.arF! : sentence.ar;
    const stored = feminine ? sentence.translitF ?? sentence.translit : sentence.translit;
    // Kütüphane cümleleri kelime hizalaması taşımıyorsa tablo, her Türkçe kelimenin sözlük karşılığından türetilir;
    // bunlar cümledeki Arapça ile hizalı olmadığı için tümü "~" (emin değil) işaretlenir.
    const rows = sentence.align.length
      ? sentence.align.map((r) => ({ ...r, translit: libTranslit(r.translit, r.ar, prefs) }))
      : wordRows(tokens, repo, addressGender, prefs).rows.filter((r) => r.ar).map((r) => ({ ...r, uncertain: true }));
    return {
      ...empty,
      arabic: ar,
      translit: libTranslit(stored, ar, prefs),
      matchKind: 'sentence',
      confidence: 'high',
      verified: sentence.verified,
      rows,
    };
  }

  const { rows, missing } = wordRows(tokens, repo, addressGender, prefs);
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
