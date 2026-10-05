import { useEffect, useState } from 'react';
import { useChatStore } from '../core/chat/store';
import { useLibraryStore } from '../core/library/store';
import { useSettingsStore } from '../core/settings/store';
import { trChat } from '../core/i18n/chat.tr';
import { tr } from '../core/i18n/tr';
import { ChatScreen } from './screens/ChatScreen';
import { Home } from './screens/Home';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'home' | 'chat' | 'settings';

export function App() {
  const load = useSettingsStore((s) => s.load);
  const loadChat = useChatStore((s) => s.load);
  const loadLibrary = useLibraryStore((s) => s.load);
  const checkLibrary = useLibraryStore((s) => s.check);
  const loaded = useSettingsStore((s) => s.loaded);
  const theme = useSettingsStore((s) => s.settings.theme);
  const reduceMotion = useSettingsStore((s) => s.settings.reduceMotion);
  const [tab, setTab] = useState<Tab>('home');

  useEffect(() => {
    void load();
    void loadChat();
    void loadLibrary();
  }, [load, loadChat, loadLibrary]);

  // Açılışta (ayarlar yüklendikten sonra, bir kez) sessizce yeni kütüphane var mı diye bakılır.
  const autoCheck = useSettingsStore((s) => s.settings.libraryAutoCheck);
  const manifestUrl = useSettingsStore((s) => s.settings.libraryManifestUrl);
  useEffect(() => {
    if (loaded && autoCheck) void checkLibrary(manifestUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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
      {/* Üç ekran da bağlı kalır: sekme değişince çeviri, sohbet ve yazılan metin kaybolmaz. */}
      <main className="app-main">
        <div hidden={tab !== 'home'}><Home /></div>
        <div hidden={tab !== 'chat'}><ChatScreen onOpenSettings={() => setTab('settings')} /></div>
        <div hidden={tab !== 'settings'}><SettingsScreen /></div>
      </main>
      <nav className="tabbar" aria-label="Ana menü">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          {tr.home}
        </button>
        <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
          {trChat.tab}
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          {tr.settings}
        </button>
      </nav>
    </div>
  );
}
