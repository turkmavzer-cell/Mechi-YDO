import type { AlignRow } from '../../types';
import { tr } from '../../core/i18n/tr';
import { useShowTranslit, useSettingsStore } from '../../core/settings/store';
import { ArabicText } from './ArabicText';

interface Props {
  rows: AlignRow[];
  onVerbTap: (row: AlignRow) => void;
}

export function WordTable({ rows, onVerbTap }: Props) {
  const showTranslit = useShowTranslit();
  const pulse = useSettingsStore((s) => s.settings.pulseVerbs);
  if (rows.length === 0) return null;
  return (
    <table className="word-table">
      <thead>
        <tr>
          <th>{tr.colTr}</th>
          <th>{tr.colAr}</th>
          {showTranslit && <th>{tr.colTranslit}</th>}
          <th>{tr.colPos}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const isVerb = !!r.verb;
          return (
            <tr
              key={i}
              className={isVerb ? `verb-row ${pulse ? 'pulse' : ''}` : ''}
              onClick={isVerb ? () => onVerbTap(r) : undefined}
            >
              <td>
                {r.uncertain && <span className="tilde" title="Emin değil">~</span>}
                {r.tr}
              </td>
              <td>{r.ar ? <ArabicText text={r.ar} size={26} /> : <span className="muted">—</span>}</td>
              {showTranslit && <td className="translit">{r.translit}</td>}
              <td className="muted">{tr.pos[r.pos] ?? r.pos}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
