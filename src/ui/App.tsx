import { useEffect, useState } from 'react';
import { useSettingsStore } from '../core/settings/store';
import { tr } from '../core/i18n/tr';
import { Home } from './screens/Home';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'home' | 'settings';

export function App() {
  const load = useSettingsStore((s) => s.load);
  const loaded = useSettingsStore((s) => s.loaded);
  const theme = useSettingsStore((s) => s.settings.theme);
  const reduceMotion = useSettingsStore((s) => s.settings.reduceMotion);
  const [tab, setTab] = useState<Tab>('home');

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    root.toggleAttribute('data-reduce-motion', reduceMotion);
  }, [theme, reduceMotion]);

  if (!loaded) return null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>{tr.appName}</h1>
      </header>
      {/* İki ekran da bağlı kalır: ayarlara gidip dönünce çeviri ve yazılan metin kaybolmaz. */}
      <main className="app-main">
        <div hidden={tab !== 'home'}><Home /></div>
        <div hidden={tab !== 'settings'}><SettingsScreen /></div>
      </main>
      <nav className="tabbar" aria-label="Ana menü">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          {tr.home}
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          {tr.settings}
        </button>
      </nav>
    </div>
  );
}
