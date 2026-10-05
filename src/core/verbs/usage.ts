import type { AlignRow, ArPerson, ConjCell, ConjTense, Conjugations, Gender } from '../../types';
import { stripHarakat } from '../tokenizer/normalize';
import { PERSONS, personsForTr, tableForTrTense } from './persons';

export interface UsedForm {
  voice: 'active' | 'passive';
  tense: ConjTense;
  persons: ArPerson[];
  /** true: Arapça yazım tablodaki hücreyle birebir eşleşti; false: Türkçe şahıstan tahmin edildi. */
  exact: boolean;
}

const nfc = (s: string) => s.normalize('NFC');

/**
 * Cümlede kullanılan çekimi bulur.
 * 1) Satırın Arapçası (veya içindeki bir kelime, ör. "لَا أَفْهَمُ") tablodaki bir hücreyle aynıysa o hücre.
 * 2) Değilse Türkçe zaman/şahıs bilgisinden aday hücreler.
 * Masdar gibi tabloda olmayan biçimlerde undefined döner.
 */
export function findUsedForm(row: AlignRow, conj: Conjugations, gender: Gender): UsedForm | undefined {
  const words = row.ar ? row.ar.split(/\s+/).map(nfc) : [];
  const plainWords = words.map(stripHarakat);
  const tables: [UsedForm['voice'], ConjTense][] = [
    ['active', 'past'], ['active', 'present'], ['active', 'future'], ['active', 'imperative'],
    ['passive', 'past'], ['passive', 'present'],
  ];
  for (const strict of [true, false]) {
    for (const [voice, tense] of tables) {
      const table = voice === 'active' ? conj.active[tense] : conj.passive?.[tense as 'past' | 'present'];
      if (!table) continue;
      const hits = PERSONS.filter((p) => {
        const c = table[p];
        if (!c) return false;
        const forms = [c.ar, ...(c.alt ?? [])].map(nfc);
        return strict ? forms.some((f) => words.includes(f)) : forms.some((f) => plainWords.includes(stripHarakat(f)));
      });
      if (hits.length) {
        // Aynı yazım birden çok şahısta olabilir (ör. tarkabu: anta/hiya); Türkçe şahıs varsa onunla daralt.
        const pref = personsForTr(row.person, gender);
        const narrowed = hits.filter((p) => pref.includes(p));
        // "سَوْفَ أَرْكَبُ": fiil şimdiki tabloda bulunur ama gelecek zamandır.
        const sawfa = tense === 'present' && plainWords.includes('سوف');
        return { voice, tense: sawfa ? 'futureSawfa' : tense, persons: narrowed.length ? narrowed : hits, exact: true };
      }
    }
  }
  const tense = tableForTrTense(row.tense);
  if (!tense) return undefined;
  const persons = personsForTr(row.person, gender);
  return persons.length ? { voice: 'active', tense, persons, exact: false } : undefined;
}

/** Türkçe çekimli fiil için varsayılan Arapça hücre (kelime kelime çeviride kullanılır). */
export function cellForTrForm(
  conj: Conjugations, trTense: string | undefined, trPerson: string | undefined, gender: Gender,
): { cell: ConjCell; tense: ConjTense; person: ArPerson } | undefined {
  const tense = tableForTrTense(trTense);
  if (!tense) return undefined;
  for (const person of personsForTr(trPerson, gender)) {
    const cell = conj.active[tense][person];
    if (cell) return { cell, tense, person };
  }
  return undefined;
}
