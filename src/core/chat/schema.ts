/**
 * Model çıktısının JSON şeması ve doğrulayıcısı (okunuş alanı modelden istenmez, uygulama üretir).
 * Worker şemayı modele verir (yapılandırılmış çıktı), hem Worker hem uygulama aynı doğrulayıcıdan geçirir:
 * model bir şeyi yanlış biçimde döndürürse kullanıcıya bozuk veri gitmez.
 */
import { CONFIDENCES, VOCAB_POS, type Confidence, type ModelResult, type ModelWord, type VocabPos } from './types.ts';

const ARABIC_LETTER = /[ء-يٱ-ۓ]/;
export const MAX_WORDS = 8;

/** Anthropic yapılandırılmış çıktı için şema: tüm alanlar zorunlu, ek alan yok. */
export const RESULT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    ar: { type: 'string' },
    tr: { type: 'string' },
    confidence: { type: 'string', enum: [...CONFIDENCES] },
    notes: { type: 'string' },
    words: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ar: { type: 'string' },
          tr: { type: 'string' },
          pos: { type: 'string', enum: [...VOCAB_POS] },
          example_ar: { type: 'string' },
          example_tr: { type: 'string' },
        },
        required: ['ar', 'tr', 'pos', 'example_ar', 'example_tr'],
        additionalProperties: false,
      },
    },
  },
  required: ['ar', 'tr', 'confidence', 'notes', 'words'],
  additionalProperties: false,
} as const;

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.normalize('NFC').trim().slice(0, max) : '');

function parseWord(raw: unknown): ModelWord | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const w = raw as Record<string, unknown>;
  const ar = str(w.ar, 80);
  const tr = str(w.tr, 120);
  // Arap harfi olmayan veya anlamı boş kelime kaydı alınmaz.
  if (!ar || !ARABIC_LETTER.test(ar) || !tr) return undefined;
  const pos = VOCAB_POS.includes(w.pos as VocabPos) ? (w.pos as VocabPos) : 'phrase';
  const exampleAr = str(w.example_ar, 200);
  return {
    // Okunuş modelden istenmez: uygulama harekeli Arapçadan kendi motoruyla üretir (engine.ts).
    ar, translit: '', tr, pos,
    // Örnek cümle Arapça içermiyorsa (model alanları karıştırdıysa) atılır.
    example_ar: ARABIC_LETTER.test(exampleAr) ? exampleAr : '',
    example_tr: ARABIC_LETTER.test(exampleAr) ? str(w.example_tr, 200) : '',
  };
}

/** Bilinmeyen değeri ModelResult'a çevirir; zorunlu alanlar (ar, tr) yoksa fırlatır. */
export function parseModelResult(value: unknown): ModelResult {
  if (!value || typeof value !== 'object') throw new Error('sonuç nesne değil');
  const v = value as Record<string, unknown>;
  const ar = str(v.ar, 1200);
  const tr = str(v.tr, 1200);
  if (!ar || !ARABIC_LETTER.test(ar)) throw new Error('Arapça alan boş veya Arap harfi içermiyor');
  if (!tr) throw new Error('Türkçe alan boş');
  const confidence: Confidence = CONFIDENCES.includes(v.confidence as Confidence) ? (v.confidence as Confidence) : 'medium';
  const words = (Array.isArray(v.words) ? v.words : [])
    .map(parseWord)
    .filter((w): w is ModelWord => !!w)
    .slice(0, MAX_WORDS);
  return { ar, translit: '', tr, confidence, notes: str(v.notes, 300), words };
}
