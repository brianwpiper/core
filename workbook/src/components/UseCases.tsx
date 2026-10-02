import { useId, useState } from 'react';
import { useApp, useData } from '../app/AppContext';
import { useUi } from '../app/UiContext';
import { AREAS, AREA_LABELS } from '../lib/options';
import { baselineText, sortedUseCases } from '../lib/template';
import type { Area, UseCase } from '../lib/types';
import { NumberInput, Scale, TextInput } from './Field';

type Draft = Partial<UseCase> & { name: string };

export function UseCaseForm({
  initial,
  sourceSection,
  showRatings = true,
  onDone,
}: {
  initial?: UseCase;
  sourceSection?: string;
  showRatings?: boolean;
  onDone: (id?: string) => void;
}) {
  const { store } = useApp();
  const [d, setD] = useState<Draft>(initial ?? { name: '', area: null, source_section: sourceSection ?? null });
  const [error, setError] = useState('');
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const areaId = useId();
  const name = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) {
      setError('Give it a short name.');
      return;
    }
    const id = store.saveUseCase({ ...d, name: d.name.trim() });
    onDone(id);
  };

  return (
    <form onSubmit={submit} className="stack" noValidate>
      {error && (
        <p className="notice err" role="alert">
          {error}
        </p>
      )}
      <TextInput label="Short name" value={d.name} onChange={(v) => set({ name: v })} max={120} required placeholder="For example: Reply to quote requests" />
      <div className="field">
        <label htmlFor={areaId}>Area</label>
        <select id={areaId} value={d.area ?? ''} onChange={(e) => set({ area: (e.target.value || null) as Area | null })}>
          <option value="">Choose one</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>
      </div>
      <TextInput label="One-line description" value={d.description ?? ''} onChange={(v) => set({ description: v })} max={300} />
      {showRatings && (
        <>
          <Scale name={`${name}-impact`} label="Impact if it works" value={d.impact} onChange={(v) => set({ impact: v })} />
          <Scale name={`${name}-effort`} label="Effort to set up" value={d.effort} onChange={(v) => set({ effort: v })} />
          <Scale name={`${name}-risk`} label="Risk if it goes wrong" value={d.risk} onChange={(v) => set({ risk: v })} />
          <div className="grid-2">
            <NumberInput label="Today (number)" value={d.current_value ?? null} onChange={(v) => set({ current_value: v })} placeholder="6" />
            <NumberInput label="Target (number)" value={d.target_value ?? null} onChange={(v) => set({ target_value: v })} placeholder="2" />
          </div>
          <TextInput label="Unit" value={d.unit ?? ''} onChange={(v) => set({ unit: v })} max={40} placeholder="hours per week" />
        </>
      )}
      <div className="row">
        <button className="btn" type="submit">
          {initial ? 'Save changes' : 'Add to my list'}
        </button>
        <button className="btn ghost" type="button" onClick={() => onDone()}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function UseCaseItem({ u, showRatings = true }: { u: UseCase; showRatings?: boolean }) {
  const { store } = useApp();
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div className="uc">
        <UseCaseForm initial={u} showRatings={showRatings} onDone={() => setEditing(false)} />
      </div>
    );
  }
  const base = baselineText(u);
  return (
    <div className="uc">
      <div className="uc-head">
        <div className="uc-name">
          {u.name}
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            {u.area && <span className="pill">{AREA_LABELS[u.area]}</span>}
            {u.is_suggested && <span className="pill warn">Suggested</span>}
          </div>
        </div>
        <button
          type="button"
          className="star"
          aria-pressed={u.is_pilot_candidate}
          aria-label={u.is_pilot_candidate ? `Unstar ${u.name} as a pilot candidate` : `Star ${u.name} as a pilot candidate`}
          onClick={() => store.saveUseCase({ ...u, is_pilot_candidate: !u.is_pilot_candidate })}
        >
          {u.is_pilot_candidate ? '★' : '☆'}
        </button>
      </div>
      {u.description && <p className="small" style={{ margin: '6px 0' }}>{u.description}</p>}
      <p className="uc-meta" style={{ margin: 0 }}>
        {[u.impact && `Impact ${u.impact}`, u.effort && `Effort ${u.effort}`, u.risk && `Risk ${u.risk}`].filter(Boolean).join(' · ') ||
          (showRatings ? 'Not rated yet' : '')}
        {base && <> {' · '} {base}</>}
      </p>
      <div className="row" style={{ marginTop: 6 }}>
        <button type="button" className="btn ghost small" onClick={() => setEditing(true)}>
          {showRatings && !u.impact ? 'Rate and edit' : 'Edit'}
        </button>
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            if (confirm(`Remove "${u.name}" from your list?`)) store.deleteUseCase(u.id);
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function UseCaseList({ mode = 'rate', section }: { mode?: 'brief' | 'rate'; section?: string }) {
  const data = useData();
  const list = sortedUseCases(data);
  const [adding, setAdding] = useState(false);
  const showRatings = mode === 'rate';
  return (
    <section className="card" aria-labelledby="uc-list-h">
      <h3 id="uc-list-h">My use case list ({list.length})</h3>
      <p className="small muted">
        {showRatings
          ? 'Rate each idea from 1 to 5 and add a number for how it works today. Tap the star on any you would consider as a pilot.'
          : 'Add the ideas that stand out. You will rate them in Workshop 1. Your list follows you through every section.'}
      </p>
      {list.length === 0 && <p className="muted">Nothing here yet.</p>}
      {list.map((u) => (
        <UseCaseItem key={u.id} u={u} showRatings={showRatings} />
      ))}
      {adding ? (
        <div className="uc">
          <UseCaseForm sourceSection={section} showRatings={showRatings} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button type="button" className="btn secondary" onClick={() => setAdding(true)}>
          + Add a use case
        </button>
      )}
    </section>
  );
}

export function UseCaseDrawer() {
  const { drawerOpen, closeDrawer, currentSection } = useUi();
  const data = useData();
  const list = sortedUseCases(data);
  const [adding, setAdding] = useState(false);
  if (!drawerOpen) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={closeDrawer} />
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-h" onKeyDown={(e) => e.key === 'Escape' && closeDrawer()}>
        <div className="drawer-head">
          <h2 id="drawer-h">My use cases ({list.length})</h2>
          <button type="button" className="header-btn" style={{ marginLeft: 'auto' }} onClick={closeDrawer} autoFocus>
            Close
          </button>
        </div>
        <div className="drawer-body">
          {adding ? (
            <div className="uc">
              <UseCaseForm sourceSection={currentSection ?? undefined} onDone={() => setAdding(false)} />
            </div>
          ) : (
            <button type="button" className="btn big" onClick={() => setAdding(true)} style={{ marginBottom: 14 }}>
              + Add a use case
            </button>
          )}
          {list.length === 0 && <p className="muted">Your running list of AI ideas lives here. Add one any time.</p>}
          {list.map((u) => (
            <UseCaseItem key={u.id} u={u} />
          ))}
        </div>
      </div>
    </>
  );
}
