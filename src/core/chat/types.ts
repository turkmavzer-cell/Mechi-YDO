/** Sohbet (Türkçe ⇄ Fusha) ortak tipleri. Hem uygulama hem Cloudflare Worker kullanır. */

/** tr2ar: kullanıcı Türkçe yazar → Fusha. ar2tr: karşıdakinin Arapça sözü → Türkçe. */
export type ChatDirection = 'tr2ar' | 'ar2tr';

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
  /** Harekeli Arapça (tr2ar: Fusha çıktı; ar2tr: girdinin Arap harfine normalize hâli). */
  ar: string;
  /** Türkçe harflerle okunuş. Model üretmez: uygulama harekeli Arapçadan kendi motoruyla üretir (hareke yetersizse boş). */
  translit: string;
  /** Türkçe (tr2ar: girdinin düzeltilmiş hâli; ar2tr: çıktı). */
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
  /** Karşıdaki kişinin cinsiyeti: "sen" biçimlerini belirler. */
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
  /** library: yerel kütüphaneden (internetsiz, ücretsiz); online: Claude. Eski kayıtlarda yok = online. */
  source?: 'library' | 'online';
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
  /** Her kayıt doğrulanmamıştır: yapay zekâ çıktısıdır, Arapça bilen biriyle doğrulanmalı. */
  verified: false;
  source: 'chat-ar';
}
