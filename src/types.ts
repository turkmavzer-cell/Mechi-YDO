export type Variant = 'msa';
export type Pos = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'pron' | 'num' | 'particle' | 'phrase';
export type Source = 'library' | 'online' | 'offline_model';
export type Gender = 'm' | 'f';

export interface Word {
  tr: string;
  trNorm: string;
  ar: string;
  arPlain: string;
  translit: string;
  pos: Pos;
  category: string;
  gender?: Gender;
  variant: Variant;
  verified: boolean;
}

export interface Verb {
  tr: string; // mastar: binmek
  ar: string; // رَكِبَ
  masdar: string;
  root: string;
  form: string; // I..X
  type: string;
  transitive: boolean;
  translit: string;
  variant: Variant;
  verified: boolean;
}

export interface FormEntry {
  form: string;
  lemma: string;
  tense: string;
  person: string;
}

/** Fusha'nın 13 şahsı (emirde yalnızca 2. şahıslar). */
export type ArPerson =
  | 'ana' | 'anta' | 'anti' | 'huwa' | 'hiya' | 'antuma' | 'huma_m' | 'huma_f'
  | 'nahnu' | 'antum' | 'antunna' | 'hum' | 'hunna';

export type ConjTense = 'past' | 'present' | 'future' | 'futureSawfa' | 'imperative';

export interface ConjCell {
  ar: string;
  /** Bilimsel okunuş (Wiktionary biçimi); Türkçe okunuş buradan üretilir. */
  rom: string;
  /** Türkçe karşılık (ör. "bindim"). İkil ve dişil şahıslarda Türkçe çoğul/ortak biçim kullanılır. */
  tr?: string;
  /** Yalnızca muḍāriʿ hücrelerinde: Türkçe geniş zaman karşılığı (ör. "biner"); `tr` şimdiki zamandır. */
  trAorist?: string;
  /** Aynı hücrenin geçerli diğer yazımları. */
  alt?: string[];
}

export type ConjTable = Partial<Record<ArPerson, ConjCell>>;

export interface Conjugations {
  source: string;
  /** Bağımsız kural motoruyla makine kontrolü; insan doğrulaması değildir. */
  crossCheck: 'match' | 'mismatch' | 'unsupported';
  active: Record<ConjTense, ConjTable>;
  /** Yalnızca geçişli fiillerde. */
  passive?: { past: ConjTable; present: ConjTable };
}

export interface AlignRow {
  tr: string;
  ar: string;
  translit: string;
  /** Çekim tablosundan gelen fiillerde bilimsel okunuş. */
  rom?: string;
  pos: Pos | string;
  lemma?: string;
  tense?: string;
  person?: string;
  verb?: boolean;
  /** Hizalama güvenilir değil: tabloda "~" ile gösterilir. */
  uncertain?: boolean;
}

export interface Sentence {
  tr: string;
  trNorm: string;
  /** Türkçe söyleyiş alternatifleri (normalize edilmiş arama anahtarları). */
  trAlt?: string[];
  ar: string;
  /** Dişil biçim (varsa) ve kime göre: addressee = karşıdaki kadın, speaker = konuşan kadın. */
  arF?: string;
  translitF?: string;
  arFKind?: 'addressee' | 'speaker';
  translit: string;
  category: string;
  align: AlignRow[];
  variant: Variant;
  verified: boolean;
}

export type MatchKind = 'sentence' | 'word-by-word' | 'none';

export interface TranslationResult {
  input: string;
  tokens: string[];
  arabic: string;
  translit: string;
  source: Source;
  matchKind: MatchKind;
  confidence: 'high' | 'low' | 'none';
  verified: boolean;
  rows: AlignRow[];
  missingWords: string[];
}
