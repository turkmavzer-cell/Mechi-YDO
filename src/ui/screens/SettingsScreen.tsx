import { tr } from '../../core/i18n/tr';
import { useSettingsStore } from '../../core/settings/store';
import type { Settings } from '../../core/settings/schema';
import { ArabicText } from '../components/ArabicText';

type BoolKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

export function SettingsScreen() {
  const s = useSettingsStore((st) => st.settings);
  const update = useSettingsStore((st) => st.update);
  const reset = useSettingsStore((st) => st.reset);
  const L = tr.settingLabels;

  const toggle = (key: BoolKey, label: string, hint?: string) => (
    <label className="row">
      <span>
        {label}
        {hint && <small className="muted block">{hint}</small>}
      </span>
      <input type="checkbox" checked={s[key]} onChange={(e) => update({ [key]: e.target.checked })} />
    </label>
  );

  return (
    <div className="settings">
      <h2>{tr.settingsGroups.display}</h2>
      {toggle('showTransliteration', L.showTransliteration, L.showTransliterationHint)}
      {toggle('showHarakat', L.showHarakat)}
      <label className="row col">
        <span>{L.arabicFontSize}: {s.arabicFontSize}px</span>
        <input type="range" min={24} max={64} value={s.arabicFontSize}
          onChange={(e) => update({ arabicFontSize: Number(e.target.value) })} />
        <ArabicText text="رَكِبْتُ السَّيَّارَةَ" />
      </label>
      <label className="row col">
        <span>{L.turkishFontSize}: {s.turkishFontSize}px</span>
        <input type="range" min={14} max={32} value={s.turkishFontSize}
          onChange={(e) => update({ turkishFontSize: Number(e.target.value) })} />
      </label>
      <label className="row">
        <span>{L.theme}</span>
        <select value={s.theme} onChange={(e) => update({ theme: e.target.value as Settings['theme'] })}>
          <option value="system">Sistem</option>
          <option value="light">Açık</option>
          <option value="dark">Koyu</option>
        </select>
      </label>
      {toggle('pulseVerbs', L.pulseVerbs)}
      {toggle('reduceMotion', L.reduceMotion)}
      {toggle('showSourceBadge', L.showSourceBadge)}
      {toggle('markUnverified', L.markUnverified)}
      <button className="danger" onClick={reset}>{L.reset}</button>
    </div>
  );
}
