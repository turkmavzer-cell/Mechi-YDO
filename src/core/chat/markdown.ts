import { VOCAB_POS, type VocabEntry, type VocabPos } from './types.ts';

export const MD_FILENAME = 'misir-arapcasi-kelimeler.md';
const JSON_MARK_START = '<!-- mechi-vocab-eg:v1 begin -->';
const JSON_MARK_END = '<!-- mechi-vocab-eg:v1 end -->';

const POS_TR: Record<VocabPos, string> = {
  noun: 'isim', verb: 'fiil', adj: 'sıfat', adv: 'zarf', prep: 'edat', pron: 'zamir',
  num: 'sayı', particle: 'edat/bağlaç', phrase: 'kalıp',
};

/** Tablo hücresi: boru işareti kaçırılır, satır sonları boşluğa çevrilir. */
const cell = (s: string) => s.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();

const pad = (n: number) => String(n).padStart(2, '0');
/** Yerel saat: 2026-10-05 14:32 */
export function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const dateOnly = (iso: string) => formatLocal(iso).slice(0, 10);

export interface MarkdownOptions {
  generatedAt: string;
  appVersion?: string;
}

/**
 * Sohbetten toplanan kelimelerin md dosyası. İnsan için tablo, araçlar için sonda JSON bloğu
 * (`parseVocabMarkdown` ile geri okunur; Aşama 7 hattı kütüphaneyi büyütürken bunu kullanır).
 * Sıra: ilk görülme tarihine göre eskiden yeniye (yeni kelimeler dosyanın sonuna eklenir).
 */
export function buildVocabMarkdown(entries: VocabEntry[], opts: MarkdownOptions): string {
  const sorted = [...entries].sort((a, b) => a.firstSeen.localeCompare(b.firstSeen) || a.key.localeCompare(b.key));
  const total = sorted.reduce((n, e) => n + e.count, 0);
  const lines: string[] = [
    '# Mısır Arapçası — Sohbetten Toplanan Kelimeler',
    '',
    `- Oluşturulma: ${formatLocal(opts.generatedAt)}`,
    `- Kaynak: Yurt Dışı Asistanı${opts.appVersion ? ` ${opts.appVersion}` : ''} · Sohbet (Mısır Arapçası ⇄ Türkçe)`,
    `- Kelime/kalıp: **${sorted.length}** · Toplam görülme: ${total}`,
    '- Durum: **doğrulanmamış.** Çeviriler, okunuşlar ve örnek cümleler yapay zekâ (Claude) çıktısıdır; Mısırlı bir konuşmacıyla doğrulanmadan kütüphaneye eklenmemelidir.',
    '- Okunuş: Mısır telaffuzuna göre Türkçe harflerle (ج = g, ق = hemze, \' = ayn/hemze).',
    '',
    '## Kelimeler',
    '',
  ];

  if (sorted.length === 0) {
    lines.push('_Henüz kelime yok. Sohbette yeni kelimeler geçtikçe burada birikir._', '');
  } else {
    lines.push(
      '| # | Mısır Arapçası | Okunuş | Türkçe | Tür | Örnek (Mısır Arapçası) | Örnek (Türkçe) | Görülme | İlk görülme |',
      '|--:|---|---|---|---|---|---|--:|---|',
    );
    sorted.forEach((e, i) => {
      const tr = [e.tr, ...e.altTr].map(cell).join('; ');
      lines.push(
        `| ${i + 1} | ${cell(e.ar)} | ${cell(e.translit)} | ${tr} | ${POS_TR[e.pos] ?? e.pos} | ${cell(e.exampleAr)} | ${cell(e.exampleTr)} | ${e.count} | ${dateOnly(e.firstSeen)} |`,
      );
    });
    lines.push('');
  }

  lines.push(
    '## Makine tarafından okunabilir veri',
    '',
    'Aşağıdaki blok araçlar içindir; elle düzenlemeyin.',
    '',
    JSON_MARK_START,
    '```json',
    JSON.stringify(sorted, null, 1),
    '```',
    JSON_MARK_END,
    '',
  );
  return lines.join('\n');
}

/** md içindeki JSON bloğunu geri okur; bozuk veya eksikse boş dizi döner. Kayıtlar yeniden doğrulanır. */
export function parseVocabMarkdown(md: string): VocabEntry[] {
  const a = md.indexOf(JSON_MARK_START);
  const b = md.indexOf(JSON_MARK_END);
  if (a < 0 || b < a) return [];
  const block = md.slice(a + JSON_MARK_START.length, b);
  const start = block.indexOf('```json');
  const end = block.lastIndexOf('```');
  if (start < 0 || end <= start) return [];
  try {
    const raw = JSON.parse(block.slice(start + '```json'.length, end)) as unknown;
    if (!Array.isArray(raw)) return [];
    const out: VocabEntry[] = [];
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      const e = r as Partial<VocabEntry>;
      if (typeof e.key !== 'string' || typeof e.ar !== 'string' || typeof e.tr !== 'string' || !e.key || !e.ar) continue;
      out.push({
        key: e.key, ar: e.ar, translit: typeof e.translit === 'string' ? e.translit : '', tr: e.tr,
        altTr: Array.isArray(e.altTr) ? e.altTr.filter((x): x is string => typeof x === 'string').slice(0, 3) : [],
        pos: VOCAB_POS.includes(e.pos as VocabPos) ? (e.pos as VocabPos) : 'phrase',
        exampleAr: typeof e.exampleAr === 'string' ? e.exampleAr : '',
        exampleTr: typeof e.exampleTr === 'string' ? e.exampleTr : '',
        count: typeof e.count === 'number' && e.count >= 1 ? Math.floor(e.count) : 1,
        firstSeen: typeof e.firstSeen === 'string' ? e.firstSeen : '', lastSeen: typeof e.lastSeen === 'string' ? e.lastSeen : '',
        verified: false, source: 'chat-eg',
      });
    }
    return out;
  } catch {
    return [];
  }
}
