/**
 * Kütüphane genişletme: Wiktionary (kaikki.org, CC-BY-SA) çeviri tabloları ve phrasebook ifadelerinden
 * kategori bazlı kelime, fiil ve cümle üretir.
 *
 *   node tools/build_content.ts      → src/data/library/{words,verbs,sentences}.json + docs/LIBRARY_REPORT.md
 *
 * Kurallar: Arapça hiçbir zaman elle yazılmaz (kaynak tablodan gelir); tüm kayıtlar verified=false;
 * tohum verideki (elle yazılmış) kayıtlarla çakışan Türkçe anahtarlar atlanır (tohum önceliklidir).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { concepts, type Category } from './library/concepts.ts';
import { pick, type Pick } from './library/select.ts';
import { phrases } from './library/phrases.ts';
import { arabicVerb, type LibVerb } from './library/arabicVerb.ts';
import { ROOT } from './library/kaikki.ts';
import { conjugateTr, isSupportedInfinitive, KNOWN, verifyKnown } from './turkish/conjugate.ts';
import { romanize } from '../src/core/translit/romanize.ts';
import { sentenceToTurkish } from '../src/core/translit/toTurkish.ts';
import { translitAr } from '../src/core/translit/index.ts';

const OUT = join(ROOT, 'src/data/library');
const REPORT = join(ROOT, 'docs/LIBRARY_REPORT.md');
const POS: Record<string, string> = { n: 'noun', v: 'verb', adj: 'adj', adv: 'adv', num: 'num', phr: 'particle' };

const normTr = (s: string) =>
  s.normalize('NFC').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}\s'’-]/gu, ' ').replace(/['’]/g, '').replace(/\s+/g, ' ').trim();

/** Wiktionary çeviri okunuşunu romanize.ts biçimine yaklaştırır (karşılaştırma için). */
const normRoman = (r: string) =>
  r.normalize('NFC').replace(/ʾ/g, 'ʔ').replace(/ʿ/g, 'ʕ').replace(/ġ/g, 'ḡ').replace(/ḫ/g, 'ḵ').replace(/[-\s]+/g, ' ').trim();

interface LibWord {
  tr: string; ar: string; translit: string; pos: string; category: Category;
  gender?: 'm' | 'f'; en: string; sense: string; source: string;
}
interface LibSentence {
  tr: string; trAlt: string[]; ar: string; arF?: string; arFKind?: 'addressee' | 'speaker'; translit: string; translitF?: string;
  category: Category; en: string; source: string;
}

async function main() {
  const seedWords = JSON.parse(readFileSync(join(ROOT, 'src/data/seed/words.json'), 'utf8')) as string[][];
  const seedVerbs = JSON.parse(readFileSync(join(ROOT, 'src/data/seed/verbs.json'), 'utf8')) as { tr: string }[];
  const seedSentences = JSON.parse(readFileSync(join(ROOT, 'src/data/seed/sentences.json'), 'utf8')) as { tr: string }[];
  const seedWordKeys = new Set(seedWords.map((w) => normTr(w[0])));
  const seedVerbKeys = new Set(seedVerbs.map((v) => v.tr));
  const seedSentKeys = new Set(seedSentences.map((s) => normTr(s.tr)));

  const words: LibWord[] = [];
  const verbs: (LibVerb & { translit: string })[] = [];
  const log = { skippedSeed: [] as string[], dup: [] as string[], errors: [] as string[], flags: [] as string[],
    translitDiff: [] as string[], verbErrors: [] as string[], verbUnknownTr: [] as string[] };
  const wordKeys = new Set<string>();

  for (const c of concepts()) {
    const p = await pick(c);
    if ('error' in p) { log.errors.push(`${c.category} · ${c.en} (${c.pos}): ${p.error}`); continue; }
    const pk = p as Pick;
    if (pk.flags.length) log.flags.push(`${c.category} · ${c.en}: ${pk.tr} = ${pk.ar} — ${pk.flags.join('; ')}`);

    // Tek kelimelik, desteklenen Türkçe mastar → fiil tablosu (çekim + Türkçe çekimli hâller).
    if (c.pos === 'v' && isSupportedInfinitive(pk.tr)) {
      if (seedVerbKeys.has(pk.tr) || verbs.some((v) => v.tr === pk.tr)) { log.dup.push(`fiil ${pk.tr} (${c.en})`); continue; }
      const v = await arabicVerb(pk.tr, pk.ar, c.en);
      if ('error' in v) { log.verbErrors.push(`${pk.tr} = ${pk.ar}: ${v.error}`); continue; }
      if (!KNOWN[pk.tr]) log.verbUnknownTr.push(`${pk.tr}: ${Object.values(conjugateTr(pk.tr)).map((t) => Object.values(t)[0]).join(', ')}`);
      verbs.push({ ...v, translit: translitAr(v.ar, { irab: true }) });
      continue;
    }

    const key = normTr(pk.tr);
    if (seedWordKeys.has(key)) { log.skippedSeed.push(`${pk.tr} (${c.en})`); continue; }
    if (wordKeys.has(key)) { log.dup.push(`${pk.tr} (${c.en})`); continue; }
    wordKeys.add(key);

    const translit = sentenceToTurkish(romanize(pk.ar));
    if (pk.arRoman) {
      const ours = romanize(pk.ar).join(' ').replace(/[ŧⁿ]/g, '').replace(/-/g, ' ');
      const theirs = normRoman(pk.arRoman);
      if (ours.replace(/\s+/g, ' ') !== theirs) log.translitDiff.push(`${pk.tr}: ${pk.ar} — motor "${ours}" / Wiktionary "${pk.arRoman}"`);
    }
    const gender = pk.arTags.includes('feminine') ? 'f' : pk.arTags.includes('masculine') ? 'm' : undefined;
    words.push({
      tr: pk.tr, ar: pk.ar, translit, pos: POS[c.pos], category: c.category, ...(gender ? { gender } : {}),
      en: c.en, sense: pk.sense, source: 'wiktionary',
    });
  }

  const { ok: phr, skipped: phrSkipped } = await phrases();
  const sentences: LibSentence[] = [];
  const sentKeys = new Set<string>();
  const sentSkippedSeed: string[] = [];
  for (const p of phr) {
    const keys = [p.tr, ...p.trAlt].map(normTr);
    if (keys.some((k) => seedSentKeys.has(k))) { sentSkippedSeed.push(`${p.tr} (${p.en})`); continue; }
    if (keys.some((k) => sentKeys.has(k))) { log.dup.push(`cümle ${p.tr} (${p.en})`); continue; }
    keys.forEach((k) => sentKeys.add(k));
    sentences.push({
      tr: p.tr, trAlt: p.trAlt, ar: p.ar, ...(p.arF ? { arF: p.arF, arFKind: p.arFKind } : {}),
      translit: sentenceToTurkish(romanize(p.ar)),
      ...(p.arF ? { translitF: sentenceToTurkish(romanize(p.arF)) } : {}),
      category: p.category, en: p.en, source: 'wiktionary-phrasebook',
    });
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'words.json'), JSON.stringify(words, null, 1) + '\n');
  writeFileSync(join(OUT, 'verbs.json'), JSON.stringify(verbs, null, 1) + '\n');
  writeFileSync(join(OUT, 'sentences.json'), JSON.stringify(sentences, null, 1) + '\n');

  // Türkçe çekimli hâller (forms): seed ile aynı biçim; tools/turkish/conjugate.ts, KNOWN testleriyle doğrulanır.
  const knownErrors = verifyKnown();
  if (knownErrors.length) throw new Error(`Türkçe çekim doğrulaması başarısız:\n  ${knownErrors.join('\n  ')}`);
  const forms: { form: string; lemma: string; tense: string; person: string }[] = [];
  const seenForms = new Set<string>();
  for (const v of verbs) {
    for (const [tense, persons] of Object.entries(conjugateTr(v.tr))) {
      for (const [person, form] of Object.entries(persons)) {
        if (seenForms.has(`${form}|${v.tr}`)) continue;
        seenForms.add(`${form}|${v.tr}`);
        forms.push({ form, lemma: v.tr, tense, person });
      }
    }
    forms.push({ form: v.tr, lemma: v.tr, tense: 'infinitive', person: '' });
  }
  writeFileSync(join(OUT, 'forms.json'), JSON.stringify(forms) + '\n');

  const cats: Category[] = ['günlük', 'alışveriş', 'yolculuk', 'tartışma', 'iş', 'sağlık', 'banka', 'ev', 'tamir', 'yön', 'sayılar', 'zaman'];
  const count = (arr: { category?: Category }[], c: Category) => arr.filter((x) => x.category === c).length;
  const verbCat = (v: LibVerb) => concepts().find((c) => c.en === v.en && c.pos === 'v')?.category;
  const lines = [
    '# Kütüphane genişletme raporu',
    '',
    '`node tools/build_content.ts` tarafından üretilir; elle düzenleme.',
    '',
    'Kaynak: Wiktionary İngilizce maddelerinin çeviri tabloları (aynı anlamın Türkçe ve Arapça karşılıkları) ve ',
    '"English phrasebook" ifadeleri — kaikki.org dökümü, **CC-BY-SA 4.0**. Arapça hiçbir kayıtta elle yazılmadı. ',
    'Tüm kayıtlar **doğrulanmamış** (`verified: false`); Arapça bilen biri tarafından gözden geçirilmeli.',
    '',
    '| Kategori | Kelime | Fiil | Cümle |',
    '|---|---|---|---|',
    ...cats.map((c) => `| ${c} | ${count(words, c)} | ${verbs.filter((v) => verbCat(v) === c).length} | ${count(sentences, c)} |`),
    `| **Toplam** | **${words.length}** | **${verbs.length}** | **${sentences.length}** |`,
    '',
    '## İnceleme gerektirenler',
    '',
    '### Seçimde uyarı alan maddeler',
    ...log.flags.map((x) => `- ${x}`),
    '',
    '### Okunuş: motor (harekeli yazımdan) ile Wiktionary okunuşu farklı',
    'Görüntülenen okunuş motorundur (ekrandaki harekeli yazımla tutarlı). Fark çoğunlukla Wiktionary okunuşunun',
    'i\'rab/tenvin veya farklı bir harf çevriyazısı içermesinden kaynaklanır; yine de gözden geçirin.',
    ...log.translitDiff.map((x) => `- ${x}`),
    '',
    '### Türkçe çekimi elle doğrulanmamış yeni fiiller (kural çıktısı, ilk şahıs örnekleri)',
    ...log.verbUnknownTr.map((x) => `- ${x}`),
    '',
    '## Alınamayanlar',
    '',
    '### Kavram bulunamadı / tablo yok',
    ...log.errors.map((x) => `- ${x}`),
    '',
    '### Fiil bilgisi çıkarılamadı',
    ...log.verbErrors.map((x) => `- ${x}`),
    '',
    '### Tohumda zaten olan (tohum önceliklidir)',
    ...[...log.skippedSeed, ...sentSkippedSeed].map((x) => `- ${x}`),
    '',
    '### Tekrar eden Türkçe anahtar',
    ...log.dup.map((x) => `- ${x}`),
    '',
    '### Phrasebook: atlanan ifadeler',
    ...Object.entries(phrSkipped.reduce<Record<string, string[]>>((a, s) => ((a[s.why] ??= []).push(s.en), a), {}))
      .map(([why, list]) => `- **${why}** (${list.length}): ${list.slice(0, 40).join(', ')}${list.length > 40 ? ' …' : ''}`),
    '',
  ];
  writeFileSync(REPORT, lines.join('\n'));
  console.log(`kelime ${words.length}, fiil ${verbs.length}, cümle ${sentences.length} → ${OUT}`);
  console.log(`rapor → ${REPORT}`);
}

await main();
