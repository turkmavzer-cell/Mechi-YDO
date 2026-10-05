/** Arama anahtarı normalizasyonu. Görüntülenen metin asla bundan geçmez. */

const TR = 'tr-TR';

/** Türkçe: küçük harf (İ/ı doğru), noktalama atılır, boşluklar tekilleşir. */
export function normTr(s: string): string {
  return s
    .normalize('NFC')
    .toLocaleLowerCase(TR)
    .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Türkçe karakter eksik yazılmış girdi için ikinci deneme anahtarı. */
export function foldTr(s: string): string {
  return normTr(s)
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
}

const HARAKAT = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

/** Harekeleri ve tatweel'i atar (gösterim için). Harf yapısı değişmez. */
export function stripHarakat(s: string): string {
  return s.replace(HARAKAT, '').replace(TATWEEL, '');
}

/** Arapça arama anahtarı: hareke/tatweel yok; أ إ آ→ا, ى→ي, ة→ه. */
export function normAr(s: string): string {
  return stripHarakat(s)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeTr(s: string): string[] {
  const n = normTr(s);
  return n ? n.split(' ') : [];
}
