import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_VERSION, migrateSettings } from '../src/core/settings/schema';

describe('ayar göçü', () => {
  it('boş/bozuk girdi varsayılana döner', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings('x')).toEqual(DEFAULT_SETTINGS);
  });
  it('okunuş varsayılanı açık, i\'rab vb. sonraki aşamalar için alan yok ama sürüm güncel', () => {
    expect(DEFAULT_SETTINGS.showTransliteration).toBe(true);
    expect(migrateSettings({}).settingsVersion).toBe(SETTINGS_VERSION);
  });
  it('geçerli alanlar korunur, yanlış türdekiler düşer', () => {
    const m = migrateSettings({ showTransliteration: false, arabicFontSize: '99', theme: 'dark' });
    expect(m.showTransliteration).toBe(false);
    expect(m.arabicFontSize).toBe(DEFAULT_SETTINGS.arabicFontSize);
    expect(m.theme).toBe('dark');
  });
  it('v0 (sürümsüz) kayıt güncel sürüme taşınır', () => {
    expect(migrateSettings({ showHarakat: false }).settingsVersion).toBe(SETTINGS_VERSION);
  });
  it('v1 kaydı v2\'ye taşınır: eski değerler korunur, fiil penceresi ayarları varsayılanla gelir', () => {
    const v1 = { settingsVersion: 1, showTransliteration: false, theme: 'dark', addressGender: 'f' };
    const m = migrateSettings(v1);
    expect(m.settingsVersion).toBe(2);
    expect(m.showTransliteration).toBe(false);
    expect(m.addressGender).toBe('f');
    expect(m.verbShowDual).toBe(true);
    expect(m.verbBlur).toBe(8);
    expect(m.readIrab).toBe(false);
  });
  it('geçersiz seçenek ve aralık dışı değer varsayılana düşer', () => {
    const m = migrateSettings({ theme: 'neon', verbBlur: 99, futureParticle: 'sawfa' });
    expect(m.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(m.verbBlur).toBe(DEFAULT_SETTINGS.verbBlur);
    expect(m.futureParticle).toBe('sawfa');
  });
});
