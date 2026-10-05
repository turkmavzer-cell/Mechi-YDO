/** Sohbet (Mısır Arapçası) ortak tipleri. Hem uygulama hem Cloudflare Worker kullanır. */

/** tr2eg: kullanıcı Türkçe yazar → Mısır Arapçası. eg2tr: Mısırlı konuşanın sözü → Türkçe. */
export type ChatDirection = 'tr2eg' | 'eg2tr';

export type VocabPos = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'pron' | 'num' | 'particle' | 'phrase';
export const VOCAB_POS: readonly VocabPos[] = ['noun', 'verb', 'adj', 'adv', 'prep', 'pron', 'num', 'particle', 'phrase'];

export type Confidence = 'high' | 'medium' | 'low';
export const CONFIDENCES: readonly Confidence[] = ['high', 'medium', 'low'];

export type Gender = 'm' | 'f';

/** Modelin döndürdüğü tek kelime/kalıp. */
export interface ModelWord {
  ar: string;
  translit: string;
  tr: string;
  pos: VocabPos;
  example_ar: string;
  example_tr: string;
}

/** Modelin tek çeviri turu için döndürdüğü sonuç. Yön ne olursa olsun üç alan da doludur. */
export interface ModelResult {
  /** Mısır Arapçası, Arap harfiyle (tr2eg: çıktı; eg2tr: girdinin Arap harfine normalize hâli). */
  ar: string;
  /** Mısır telaffuzuna göre Türkçe harflerle okunuş. */
  translit: string;
  /** Türkçe (tr2eg: girdinin düzeltilmiş hâli; eg2tr: çıktı). */
  tr: string;
  confidence: Confidence;
  /** Kısa Türkçe not (cinsiyet/nezaket farkı, belirsizlik); yoksa boş. */
  notes: string;
  words: ModelWord[];
}

export interface HistoryTurn {
  direction: ChatDirection;
  ar: string;
  tr: string;
}

/** Uygulama → proxy isteği. */
export interface TurnRequest {
  direction: ChatDirection;
  text: string;
  /** Konuşanın (kullanıcının) cinsiyeti: "yorgunum", "gidiyorum" gibi biçimleri belirler. */
  speaker: Gender;
  /** Karşıdaki Mısırlının cinsiyeti: "sen" biçimlerini belirler. */
  addressee: Gender;
  history: HistoryTurn[];
}

export type ChatErrorCode =
  | 'no_proxy'
  | 'consent'
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'bad_request'
  | 'rate_limited'
  | 'refused'
  | 'bad_response'
  | 'server_error';

/** Sohbet balonu: bir tur (kullanıcının girdisi + çevirisi). */
export interface ChatMessage {
  id: string;
  direction: ChatDirection;
  /** ISO zamanı. */
  at: string;
  /** Kullanıcının yazdığı ham metin. */
  input: string;
  ar: string;
  translit: string;
  tr: string;
  confidence: Confidence;
  notes: string;
  /** Bu turda ilk kez eklenen kelimelerin anahtarları (sözlükte vurgulamak için). */
  newWordKeys: string[];
}

/** Kalıcı kelime kaydı (md dışa aktarımının kaynağı). */
export interface VocabEntry {
  key: string;
  ar: string;
  translit: string;
  tr: string;
  /** Aynı kelimede farklı bir Türkçe anlam görüldüyse (en çok 3). */
  altTr: string[];
  pos: VocabPos;
  exampleAr: string;
  exampleTr: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  /** Her kayıt doğrulanmamıştır: yapay zekâ çıktısıdır, Mısırlı bir konuşmacıyla doğrulanmalı. */
  verified: false;
  source: 'chat-eg';
}
