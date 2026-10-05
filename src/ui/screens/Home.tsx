import { useMemo, useState } from 'react';
import { createSeedRepo } from '../../core/library/seed';
import { translate } from '../../core/translation/orchestrator';
import { normTr } from '../../core/tokenizer/normalize';
import { tr } from '../../core/i18n/tr';
import { useShowTranslit, useSettingsStore } from '../../core/settings/store';
import type { AlignRow, TranslationResult } from '../../types';
import { ArabicText } from '../components/ArabicText';
import { WordTable } from '../components/WordTable';

const sourceLabel = { library: tr.sourceLibrary, online: tr.sourceOnline, offline_model: tr.sourceOffline };

/** Üst metin: kullanıcının yazdığı kelimeler; fiiller (varsa) yanıp söner. */
function SourceText({ text, rows, onVerbTap }: { text: string; rows: AlignRow[]; onVerbTap: (r: AlignRow) => void }) {
  const pulse = useSettingsStore((s) => s.settings.pulseVerbs);
  const fontSize = useSettingsStore((s) => s.settings.turkishFontSize);
  const verbs = new Map<string, AlignRow>();
  for (const r of rows) if (r.verb) verbs.set(normTr(r.tr), r);
  const parts = text.split(/(\s+)/);
  return (
    <p className="source-text" style={{ fontSize }}>
      {parts.map((p, i) => {
        const row = verbs.get(normTr(p));
        if (!row) return <span key={i}>{p}</span>;
        return (
          <button key={i} className={`verb-chip ${pulse ? 'pulse' : ''}`} onClick={() => onVerbTap(row)}>
            {p}
          </button>
        );
      })}
    </p>
  );
}

export function Home() {
  const repo = useMemo(() => createSeedRepo(), []);
  const addressGender = useSettingsStore((s) => s.settings.addressGender);
  const showTranslit = useShowTranslit();
  const showBadge = useSettingsStore((s) => s.settings.showSourceBadge);
  const markUnverified = useSettingsStore((s) => s.settings.markUnverified);
  const [text, setText] = useState('');
  const [shown, setShown] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [toast, setToast] = useState('');

  const run = () => {
    const input = text.trim();
    if (!input) return;
    setShown(input);
    setResult(translate(input, repo, { addressGender }));
  };

  const onVerbTap = () => {
    setToast(tr.verbTapSoon);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="home">
      <div className="input-card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr.inputPlaceholder}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
        />
        <div className="btn-row">
          <button className="primary" onClick={run}>{tr.translate}</button>
          <button
            onClick={() => {
              setText('');
              setShown('');
              setResult(null);
            }}
          >
            {tr.clear}
          </button>
        </div>
      </div>

      {result && (
        <section className="result" aria-live="polite">
          {/* 1) Üst alan: Türkçe metin */}
          <div className="zone zone-top">
            <h2>{tr.yourText}</h2>
            <SourceText text={shown} rows={result.rows} onVerbTap={onVerbTap} />
          </div>

          {/* 2) Orta alan: Arapça çeviri (+ okunuş) */}
          <div className={`zone zone-mid ${markUnverified && !result.verified && result.arabic ? 'unverified' : ''}`}>
            <h2>
              {tr.arabicTranslation}
              {showBadge && result.arabic && (
                <span className="badge">{sourceLabel[result.source]}</span>
              )}
              {result.arabic && !result.verified && <span className="badge warn">{tr.unverified}</span>}
            </h2>
            {result.arabic ? (
              <>
                <div className="ar-line">
                  <ArabicText text={result.arabic} />
                </div>
                {showTranslit && <div className="translit-line">{result.translit}</div>}
                {result.matchKind === 'word-by-word' && <p className="note">{tr.partialMatch}</p>}
              </>
            ) : (
              <p className="note">{tr.notInLibrary}</p>
            )}
            {result.missingWords.length > 0 && result.arabic && (
              <p className="note">Bulunamayan: {result.missingWords.join(', ')}</p>
            )}
          </div>

          {/* 3) Alt pencere: kelime tablosu */}
          <div className="zone zone-bottom">
            <h2>{tr.wordTable}</h2>
            <WordTable rows={result.rows} onVerbTap={onVerbTap} />
          </div>
        </section>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
