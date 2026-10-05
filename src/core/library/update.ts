/**
 * Kütüphane güncelleme: internetten yalnızca veri paketi (JSON) iner, kod inmez.
 * Akış: manifest → sürüm karşılaştır → paketi indir → boyut + sha256 + şema doğrula → cihaza kaydet.
 * Doğrulamayı geçmeyen paket asla kaydedilmez; eski kütüphane kullanılmaya devam eder.
 */
import { Preferences } from '@capacitor/preferences';
import { BUNDLED_PACK, PACK_FORMAT, validatePack, type LibraryPack } from './pack';

/** Paket üst sınırı (bozuk/kötü niyetli dev dosyaya karşı). */
export const MAX_PACK_BYTES = 8 * 1024 * 1024;
const KEY = 'library.pack.v1';

export interface Manifest {
  format: 1;
  version: number;
  /** Paket adresi; göreli ise manifestin adresine göre çözülür. */
  url: string;
  sha256: string;
  size: number;
  builtAt: string;
}

export type FetchFn = (url: string) => Promise<Response>;
const defaultFetch: FetchFn = (u) => fetch(u, { cache: 'no-store' });

/** Yalnızca https (geliştirmede localhost için http). */
export function isAllowedUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

export function parseManifest(raw: unknown): Manifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  if (m.format !== PACK_FORMAT) return null;
  if (typeof m.version !== 'number' || !Number.isInteger(m.version) || m.version < 1) return null;
  if (typeof m.url !== 'string' || !m.url) return null;
  if (typeof m.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(m.sha256)) return null;
  if (typeof m.size !== 'number' || !Number.isInteger(m.size) || m.size < 1 || m.size > MAX_PACK_BYTES) return null;
  if (typeof m.builtAt !== 'string') return null;
  return m as unknown as Manifest;
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class UpdateError extends Error {}

async function getOk(fetchFn: FetchFn, url: string): Promise<Response> {
  if (!isAllowedUrl(url)) throw new UpdateError('Güvenli olmayan adres (yalnızca https).');
  let res: Response;
  try {
    res = await fetchFn(url);
  } catch {
    throw new UpdateError('İnternete ulaşılamadı.');
  }
  if (!res.ok) throw new UpdateError(`Sunucu hata verdi (${res.status}).`);
  return res;
}

export type CheckResult =
  | { kind: 'uptodate'; manifest: Manifest }
  | { kind: 'available'; manifest: Manifest; manifestUrl: string };

/** Sunucudaki sürüm, mevcut sürümden yeniyse "available" döner. */
export async function checkUpdate(manifestUrl: string, currentVersion: number, fetchFn: FetchFn = defaultFetch): Promise<CheckResult> {
  const res = await getOk(fetchFn, manifestUrl);
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new UpdateError('Güncelleme bilgisi okunamadı.');
  }
  const manifest = parseManifest(raw);
  if (!manifest) throw new UpdateError('Güncelleme bilgisi geçersiz.');
  return manifest.version > currentVersion ? { kind: 'available', manifest, manifestUrl } : { kind: 'uptodate', manifest };
}

/** Paketi indirir ve her kontrolden geçirir; geçerli paketi döndürür (kaydetmez). */
export async function downloadPack(manifest: Manifest, manifestUrl: string, fetchFn: FetchFn = defaultFetch): Promise<LibraryPack> {
  const res = await getOk(fetchFn, new URL(manifest.url, manifestUrl).toString());
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_PACK_BYTES) throw new UpdateError('Paket çok büyük.');
  if (bytes.byteLength !== manifest.size) throw new UpdateError('Paket eksik veya fazla indi; tekrar dene.');
  if ((await sha256Hex(bytes)) !== manifest.sha256) throw new UpdateError('Paket doğrulanamadı (sha256 uyuşmuyor).');
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new UpdateError('Paket okunamadı.');
  }
  const v = validatePack(raw);
  if ('error' in v) throw new UpdateError(v.error);
  if (v.pack.version !== manifest.version) throw new UpdateError('Paket sürümü bilgiyle uyuşmuyor.');
  return v.pack;
}

// --- Cihazda saklama (Preferences: Android'de SharedPreferences, tarayıcıda localStorage)

export async function saveInstalledPack(pack: LibraryPack): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(pack) });
}

export async function clearInstalledPack(): Promise<void> {
  await Preferences.remove({ key: KEY });
}

/** Cihazdaki indirilmiş paketi okur. Bozuksa ya da gömülü paketten eskiyse (APK güncellenmiş olabilir) yok sayılır. */
export async function loadInstalledPack(): Promise<LibraryPack | null> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return null;
    const v = validatePack(JSON.parse(value));
    if ('error' in v) return null;
    return v.pack.version > BUNDLED_PACK.version ? v.pack : null;
  } catch {
    return null;
  }
}
