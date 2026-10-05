/**
 * Kütüphane paketi: uygulamaya gömülü gelir (src/data/library) ve internetten güncellenebilir.
 * Pakette yalnızca VERİ vardır (JSON); kod indirilmez. El yazması tohum (src/data/seed) pakette değildir,
 * her zaman gömülüdür ve çakışmada paketin önündedir.
 */
import libWords from '../../data/library/words.json';
import libVerbs from '../../data/library/verbs.json';
import libSentences from '../../data/library/sentences.json';
import libForms from '../../data/library/forms.json';
import libConjugations from '../../data/library/conjugations.json';
import meta from '../../data/library/meta.json';

export interface LibraryPack {
  /** Paket biçimi; uyumsuz biçim uygulama tarafından reddedilir. */
  format: 1;
  /** Artan sürüm numarası (tools/build_pack.ts verir). */
  version: number;
  builtAt: string;
  words: unknown[];
  verbs: unknown[];
  sentences: unknown[];
  forms: unknown[];
  conjugations: Record<string, unknown>;
}

export const PACK_FORMAT = 1;

export const BUNDLED_PACK: LibraryPack = {
  format: PACK_FORMAT,
  version: meta.version,
  builtAt: meta.builtAt,
  words: libWords as unknown[],
  verbs: libVerbs as unknown[],
  sentences: libSentences as unknown[],
  forms: libForms as unknown[],
  conjugations: libConjugations as unknown as Record<string, unknown>,
};

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/**
 * İnternetten gelen veriyi doğrular. Yanlış biçimli, küçük/boş ya da gömülüden belirgin biçimde küçük paket reddedilir
 * (yarım inmiş ya da bozuk dosya kütüphaneyi bozamasın). Geçerliyse paketi, değilse hata metnini döndürür.
 */
export function validatePack(raw: unknown, bundled: LibraryPack = BUNDLED_PACK): { pack: LibraryPack } | { error: string } {
  if (!isObj(raw)) return { error: 'Paket okunamadı.' };
  if (raw.format !== PACK_FORMAT) return { error: 'Paket biçimi bu uygulama sürümüyle uyumlu değil.' };
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) return { error: 'Paket sürümü geçersiz.' };
  if (typeof raw.builtAt !== 'string') return { error: 'Paket tarihi eksik.' };
  for (const k of ['words', 'verbs', 'sentences', 'forms'] as const) {
    if (!Array.isArray(raw[k])) return { error: `Paketteki "${k}" bölümü eksik.` };
  }
  if (!isObj(raw.conjugations)) return { error: 'Paketteki "conjugations" bölümü eksik.' };
  const p = raw as unknown as LibraryPack;
  // Her kayıtta zorunlu alanlar (seed.ts bunlara güvenir).
  const str = (v: unknown) => typeof v === 'string' && v.length > 0;
  if (!p.words.every((w) => isObj(w) && str(w.tr) && str(w.ar) && typeof w.translit === 'string' && str(w.pos))) return { error: 'Paketteki kelimelerde eksik alan var.' };
  if (!p.verbs.every((v) => isObj(v) && str(v.tr) && str(v.ar) && typeof v.translit === 'string')) return { error: 'Paketteki fiillerde eksik alan var.' };
  if (!p.sentences.every((s) => isObj(s) && str(s.tr) && str(s.ar) && Array.isArray(s.trAlt))) return { error: 'Paketteki cümlelerde eksik alan var.' };
  if (!p.forms.every((f) => isObj(f) && str(f.form) && str(f.lemma))) return { error: 'Paketteki çekim biçimlerinde eksik alan var.' };
  // Gömülünün yarısından küçük paket büyük olasılıkla bozuk/eksiktir.
  if (p.words.length < bundled.words.length / 2 || p.sentences.length < bundled.sentences.length / 2) {
    return { error: 'Paket beklenenden çok küçük; reddedildi.' };
  }
  return { pack: p };
}
