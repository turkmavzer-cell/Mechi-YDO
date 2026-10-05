export const SETTINGS_VERSION = 6;

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
  /** v5: Konuşanın cinsiyeti ("yorgunum" gibi cümlelerde Arapça biçimi belirler). */
  speakerGender: 'm' | 'f';
  // --- Fiil penceresi (v2)
  verbBlur: number;
  verbShowPast: boolean;
  verbShowPresent: boolean;
  verbShowFuture: boolean;
  verbShowImperative: boolean;
  verbShowDual: boolean;
  verbShowPassive: boolean;
  verbMarkUsed: boolean;
  verbShowMeta: boolean;
  verbGenderSplit: boolean;
  futureParticle: 'sa' | 'sawfa';
  // --- Sohbet (Fusha, v6)
  /** Çeviri proxy'si (Cloudflare Worker) adresi. API anahtarı burada DEĞİL, Worker'da durur. */
  chatProxyUrl: string;
  /** Worker'da APP_TOKEN tanımlıysa gönderilen paylaşılan anahtar. */
  chatProxyToken: string;
  /** Sohbet metinlerinin Claude'a (proxy üzerinden) gönderilmesine verilen izin. Varsayılan kapalı. */
  chatConsent: boolean;
  /** Yeni kelime çıkınca md dosyasını cihazda (Belgeler/MechiYDO) otomatik güncelle. */
  chatAutoSaveMd: boolean;
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
  speakerGender: 'm',
  verbBlur: 8,
  verbShowPast: true,
  verbShowPresent: true,
  verbShowFuture: true,
  verbShowImperative: true,
  verbShowDual: true,
  verbShowPassive: true,
  verbMarkUsed: true,
  verbShowMeta: true,
  verbGenderSplit: true,
  futureParticle: 'sa',
  chatProxyUrl: (import.meta.env?.VITE_TRANSLATE_PROXY_URL as string | undefined) ?? '',
  chatProxyToken: '',
  chatConsent: false,
  chatAutoSaveMd: true,
};

const ENUMS: Partial<Record<keyof Settings, readonly string[]>> = {
  translitStyle: ['simple', 'detailed'],
  theme: ['light', 'dark', 'system'],
  addressGender: ['m', 'f'],
  speakerGender: ['m', 'f'],
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
 * aşağıya `if (version < N)` adımı ekle. (v1 → v2 → v3 → v5: yeni alanlar varsayılanla dolar; v4: geniş zaman sekmesi kaldırıldı,
 * `verbShowAorist` alanı artık okunmaz ve kayıttan düşer.)
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
