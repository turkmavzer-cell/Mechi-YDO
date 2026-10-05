import { useEffect, useRef, useState } from 'react';
import { trChat } from '../../core/i18n/chat.tr';
import { useChatStore } from '../../core/chat/store';
import type { ChatDirection, ChatMessage } from '../../core/chat/types';
import { useSettingsStore, useShowTranslit } from '../../core/settings/store';
import { ArabicText } from '../components/ArabicText';
import { VocabSheet } from '../components/VocabSheet';

function Bubble({ m, showTranslit, onWords }: { m: ChatMessage; showTranslit: boolean; onWords: (keys: string[]) => void }) {
  const mine = m.direction === 'tr2eg';
  return (
    <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>
      {mine ? (
        <>
          <div className="b-src">{m.tr}</div>
          {/* Karşındakine gösterilecek metin: büyük Arapça */}
          <div className="b-main ar-line"><ArabicText text={m.ar} size={32} /></div>
          {showTranslit && m.translit && <div className="b-translit">{m.translit}</div>}
        </>
      ) : (
        <>
          <div className="b-main b-tr">{m.tr}</div>
          <div className="b-src b-ar">
            <ArabicText text={m.ar} size={22} />
            {showTranslit && m.translit && <span className="b-translit"> · {m.translit}</span>}
          </div>
        </>
      )}
      {(m.confidence !== 'high' || m.notes || m.newWordKeys.length > 0) && (
        <div className="b-meta">
          {m.confidence === 'low' && <span className="badge warn">{trChat.uncertain}</span>}
          {m.confidence === 'medium' && <span className="badge">{trChat.mediumConf}</span>}
          {m.notes && <span className="b-note">{m.notes}</span>}
          {m.newWordKeys.length > 0 && (
            <button className="chip-btn" onClick={() => onWords(m.newWordKeys)}>{trChat.newWords(m.newWordKeys.length)}</button>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const messages = useChatStore((s) => s.messages);
  const vocab = useChatStore((s) => s.vocab);
  const busy = useChatStore((s) => s.busy);
  const error = useChatStore((s) => s.error);
  const send = useChatStore((s) => s.send);
  const dismissError = useChatStore((s) => s.dismissError);
  const proxyUrl = useSettingsStore((s) => s.settings.chatProxyUrl);
  const consent = useSettingsStore((s) => s.settings.chatConsent);
  const update = useSettingsStore((s) => s.update);
  const showTranslit = useShowTranslit();

  const [direction, setDirection] = useState<ChatDirection>('tr2eg');
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState<string[] | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, busy]);

  const ready = !!proxyUrl.trim() && consent;
  const submit = async () => {
    if (!text.trim() || busy || !ready) return;
    // Başarısızlıkta metin korunur (yeniden denenebilir), başarıda temizlenir.
    if (await send(direction, text)) setText('');
  };

  return (
    <div className="chat">
      <div className="chat-top">
        <div>
          <strong>{trChat.title}</strong>
          <div className="muted small">{trChat.subtitle}</div>
        </div>
        <button onClick={() => setSheet([])} aria-label={trChat.vocabButton(vocab.length)}>
          {trChat.vocabButton(vocab.length)}
        </button>
      </div>

      {!proxyUrl.trim() && (
        <div className="zone">
          <h2>{trChat.setupTitle}</h2>
          <p className="note">{trChat.setupBody}</p>
          <button className="primary" onClick={onOpenSettings}>{trChat.setupButton}</button>
        </div>
      )}
      {!!proxyUrl.trim() && !consent && (
        <div className="zone">
          <h2>{trChat.consentTitle}</h2>
          <p className="note">{trChat.consentBody}</p>
          <button className="primary" onClick={() => update({ chatConsent: true })}>{trChat.consentButton}</button>
        </div>
      )}

      <div className="chat-list" role="log" aria-live="polite">
        {messages.length === 0 && ready && <p className="note chat-empty">{trChat.empty}</p>}
        {messages.map((m) => (
          <Bubble key={m.id} m={m} showTranslit={showTranslit} onWords={setSheet} />
        ))}
        {busy && <div className={`bubble pending ${direction === 'tr2eg' ? 'mine' : 'theirs'}`}>{trChat.translating}</div>}
        {error && (
          <div className="bubble error" role="alert">
            {trChat.errors[error.code] ?? error.message}
            <button className="chip-btn" onClick={dismissError}>✕</button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input">
        <div className="seg" role="group" aria-label="Kim konuşuyor">
          {(['tr2eg', 'eg2tr'] as ChatDirection[]).map((d) => (
            <button key={d} aria-pressed={direction === d} className={direction === d ? 'active' : ''} onClick={() => setDirection(d)}>
              {d === 'tr2eg' ? trChat.me : trChat.them}
              <small className="block muted">{d === 'tr2eg' ? trChat.meHint : trChat.themHint}</small>
            </button>
          ))}
        </div>
        <div className="chat-compose">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={direction === 'tr2eg' ? trChat.placeholderMe : trChat.placeholderThem}
            dir="auto"
            rows={2}
            maxLength={600}
            disabled={!ready}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button className="primary" onClick={() => void submit()} disabled={!ready || busy || !text.trim()}>
            {busy ? '…' : trChat.send}
          </button>
        </div>
      </div>

      {sheet && <VocabSheet highlight={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
