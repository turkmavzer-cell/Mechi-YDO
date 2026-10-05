import type { ArPerson, ConjTense, Gender } from '../../types';

export const PERSONS: ArPerson[] = [
  'ana', 'anta', 'anti', 'huwa', 'hiya', 'antuma', 'huma_m', 'huma_f',
  'nahnu', 'antum', 'antunna', 'hum', 'hunna',
];
export const PRONOUN_AR: Record<ArPerson, string> = {
  ana: 'أَنَا', anta: 'أَنْتَ', anti: 'أَنْتِ', huwa: 'هُوَ', hiya: 'هِيَ', antuma: 'أَنْتُمَا',
  huma_m: 'هُمَا', huma_f: 'هُمَا', nahnu: 'نَحْنُ', antum: 'أَنْتُمْ', antunna: 'أَنْتُنَّ', hum: 'هُمْ', hunna: 'هُنَّ',
};

/** Türkçe çekim zamanı → Arapça tablo. Geniş ve şimdiki zaman muḍāriʿ ile karşılanır. */
export function tableForTrTense(tense: string | undefined): ConjTense | undefined {
  switch (tense) {
    case 'past': return 'past';
    case 'present':
    case 'aorist': return 'present';
    case 'future': return 'future';
    case 'imperative': return 'imperative';
    default: return undefined;
  }
}

/**
 * Türkçe şahıs → olası Arapça şahıslar (ilki varsayılan).
 * Türkçede cinsiyet ve ikil yoktur: "o", "siz", "onlar" birden çok hücreye karşılık gelir.
 */
export function personsForTr(person: string | undefined, gender: Gender): ArPerson[] {
  const f = gender === 'f';
  switch (person) {
    case 'ben': return ['ana'];
    case 'sen': return f ? ['anti', 'anta'] : ['anta', 'anti'];
    case 'o': return ['huwa', 'hiya'];
    case 'biz': return ['nahnu'];
    case 'siz': return ['antum', 'antunna', 'antuma'];
    case 'onlar': return ['hum', 'hunna', 'huma_m', 'huma_f'];
    default: return [];
  }
}

/** Türkçe şahıs Arapçada tek hücreye mi karşılık geliyor? (Değilse satır "~" ile işaretlenir.) */
export function isAmbiguousTrPerson(person: string | undefined): boolean {
  return person === 'o' || person === 'siz' || person === 'onlar';
}

/**
 * Çekim tablosu iskeleti: her satır ekranda soldan sağa [çoğul, ikil, tekil].
 * 2. şahıs ikil (entuma) eril/dişil aynıdır, iki satırda da görünür; 1. şahısta ikil yoktur, "nahnu" kullanılır.
 */
export const GRID: { cells: [ArPerson, ArPerson, ArPerson]; feminine: boolean }[] = [
  { cells: ['hum', 'huma_m', 'huwa'], feminine: false },
  { cells: ['hunna', 'huma_f', 'hiya'], feminine: true },
  { cells: ['antum', 'antuma', 'anta'], feminine: false },
  { cells: ['antunna', 'antuma', 'anti'], feminine: true },
  { cells: ['nahnu', 'nahnu', 'ana'], feminine: false },
];

/** Şahıs zamirlerinin Türkçe harflerle okunuşu (tablo başlıkları). */
export const PRONOUN_TR: Record<ArPerson, string> = {
  hum: 'hum', huma_m: 'huma', huwa: 'hüve', hunna: 'hunne', huma_f: 'huma', hiya: 'hiye',
  antum: 'entum', antuma: 'entuma', anta: 'ente', antunna: 'entunne', anti: 'enti', nahnu: 'nahnu', ana: 'ene',
};
