import { mergeVocab } from './vocab.ts';
import type { ChatDirection, ChatMessage, Gender, HistoryTurn, ModelResult, TurnRequest, VocabEntry } from './types.ts';

export const MAX_MESSAGES = 300;
export const HISTORY_TURNS = 6;
export const MAX_INPUT = 600;

export interface ChatState {
  messages: ChatMessage[];
  vocab: VocabEntry[];
}

export interface TurnParams {
  direction: ChatDirection;
  text: string;
  speaker: Gender;
  addressee: Gender;
}

export type Translator = (req: TurnRequest) => Promise<ModelResult>;

/** Modele giden bağlam: son birkaç turun Arapça ve Türkçe hâli (çeviri tutarlılığı için). */
export function historyOf(messages: ChatMessage[]): HistoryTurn[] {
  return messages.slice(-HISTORY_TURNS).map((m) => ({ direction: m.direction, ar: m.ar, tr: m.tr }));
}

export function cleanInput(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT);
}

/**
 * Bir sohbet turunu çalıştırır: çevir, kelimeleri sözlüğe birleştir, balonu ekle.
 * Hata olursa durum DEĞİŞMEZ ve hata fırlatılır (arayüz metni korur, yeniden denenebilir).
 */
export async function runTurn(
  state: ChatState,
  params: TurnParams,
  translate: Translator,
  now: () => string,
  newId: () => string,
): Promise<{ state: ChatState; message: ChatMessage }> {
  const text = cleanInput(params.text);
  if (!text) throw new Error('boş metin');
  const result = await translate({
    direction: params.direction, text, speaker: params.speaker, addressee: params.addressee, history: historyOf(state.messages),
  });
  const at = now();
  const merged = mergeVocab(state.vocab, result.words, at);
  const message: ChatMessage = {
    id: newId(), direction: params.direction, at, input: text, ar: result.ar, translit: result.translit, tr: result.tr,
    confidence: result.confidence, notes: result.notes, newWordKeys: merged.added.map((e) => e.key),
  };
  return {
    state: { messages: [...state.messages, message].slice(-MAX_MESSAGES), vocab: merged.entries },
    message,
  };
}
