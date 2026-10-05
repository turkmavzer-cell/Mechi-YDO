import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AlignRow, ArPerson, ConjTable, ConjTense } from '../../types';
import type { LibraryRepo } from '../../core/library/repo';
import { tr } from '../../core/i18n/tr';
import { useSettingsStore, useTranslitPrefs } from '../../core/settings/store';
import { translitAr } from '../../core/translit/index.ts';
import { DUAL, FEMININE_ONLY, IMP_PERSONS, PERSONS, PERSON_LABEL, PRONOUN_AR } from '../../core/verbs/persons';
import { cellTranslit } from '../../core/verbs/translit';
import { findUsedForm } from '../../core/verbs/usage';
import { ArabicText } from './ArabicText';

interface Props {
  row: AlignRow;
  repo: LibraryRepo;
  onClose: () => void;
}

type Tab = 'past' | 'present' | 'future' | 'imperative';
type Voice = 'active' | 'passive';

const FORM_PATTERN: Record<string, string> = {
  I: 'فَعَلَ', II: 'فَعَّلَ', III: 'فَاعَلَ', IV: 'أَفْعَلَ', V: 'تَفَعَّلَ', VI: 'تَفَاعَلَ',
  VII: 'اِنْفَعَلَ', VIII: 'اِفْتَعَلَ', IX: 'اِفْعَلَّ', X: 'اِسْتَفْعَلَ',
};

const SWIPE_CLOSE_PX = 80;

/**
 * Fiil penceresi: Türkçe mastardan başlar, tüm zamanları 13 şahısla gösterir.
 * <dialog> + showModal(): odak tuzağı, Esc ve (destekleyen tarayıcıda) dışarı dokunma ile kapanma yerleşik.
 */
export function VerbModal({ row, repo, onClose }: Props) {
  const s = useSettingsStore((st) => st.settings);
  const update = useSettingsStore((st) => st.update);
  const prefs = useTranslitPrefs();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragStart = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const lemma = row.lemma ?? '';
  const verb = repo.findVerb(lemma);
  const conj = repo.findConjugations(lemma);
  const used = useMemo(
    () => (conj && row.tense !== 'masdar' ? findUsedForm(row, conj, s.addressGender) : undefined),
    [conj, row, s.addressGender],
  );
  const example = useMemo(() => repo.exampleFor(lemma), [repo, lemma]);

  const allTabs: Tab[] = ['past', 'present', 'future', 'imperative'];
  const enabledTabs = allTabs.filter(
    (t) => ({ past: s.verbShowPast, present: s.verbShowPresent, future: s.verbShowFuture, imperative: s.verbShowImperative })[t],
  );
  // Hepsi kapatılmışsa boş pencere yerine tüm zamanlar gösterilir.
  const visibleTabs = enabledTabs.length ? enabledTabs : allTabs;
  const usedTab: Tab | undefined = used ? (used.tense === 'futureSawfa' ? 'future' : (used.tense as Tab)) : undefined;
  const [tabState, setTab] = useState<Tab>(() =>
    usedTab && visibleTabs.includes(usedTab) ? usedTab : visibleTabs[0] ?? 'past',
  );
  const [voice, setVoice] = useState<Voice>(used?.voice === 'passive' && s.verbShowPassive ? 'passive' : 'active');

  useLayoutEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onDialogClose = () => onClose();
    d.addEventListener('close', onDialogClose);
    // closedby="any" desteklemeyen tarayıcılar için: arka plana dokununca kapat.
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

  // `close` olayı kuyruğa alınır (sayfa arka plandayken gecikebilir); X/kaydırma doğrudan kapatır.
  // Dışarı dokunma, Esc ve Android geri hareketi yalnızca `close` olayıyla gelir.
  const close = () => {
    dialogRef.current?.close();
    onClose();
  };

  // Aşağı kaydırarak kapatma (tutamaç / başlık alanından).
  const onTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - dragStart.current));
  };
  const onTouchEnd = () => {
    if (dragY > SWIPE_CLOSE_PX) close();
    dragStart.current = null;
    setDragY(0);
  };

  const hasPassive = !!conj?.passive && s.verbShowPassive;
  const activeVoice: Voice = hasPassive ? voice : 'active';
  // Edilgen yalnızca geçmiş ve geniş/şimdiki zamanda gösterilir; seçili sekme gösterilemiyorsa ilk uygun sekme.
  const tabsShown = activeVoice === 'passive' ? visibleTabs.filter((t) => t === 'past' || t === 'present') : visibleTabs;
  const tab: Tab = tabsShown.includes(tabState) ? tabState : tabsShown[0] ?? 'past';

  let table: ConjTable | undefined;
  let tense: ConjTense = tab;
  if (conj) {
    if (activeVoice === 'passive') {
      table = conj.passive?.[tab as 'past' | 'present'];
    } else if (tab === 'future') {
      tense = s.futureParticle === 'sawfa' ? 'futureSawfa' : 'future';
      table = conj.active[tense];
    } else {
      table = conj.active[tab];
    }
  }

  const persons = (tab === 'imperative' ? IMP_PERSONS : PERSONS).filter(
    (p) => (s.verbShowDual || !DUAL.has(p)) && (s.verbGenderSplit || !FEMININE_ONLY.has(p)),
  );
  const isUsed = (p: ArPerson) => {
    if (!s.verbMarkUsed || !used || used.voice !== activeVoice) return false;
    const sameTab = used.tense === tense || (tab === 'future' && (used.tense === 'future' || used.tense === 'futureSawfa'));
    return sameTab && used.persons.includes(p);
  };
  const L = tr.verb;
  const label = (p: ArPerson) => PERSON_LABEL[p][s.verbGenderSplit ? 0 : 1];
  const sheetStyle = dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="verb-sheet"
      // React henüz closedby özniteliğini tanımıyor; küçük harfle doğrudan DOM'a geçer.
      {...{ closedby: 'any' }}
      aria-labelledby="verb-title"
      style={sheetStyle}
    >
      {/* ::backdrop özel özellik miras almayabilir (eski WebView); bulanıklık doğrudan yazılır. */}
      <style>{`.verb-sheet::backdrop{-webkit-backdrop-filter:blur(${s.verbBlur}px);backdrop-filter:blur(${s.verbBlur}px)}`}</style>
      <div className="sheet-grip" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <span aria-hidden="true" />
      </div>
      <header className="verb-head" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div>
          <h2 id="verb-title">{lemma}</h2>
          {row.tr !== lemma && <p className="muted small">{row.tr} → {lemma}</p>}
        </div>
        {verb && (
          <div className="verb-lemma">
            <ArabicText text={verb.ar} size={34} />
            {prefs && <div className="translit">{translitAr(verb.ar, { ...prefs, irab: true })}</div>}
          </div>
        )}
        <button className="icon-btn" onClick={close} aria-label={L.close}>✕</button>
      </header>

      {verb && s.verbShowMeta && (
        <dl className="verb-meta">
          <div className={row.tense === 'masdar' && s.verbMarkUsed ? 'used' : ''}>
            <dt>{L.masdar}</dt>
            <dd>
              <ArabicText text={verb.masdar} size={22} />
              {prefs && <span className="translit"> {translitAr(verb.masdar, prefs)}</span>}
            </dd>
          </div>
          <div>
            <dt>{L.root}</dt>
            <dd><ArabicText text={verb.root.split(' ').join(' - ')} size={22} /></dd>
          </div>
          <div>
            <dt>{L.form}</dt>
            <dd>{verb.form} <ArabicText text={FORM_PATTERN[verb.form] ?? ''} size={20} /></dd>
          </div>
          <div>
            <dt>{L.type}</dt>
            <dd>{L.types[verb.type] ?? verb.type} · {verb.transitive ? L.transitive : L.intransitive}</dd>
          </div>
        </dl>
      )}
      {row.tense === 'masdar' && s.verbMarkUsed && <p className="note">{L.usedMasdar}</p>}

      {!conj ? (
        <p className="note">{L.noTable}</p>
      ) : (
        <>
          <div className="seg" role="tablist" aria-label="Zaman">
            {tabsShown.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {L.tenses[t]}
                {usedTab === t && s.verbMarkUsed && <span className="dot" aria-label={L.usedHere} />}
              </button>
            ))}
          </div>
          <div className="seg-row">
            {hasPassive && (
              <div className="seg small" role="group" aria-label="Çatı">
                {(['active', 'passive'] as Voice[]).map((v) => (
                  <button key={v} aria-pressed={activeVoice === v} className={activeVoice === v ? 'active' : ''} onClick={() => setVoice(v)}>
                    {v === 'active' ? L.active : L.passive}
                  </button>
                ))}
              </div>
            )}
            {tab === 'future' && activeVoice === 'active' && (
              <div className="seg small" role="group" aria-label="Gelecek eki">
                {(['sa', 'sawfa'] as const).map((f) => (
                  <button key={f} aria-pressed={s.futureParticle === f} className={s.futureParticle === f ? 'active' : ''}
                    onClick={() => update({ futureParticle: f })}>
                    <span className="arabic" dir="rtl" lang="ar">{f === 'sa' ? 'سَـ' : 'سَوْفَ'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {table ? (
            <table className="conj-table">
              <caption className="sr-only">{L.tenses[tab]} — {activeVoice === 'active' ? L.active : L.passive}</caption>
              <thead>
                <tr>
                  <th>{L.colPerson}</th>
                  <th>{L.colAr}</th>
                  {prefs && <th>{L.colTranslit}</th>}
                  {activeVoice === 'active' && <th>{L.colTr}</th>}
                </tr>
              </thead>
              <tbody>
                {persons.map((p) => {
                  const c = table[p];
                  if (!c) return null;
                  const u = isUsed(p);
                  return (
                    <tr key={p} className={u ? 'used' : ''}>
                      <td>
                        {label(p)}
                        <span className="pronoun"><ArabicText text={PRONOUN_AR[p]} size={16} /></span>
                        {u && <span className="badge used-badge">{L.usedHere}</span>}
                      </td>
                      <td className="ar-cell">
                        <ArabicText text={c.ar} size={26} />
                        {c.alt && <small className="muted block" title={L.alt}>{c.alt.map((a) => <ArabicText key={a} text={a} size={16} />)}</small>}
                      </td>
                      {prefs && <td className="translit">{cellTranslit(c, tense, prefs)}</td>}
                      {activeVoice === 'active' && <td className="muted">{c.tr ?? ''}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="note">{L.passiveNote}</p>
          )}
          {used && !used.exact && s.verbMarkUsed && <p className="note">{L.usedGuess}</p>}
        </>
      )}

      {example && (
        <div className="verb-example">
          <h3>{L.example}</h3>
          <p>{example.tr}</p>
          <ArabicText text={example.ar} size={24} />
          {prefs && (
            <div className="translit">
              {prefs.style === 'simple' && !prefs.irab ? example.translit : translitAr(example.ar, prefs)}
            </div>
          )}
        </div>
      )}

      <footer className="verb-foot muted">
        {conj && <p>{L.attribution}</p>}
        {verb && !verb.verified && <p className="warn-text">{L.unverifiedNote}</p>}
      </footer>
    </dialog>
  );
}
