import { describe, expect, it } from 'vitest';
import { createSeedRepo } from '../src/core/library/seed';
import { attachPossessive, composeNoun } from '../src/core/translation/compose';
import { translate } from '../src/core/translation/orchestrator';
import { analyzeNoun, describeAnalysis, stemVariants } from '../src/core/tokenizer/turkishMorph';

const DICT = new Set(['ev', 'araba', 'anahtar', 'doktor', 'okul', 'mutfak', 'kitap', 'şehir', 'saat', 'kapı', 'telefon', 'ağız', 'su', 'oda', 'para', 'isim', 'ad', 'renk', 'ağaç', 'sokak']);
const lookup = (l: string) => DICT.has(l);
const first = (w: string) => {
  const a = analyzeNoun(w, lookup)[0];
  return a ? describeAnalysis(a) : undefined;
};

describe('Türkçe isim ek çözümleyici', () => {
  // [kelime, beklenen ilk çözümleme]: hepsi Türkçe dilbilgisine göre doğru biçimlerdir.
  const CASES: [string, string][] = [
    // hâl ekleri: ünlüyle biten kök (y kaynaştırması)
    ['arabaya', 'araba + -e hâli (yönelme)'], ['arabayı', 'araba + -i hâli'], ['arabada', 'araba + -de hâli (bulunma)'],
    ['arabadan', 'araba + -den hâli (ayrılma)'], ['arabanın', 'araba + -in (ilgi)'], ['arabayla', 'araba + -le (ile)'],
    // hâl ekleri: ünsüzle biten kök, ünlü uyumu (ince/kalın), sert ünsüz (t)
    ['evde', 'ev + -de hâli (bulunma)'], ['evden', 'ev + -den hâli (ayrılma)'], ['eve', 'ev + -e hâli (yönelme)'], ['evle', 'ev + -le (ile)'],
    ['okula', 'okul + -e hâli (yönelme)'], ['okuldan', 'okul + -den hâli (ayrılma)'], ['doktora', 'doktor + -e hâli (yönelme)'],
    ['sokakta', 'sokak + -de hâli (bulunma)'], ['kitapta', 'kitap + -de hâli (bulunma)'],
    // iyelik
    ['arabam', 'araba + benim'], ['araban', 'araba + senin'], ['arabası', 'araba + onun'], ['arabamız', 'araba + bizim'],
    ['arabanız', 'araba + sizin'], ['evim', 'ev + benim'], ['evimiz', 'ev + bizim'], ['eviniz', 'ev + sizin'],
    ['okulum', 'okul + benim'], ['telefonum', 'telefon + benim'], ['kapısı', 'kapı + onun'],
    // çoğul
    ['evler', 'ev + çoğul'], ['kitaplar', 'kitap + çoğul'], ['evlerde', 'ev + çoğul + -de hâli (bulunma)'], ['evlere', 'ev + çoğul + -e hâli (yönelme)'],
    // iyelik + hâl: 3. kişide n kaynaştırması, diğerlerinde yok
    ['arabasına', 'araba + onun + -e hâli (yönelme)'], ['arabasında', 'araba + onun + -de hâli (bulunma)'], ['arabasından', 'araba + onun + -den hâli (ayrılma)'],
    ['arabasını', 'araba + onun + -i hâli'], ['arabasıyla', 'araba + onun + -le (ile)'], ['arabama', 'araba + benim + -e hâli (yönelme)'],
    ['evimde', 'ev + benim + -de hâli (bulunma)'], ['evimi', 'ev + benim + -i hâli'], ['evimin', 'ev + benim + -in (ilgi)'], ['eviyle', 'ev + onun + -le (ile)'],
    // çoğul + iyelik + hâl
    ['anahtarlarımı', 'anahtar + çoğul + benim + -i hâli'], ['paramı', 'para + benim + -i hâli'],
    // ünsüz yumuşaması (p→b, k→ğ, ç→c), ünlü düşmesi (şehir→şehr, ağız→ağz), nk→ng
    ['kitabı', 'kitap + -i hâli'], ['kitaba', 'kitap + -e hâli (yönelme)'], ['mutfağa', 'mutfak + -e hâli (yönelme)'], ['ağaca', 'ağaç + -e hâli (yönelme)'],
    ['şehre', 'şehir + -e hâli (yönelme)'], ['şehirde', 'şehir + -de hâli (bulunma)'], ['ağzım', 'ağız + benim'], ['rengi', 'renk + -i hâli'],
    // ince ek alan kalın ünlülü istisna (saat → saate)
    ['saate', 'saat + -e hâli (yönelme)'], ['saatte', 'saat + -de hâli (bulunma)'], ['saatler', 'saat + çoğul'],
    // su: n/y kaynaştırması düzensiz değil, y ile
    ['suda', 'su + -de hâli (bulunma)'], ['suyu', 'su + -i hâli'],
  ];
  for (const [word, expected] of CASES) {
    it(`${word} → ${expected}`, () => expect(first(word)).toBe(expected));
  }

  it('belirsiz biçimlerde tüm çözümlemeler döner (evi: -i hâli / onun evi), sade olan önde', () => {
    const all = analyzeNoun('evi', lookup).map(describeAnalysis);
    expect(all).toEqual(['ev + -i hâli', 'ev + onun']);
    expect(analyzeNoun('evin', lookup).map(describeAnalysis)).toEqual(['ev + -in (ilgi)', 'ev + senin']);
  });
  it('çıplak kök ve sözlükte olmayan kelime çözümlenmez (çıplak kök doğrudan sözlük aramasıdır)', () => {
    expect(analyzeNoun('araba', lookup)).toEqual([]);
    expect(analyzeNoun('zzzxyz', lookup)).toEqual([]);
    expect(analyzeNoun('evvv', lookup)).toEqual([]);
  });
  it('üretilen biçim yazılışla birebir eşleşmediyse çözümleme yok (yanlış ek yanlış sonuç vermez)', () => {
    expect(analyzeNoun('arabayee', lookup)).toEqual([]);
    expect(analyzeNoun('evdan', lookup)).toEqual([]); // ince kökte kalın ek
    expect(analyzeNoun('okulde', lookup)).toEqual([]);
  });
  it('büyük harf ve Türkçe İ/ı doğru işlenir', () => {
    expect(first('ARABAYA')).toBe('araba + -e hâli (yönelme)');
    expect(first('Okuldan')).toBe('okul + -den hâli (ayrılma)');
  });
  it('kök varyantları: yumuşama ve ünlü düşmesi', () => {
    expect(stemVariants('kitap')).toContain('kitab');
    expect(stemVariants('mutfak')).toContain('mutfağ');
    expect(stemVariants('şehir')).toContain('şehr');
    expect(stemVariants('ev')).toEqual(['ev']);
  });
});

describe('Arapça iyelik zamir eki', () => {
  // Beklenen değerler NFC'ye çevrilir: şedde+kesre sırası görünüşte aynı, bayt olarak farklı yazılabilir.
  const n = (s: string) => s.normalize('NFC');
  const ben = (w: string) => attachPossessive(w, 'ben', 'u', 'm');
  it('ben: kesre + ي (بَيْتِي، سَيَّارَتِي، حُبِّي)', () => {
    expect(ben('بَيْت')).toBe('بَيْتِي');
    expect(ben('سَيَّارَة')).toBe('سَيَّارَتِي'); // tā marbūṭa → ت
    expect(ben('حُبّ')).toBe(n('حُبِّي')); // şeddeli son harf
  });
  it('sen/o/biz/siz/onlar: durum ünlüsü + ek (nominatif varsayılan)', () => {
    expect(attachPossessive('اِسْم', 'sen', 'u', 'm')).toBe('اِسْمُكَ'); // tohumdaki "ismuk" ile aynı
    expect(attachPossessive('اِسْم', 'sen', 'u', 'f')).toBe('اِسْمُكِ');
    expect(attachPossessive('بَيْت', 'o', 'u', 'm')).toBe('بَيْتُهُ');
    expect(attachPossessive('بَيْت', 'o', 'u', 'f')).toBe('بَيْتُهَا');
    expect(attachPossessive('بَيْت', 'biz', 'u', 'm')).toBe('بَيْتُنَا');
    expect(attachPossessive('بَيْت', 'siz', 'u', 'm')).toBe('بَيْتُكُمْ');
    expect(attachPossessive('بَيْت', 'onlar', 'u', 'm')).toBe('بَيْتُهُمْ');
  });
  it('edatın ardından (tamlayan, kesre): بِهِ / بِهِمْ asimilasyonu', () => {
    expect(attachPossessive('بَيْت', 'o', 'i', 'm')).toBe('بَيْتِهِ');
    expect(attachPossessive('بَيْت', 'onlar', 'i', 'm')).toBe('بَيْتِهِمْ');
    expect(attachPossessive('بَيْت', 'sen', 'i', 'm')).toBe('بَيْتِكَ');
  });
  it('uygulanamayan kelimeler: uzun ünlü/hemze ile bitenler, çok kelimeli kalıp, boş', () => {
    for (const w of ['مَاء', 'مُسْتَشْفَى', 'غَالٍ', 'بِطَاقَة ائْتِمَان', '']) expect(ben(w), w).toBeUndefined();
  });
  it('mevcut tenvin/durum ünlüsü yeni ünlüyle değişir', () => {
    expect(ben('بَيْتٌ')).toBe('بَيْتِي');
    expect(ben('بَيْتُ')).toBe('بَيْتِي');
  });
});

describe('Arapça birleştirme (hâl → edat)', () => {
  const a = (w: string) => analyzeNoun(w, lookup)[0];
  it('yönelme إِلَى, bulunma فِي, ayrılma مِنْ, ile مَعَ', () => {
    expect(composeNoun('سَيَّارَة', a('arabaya'), 'm').ar).toBe('إِلَى سَيَّارَة');
    expect(composeNoun('مَطْبَخ', a('evde'), 'm').ar).toBe('فِي مَطْبَخ');
    expect(composeNoun('مَدْرَسَة', a('okuldan'), 'm').ar).toBe('مِنْ مَدْرَسَة');
    expect(composeNoun('طَبِيب', a('arabayla'), 'm').ar).toBe('مَعَ طَبِيب');
  });
  it('iyelik + hâl: edatın ardından tamlayan (kesre) → إِلَى سَيَّارَتِهِ', () => {
    expect(composeNoun('سَيَّارَة', a('arabasına'), 'm').ar).toBe('إِلَى سَيَّارَتِهِ');
    expect(composeNoun('بَيْت', a('evinde'), 'm').ar).toBe('فِي بَيْتِكَ');
  });
  it('çoğul uyarı verir (Arapça çoğul yok), kök gösterilir', () => {
    const r = composeNoun('بَيْت', a('evler'), 'm');
    expect(r.ar).toBe('بَيْت');
    expect(r.notes.join(' ')).toContain('çoğul');
  });
  it('iyelik eklenemeyen kelimede kök gösterilir ve neden söylenir', () => {
    const r = composeNoun('مَاء', a('suyum') ?? { lemma: 'su', plural: false, possessive: 'ben', case: 'nom', suffixes: ['m'] }, 'm');
    expect(r.ar).toBe('مَاء');
    expect(r.notes.join(' ')).toContain('eklenemedi');
  });
  it('3. kişi iyelikte cinsiyet notu', () => {
    expect(composeNoun('بَيْت', a('evim') && { ...a('evim'), possessive: 'o' }, 'm').notes.join(' ')).toContain('dişil için');
  });
});

describe('çeviri akışında ek almış isimler (gerçek kütüphane)', () => {
  const repo = createSeedRepo();
  it('"arabaya" artık bulunur: edat + isim, "~" işaretli, ek açıklaması notta', () => {
    const r = translate('arabaya', repo);
    expect(r.matchKind).toBe('word-by-word');
    expect(r.missingWords).toEqual([]);
    expect(r.rows[0]).toMatchObject({ tr: 'arabaya', ar: 'إِلَى السَّيَّارَة'.replace('السَّيَّارَة', 'سَيَّارَة'), pos: 'noun', lemma: 'araba', uncertain: true });
    expect(r.rows[0].note).toContain('araba + -e hâli (yönelme)');
  });
  it('"doktorda", "okuldan", "mutfağa" bulunur', () => {
    for (const w of ['doktorda', 'okuldan', 'mutfağa']) {
      const r = translate(w, repo);
      expect(r.missingWords, w).toEqual([]);
      expect(r.arabic, w).toBeTruthy();
    }
  });
  it('"anahtarlarımı" (çoğul+iyelik+hâl) bulunur ve uyarı notu taşır', () => {
    const r = translate('anahtarlarımı', repo);
    expect(r.missingWords).toEqual([]);
    expect(r.rows[0].note).toContain('çoğul');
  });
  it('okunuş: birleşik Arapçadan motor üretir; okunuş kapalıysa hesaplanmaz', () => {
    expect(translate('arabaya', repo).rows[0].translit).toBe('ila sayyara');
    expect(translate('arabaya', repo, { translit: false }).rows[0].translit).toBe('');
  });
  it('doğrudan sözlük kaydı ek çözümlemesine üstündür; fiil çekimi isimden önce gelir', () => {
    expect(translate('araba', repo).rows[0].note).toBeUndefined();
    expect(translate('gidiyorum', repo).rows[0].verb).toBe(true);
  });
  it('cümle içinde: bilinmeyen kelime yine eksik, ek almış bilinen kelime artık eksik değil', () => {
    const r = translate('arabaya zzzxyz', repo);
    expect(r.missingWords).toEqual(['zzzxyz']);
    expect(r.rows.find((x) => x.tr === 'arabaya')?.ar).toBeTruthy();
  });
  it('hitap cinsiyeti iyelik ekine yansır (senin evin → kadına ـكِ)', () => {
    expect(translate('evinde', repo, { addressGender: 'f' }).rows[0].note).toContain('erkeğe: ـكَ');
  });
});
