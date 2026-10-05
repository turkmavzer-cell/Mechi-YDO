import { describe, expect, it } from 'vitest';
import { foldTr, normAr, normTr, stripHarakat, tokenizeTr } from '../src/core/tokenizer/normalize';

describe('Türkçe normalizasyon', () => {
  it('İ/ı doğru küçülür', () => {
    expect(normTr('İSTASYON')).toBe('istasyon');
    expect(normTr('IŞIK')).toBe('ışık');
  });
  it('noktalama atılır, boşluk tekilleşir', () => {
    expect(normTr('  Ne   kadar?! ')).toBe('ne kadar');
    expect(tokenizeTr('Taksi, lütfen.')).toEqual(['taksi', 'lütfen']);
  });
  it('Türkçe karakter katlama', () => {
    expect(foldTr('Çalışıyorum')).toBe('calisiyorum');
  });
});

describe('Arapça normalizasyon (yalnızca arama anahtarı)', () => {
  it('harekeleri ve tatweel atar', () => {
    expect(stripHarakat('رَكِبْتُ')).toBe('ركبت');
    expect(stripHarakat('كـتـاب')).toBe('كتاب');
  });
  it('alef/ya/ta marbuta eşlemeleri', () => {
    expect(normAr('أَرَادَ')).toBe('اراد');
    expect(normAr('إِيجَار')).toBe('ايجار');
    expect(normAr('مَدْرَسَة')).toBe('مدرسه');
    expect(normAr('مُسْتَشْفَى')).toBe('مستشفي');
  });
});
