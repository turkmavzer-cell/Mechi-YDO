/**
 * Tohum fiillerin Wiktionary kayıtlarını kaikki.org'dan indirir (data/raw/kaikki/*.jsonl).
 * Önbellek: dosya varsa yeniden indirilmez (idempotent). Kaynak lisansı: CC-BY-SA (atıf zorunlu).
 *
 *   node tools/fetch_wiktionary_verbs.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'data/raw/kaikki');
const VERBS = join(ROOT, 'src/data/seed/verbs.json');

export function plainLemma(ar: string): string {
  return ar.replace(/[ً-ٰٟـ]/g, '');
}

export function kaikkiUrl(plain: string): string {
  const chars = [...plain];
  const parts = [chars[0], chars.slice(0, 2).join(''), plain].map(encodeURIComponent);
  return `https://kaikki.org/dictionary/Arabic/meaning/${parts[0]}/${parts[1]}/${parts[2]}.jsonl`;
}

export function rawPath(plain: string): string {
  return join(RAW, `${plain}.jsonl`);
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  const verbs = JSON.parse(readFileSync(VERBS, 'utf8')) as { tr: string; ar: string }[];
  let fetched = 0;
  for (const v of verbs) {
    const plain = plainLemma(v.ar);
    const out = rawPath(plain);
    if (existsSync(out)) continue;
    const res = await fetch(kaikkiUrl(plain));
    if (!res.ok) {
      console.error(`HATA ${res.status}: ${v.tr} ${plain}`);
      process.exitCode = 1;
      continue;
    }
    writeFileSync(out, await res.text());
    fetched++;
  }
  console.log(`${verbs.length} fiil, ${fetched} yeni indirildi → ${RAW}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
