/**
 * Fiil çekim tablolarını üretir: src/data/seed/conjugations.json + docs/VERB_CROSSCHECK.md
 *
 * Kaynak: Wiktionary (kaikki.org dökümü, CC-BY-SA). Önce: node tools/fetch_wiktionary_verbs.ts
 * Çapraz doğrulama: tools/arabic/conjugate.ts (bağımsız kural motoru) her hücreyi yeniden üretir;
 * motor çıktısı Wiktionary'nin o hücredeki biçimlerinden biriyle aynı değilse uyumsuzluk raporlanır.
 * Tüm kayıtlar verified=false kalır (insan doğrulaması gerekir); crossCheck yalnızca makine kontrolüdür.
 *
 *   node tools/build_verbs.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conjugate, IMP_PERSONS, PERSONS, UnsupportedVerb, type Conjugation, type ImpPerson, type Person } from './arabic/conjugate.ts';
import { specFor } from './arabic/roots.ts';
import { toArabic } from './arabic/orthography.ts';
import { romanizeWord } from '../src/core/translit/romanize.ts';
import { plainLemma, rawPath } from './fetch_wiktionary_verbs.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERBS = join(ROOT, 'src/data/seed/verbs.json');
const FORMS = join(ROOT, 'src/data/seed/forms.json');
const OUT = join(ROOT, 'src/data/seed/conjugations.json');
const REPORT = join(ROOT, 'docs/VERB_CROSSCHECK.md');

interface SeedVerb { tr: string; ar: string; root: string; form: string; transitive: number }
interface KForm { form: string; tags?: string[]; roman?: string; source?: string }
interface KEntry { pos: string; forms?: KForm[] }

type Voice = 'active' | 'passive';
type Tense = 'past' | 'present' | 'imperative';
type Variant = { ar: string; rom: string };

const ARABIC = /[؀-ۿ]/;

/** Wiktionary etiketlerinden 13 şahıs anahtarı. */
function personOf(tags: Set<string>): Person | undefined {
  const g = tags.has('feminine') ? 'f' : 'm';
  const num = tags.has('dual') ? 'd' : tags.has('plural') ? 'p' : 's';
  if (tags.has('first-person')) return g === 'm' ? (num === 's' ? 'ana' : num === 'p' ? 'nahnu' : undefined) : undefined;
  if (tags.has('second-person')) {
    if (num === 's') return g === 'm' ? 'anta' : 'anti';
    if (num === 'd') return g === 'm' ? 'antuma' : undefined;
    return g === 'm' ? 'antum' : 'antunna';
  }
  if (tags.has('third-person')) {
    if (num === 's') return g === 'm' ? 'huwa' : 'hiya';
    if (num === 'd') return g === 'm' ? 'huma_m' : 'huma_f';
    return g === 'm' ? 'hum' : 'hunna';
  }
  return undefined;
}

type Table = Record<Voice, Record<Tense, Partial<Record<Person, Variant[]>>>>;

function extract(entry: KEntry): Table {
  const t: Table = { active: { past: {}, present: {}, imperative: {} }, passive: { past: {}, present: {}, imperative: {} } };
  for (const f of entry.forms ?? []) {
    if (f.source !== 'conjugation' || !f.tags || !ARABIC.test(f.form)) continue;
    const tags = new Set(f.tags);
    const voice: Voice = tags.has('passive') ? 'passive' : 'active';
    let tense: Tense | undefined;
    if (tags.has('imperative')) tense = 'imperative';
    else if (tags.has('past')) tense = 'past';
    else if (tags.has('non-past') && tags.has('indicative')) tense = 'present';
    if (!tense) continue;
    const p = personOf(tags);
    if (!p) continue;
    const list = (t[voice][tense][p] ??= []);
    const rom = f.roman ?? romanizeWord(f.form);
    if (!list.some((v) => v.ar === f.form)) list.push({ ar: f.form, rom });
  }
  return t;
}

function engineFor(v: SeedVerb, table: Table): Conjugation | { unsupported: string } {
  const spec = specFor(v.root, v.form, table.active.past.huwa?.[0]?.rom ?? '', table.active.present.huwa?.[0]?.rom ?? '');
  if (!spec) return { unsupported: `kök okunamadı: ${v.root}` };
  try {
    return conjugate(spec);
  } catch (e) {
    if (e instanceof UnsupportedVerb) return { unsupported: e.message };
    throw e;
  }
}

interface OutCell { ar: string; rom: string; tr?: string; alt?: string[] }
type OutTable = Partial<Record<Person, OutCell>>;

function main() {
  const seed = JSON.parse(readFileSync(VERBS, 'utf8')) as SeedVerb[];
  const forms = JSON.parse(readFileSync(FORMS, 'utf8')) as { form: string; lemma: string; tense: string; person: string }[];
  const trForm = (lemma: string, tense: string, person: string) =>
    forms.find((f) => f.lemma === lemma && f.tense === tense && f.person === person)?.form;
  const TR_PERSON: Record<Person, string> = {
    ana: 'ben', anta: 'sen', anti: 'sen', huwa: 'o', hiya: 'o', antuma: 'siz', huma_m: 'onlar', huma_f: 'onlar',
    nahnu: 'biz', antum: 'siz', antunna: 'siz', hum: 'onlar', hunna: 'onlar',
  };

  const out: Record<string, unknown> = {};
  const report: string[] = [];
  let totalCells = 0, totalMatch = 0;

  for (const v of seed) {
    const lines = readFileSync(rawPath(plainLemma(v.ar)), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as KEntry);
    const entry = lines.find((e) => e.pos === 'verb' && e.forms?.some((f) => f.tags?.includes('canonical') && f.form === v.ar));
    if (!entry) throw new Error(`Wiktionary kaydı yok: ${v.tr} ${v.ar}`);
    const table = extract(entry);
    const eng = engineFor(v, table);

    const mismatches: string[] = [];
    // Hücrede birden çok yazım varsa motorun kurallarıyla tutarlı olanı başa al (tek tip imla).
    const prefer = (ref: Variant[] | undefined, ar: string) => {
      const i = ref?.findIndex((r) => r.ar.normalize('NFC') === ar) ?? -1;
      if (ref && i > 0) ref.unshift(...ref.splice(i, 1));
    };
    let cells = 0, match = 0;
    const check = (label: string, ref: Variant[] | undefined, got: { ar: string; rom: string } | undefined) => {
      if (!ref || !got) return;
      cells++;
      // Şedde/hareke sırası Unicode'da farklı yazılabilir: NFC ile karşılaştır.
      const okAr = ref.some((r) => r.ar.normalize('NFC') === got.ar.normalize('NFC'));
      const okRom = ref.some((r) => r.rom === got.rom);
      if (okAr && okRom) {
        match++;
        prefer(ref, got.ar);
      }
      else mismatches.push(`| ${label} | ${ref.map((r) => r.ar).join(' / ')} | ${got.ar} | ${ref[0].rom} | ${got.rom} |`);
    };
    if (!('unsupported' in eng)) {
      for (const voice of ['active', 'passive'] as const) {
        for (const tense of ['past', 'present'] as const) {
          for (const p of PERSONS) {
            const c = eng[voice][tense][p];
            check(`${voice} ${tense} ${p}`, table[voice][tense][p], { ar: toArabic(c), rom: c.rom });
          }
        }
      }
      for (const p of IMP_PERSONS) {
        const c = eng.active.imperative[p];
        check(`imperative ${p}`, table.active.imperative[p as Person], { ar: toArabic(c), rom: c.rom });
      }
    }
    totalCells += cells;
    totalMatch += match;
    const status = 'unsupported' in eng ? 'unsupported' : mismatches.length === 0 ? 'match' : 'mismatch';

    const toOut = (voice: Voice, tense: Tense, trTense: string | null, persons: readonly Person[]): OutTable => {
      const res: OutTable = {};
      for (const p of persons) {
        const vs = table[voice][tense][p];
        if (!vs?.length) continue;
        const cell: OutCell = { ar: vs[0].ar, rom: vs[0].rom };
        const tr = trTense ? trForm(v.tr, trTense, TR_PERSON[p]) : undefined;
        if (tr) cell.tr = tr;
        if (vs.length > 1) cell.alt = vs.slice(1).map((x) => x.ar);
        res[p] = cell;
      }
      return res;
    };
    const present = toOut('active', 'present', 'present', PERSONS);
    const future: OutTable = {};
    const futureSawfa: OutTable = {};
    for (const p of PERSONS) {
      const c = present[p];
      if (!c) continue;
      const tr = trForm(v.tr, 'future', TR_PERSON[p]);
      future[p] = { ar: 'سَ' + c.ar, rom: 'sa' + c.rom, ...(tr ? { tr } : {}) };
      futureSawfa[p] = { ar: 'سَوْفَ ' + c.ar, rom: 'sawfa ' + c.rom, ...(tr ? { tr } : {}) };
    }

    out[v.tr] = {
      source: 'wiktionary',
      crossCheck: status,
      active: {
        past: toOut('active', 'past', 'past', PERSONS),
        present,
        future,
        futureSawfa,
        imperative: toOut('active', 'imperative', 'imperative', IMP_PERSONS as readonly ImpPerson[] as readonly Person[]),
      },
      // Geçişsiz fiillerde edilgen yalnızca kişisiz (ör. ذُهِبَ بِهِ) kullanılır; tabloya konmaz.
      ...(v.transitive
        ? { passive: { past: toOut('passive', 'past', null, PERSONS), present: toOut('passive', 'present', null, PERSONS) } }
        : {}),
    };

    report.push(`## ${v.tr} — ${v.ar} (bab ${v.form}) — **${status}** (${match}/${cells})`);
    if ('unsupported' in eng) report.push(`Motor desteklemiyor: ${eng.unsupported}`);
    if (mismatches.length) {
      report.push('', '| Hücre | Wiktionary | Motor | Wiktionary okunuş | Motor okunuş |', '|---|---|---|---|---|', ...mismatches);
    }
    report.push('');
  }

  writeFileSync(OUT, JSON.stringify(out) + '\n');
  const header = [
    '# Fiil çekimi çapraz doğrulama raporu',
    '',
    '`node tools/build_verbs.ts` tarafından üretilir; elle düzenleme.',
    '',
    `Kaynak: Wiktionary (kaikki.org, CC-BY-SA). Kontrol: bağımsız kural motoru (tools/arabic). ` +
      `Toplam ${totalMatch}/${totalCells} hücre birebir aynı.`,
    '',
    'Uyumsuzluk = motorun ürettiği yazım veya okunuş, Wiktionary\'nin o hücre için verdiği biçimlerin hiçbiriyle aynı değil. ' +
      'Uygulamaya giden veri her zaman Wiktionary biçimidir; uyumsuz hücreler insan doğrulamasında öncelikli incelenmelidir.',
    '',
  ];
  writeFileSync(REPORT, header.concat(report).join('\n'));
  console.log(`${seed.length} fiil yazıldı → ${OUT}`);
  console.log(`Çapraz doğrulama: ${totalMatch}/${totalCells} hücre uyumlu → ${REPORT}`);
}

main();
