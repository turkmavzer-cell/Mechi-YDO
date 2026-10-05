/**
 * Kütüphane önce: Türkçe → Arapça isteği, internet ve ücret gerektirmeden yerel kütüphanede aranır.
 * Yalnızca KESİN eşleşme kabul edilir (tam cümle veya tek kelime); kelime kelime birleştirme ve ek çözümlemesi gibi
 * "emin değil" sonuçlar yerel sayılmaz, Claude'a gider (daha doğru çeviri verebilir).
 */
import { getRepo } from '../library/store';
import type { LibraryRepo } from '../library/repo';
import { tokenizeTr } from '../tokenizer/normalize';
import { translate } from '../translation/orchestrator';
import type { Gender } from './types.ts';

export interface LocalHit {
  ar: string;
}

export function lookupLocal(text: string, genders: { addressGender: Gender; speakerGender: Gender }, lib: LibraryRepo = getRepo()): LocalHit | undefined {
  const r = translate(text, lib, { ...genders, translit: false });
  if (!r.arabic) return undefined;
  if (r.matchKind === 'sentence') return { ar: r.arabic };
  // Tek kelime: bulundu, ek çözümlemesi veya hizalama belirsizliği yok.
  if (r.matchKind === 'word-by-word' && tokenizeTr(text).length === 1 && r.missingWords.length === 0 && r.rows.length === 1 && !r.rows[0].uncertain) {
    return { ar: r.arabic };
  }
  return undefined;
}
