import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { DEFAULT_SETTINGS, migrateSettings, type Settings } from './schema';

const KEY = 'settings';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

async function persist(s: Settings) {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(s) });
  } catch (e) {
    console.error('Ayarlar kaydedilemedi', e);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    try {
      const { value } = await Preferences.get({ key: KEY });
      set({ settings: migrateSettings(value ? JSON.parse(value) : null), loaded: true });
    } catch {
      set({ settings: DEFAULT_SETTINGS, loaded: true });
    }
  },
  update: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    void persist(next);
  },
  reset: () => {
    set({ settings: DEFAULT_SETTINGS });
    void persist(DEFAULT_SETTINGS);
  },
}));

/** Okunuş çentiği TEK kaynaktan okunur; bileşenler bu kancaya abone olur. */
export const useShowTranslit = () => useSettingsStore((s) => s.settings.showTransliteration);
