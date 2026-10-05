import type { ArPerson, ConjTense, Gender } from '../../types';

export const PERSONS: ArPerson[] = [
  'ana', 'anta', 'anti', 'huwa', 'hiya', 'antuma', 'huma_m', 'huma_f',
  'nahnu', 'antum', 'antunna', 'hum', 'hunna',
];
export const IMP_PERSONS: ArPerson[] = ['anta', 'anti', 'antuma', 'antum', 'antunna'];

/** İkil (müsenna) şahıslar: ayarla gizlenebilir. */
export const DUAL = new Set<ArPerson>(['antuma', 'huma_m', 'huma_f']);
/** Yalnızca dişil şahıslar: "eril/dişil ayrımı" kapalıyken gizlenir. */
export const FEMININE_ONLY = new Set<ArPerson>(['anti', 'hiya', 'huma_f', 'antunna', 'hunna']);

export const PRONOUN_AR: Record<ArPerson, string> = {
  ana: 'أَنَا', anta: 'أَنْتَ', anti: 'أَنْتِ', huwa: 'هُوَ', hiya: 'هِيَ', antuma: 'أَنْتُمَا',
  huma_m: 'هُمَا', huma_f: 'هُمَا', nahnu: 'نَحْنُ', antum: 'أَنْتُمْ', antunna: 'أَنْتُنَّ', hum: 'هُمْ', hunna: 'هُنَّ',
};

/** [cinsiyet ayrımı açık, kapalı] etiketleri. */
export const PERSON_LABEL: Record<ArPerson, [string, string]> = {
  ana: ['ben', 'ben'],
  anta: ['sen (erkek)', 'sen'],
  anti: ['sen (kadın)', 'sen'],
  huwa: ['o (erkek)', 'o'],
  hiya: ['o (kadın)', 'o'],
  antuma: ['siz ikiniz', 'siz ikiniz'],
  huma_m: ['onlar ikisi (erkek)', 'onlar ikisi'],
  huma_f: ['onlar ikisi (kadın)', 'onlar ikisi'],
  nahnu: ['biz', 'biz'],
  antum: ['siz (erkek)', 'siz'],
  antunna: ['siz (kadın)', 'siz'],
  hum: ['onlar (erkek)', 'onlar'],
  hunna: ['onlar (kadın)', 'onlar'],
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
