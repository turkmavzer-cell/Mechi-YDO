import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { trChat } from '../../core/i18n/chat.tr';
import { copyText, exportMarkdown } from '../../core/chat/exportMd';
import { buildVocabMarkdown } from '../../core/chat/markdown';
import { useChatStore } from '../../core/chat/store';
import { transliterate } from '../../core/chat/translit';
import { useSettingsStore, useTranslitPrefs } from '../../core/settings/store';
import { ArabicText } from './ArabicText';

interface Props {
  /** Vurgulanacak (bu turda yeni eklenen) kelime anahtarları. */
  highlight?: string[];
  onClose: () => void;
}

const POS_TR: Record<string, string> = {
  noun: 'isim', verb: 'fiil', adj: 'sıfat', adv: 'zarf', prep: 'edat', pron: 'zamir', num: 'sayı', particle: 'edat/bağlaç', phrase: 'kalıp',
};

/** Kelime defteri: biriken kelimeler + md dışa aktarma. <dialog> tabanlı alt sayfa (fiil penceresiyle aynı desen). */
export function VocabSheet({ highlight = [], onClose }: Props) {
  const vocab = useChatStore((s) => s.vocab);
  const removeVocab = useChatStore((s) => s.removeVocab);
  const clearVocab = useChatStore((s) => s.clearVocab);
  const prefs = useTranslitPrefs();
  const blur = useSettingsStore((s) => s.settings.verbBlur);
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState('');

  useLayoutEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => onClose();
    d.addEventListener('close', onDialogClose);
    const supportsClosedBy = 'closedBy' in HTMLDialogElement.prototype;
    const onClick = (e: MouseEvent) => {
      if (supportsClosedBy || e.target !== d) return;
      const r = d.getBoundingClientRect();
      const inside = r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right;
      if (!inside) d.close();
    };
    d.addEventListener('click', onClick);
    return () => {
      d.removeEventListener('close', onDialogClose);
      d.removeEventListener('click', onClick);
    };
  }, [onClose]);

  const close = () => {
    ref.current?.close();
    onClose();
  };
  const md = () => buildVocabMarkdown(vocab, { generatedAt: new Date().toISOString(), appVersion: '0.1.0' });
  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2500);
  };
  const onExport = async () => {
    const r = await exportMarkdown(md());
    if (r === 'downloaded') flash(trChat.vocab.downloaded);
    else if (r === 'shared') flash(trChat.vocab.shared);
  };
  const onCopy = async () => flash((await copyText(md())) ? trChat.vocab.copied : trChat.errors.server_error);
  const onClear = () => {
    if (window.confirm(trChat.vocab.confirmClear)) clearVocab();
  };

  // Yeni → eski.
  const list = [...vocab].reverse();

  return (
    <dialog ref={ref} className="verb-sheet vocab-sheet" aria-labelledby="vocab-title" {...{ closedby: 'any' }}>
      <style>{`.vocab-sheet::backdrop{-webkit-backdrop-filter:blur(${blur}px);backdrop-filter:blur(${blur}px)}`}</style>
      <div className="sheet-grip"><span aria-hidden="true" /></div>
      <header className="verb-head">
        <div>
          <h2 id="vocab-title">{trChat.vocab.title}</h2>
          <p className="muted small">{vocab.length} · {trChat.vocab.unverified}</p>
        </div>
        <button className="icon-btn" onClick={close} aria-label={trChat.vocab.close}>✕</button>
      </header>

      <div className="vocab-actions">
        <button className="primary" onClick={onExport} disabled={vocab.length === 0}>{trChat.vocab.export}</button>
        <button onClick={onCopy} disabled={vocab.length === 0}>{trChat.vocab.copy}</button>
      </div>
      {status && <p className="note" role="status">{status}</p>}

      {list.length === 0 ? (
        <p className="note">{trChat.vocab.empty}</p>
      ) : (
        <ul className="vocab-list">
          {list.map((v) => (
            <li key={v.key} className={highlight.includes(v.key) ? 'fresh' : ''}>
              <div className="vocab-ar"><ArabicText text={v.ar} size={26} /></div>
              <div className="vocab-body">
                {prefs && transliterate(v.ar, prefs) && <div className="translit">{transliterate(v.ar, prefs)}</div>}
                <div className="vocab-tr">{[v.tr, ...v.altTr].join('; ')}</div>
                {v.exampleAr && (
                  <div className="vocab-ex">
                    <ArabicText text={v.exampleAr} size={18} /> <span className="muted">{v.exampleTr}</span>
                  </div>
                )}
                <div className="muted small">{POS_TR[v.pos] ?? v.pos} · {trChat.vocab.seen(v.count)}</div>
              </div>
              <button className="icon-btn" onClick={() => removeVocab(v.key)} aria-label={`${trChat.vocab.remove}: ${v.tr}`}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <p className="note">{trChat.vocab.note}</p>
      {vocab.length > 0 && <button className="danger" onClick={onClear}>{trChat.vocab.clear}</button>}
    </dialog>
  );
}
