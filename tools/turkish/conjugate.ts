/**
 * Türkçe mastardan çekimli hâller (tools/build_forms.py'nin TypeScript karşılığı; Python bu makinede yok).
 * Kural tabanlı ve denetlenebilir: belirli geçmiş, şimdiki, gelecek, geniş zaman, emir; 6 şahıs.
 * KNOWN altındaki bilinen çekimlerle doğrulanır.
 */

const BACK = new Set([...'aıou']);
const VOWELS = new Set([...'aeıioöuü']);
const VOICELESS = new Set([...'fstkçşhp']);

/** Ünlüyle başlayan ekten önce kökü değişen mastarlar (gitmek → gid-iyor). */
const SOFT: Record<string, string> = {
  gitmek: 'gid',
  // -etmek birleşikleri tek kelime yazılır ve "et" gibi yumuşar: kaybediyor, reddeder, affedecek.
  kaybetmek: 'kaybed', reddetmek: 'redded', affetmek: 'affed', kastetmek: 'kasted',
};
/** -etmek birleşikleri: geniş zaman tek heceli "et" gibi -er alır (kaybeder; *kaybedir değil). */
const ET_COMPOUND = new Set(['kaybetmek', 'reddetmek', 'affetmek', 'kastetmek']);
const YI_DI: Record<string, string> = { yemek: 'yi', demek: 'di' };
/** Tek heceli, geniş zamanı -ır/-ir/-ur/-ür alan kökler. */
const AORIST_I = new Set(['al', 'bil', 'bul', 'dur', 'gel', 'gör', 'kal', 'ol', 'öl', 'san', 'var', 'ver', 'vur']);

function lastVowel(s: string): string {
  for (const ch of [...s].reverse()) if (VOWELS.has(ch)) return ch;
  return 'e';
}
/** İki yönlü ünlü uyumu: a/e. */
const h2 = (v: string) => (BACK.has(v) ? 'a' : 'e');
/** Dört yönlü ünlü uyumu: ı/i/u/ü. */
function h4(v: string): string {
  if ('aı'.includes(v)) return 'ı';
  if ('ei'.includes(v)) return 'i';
  if ('ou'.includes(v)) return 'u';
  return 'ü';
}
const syllables = (s: string) => [...s].filter((c) => VOWELS.has(c)).length;

export type TrPerson = 'ben' | 'sen' | 'o' | 'biz' | 'siz' | 'onlar';
export type TrTense = 'past' | 'present' | 'future' | 'aorist' | 'imperative';
export type TrConjugation = Record<TrTense, Partial<Record<TrPerson, string>>>;

export function isSupportedInfinitive(inf: string): boolean {
  return /^[a-zçğıöşü]+m[ae]k$/.test(inf);
}

export function conjugateTr(inf: string): TrConjugation {
  if (!isSupportedInfinitive(inf)) throw new Error(`desteklenmeyen mastar: ${inf}`);
  const stem = inf.slice(0, -3);
  const lv = lastVowel(stem);
  const endsVowel = VOWELS.has(stem[stem.length - 1]);

  // Belirli geçmiş: -dı/-di/-du/-dü (sert ünsüzden sonra -tı…)
  const d = VOICELESS.has(stem[stem.length - 1]) ? 't' : 'd';
  const pastBase = stem + d + h4(lv);
  const past = {
    ben: pastBase + 'm', sen: pastBase + 'n', o: pastBase, biz: pastBase + 'k',
    siz: pastBase + 'n' + h4(lv) + 'z', onlar: stem + d + h4(lv) + 'l' + h2(lv) + 'r',
  };

  // Şimdiki: -(ı)yor
  let presBase: string;
  if (inf in YI_DI) presBase = YI_DI[inf] + 'yor';
  else if (inf in SOFT) presBase = SOFT[inf] + h4(lv) + 'yor';
  else if (endsVowel && 'ae'.includes(stem[stem.length - 1])) presBase = stem.slice(0, -1) + h4(lastVowel(stem.slice(0, -1))) + 'yor';
  else if (endsVowel) presBase = stem + 'yor';
  else presBase = stem + h4(lv) + 'yor';
  const u = h4('o');
  const present = {
    ben: presBase + u + 'm', sen: presBase + 's' + u + 'n', o: presBase, biz: presBase + u + 'z',
    siz: presBase + 's' + u + 'n' + u + 'z', onlar: presBase + 'lar',
  };

  // Gelecek: -acak/-ecek (ünlü önünde k → ğ)
  let fstem: string;
  let fv: string;
  if (inf in YI_DI) {
    fstem = YI_DI[inf] + 'y';
    fv = inf === 'demek' || inf === 'yemek' ? 'e' : lastVowel(YI_DI[inf]);
  } else if (inf in SOFT) [fstem, fv] = [SOFT[inf], lv];
  else if (endsVowel) [fstem, fv] = [stem + 'y', lv];
  else [fstem, fv] = [stem, lv];
  const futBase = fstem + h2(fv) + 'c' + h2(fv);
  const futSoft = futBase + 'ğ';
  const fh = h4(h2(fv));
  const future = {
    ben: futSoft + fh + 'm', sen: futBase + 'k' + 's' + fh + 'n', o: futBase + 'k', biz: futSoft + fh + 'z',
    siz: futBase + 'k' + 's' + fh + 'n' + fh + 'z', onlar: futBase + 'k' + 'l' + h2(fv) + 'r',
  };

  // Geniş zaman
  const astem = SOFT[inf] ?? stem;
  let aorBase: string;
  if (endsVowel) aorBase = astem + 'r';
  else if (ET_COMPOUND.has(inf)) aorBase = astem + 'er';
  else if (AORIST_I.has(stem) || syllables(stem) > 1) aorBase = astem + h4(lv) + 'r';
  else aorBase = astem + h2(lv) + 'r';
  const pv = h4(lastVowel(aorBase));
  const aorist = {
    ben: aorBase + pv + 'm', sen: aorBase + 's' + pv + 'n', o: aorBase, biz: aorBase + pv + 'z',
    siz: aorBase + 's' + pv + 'n' + pv + 'z', onlar: aorBase + 'l' + h2(lastVowel(aorBase)) + 'r',
  };

  // Emir: siz biçiminde -etmek birleşikleri yumuşar (kaybedin).
  const imperative = {
    sen: stem,
    siz: (SOFT[inf] && inf !== 'gitmek' ? SOFT[inf] : stem) + (endsVowel ? 'y' : '') + h4(lv) + 'n',
  };
  return { past, present, future, aorist, imperative };
}

/** Elle bilinen/denetlenen doğru çekimler (regresyon testi). */
export const KNOWN: Record<string, [TrTense, TrPerson, string][]> = {
  binmek: [['past', 'ben', 'bindim'], ['past', 'sen', 'bindin'], ['past', 'o', 'bindi'], ['past', 'biz', 'bindik'],
    ['past', 'siz', 'bindiniz'], ['past', 'onlar', 'bindiler'], ['present', 'ben', 'biniyorum'], ['future', 'ben', 'bineceğim'],
    ['aorist', 'ben', 'binerim'], ['imperative', 'sen', 'bin']],
  gitmek: [['past', 'ben', 'gittim'], ['present', 'ben', 'gidiyorum'], ['future', 'ben', 'gideceğim'], ['aorist', 'ben', 'giderim'],
    ['present', 'onlar', 'gidiyorlar']],
  gelmek: [['past', 'ben', 'geldim'], ['present', 'sen', 'geliyorsun'], ['future', 'o', 'gelecek'], ['aorist', 'ben', 'gelirim']],
  yemek: [['past', 'ben', 'yedim'], ['present', 'ben', 'yiyorum'], ['future', 'ben', 'yiyeceğim'], ['aorist', 'ben', 'yerim']],
  almak: [['past', 'ben', 'aldım'], ['present', 'ben', 'alıyorum'], ['future', 'ben', 'alacağım'], ['aorist', 'ben', 'alırım']],
  vermek: [['past', 'ben', 'verdim'], ['present', 'biz', 'veriyoruz'], ['aorist', 'ben', 'veririm']],
  görmek: [['past', 'ben', 'gördüm'], ['present', 'ben', 'görüyorum'], ['aorist', 'ben', 'görürüm'], ['future', 'ben', 'göreceğim']],
  okumak: [['past', 'ben', 'okudum'], ['present', 'ben', 'okuyorum'], ['future', 'ben', 'okuyacağım'], ['aorist', 'ben', 'okurum']],
  yaşamak: [['present', 'ben', 'yaşıyorum'], ['future', 'ben', 'yaşayacağım'], ['aorist', 'ben', 'yaşarım']],
  yapmak: [['past', 'ben', 'yaptım'], ['present', 'ben', 'yapıyorum'], ['aorist', 'ben', 'yaparım']],
  içmek: [['past', 'ben', 'içtim'], ['present', 'ben', 'içiyorum'], ['aorist', 'ben', 'içerim']],
  beklemek: [['aorist', 'ben', 'beklerim'], ['past', 'ben', 'bekledim'], ['present', 'ben', 'bekliyorum'], ['future', 'ben', 'bekleyeceğim']],
  anlamak: [['past', 'ben', 'anladım'], ['present', 'ben', 'anlıyorum'], ['aorist', 'ben', 'anlarım']],
  çalışmak: [['past', 'ben', 'çalıştım'], ['present', 'ben', 'çalışıyorum'], ['aorist', 'ben', 'çalışırım']],
  oturmak: [['aorist', 'ben', 'otururum'], ['past', 'ben', 'oturdum']],
  kapatmak: [['aorist', 'ben', 'kapatırım'], ['past', 'ben', 'kapattım']],
  öğrenmek: [['aorist', 'ben', 'öğrenirim'], ['future', 'ben', 'öğreneceğim']],
  açmak: [['past', 'ben', 'açtım'], ['present', 'ben', 'açıyorum']],
  söylemek: [['past', 'ben', 'söyledim'], ['present', 'ben', 'söylüyorum'], ['future', 'ben', 'söyleyeceğim']],
  demek: [['past', 'ben', 'dedim'], ['present', 'ben', 'diyorum'], ['future', 'ben', 'diyeceğim']],
  // Kütüphane genişletmesiyle eklenen fiiller (2026-10-05)
  uyumak: [['past', 'ben', 'uyudum'], ['present', 'ben', 'uyuyorum'], ['future', 'ben', 'uyuyacağım'], ['aorist', 'ben', 'uyurum']],
  uyanmak: [['present', 'ben', 'uyanıyorum'], ['aorist', 'o', 'uyanır'], ['past', 'ben', 'uyandım']],
  yıkamak: [['present', 'ben', 'yıkıyorum'], ['aorist', 'ben', 'yıkarım'], ['future', 'ben', 'yıkayacağım']],
  pişirmek: [['present', 'ben', 'pişiriyorum'], ['aorist', 'ben', 'pişiririm'], ['past', 'ben', 'pişirdim']],
  temizlemek: [['present', 'ben', 'temizliyorum'], ['future', 'ben', 'temizleyeceğim'], ['aorist', 'ben', 'temizlerim']],
  dinlemek: [['present', 'ben', 'dinliyorum'], ['aorist', 'ben', 'dinlerim']],
  duymak: [['present', 'ben', 'duyuyorum'], ['aorist', 'ben', 'duyarım'], ['past', 'ben', 'duydum']],
  unutmak: [['present', 'ben', 'unutuyorum'], ['aorist', 'ben', 'unuturum'], ['past', 'ben', 'unuttum']],
  bulmak: [['aorist', 'ben', 'bulurum'], ['past', 'ben', 'buldum'], ['present', 'ben', 'buluyorum']],
  koymak: [['aorist', 'ben', 'koyarım'], ['present', 'ben', 'koyuyorum']],
  göstermek: [['aorist', 'ben', 'gösteririm'], ['present', 'ben', 'gösteriyorum']],
  seçmek: [['past', 'ben', 'seçtim'], ['aorist', 'ben', 'seçerim'], ['present', 'ben', 'seçiyorum']],
  denemek: [['present', 'ben', 'deniyorum'], ['future', 'ben', 'deneyeceğim'], ['aorist', 'ben', 'denerim']],
  uçmak: [['past', 'ben', 'uçtum'], ['aorist', 'ben', 'uçarım'], ['present', 'ben', 'uçuyorum']],
  sürmek: [['aorist', 'ben', 'sürerim'], ['present', 'ben', 'sürüyorum']],
  varmak: [['aorist', 'ben', 'varırım'], ['past', 'ben', 'vardım']],
  durmak: [['aorist', 'ben', 'dururum'], ['present', 'ben', 'duruyorum']],
  sormak: [['aorist', 'ben', 'sorarım'], ['present', 'ben', 'soruyorum'], ['past', 'ben', 'sordum']],
  düşünmek: [['aorist', 'ben', 'düşünürüm'], ['present', 'ben', 'düşünüyorum']],
  inanmak: [['aorist', 'ben', 'inanırım'], ['present', 'ben', 'inanıyorum']],
  kazanmak: [['aorist', 'ben', 'kazanırım'], ['future', 'ben', 'kazanacağım']],
  yönetmek: [['present', 'ben', 'yönetiyorum'], ['past', 'ben', 'yönettim'], ['aorist', 'ben', 'yönetirim']],
  başlamak: [['present', 'ben', 'başlıyorum'], ['aorist', 'ben', 'başlarım']],
  kaybetmek: [['present', 'ben', 'kaybediyorum'], ['past', 'ben', 'kaybettim'], ['future', 'ben', 'kaybedeceğim'],
    ['aorist', 'ben', 'kaybederim'], ['aorist', 'o', 'kaybeder'], ['imperative', 'sen', 'kaybet'], ['imperative', 'siz', 'kaybedin']],
  reddetmek: [['present', 'ben', 'reddediyorum'], ['past', 'ben', 'reddettim'], ['aorist', 'ben', 'reddederim']],
  affetmek: [['present', 'ben', 'affediyorum'], ['aorist', 'ben', 'affederim'], ['imperative', 'siz', 'affedin']],
  // Genişletme (sağlık/ev/tamir/günlük) fiilleri
  yüzmek: [['present', 'ben', 'yüzüyorum'], ['future', 'ben', 'yüzeceğim'], ['aorist', 'ben', 'yüzerim'], ['past', 'ben', 'yüzdüm']],
  yürümek: [['present', 'ben', 'yürüyorum'], ['future', 'ben', 'yürüyeceğim'], ['aorist', 'ben', 'yürürüm']],
  giymek: [['present', 'ben', 'giyiyorum'], ['future', 'ben', 'giyeceğim'], ['aorist', 'ben', 'giyerim']],
  boyamak: [['present', 'ben', 'boyuyorum'], ['future', 'ben', 'boyayacağım'], ['aorist', 'ben', 'boyarım']],
  oynamak: [['present', 'ben', 'oynuyorum'], ['aorist', 'ben', 'oynarım'], ['past', 'ben', 'oynadım']],
  harcamak: [['present', 'ben', 'harcıyorum'], ['aorist', 'ben', 'harcarım']],
  taşımak: [['present', 'ben', 'taşıyorum'], ['aorist', 'ben', 'taşırım']],
  inmek: [['present', 'ben', 'iniyorum'], ['past', 'ben', 'indim'], ['aorist', 'ben', 'inerim'], ['imperative', 'sen', 'in']],
  korkmak: [['past', 'ben', 'korktum'], ['aorist', 'ben', 'korkarım'], ['present', 'ben', 'korkuyorum']],
  tanımak: [['present', 'ben', 'tanıyorum'], ['aorist', 'ben', 'tanırım'], ['past', 'ben', 'tanıdım']],
  kusmak: [['past', 'ben', 'kustum'], ['aorist', 'ben', 'kusarım']],
  öksürmek: [['present', 'ben', 'öksürüyorum'], ['aorist', 'ben', 'öksürürüm']],
  doldurmak: [['present', 'ben', 'dolduruyorum'], ['aorist', 'ben', 'doldururum']],
  izlemek: [['present', 'ben', 'izliyorum'], ['aorist', 'ben', 'izlerim']],
  onarmak: [['aorist', 'ben', 'onarırım'], ['present', 'ben', 'onarıyorum']],
  ölçmek: [['aorist', 'ben', 'ölçerim'], ['past', 'ben', 'ölçtüm']],
  kesmek: [['aorist', 'ben', 'keserim'], ['past', 'ben', 'kestim']],
};

export function verifyKnown(): string[] {
  const errors: string[] = [];
  for (const [inf, checks] of Object.entries(KNOWN)) {
    const c = conjugateTr(inf);
    for (const [tense, person, expected] of checks) {
      const got = c[tense][person];
      if (got !== expected) errors.push(`${inf} ${tense} ${person}: beklenen ${expected}, üretilen ${got}`);
    }
  }
  return errors;
}
