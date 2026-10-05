/**
 * kaikki.org (Wiktionary dökümü, CC-BY-SA) erişimi: önbellekli, sıralı ve nazik (istekler arası bekleme).
 * Önbellek: data/raw/kaikki-<dil>/ (git dışı). Dosya varsa yeniden indirilmez; "yok" sonucu da önbelleğe yazılır.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'Mechi-YDO-library-builder/0.1 (offline Turkish-Arabic learning app; contact: repo owner)';
const DELAY_MS = 250;

export interface KTranslation {
  lang?: string;
  code?: string;
  sense?: string;
  word?: string;
  roman?: string;
  tags?: string[];
  note?: string;
}
export interface KForm { form: string; tags?: string[]; roman?: string; source?: string }
export interface KSense { glosses?: string[]; tags?: string[]; categories?: { name: string }[] }
export interface KEntry {
  word: string;
  pos: string;
  lang?: string;
  senses?: KSense[];
  translations?: KTranslation[];
  forms?: KForm[];
  categories?: (string | { name: string })[];
  etymology_templates?: { name: string; args: Record<string, string>; expansion?: string }[];
  head_templates?: { name: string; args: Record<string, string>; expansion?: string }[];
}

let last = 0;
async function politeFetch(url: string): Promise<Response> {
  const wait = last + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status >= 500 && attempt < 3) throw new Error(String(res.status));
      return res;
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

/** kaikki "meaning" sayfası yolu: ilk harf / ilk iki harf / kelime. */
function kaikkiPath(lang: 'English' | 'Arabic', word: string): string {
  const chars = [...word];
  const p1 = chars[0];
  const p2 = chars.slice(0, 2).join('');
  return `https://kaikki.org/dictionary/${lang}/meaning/${[p1, p2, word].map(encodeURIComponent).join('/')}.jsonl`;
}

const safeName = (w: string) => w.replace(/[\\/:*?"<>|]/g, '_');

/** Bir dildeki maddenin tüm kayıtlarını döndürür (bulunamazsa boş dizi). */
export async function kaikkiEntries(lang: 'English' | 'Arabic', word: string): Promise<KEntry[]> {
  const dir = join(ROOT, 'data/raw', `kaikki-${lang === 'English' ? 'en' : 'ar'}`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, safeName(word) + '.jsonl');
  if (!existsSync(file)) {
    const res = await politeFetch(kaikkiPath(lang, word));
    writeFileSync(file, res.ok ? await res.text() : '');
  }
  const text = readFileSync(file, 'utf8').trim();
  if (!text || text.startsWith('<')) return [];
  return text.split('\n').map((l) => JSON.parse(l) as KEntry);
}

/** Wiktionary kategorisindeki sayfa başlıkları (MediaWiki API; önbellekli). */
export async function categoryMembers(category: string): Promise<string[]> {
  const dir = join(ROOT, 'data/raw/wiktionary-api');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, safeName(category) + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as string[];
  const titles: string[] = [];
  let cont: string | undefined;
  do {
    const url = `https://en.wiktionary.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(
      'Category:' + category,
    )}&cmlimit=500&format=json${cont ? '&cmcontinue=' + encodeURIComponent(cont) : ''}`;
    const j = (await (await politeFetch(url)).json()) as {
      query: { categorymembers: { title: string; ns: number }[] };
      continue?: { cmcontinue: string };
    };
    titles.push(...j.query.categorymembers.filter((m) => m.ns === 0).map((m) => m.title));
    cont = j.continue?.cmcontinue;
  } while (cont);
  writeFileSync(file, JSON.stringify(titles));
  return titles;
}
