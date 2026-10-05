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

export interface AlignRow {
  tr: string;
  ar: string;
  translit: string;
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
  ar: string;
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
