export const SETTINGS_VERSION = 3;

export interface Settings {
  settingsVersion: number;
  showTransliteration: boolean;
  translitStyle: 'simple' | 'detailed';
  /** Kelime sonu (i'rab) harekelerini oku. Kapalı = duruş (waqf) okunuşu. */
  readIrab: boolean;
  showHarakat: boolean;
  arabicFontSize: number;
  turkishFontSize: number;
  theme: 'light' | 'dark' | 'system';
  pulseVerbs: boolean;
  reduceMotion: boolean;
  showSourceBadge: boolean;
  markUnverified: boolean;
  addressGender: 'm' | 'f';
  // --- Fiil penceresi (v2)
  verbBlur: number;
  verbShowPast: boolean;
  verbShowPresent: boolean;
  verbShowFuture: boolean;
  /** v3: Geniş zaman sekmesi (Arapçası şimdiki zamanla aynı muḍāriʿ). */
  verbShowAorist: boolean;
  verbShowImperative: boolean;
  verbShowDual: boolean;
  verbShowPassive: boolean;
  verbMarkUsed: boolean;
  verbShowMeta: boolean;
  verbGenderSplit: boolean;
  futureParticle: 'sa' | 'sawfa';
}

export const DEFAULT_SETTINGS: Settings = {
  settingsVersion: SETTINGS_VERSION,
  showTransliteration: true,
  translitStyle: 'simple',
  readIrab: false,
  showHarakat: true,
  arabicFontSize: 36,
  turkishFontSize: 20,
  theme: 'system',
  pulseVerbs: true,
  reduceMotion: false,
  showSourceBadge: true,
  markUnverified: true,
  addressGender: 'm',
  verbBlur: 8,
  verbShowPast: true,
  verbShowPresent: true,
  verbShowFuture: true,
  verbShowAorist: true,
  verbShowImperative: true,
  verbShowDual: true,
  verbShowPassive: true,
  verbMarkUsed: true,
  verbShowMeta: true,
  verbGenderSplit: true,
  futureParticle: 'sa',
};

const ENUMS: Partial<Record<keyof Settings, readonly string[]>> = {
  translitStyle: ['simple', 'detailed'],
  theme: ['light', 'dark', 'system'],
  addressGender: ['m', 'f'],
  futureParticle: ['sa', 'sawfa'],
};
const RANGES: Partial<Record<keyof Settings, [number, number]>> = {
  arabicFontSize: [24, 64],
  turkishFontSize: [14, 32],
  verbBlur: [0, 20],
};

/**
 * Saklı ayarı güncel şemaya taşır. Bilinmeyen/eksik/geçersiz alanlar varsayılana düşer, geçerli olanlar korunur.
 * Yeni sürüm eklerken: SETTINGS_VERSION'ı artır; yeniden adlandırma gibi dönüşümler gerekiyorsa
 * aşağıya `if (version < N)` adımı ekle. (v1 → v2 → v3: yalnızca yeni alanlar eklendi, varsayılanla dolar.)
 */
export function migrateSettings(raw: unknown): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof Settings)[]) {
    const v = src[key];
    if (v === undefined || typeof v !== typeof base[key]) continue;
    const allowed = ENUMS[key];
    if (allowed && !allowed.includes(v as string)) continue;
    const range = RANGES[key];
    if (range && (Number.isNaN(v) || (v as number) < range[0] || (v as number) > range[1])) continue;
    (base as unknown as Record<string, unknown>)[key] = v;
  }
  base.settingsVersion = SETTINGS_VERSION;
  return base;
}
