/**
 * Ek almış Türkçe isimler için Arapça birleştirme: hâl eki → edat (إِلَى فِي مِنْ مَعَ), iyelik eki → zamir eki (ـِي ـكَ ـهُ…).
 * Kurallar Fusha'nın sabit kurallarıdır; yine de sonuç "emin değil" (~) işaretlenir: bağlam (tanımlılık, hâl, cinsiyet)
 * tek kelimeden bilinemez. Kuralın uygulanamadığı kelimelerde (uzun ünlüyle biten, hemzeli, çok kelimeli) birleştirme
 * denenmez, yalnızca kök gösterilir ve nedeni notta söylenir.
 */
import type { Gender } from '../../types';
import type { CaseName, NounAnalysis, Possessive } from '../tokenizer/turkishMorph';

const FATHA = '\u064E', DAMMA = '\u064F', KASRA = '\u0650';
/** Son harf + (şedde) + son işaretler. */
const TAIL = /^(.*?)([\u0621-\u064A])(\u0651?)([\u064B-\u0650\u0652\u0670]*)$/;
/** Zamir eki gelince biçimi değişen veya yazımı karmaşıklaşan son harfler: ünlü harfler ve hemze. */
const NOT_ATTACHABLE = /[اىيوءأإؤئآ]/;

export const PREPOSITION: Partial<Record<CaseName, string>> = {
  dat: 'إِلَى', loc: 'فِي', abl: 'مِنْ', ins: 'مَعَ',
};

export type CaseVowel = 'u' | 'a' | 'i';
const VOWEL_MARK: Record<CaseVowel, string> = { u: DAMMA, a: FATHA, i: KASRA };

/**
 * İsme iyelik zamir eki ekler: بَيْت + ben → بَيْتِي, سَيَّارَة + sen(erkek) → سَيَّارَتُكَ.
 * Tek kelimelik, son harfi ünsüz (veya ة) olan isimlerde çalışır; aksi hâlde undefined (birleştirme denenmez).
 * `caseVowel`: ismin durum ünlüsü (u: özne, a: nesne, i: edatın ardından/tamlayan). `ben` eki her zaman kesre ister.
 */
export function attachPossessive(ar: string, person: Possessive, caseVowel: CaseVowel, gender: Gender): string | undefined {
  const s = ar.normalize('NFC').trim();
  if (!s || /\s/.test(s)) return undefined;
  const m = TAIL.exec(s);
  if (!m) return undefined;
  const [, head, last, shadda, tail] = m;
  if (NOT_ATTACHABLE.test(last)) return undefined;
  // Kesre tenvinli kelimeler eksik ي'li (defective) isimlerdir (مُحَامٍ): ek alma kuralı farklı, birleştirme denenmez.
  if (tail.includes('\u064D')) return undefined;
  const letter = last === 'ة' ? 'ت' : last;
  const vowel = person === 'ben' ? 'i' : caseVowel;
  const mark = VOWEL_MARK[vowel];
  // Eklerin kendi ünlüsü: 3. kişi ekleri kesreden sonra kesreli yazılır (بِهِ، بِهِمْ).
  const suffix: Record<Possessive, string> = {
    ben: 'ي',
    sen: gender === 'f' ? `ك${KASRA}` : `ك${FATHA}`,
    o: vowel === 'i' ? `ه${KASRA}` : gender === 'f' ? `ه${FATHA}ا` : `ه${DAMMA}`,
    biz: `ن${FATHA}ا`,
    siz: `ك${DAMMA}مْ`,
    onlar: vowel === 'i' ? `ه${KASRA}مْ` : `ه${DAMMA}مْ`,
  };
  // "o" 3. kişi dişil ekinin (ـهَا) kasreden sonra da aynı kaldığını koru.
  if (person === 'o' && gender === 'f') suffix.o = `ه${FATHA}ا`;
  // NFC: şedde ile kesre sırası standartlaşır (aynı görünen iki ayrı dizilim karşılaştırmayı bozmasın).
  return `${head}${letter}${shadda}${mark}${suffix[person]}`.normalize('NFC');
}

export interface Composed {
  ar: string;
  /** Kullanıcıya gösterilecek kısa uyarılar (Türkçe). */
  notes: string[];
}

/** Analize göre Arapça: [edat] + isim(+zamir eki). Çoğul için Arapça çoğul biçimi olmadığından tekil gösterilir. */
export function composeNoun(wordAr: string, a: NounAnalysis, gender: Gender): Composed {
  const notes: string[] = [];
  let noun = wordAr;

  if (a.possessive) {
    // Edatın ardından isim tamlayan (kesre) olur; çıplak isimde özne varsayılır (damma).
    const vowel: CaseVowel = PREPOSITION[a.case] ? 'i' : 'u';
    const att = attachPossessive(wordAr, a.possessive, vowel, gender);
    if (att) {
      noun = att;
      if (a.possessive === 'o') notes.push(gender === 'f' ? 'erkek için: ـهُ' : 'dişil için: ـهَا');
      if (a.possessive === 'sen') notes.push(gender === 'f' ? 'erkeğe: ـكَ' : 'kadına: ـكِ');
    } else {
      notes.push('iyelik eki eklenemedi, kök gösteriliyor');
    }
  }
  if (a.plural) notes.push('çoğul biçimi yok, tekil gösteriliyor');
  if (a.case === 'gen') notes.push('ilgi hâli: yalnızca kelime gösteriliyor');

  const prep = PREPOSITION[a.case];
  return { ar: prep ? `${prep} ${noun}` : noun, notes };
}
