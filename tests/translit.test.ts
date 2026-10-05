import { describe, expect, it } from 'vitest';
import { romanizeWord, translitAr } from '../src/core/translit/index';
import conjRaw from '../src/data/seed/conjugations.json';
import type { Conjugations } from '../src/types';

type Opts = { style?: 'simple' | 'detailed'; irab?: boolean };
/** [harekeli Arapça, beklenen Türkçe okunuş, seçenekler?] — kurallar: docs/TRANSLIT_RULES.md */
const CASES: [string, string, Opts?][] = [
  // --- Güneş harfleri: ل okunmaz, harf ikizlenir
  ['الشَّمْس', 'eş-şams'],
  ['السَّيَّارَة', 'es-sayyara'],
  ['التَّاجِر', 'et-tacir'],
  ['الدَّرْس', 'ed-dars'],
  ['الذَّهَب', 'ez-zahab'],
  ['الرَّجُل', 'er-racul'],
  ['الزَّيْت', 'ez-zeyt'],
  ['الصَّبَاح', 'es-sabah'],
  ['الطَّبِيب', 'et-tabib'],
  ['الظُّهْر', 'ez-zuhr'],
  ['اللَّيْل', 'el-leyl'],
  ['النُّور', 'en-nur'],
  ['الثَّلْج', 'es-salc'],
  ['الضَّيْف', 'ed-deyf'],
  // --- Ay harfleri
  ['الْبَيْت', 'el-beyt'],
  ['الْقَمَر', 'el-kamar'],
  ['الْكِتَاب', 'el-kitab'],
  ['الْيَوْم', 'el-yevm'],
  ['الْحِسَاب', 'el-hisab'],
  ['الْعَيْن', "el-'eyn"],
  ['الْغُرْفَة', 'el-ğurfa'],
  ['الْفُنْدُق', 'el-funduk'],
  ['الْهَاتِف', 'el-hatif'],
  ['الْوَلَد', 'el-valad'],
  ['الْخُبْز', 'el-hubz'],
  ['الْجَامِعَة', "el-cami'a"],
  ['الْمَاء', "el-ma'"],
  // --- Tanımlıktan sonra hemze yazılmaz; lam kesreli vasl
  ['الْأَحَد', 'el-ahad'],
  ['الْآنَ', 'el-an'],
  ['الِاسْم', 'el-ism'],
  ['الِاثْنَيْن', 'el-isneyn'],
  // --- Vasl: ünlüyle biten kelimeden sonra tanımlık bağlanır
  ['فِي الْبَيْتِ', 'fil-beyt'],
  ['إِلَى الْمَدْرَسَةِ', 'ilal-madrasa'],
  ['مِنَ الْبَيْتِ', 'minal-beyt'],
  ['رَكِبْتُ السَّيَّارَةَ', 'rakibtus-sayyara'],
  ['عَلَى الطَّاوِلَةِ', "'alat-tavila"],
  ['ذَهَبْتُ إِلَى السُّوقِ', 'zahabtu ilas-suk'],
  ['مِنْ الْبَيْتِ', 'min el-beyt'],
  ['فِي الْبَيْتِ الْكَبِيرِ', 'fil-beytil-kabir'],
  ['أَحْتَاجُ إِلَى الذَّهَابِ إِلَى الطَّبِيبِ', 'ahtacu ilaz-zahab ilat-tabib'],
  // --- Şedde
  ['سُكَّر', 'sukkar'],
  ['مُدَرِّس', 'mudarris'],
  ['حَمَّام', 'hammam'],
  ['جِدًّا', 'ciddan'],
  ['أُمّ', 'umm'],
  ['مَحَطَّة', 'mahatta'],
  ['صَيْدَلِيَّة', 'seydaliyya'],
  ['هُوِيَّة', 'huviyya'],
  // --- Tā marbūṭa: duruşta a, i'rab açıkken at+ünlü
  ['مَدْرَسَة', 'madrasa'],
  ['مَدِينَة', 'madina'],
  ['غُرْفَة', 'ğurfa'],
  ['سَاعَة', "sa'a"],
  ['ثَلَاثَة', 'salasa'],
  ['أَرْبَعَة', "arba'a"],
  ['عَائِلَة', "'a'ila"],
  ['مَدْرَسَةٌ', 'madrasatun', { irab: true }],
  ['مَدْرَسَةٌ', 'madrasa'],
  ['بِطَاقَة ائْتِمَان', "bitaka i'timan"],
  ['بِطَاقَةُ الْهُوِيَّةِ', 'bitakatul-huviyya'],
  ['صَبَاحُ الْخَيْرِ', 'sabahul-heyr'],
  // --- Tenvin
  ['شُكْرًا', 'şukran'],
  ['عَفْوًا', "'afvan"],
  ['أَيْضًا', 'eydan'],
  ['مَاءً', "ma'an"],
  ['غَدًا', 'ğadan'],
  ['كِتَابٌ', 'kitab'],
  ['كِتَابٌ', 'kitabun', { irab: true }],
  ['بَيْتٍ', 'beyt'],
  ['بَيْتٍ', 'beytin', { irab: true }],
  ['مَرْحَبًا', 'marhaban'],
  // --- Uzun ünlüler (sade a i u, ayrıntılı â î û)
  ['كِتَاب', 'kitab'],
  ['كِتَاب', 'kitâb', { style: 'detailed' }],
  ['كَبِير', 'kabir'],
  ['كَبِير', 'kabîr', { style: 'detailed' }],
  ['نُور', 'nur'],
  ['نُور', 'nûr', { style: 'detailed' }],
  ['بَاب', 'bab'],
  ['سُوق', 'suk'],
  // --- Diftong yalnız kısa a'dan sonra
  ['بَيْت', 'beyt'],
  ['يَوْم', 'yevm'],
  ['لَوْن', 'levn'],
  ['خَيْر', 'heyr'],
  ['شَاي', 'şay'],
  ['كَيْفَ', 'keyfa'],
  // --- Hemze
  ['سَأَلَ', "sa'ala"],
  ['قُرْآن', "kur'an"],
  ['سُؤَال', "su'al"],
  ['بِئْر', "bi'r"],
  ['أَكَلَ', 'akala'],
  ['إِسْلَام', 'islam'],
  ['أُرِيدُ', 'uridu'],
  ['هُدُوء', "hudu'"],
  ['مِائَة', "mi'a"],
  ['امْرَأَة', "imra'a"],
  // --- Harf karşılıkları
  ['ذَهَب', 'zahab'],
  ['حُبّ', 'hubb'],
  ['خُبْز', 'hubz'],
  ['صَبَاح', 'sabah'],
  ['ضَيْف', 'deyf'],
  ['ظَهْر', 'zahr'],
  ['عَرَبِيّ', "'arabiyy"],
  ['قَلْب', 'kalb'],
  ['جَمِيل', 'camil'],
  ['شَمْس', 'şams'],
  ['صَغِير', 'sağir'],
  ['ثَلْج', 'salc'],
  ['وَلَد', 'valad'],
  // --- Ayrıntılı stil
  ['حَمَّام', 'ḥammâm', { style: 'detailed' }],
  ['صَبَاح', 'ṣabâḥ', { style: 'detailed' }],
  ['عَرَبِيّ', 'ʿarabiyy', { style: 'detailed' }],
  ['قَلْب', 'ḳalb', { style: 'detailed' }],
  ['خُبْز', 'ḫubz', { style: 'detailed' }],
  ['ذَهَب', 'ẕahab', { style: 'detailed' }],
  ['ثَلْج', 's̱alc', { style: 'detailed' }],
  ['سُؤَال', 'suʾâl', { style: 'detailed' }],
  ['ظَهْر', 'ẓahr', { style: 'detailed' }],
  ['ضَيْف', 'ḍeyf', { style: 'detailed' }],
  ['طَبِيب', 'ṭabîb', { style: 'detailed' }],
  // --- Mebni tek kelimeler sözlük biçimiyle (son ünlü korunur)
  ['هُوَ', 'huva'],
  ['هِيَ', 'hiya'],
  ['مَعَ', "ma'a"],
  ['هٰذَا', 'haza'],
  ['هٰذِهِ', 'hazihi'],
  ['نَحْنُ', 'nahnu'],
  ['أَنَا', 'ana'],
  ['لَا', 'la'],
  ['نَعَمْ', "na'am"],
  ['لٰكِنْ', 'lakin'],
  // --- Elif maksûre, cemi vavı
  ['عَلَى', "'ala"],
  ['مُسْتَشْفَى', 'mustaşfa'],
  ['كَتَبُوا', 'katabu'],
  ['رَمَوْا', 'ramev'],
  // --- Cümle: sonu duruş (waqf), i'rab açıkken tam okunuş
  ['لَا أَفْهَمُ', 'la afham'],
  ['لَا أَفْهَمُ', 'la afhamu', { irab: true }],
  ['كَيْفَ حَالُكَ', 'keyfa haluk'],
  ['كَيْفَ حَالُكَ', 'keyfa haluka', { irab: true }],
  ['مَا اسْمُكَ', 'ma ismuk'],
  ['الْحِسَابَ مِنْ فَضْلِكَ', 'el-hisab min fadlik'],
  ['الْحِسَابَ مِنْ فَضْلِكَ', 'el-hisaba min fadlika', { irab: true }],
  ['ضَاعَ هَاتِفِي', "da'a hatifi"],
];

describe('okunuş motoru: kural örnekleri', () => {
  it(`en az 100 örnek (${CASES.length})`, () => {
    expect(CASES.length).toBeGreaterThanOrEqual(100);
  });
  for (const [ar, expected, opts] of CASES) {
    it(`${ar} → ${expected}${opts ? ' ' + JSON.stringify(opts) : ''}`, () => {
      expect(translitAr(ar, opts)).toBe(expected);
    });
  }
});

describe('romanize: Wiktionary çekim okunuşlarıyla birebir', () => {
  const conj = conjRaw as unknown as Record<string, Conjugations>;
  it('tüm tohum fiil hücrelerinde harekeli yazım → bilimsel okunuş aynı', () => {
    let n = 0;
    const fails: string[] = [];
    for (const [verb, c] of Object.entries(conj)) {
      const tables = [c.active.past, c.active.present, c.active.imperative, c.passive?.past, c.passive?.present];
      for (const t of tables) {
        for (const cell of Object.values(t ?? {})) {
          if (!cell) continue;
          n++;
          const got = romanizeWord(cell.ar);
          if (got !== cell.rom) fails.push(`${verb}: ${cell.ar} beklenen ${cell.rom}, çıkan ${got}`);
        }
      }
    }
    expect(n).toBeGreaterThan(1500);
    expect(fails).toEqual([]);
  });
});
