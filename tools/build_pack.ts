/**
 * Kütüphane paketini üretir: src/data/library/*.json → library-release/library-pack.json + manifest.json.
 * Uygulama manifest'i okur, yeni sürüm varsa paketi indirir (sha256 + boyut + şema doğrular).
 *
 * İçerik değişmediyse sürüm artmaz. Değiştiyse sürüm +1 olur ve src/data/library/meta.json da güncellenir
 * (uygulamayla gelen gömülü paket, yayınlanan sürümle aynı numarayı taşır).
 *
 * Yayın: çıktıyı commit edip main'e push et; uygulama raw.githubusercontent.com üzerinden okur.
 *   npm run build:content && npm run build:pack && git add library-release src/data/library && git commit && git push
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const libDir = join(root, 'src', 'data', 'library');
const outDir = join(root, 'library-release');
const read = (f: string): unknown => JSON.parse(readFileSync(join(libDir, f), 'utf8'));

const data = {
  words: read('words.json'),
  verbs: read('verbs.json'),
  sentences: read('sentences.json'),
  forms: read('forms.json'),
  conjugations: read('conjugations.json'),
};
const meta = read('meta.json') as { version: number; builtAt: string };

const packPath = join(outDir, 'library-pack.json');
const prev = existsSync(packPath) ? (JSON.parse(readFileSync(packPath, 'utf8')) as Record<string, unknown>) : null;
const sameData = prev !== null && (Object.keys(data) as (keyof typeof data)[]).every((k) => JSON.stringify(prev[k]) === JSON.stringify(data[k]));

if (sameData) {
  console.log(`Değişiklik yok: sürüm ${String(prev.version)} güncel.`);
  process.exit(0);
}

// İlk yayın gömülü sürümle aynı numarayı alır; sonraki değişiklikler +1.
const version = prev === null ? meta.version : Math.max(meta.version, Number(prev.version)) + 1;
const builtAt = new Date().toISOString();
const pack = { format: 1, version, builtAt, ...data };
const body = JSON.stringify(pack);
const sha256 = createHash('sha256').update(body).digest('hex');
const size = Buffer.byteLength(body);

mkdirSync(outDir, { recursive: true });
writeFileSync(packPath, body);
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({ format: 1, version, url: 'library-pack.json', sha256, size, builtAt }, null, 2) + '\n');
writeFileSync(join(libDir, 'meta.json'), JSON.stringify({ version, builtAt }, null, 2) + '\n');

console.log(`Sürüm ${version} üretildi: ${(size / 1024).toFixed(0)} KB, sha256 ${sha256.slice(0, 12)}…`);
console.log(`words ${(data.words as unknown[]).length} · verbs ${(data.verbs as unknown[]).length} · sentences ${(data.sentences as unknown[]).length}`);
