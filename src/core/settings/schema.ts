export const SETTINGS_VERSION = 1;

export interface Settings {
  settingsVersion: number;
  showTransliteration: boolean;
  translitStyle: 'simple' | 'detailed';
  showHarakat: boolean;
  arabicFontSize: number;
  turkishFontSize: number;
  theme: 'light' | 'dark' | 'system';
  pulseVerbs: boolean;
  reduceMotion: boolean;
  showSourceBadge: boolean;
  markUnverified: boolean;
  addressGender: 'm' | 'f';
}

export const DEFAULT_SETTINGS: Settings = {
  settingsVersion: SETTINGS_VERSION,
  showTransliteration: true,
  translitStyle: 'simple',
  showHarakat: true,
  arabicFontSize: 36,
  turkishFontSize: 20,
  theme: 'system',
  pulseVerbs: true,
  reduceMotion: false,
  showSourceBadge: true,
  markUnverified: true,
  addressGender: 'm',
};

/**
 * Saklı ayarı güncel şemaya taşır. Bilinmeyen/eksik alanlar varsayılana düşer, geçerli olanlar korunur.
 * Yeni sürüm eklerken: SETTINGS_VERSION'ı artır ve aşağıya `if (version < N)` adımı ekle.
 */
export function migrateSettings(raw: unknown): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Record<string, unknown>;
  // v0 -> v1: sürüm alanı yoktu; alanlar aynı adlarla uyumlu.
  for (const key of Object.keys(base) as (keyof Settings)[]) {
    const v = src[key];
    if (v !== undefined && typeof v === typeof base[key]) {
      (base as unknown as Record<string, unknown>)[key] = v;
    }
  }
  base.settingsVersion = SETTINGS_VERSION;
  return base;
}
