import { useMemo, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { allContentItems } from '../../lib/content';
import { copyIssuesDeep } from '../../lib/copyRules';
import { AREAS, AREA_LABELS } from '../../lib/options';
import { PLACEHOLDERS } from '../../lib/template';
import type { ContentTable } from '../../lib/types';

const TABLES: { key: ContentTable; label: string }[] = [
  { key: 'prompts', label: 'Prompt cards' },
  { key: 'library_items', label: 'Library items' },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'sections', label: 'Sections (advanced)' },
];

type FieldSpec = { key: string; label: string; kind: 'text' | 'area' | 'date' | 'list' | 'select'; rows?: number; options?: { value: string; label: string }[] };

const FORMS: Partial<Record<ContentTable, FieldSpec[]>> = {
  prompts: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'when', label: 'When to use this (one line)', kind: 'text' },
    { key: 'context', label: 'C: Context', kind: 'area', rows: 5 },
    { key: 'role', label: 'R: Role', kind: 'area', rows: 3 },
    { key: 'interview', label: 'I: Interview', kind: 'area', rows: 4 },
    { key: 'task', label: 'T: Task', kind: 'area', rows: 5 },
  ],
  library_items: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'category', label: 'Category', kind: 'text' },
    { key: 'summary', label: 'Summary (one line)', kind: 'text' },
    { key: 'as_of', label: 'As of', kind: 'date' },
    { key: 'changelog', label: 'Changelog line', kind: 'text' },
    { key: 'body', label: 'Body (## heading, - bullet, 1. numbered, **bold**)', kind: 'area', rows: 16 },
  ],
  suggestions: [
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'area', label: 'Area', kind: 'select', options: AREAS.map((a) => ({ value: a, label: AREA_LABELS[a] })) },
    { key: 'description', label: 'Description', kind: 'area', rows: 2 },
    { key: 'industries', label: 'Industries (comma separated, blank for all)', kind: 'list' },
    { key: 'roles', label: 'Roles (comma separated, blank for all)', kind: 'list' },
  ],
};

const today = () => new Date().toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

export function ContentTab() {
  const { backend, contentRows, refreshContent } = useApp();
  const [table, setTable] = useState<ContentTable>('prompts');
  const [editing, setEditing] = useState<any | null>(null);
  const [msg, setMsg] = useState('');
  const items = useMemo(() => allContentItems(table, contentRows[table] ?? []), [table, contentRows]);

  const startNew = () => {
    const base =
      table === 'library_items'
        ? { title: '', category: 'Reference', summary: '', body: '', changelog: 'New item.', as_of: today() }
        : table === 'suggestions'
          ? { name: '', area: 'communication', description: '', industries: [], roles: [] }
          : null;
    if (base) setEditing({ ...base, key: '', version: 0, _new: true });
  };

  return (
    <>
      {msg && (
        <p className="notice ok" role="status">
          {msg}
        </p>
      )}
      <div className="tabs" role="tablist" aria-label="Content type">
        {TABLES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={table === t.key}
            onClick={() => {
              setTable(t.key);
              setEditing(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {editing ? (
        <Editor
          table={table}
          item={editing}
          onCancel={() => setEditing(null)}
          onSave={async (row) => {
            await backend.saveContentRow(table, row);
            await refreshContent();
            setEditing(null);
            setMsg(`Saved "${row.data.title ?? row.data.name ?? row.key}" as version ${row.version}. Attendees get it on their next load.`);
          }}
        />
      ) : (
        <section className="card">
          <div className="row">
            <p className="small muted grow" style={{ margin: 0 }}>
              Items marked "Edited" override the built-in version. Retired items are hidden from attendees.
            </p>
            {(table === 'library_items' || table === 'suggestions') && (
              <button type="button" className="btn small" onClick={startNew}>
                + New
              </button>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Version</th>
                  <th>As of</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.key}>
                    <td>
                      <strong>{i.title ?? i.name}</strong>
                      <div className="small muted">{i.key}</div>
                    </td>
                    <td>{i.version}</td>
                    <td>{i.as_of}</td>
                    <td>
                      {i.retired ? <span className="pill warn">Retired</span> : i._source === 'edited' ? <span className="pill">Edited</span> : <span className="pill done">Built-in</span>}
                    </td>
                    <td>
                      <button type="button" className="btn small secondary" onClick={() => setEditing(i)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Editor({
  table,
  item,
  onCancel,
  onSave,
}: {
  table: ContentTable;
  item: any;
  onCancel: () => void;
  onSave: (row: { key: string; data: any; version: number; as_of: string; retired: boolean }) => Promise<void>;
}) {
  const strip = ({ _source, _new, key, version, as_of, retired, ...rest }: any) => rest;
  const [draft, setDraft] = useState<any>(strip(item));
  const [json, setJson] = useState(() => JSON.stringify(strip(item), null, 2));
  const [key, setKey] = useState<string>(item.key);
  const [asOf, setAsOf] = useState<string>(item.as_of ?? today());
  const [retired, setRetired] = useState<boolean>(!!item.retired);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const form = FORMS[table];

  const data = useMemo(() => {
    if (form) return draft;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [form, draft, json]);
  const issues = data ? copyIssuesDeep(data) : [];

  const save = async () => {
    setErr('');
    if (!data) return setErr('The JSON is not valid. Check for a missing comma or quote.');
    if (issues.length) return setErr('Fix the copy issues listed above before saving.');
    const finalKey = key || slug(data.title ?? data.name ?? '');
    if (!finalKey) return setErr('Give it a title first.');
    setBusy(true);
    try {
      await onSave({
        key: finalKey,
        data: table === 'library_items' ? { ...data, as_of: undefined } : data,
        version: (item.version ?? 0) + 1,
        as_of: table === 'library_items' ? asOf : today(),
        retired,
      });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>{item._new ? 'New item' : `Edit ${item.title ?? item.name ?? item.key}`}</h2>
      <p className="small muted">
        Saving creates version {(item.version ?? 0) + 1}. {table === 'prompts' && 'Attendees who copy it from now on are recorded against the new version.'}
      </p>
      {item._new && (
        <div className="field">
          <label htmlFor="new-key">Key (leave blank to make one from the title)</label>
          <input id="new-key" type="text" value={key} onChange={(e) => setKey(slug(e.target.value))} />
        </div>
      )}

      {form ? (
        form.map((f) => {
          const id = `ed-${f.key}`;
          const v = f.key === 'as_of' ? asOf : draft[f.key];
          const set = (val: any) => (f.key === 'as_of' ? setAsOf(val) : setDraft({ ...draft, [f.key]: val }));
          return (
            <div className="field" key={f.key}>
              <label htmlFor={id}>{f.label}</label>
              {f.kind === 'area' ? (
                <textarea id={id} rows={f.rows} value={v ?? ''} onChange={(e) => set(e.target.value)} />
              ) : f.kind === 'select' ? (
                <select id={id} value={v ?? ''} onChange={(e) => set(e.target.value)}>
                  {f.options!.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.kind === 'list' ? (
                <input
                  id={id}
                  type="text"
                  value={(v ?? []).join(', ')}
                  onChange={(e) =>
                    set(
                      e.target.value
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean),
                    )
                  }
                />
              ) : (
                <input id={id} type={f.kind === 'date' ? 'date' : 'text'} value={v ?? ''} onChange={(e) => set(e.target.value)} />
              )}
            </div>
          );
        })
      ) : (
        <div className="field">
          <label htmlFor="ed-json">Section JSON</label>
          <p className="help">
            Block types: text, callout, prompt, field, companion, crit-example, self-assessment, suggestions, use-cases,
            pilot-picker, list-composer, tools-seen, tool-compare, plan, plan-composer, closing-links.
          </p>
          <textarea id="ed-json" className="code" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
        </div>
      )}

      {table === 'prompts' && (
        <details className="small" style={{ marginBottom: 12 }}>
          <summary>Variables you can use</summary>
          <p>
            {Object.keys(PLACEHOLDERS)
              .map((k) => `{{${k}}}`)
              .join('  ')}
          </p>
        </details>
      )}

      <label className="check">
        <input type="checkbox" checked={retired} onChange={(e) => setRetired(e.target.checked)} />
        <span>Retired (hide from attendees)</span>
      </label>

      {issues.length > 0 && (
        <div className="notice err" role="alert">
          <strong>Copy standards:</strong>
          <ul>
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      )}
      {err && <p className="notice err">{err}</p>}
      <div className="row">
        <button type="button" className="btn" disabled={busy} onClick={save}>
          {busy ? 'Saving' : 'Save'}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
