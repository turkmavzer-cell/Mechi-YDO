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
  it('v0 (sürümsüz) kayıt v1\'e taşınır', () => {
    expect(migrateSettings({ showHarakat: false }).settingsVersion).toBe(1);
  });
});
