import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { useSettingsStore } from '../settings/store';
import { translateViaProxy, ChatError } from './engine.ts';
import { autoSaveMarkdown } from './exportMd.ts';
import { buildVocabMarkdown } from './markdown.ts';
import { cleanInput, MAX_MESSAGES, runTurn, type ChatState } from './session.ts';
import type { ChatDirection, ChatMessage, VocabEntry } from './types.ts';

const KEY_MESSAGES = 'chat.messages.v1';
const KEY_VOCAB = 'chat.vocab.v1';
const APP_VERSION = '0.1.0';

export interface ChatUiError {
  code: ChatError['code'];
  message: string;
}

interface ChatStore extends ChatState {
  loaded: boolean;
  busy: boolean;
  error: ChatUiError | null;
  load: () => Promise<void>;
  /** Başarılıysa true. Başarısızlıkta durum değişmez, `error` dolar (metin korunup yeniden denenebilir). */
  send: (direction: ChatDirection, text: string) => Promise<boolean>;
  dismissError: () => void;
  clearChat: () => void;
  removeVocab: (key: string) => void;
  clearVocab: () => void;
}

async function save(key: string, value: unknown) {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch (e) {
    console.error('Sohbet verisi kaydedilemedi', e);
  }
}

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  vocab: [],
  loaded: false,
  busy: false,
  error: null,

  load: async () => {
    const [messages, vocab] = await Promise.all([read<ChatMessage[]>(KEY_MESSAGES, []), read<VocabEntry[]>(KEY_VOCAB, [])]);
    set({
      messages: Array.isArray(messages) ? messages.slice(-MAX_MESSAGES) : [],
      vocab: Array.isArray(vocab) ? vocab : [],
      loaded: true,
    });
  },

  send: async (direction, text) => {
    if (get().busy) return false;
    const s = useSettingsStore.getState().settings;
    if (!cleanInput(text)) return false;
    if (!s.chatProxyUrl.trim()) {
      set({ error: { code: 'no_proxy', message: 'Çeviri sunucusu adresi tanımlı değil' } });
      return false;
    }
    if (!s.chatConsent) {
      // Metin cihazdan çıkmadan önce kullanıcı izni şarttır (gizlilik).
      set({ error: { code: 'consent', message: 'Metnin Claude\'a gönderilmesine izin verilmedi' } });
      return false;
    }
    set({ busy: true, error: null });
    try {
      const { state } = await runTurn(
        { messages: get().messages, vocab: get().vocab },
        { direction, text, speaker: s.speakerGender, addressee: s.addressGender },
        (req) => translateViaProxy({ url: s.chatProxyUrl, token: s.chatProxyToken || undefined }, req),
        () => new Date().toISOString(),
        newId,
      );
      const addedAny = state.vocab.length > get().vocab.length;
      set({ messages: state.messages, vocab: state.vocab, busy: false });
      void save(KEY_MESSAGES, state.messages);
      void save(KEY_VOCAB, state.vocab);
      if (addedAny && s.chatAutoSaveMd) {
        void autoSaveMarkdown(buildVocabMarkdown(state.vocab, { generatedAt: new Date().toISOString(), appVersion: APP_VERSION }));
      }
      return true;
    } catch (e) {
      const err = e instanceof ChatError ? e : new ChatError('server_error', 'Beklenmeyen hata');
      set({ busy: false, error: { code: err.code, message: err.message } });
      return false;
    }
  },

  dismissError: () => set({ error: null }),
  clearChat: () => {
    set({ messages: [] });
    void save(KEY_MESSAGES, []);
  },
  removeVocab: (key) => {
    const vocab = get().vocab.filter((v) => v.key !== key);
    set({ vocab });
    void save(KEY_VOCAB, vocab);
  },
  clearVocab: () => {
    set({ vocab: [] });
    void save(KEY_VOCAB, []);
  },
}));
