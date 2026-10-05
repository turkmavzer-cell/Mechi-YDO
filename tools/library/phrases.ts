/** Wiktionary "English phrasebook" ifadelerinden Türkçe ↔ Fusha cümle çiftleri. */
import type { Category } from './concepts.ts';
import { categoryMembers, kaikkiEntries, type KTranslation } from './kaikki.ts';

/** Arap harfleri, hareke, Arapça noktalama, boşluk ve birkaç ortak noktalama işareti. */
const CLEAN_AR = /^[؀-ۿ\s!.,،؟?:\-«»"]+$/;
const LETTER = /[ء-ي]/g;
const MARK = /[ً-ْٰ]/g;
const DIALECT = ['Egyptian', 'Gulf', 'Levantine', 'Moroccan', 'Iraqi', 'Hijazi', 'Sudanese', 'Tunisian', 'Algerian', 'colloquial', 'dialectal', 'slang', 'vulgar'];

/** Pratik bir yurt dışı asistanında yeri olmayan ifadeler (romantik, alkol, hakaret, din tartışması). */
const EXCLUDE = new Set([
  'can I buy you a drink', 'do you have a boyfriend', 'do you have a girlfriend', 'do you love me', "I'd like to kiss you",
  'get lost', 'do you believe in God', 'are you religious', 'are you single', 'do you come here often', 'I love you',
  'will you marry me', 'go to hell', 'fuck off', 'shut up', 'cheers', 'be called', 'have a seat', 'have fun', 'help',
  'got it', 'good afternoon', 'happy Easter', 'Happy Christmas', 'happy Hanukkah', 'merry Christmas', 'I am English',
  'how do you say … in English', 'does anyone here speak English', 'do you have a menu in English', 'I am a vegetarian',
  // Arapçası lehçe veya harekesi/dilbilgisi hatalı (öğrenene yanlış örnek olur):
  'can I use your phone', "I'm cold", "I'm tired", "I don't eat meat", "I'm bleeding", "I've burned myself",
  'please turn left', 'please turn right', 'please sit down', 'please say that again',
  // Türkçesi veya anlamı yanlış eşleşmiş / tek kelime:
  'no', 'sorry', 'stop', 'see you', 'my name is', "I'm a vegan",
  // Arapçası Türkçesiyle tam örtüşmüyor veya işaret/levha biçimi bozuk:
  'how do you do', 'many thanks', 'occupied', 'no smoking', 'no parking',
  'could I see the menu, please', 'I think so',
  // Romantik / kişisel / yere özgü:
  'I hate you', "I'm in love with you", 'kiss me', 'I like you', 'I miss you', 'I live in Melbourne', "I'm a Protestant",
]);

/**
 * Wiktionary'nin ilk Türkçe çevirisi en yaygın söyleyiş değilse, ana Türkçe elle seçilir (Arapça yine tablodan).
 * Yalnızca tabloda zaten listelenen Türkçe söyleyişler kullanılır.
 */
const TR_OVERRIDE: Record<string, { tr: string; alt: string[] }> = {
  'thank you': { tr: 'teşekkür ederim', alt: ['teşekkürler', 'sağ ol', 'sağ olun'] },
  "you're welcome": { tr: 'rica ederim', alt: ['bir şey değil', 'önemli değil'] },
  'excuse me': { tr: 'affedersiniz', alt: ['affedersin'] },
  // Wiktionary Türkçesindeki yazım hataları (çağırin, edebilirmisiniz):
  'call the fire department': { tr: 'itfaiyeyi çağırın', alt: ['itfaiyeyi çağır'] },
  'can you help me': { tr: 'bana yardım eder misiniz?', alt: ['bana yardım edebilir misiniz?'] },
};

/** Kaba/argo Türkçe alternatifler alınmaz. */
const VULGAR_TR = /\b(sik|amk|siktir)/i;

/** Anahtar kelimeyle kategori (İngilizce başlık üzerinde); eşleşme yoksa günlük. */
// Sıra önemli: "you're right" yön değil tartışmadır, bu yüzden tartışma yolculuktan önce.
const CATEGORY_RULES: [Category, RegExp][] = [
  ['alışveriş', /\b(buy|price|cost|how much|credit cards?|cash|pay|shop|sell|discount|receipt|cheap|expensive|change|money|dollars?|euros?|bill|menu|size)\b/i],
  ['tartışma', /\b(agree|disagree|opinion|think|right|wrong|sure|really|mean|explain|why|problem|of course|no way|I don't know|I see|understand|sorry|believe|true|shame)\b/i],
  ['iş', /\b(work|job|meeting|office|business|appointment|email|e-mail|busy|company|boss|call you|phone number|speak to)\b/i],
  ['yolculuk', /\b(airport|train|station|bus|taxi|hotel|ticket|passport|get to|where is|where are|lost|map|toilet|bathroom|travel|voyage|flight|room|straight|far|near|way|drive|car|street)\b/i],
];

export interface Phrase {
  en: string;
  tr: string;
  trAlt: string[];
  ar: string;
  /** Dişil biçim (varsa); `ar` eril veya ortak biçimdir. */
  arF?: string;
  /** arF kime göre? addressee: karşıdaki kadınsa ("iyi misin?"), speaker: konuşan kadınsa ("yorgunum"). */
  arFKind?: 'addressee' | 'speaker';
  category: Category;
}

const isMsa = (t: KTranslation) =>
  t.lang === 'Arabic' && !!t.word && CLEAN_AR.test(t.word.trim()) &&
  !(t.tags ?? []).some((g) => DIALECT.some((d) => g.includes(d)));

/** Harf başına hareke oranı: tam harekeli ~0.8+, kısmi harekeli düşük. */
export function vocalization(ar: string): number {
  const letters = (ar.match(LETTER) ?? []).length;
  return letters ? (ar.match(MARK) ?? []).length / letters : 0;
}

export async function phrases(): Promise<{ ok: Phrase[]; skipped: { en: string; why: string }[] }> {
  const titles = (await categoryMembers('English phrasebook')).filter((t) => !t.includes(':'));
  const ok: Phrase[] = [];
  const skipped: { en: string; why: string }[] = [];
  for (const en of titles) {
    if (EXCLUDE.has(en)) { skipped.push({ en, why: 'kapsam dışı' }); continue; }
    if (/…|\.\.\./.test(en)) { skipped.push({ en, why: 'yer tutuculu' }); continue; }
    const tl = (await kaikkiEntries('English', en)).flatMap((e) => e.translations ?? []);
    const tr = [...new Set(tl.filter((t) => t.lang === 'Turkish' && t.word).map((t) => t.word!.trim()))]
      .filter((t) => !/…|\.\.\.|\(/.test(t) && !VULGAR_TR.test(t));
    const ar = tl.filter(isMsa);
    if (!tr.length || !ar.length) { skipped.push({ en, why: tr.length ? 'Fusha Arapça yok' : 'Türkçe yok' }); continue; }
    // Tek kelimelik Türkçe mastar (oturmak, eğlenmek) ifade değil sözlük maddesidir.
    if (tr.every((t) => /^\S+m[ae]k$/.test(t))) { skipped.push({ en, why: 'Türkçesi mastar' }); continue; }
    const fem = (t: KTranslation) => (t.tags ?? []).some((g) => g === 'addressee-feminine' || g === 'feminine');
    const masc = ar.find((t) => !fem(t) && vocalization(t.word!) >= 0.5);
    const femT = ar.find((t) => fem(t) && vocalization(t.word!) >= 0.5);
    if (!masc) { skipped.push({ en, why: 'yeterince harekeli Fusha yok' }); continue; }
    const category = CATEGORY_RULES.find(([, re]) => re.test(en))?.[0] ?? 'günlük';
    // Türkçe alternatifler yalnızca ana çeviriyle ortak kelime taşıyorsa (siz/sen biçimi gibi) alınır;
    // "hello" altındaki "alo / efendim" ya da "do you speak English" altındaki "Türkçe biliyor musun" gibi kaymalar elenir.
    const words = (t: string) =>
      new Set(t.toLocaleLowerCase('tr-TR').replace(/[?!.,]/g, '').split(/\s+/).filter((w) => w.length >= 3));
    const main = words(tr[0]);
    const trAlt = tr.slice(1).filter((t) => [...words(t)].some((w) => main.has(w)) && !(/English/.test(en) && /Türkçe/i.test(t)));
    const ov = TR_OVERRIDE[en];
    ok.push({
      en, tr: ov?.tr ?? tr[0], trAlt: ov?.alt ?? trAlt, ar: masc.word!.trim(),
      ...(femT && femT.word!.trim() !== masc.word!.trim()
        ? { arF: femT.word!.trim(), arFKind: /^(I'm|I've|I'd|I'll|I|my)(?![A-Za-z])/i.test(en) ? ('speaker' as const) : ('addressee' as const) }
        : {}),
      category,
    });
  }
  return { ok, skipped };
}
