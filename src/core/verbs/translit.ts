import type { ConjCell, ConjTense } from '../../types';
import { romanToTurkish, type TranslitStyle } from '../translit/index.ts';

export interface TranslitPrefs {
  style: TranslitStyle;
  /** Kelime sonu harekelerini (i'rab) oku. */
  irab: boolean;
}

/**
 * Çekim hücresinin Türkçe okunuşu.
 * I'rab kapalıyken yalnızca muḍāriʿ (şimdiki/gelecek) sonundaki kip ünlüsü düşer (yarkabu → yarkab);
 * geçmiş ve emir sonları i'rab değil, kalıbın parçasıdır (rakiba, rakibtu) ve korunur.
 */
export function cellTranslit(cell: ConjCell, tense: ConjTense, prefs: TranslitPrefs): string {
  const moodEnding = tense === 'present' || tense === 'future' || tense === 'futureSawfa';
  return romanToTurkish(cell.rom, { style: prefs.style, pausal: moodEnding && !prefs.irab });
}
