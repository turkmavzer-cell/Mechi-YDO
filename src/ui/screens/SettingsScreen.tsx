import { useState } from 'react';
import { checkProxy, ChatError } from '../../core/chat/engine';
import { tr } from '../../core/i18n/tr';
import { trChat } from '../../core/i18n/chat.tr';
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
  const C = trChat.settings;
  const [proxyStatus, setProxyStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const testProxy = async () => {
    setTesting(true);
    setProxyStatus(null);
    try {
      const r = await checkProxy({ url: s.chatProxyUrl, token: s.chatProxyToken || undefined, timeoutMs: 10_000 });
      setProxyStatus({ ok: true, text: C.testOk(r.model) });
    } catch (e) {
      setProxyStatus({ ok: false, text: `${C.testFail}: ${e instanceof ChatError ? trChat.errors[e.code] ?? e.message : ''}` });
    } finally {
      setTesting(false);
    }
  };

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
      <label className="row">
        <span>{L.translitStyle}</span>
        <select value={s.translitStyle} disabled={!s.showTransliteration}
          onChange={(e) => update({ translitStyle: e.target.value as Settings['translitStyle'] })}>
          <option value="simple">{L.translitSimple}</option>
          <option value="detailed">{L.translitDetailed}</option>
        </select>
      </label>
      {toggle('readIrab', L.readIrab, L.readIrabHint)}
      <label className="row">
        <span>
          {L.speakerGender}
          <small className="muted block">{L.speakerGenderHint}</small>
        </span>
        <select value={s.speakerGender} onChange={(e) => update({ speakerGender: e.target.value as Settings['speakerGender'] })}>
          <option value="m">Erkeğim</option>
          <option value="f">Kadınım</option>
        </select>
      </label>
      <label className="row">
        <span>
          {L.addressGender}
          <small className="muted block">{L.addressGenderHint}</small>
        </span>
        <select value={s.addressGender} onChange={(e) => update({ addressGender: e.target.value as Settings['addressGender'] })}>
          <option value="m">Erkek (أَنْتَ)</option>
          <option value="f">Kadın (أَنْتِ)</option>
        </select>
      </label>
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

      <h2>{tr.settingsGroups.verb}</h2>
      <label className="row col">
        <span>{L.verbBlur}: {s.verbBlur}px</span>
        <input type="range" min={0} max={20} value={s.verbBlur}
          onChange={(e) => update({ verbBlur: Number(e.target.value) })} />
      </label>
      <fieldset className="row col">
        <legend>{L.verbTenses}</legend>
        <div className="chips">
          {([['verbShowPast', 'past'], ['verbShowPresent', 'present'], ['verbShowFuture', 'future'], ['verbShowImperative', 'imperative']] as const).map(([key, t]) => (
            <label key={key} className="chip">
              <input type="checkbox" checked={s[key]} onChange={(e) => update({ [key]: e.target.checked })} />
              {tr.verb.tenses[t]}
            </label>
          ))}
        </div>
      </fieldset>
      {toggle('verbShowDual', L.verbShowDual)}
      {toggle('verbShowPassive', L.verbShowPassive)}
      {toggle('verbMarkUsed', L.verbMarkUsed)}
      {toggle('verbShowMeta', L.verbShowMeta)}
      {toggle('verbGenderSplit', L.verbGenderSplit)}
      <h2>{C.group}</h2>
      <label className="row col">
        <span>
          {C.proxyUrl}
          <small className="muted block">{C.proxyUrlHint}</small>
        </span>
        <input type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={s.chatProxyUrl}
          placeholder="https://…workers.dev" onChange={(e) => update({ chatProxyUrl: e.target.value.trim() })} />
      </label>
      <label className="row col">
        <span>
          {C.token}
          <small className="muted block">{C.tokenHint}</small>
        </span>
        <input type="password" autoComplete="off" value={s.chatProxyToken} onChange={(e) => update({ chatProxyToken: e.target.value })} />
      </label>
      {toggle('chatConsent', C.consent, C.consentHint)}
      {toggle('chatAutoSaveMd', C.autoSave)}
      <div className="row col">
        <button onClick={() => void testProxy()} disabled={testing || !s.chatProxyUrl.trim()}>{testing ? C.testing : C.test}</button>
        {proxyStatus && <p className={`note ${proxyStatus.ok ? '' : 'warn-text'}`} role="status">{proxyStatus.text}</p>}
      </div>

      <button className="danger" onClick={reset}>{L.reset}</button>
    </div>
  );
}
