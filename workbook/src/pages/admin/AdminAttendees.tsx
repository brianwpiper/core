import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useApp } from '../../app/AppContext';
import type { AdminAttendee, ImportResult, ImportRow } from '../../lib/backend';

export function AttendeesTab({ initialSearch = '' }: { initialSearch?: string }) {
  const { backend } = useApp();
  const [list, setList] = useState<AdminAttendee[] | null>(null);
  const [q, setQ] = useState(initialSearch);
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState({ email: '', first_name: '', organization: '' });

  const load = () =>
    backend
      .listAttendees()
      .then(setList)
      .catch((e) => setMsg(e.message));
  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list ?? []).filter(
      (a) =>
        !needle ||
        [a.email, a.first_name, a.last_name, a.organization].some((v) => v?.toLowerCase().includes(needle)),
    );
  }, [list, q]);

  const changeEmail = async (a: AdminAttendee) => {
    const next = prompt(`New login email for ${a.first_name ?? a.email}:`, a.email);
    if (!next || next.trim().toLowerCase() === a.email) return;
    try {
      await backend.changeEmail(a.user_id, next);
      setMsg(`Email changed to ${next}. They can log in with it now.`);
      load();
    } catch (e) {
      setMsg(`Could not change email: ${(e as Error).message}`);
    }
  };

  const toggleRole = async (a: AdminAttendee, role: 'facilitator' | 'admin') => {
    const on = !a.roles.includes(role);
    if (role === 'admin' && on && !confirm(`Give ${a.email} full admin access?`)) return;
    await backend.setRole(a.user_id, role, on);
    load();
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await backend.importAttendees([adding]);
      setMsg(r.errors.length ? r.errors.join(' ') : r.created ? `Added ${adding.email}.` : `${adding.email} already had an account; details updated.`);
      setAdding({ email: '', first_name: '', organization: '' });
      load();
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  const loggedIn = (list ?? []).filter((a) => a.onboarded_at).length;

  return (
    <>
      {msg && (
        <p className="notice info" role="status">
          {msg}
        </p>
      )}
      <section className="card">
        <div className="row">
          <h2 className="grow" style={{ margin: 0 }}>
            Attendees {list && <span className="muted small">({list.length} accounts, {loggedIn} set up)</span>}
          </h2>
          <button type="button" className="btn secondary small" onClick={load}>
            Refresh
          </button>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="att-search">Search by email, name, or organization</label>
          <input id="att-search" type="text" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!list && <p>Loading</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Organization</th>
                <th>Attending</th>
                <th>Set up</th>
                <th>Roles</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 200).map((a) => (
                <tr key={a.user_id}>
                  <td>{a.email}</td>
                  <td>{[a.first_name, a.last_name].filter(Boolean).join(' ')}</td>
                  <td>{a.organization}</td>
                  <td>{a.attendance_type === 'virtual' ? 'Virtual' : a.attendance_type === 'in_person' ? 'In person' : ''}</td>
                  <td>{a.onboarded_at ? 'Yes' : 'No'}</td>
                  <td>
                    <label className="check small">
                      <input type="checkbox" checked={a.roles.includes('facilitator')} onChange={() => toggleRole(a, 'facilitator')} />
                      <span>Facilitator</span>
                    </label>
                    <label className="check small">
                      <input type="checkbox" checked={a.roles.includes('admin')} onChange={() => toggleRole(a, 'admin')} />
                      <span>Admin</span>
                    </label>
                  </td>
                  <td>
                    <button type="button" className="btn small secondary" onClick={() => changeEmail(a)}>
                      Change email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length > 200 && <p className="small muted">Showing 200 of {shown.length}. Search to narrow down.</p>}
        </div>
      </section>

      <form className="card" onSubmit={add}>
        <h2>Add one attendee</h2>
        <p className="small muted">For walk-ins and late registrations. They can log in right away.</p>
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="field">
            <label htmlFor="add-email">Email</label>
            <input id="add-email" type="email" required value={adding.email} onChange={(e) => setAdding({ ...adding, email: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="add-first">First name</label>
            <input id="add-first" type="text" value={adding.first_name} onChange={(e) => setAdding({ ...adding, first_name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="add-org">Organization</label>
            <input id="add-org" type="text" value={adding.organization} onChange={(e) => setAdding({ ...adding, organization: e.target.value })} />
          </div>
        </div>
        <button className="btn" type="submit" disabled={!adding.email.includes('@')}>
          Add attendee
        </button>
      </form>
    </>
  );
}

// --- Eventbrite CSV import ---------------------------------------------------

const TARGETS: { key: keyof ImportRow; label: string; guess: RegExp }[] = [
  { key: 'email', label: 'Email', guess: /^e-?mail( address)?$|attendee.*email/i },
  { key: 'first_name', label: 'First name', guess: /first name/i },
  { key: 'last_name', label: 'Last name', guess: /last name|surname/i },
  { key: 'organization', label: 'Organization', guess: /company|organi[sz]ation|business name/i },
  { key: 'industry', label: 'Industry', guess: /industry/i },
  { key: 'role', label: 'Role', guess: /job title|your role|^role|position/i },
  { key: 'size_band', label: 'Organization size', guess: /employees|size/i },
  { key: 'attendance_type', label: 'In person or virtual', guess: /ticket type|attend|virtual|in.person/i },
  { key: 'ai_tool', label: 'Primary AI tool', guess: /ai tool|which ai/i },
  { key: 'eventbrite_order_id', label: 'Order number', guess: /order ?#|order (number|id)/i },
];

export function normalizeAttendance(v: string) {
  const s = v.toLowerCase();
  if (/virtual|online|livestream|remote/.test(s)) return 'virtual';
  if (/person|general admission|onsite|on-site|ga\b/.test(s)) return 'in_person';
  return '';
}

export function normalizeAiTool(v: string) {
  const s = v.toLowerCase();
  if (/chat ?gpt|openai/.test(s)) return 'chatgpt';
  if (/claude|anthropic/.test(s)) return 'claude';
  if (/gemini|bard|google/.test(s)) return 'gemini';
  if (/copilot|microsoft/.test(s)) return 'copilot';
  if (/none|not yet|^no\b/.test(s)) return 'none';
  return s ? 'other' : '';
}

export function guessMapping(headers: string[]) {
  const map: Partial<Record<keyof ImportRow, string>> = {};
  for (const t of TARGETS) {
    const h = headers.find((x) => t.guess.test(x.trim()));
    if (h) map[t.key] = h;
  }
  return map;
}

export function ImportTab() {
  const { backend } = useApp();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [map, setMap] = useState<Partial<Record<keyof ImportRow, string>>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onFile = (f: File) => {
    setResult(null);
    setErr('');
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hs = res.meta.fields ?? [];
        setHeaders(hs);
        setRows(res.data);
        setMap(guessMapping(hs));
      },
      error: (e) => setErr(e.message),
    });
  };

  const mapped: ImportRow[] = useMemo(() => {
    const seen = new Set<string>();
    const out: ImportRow[] = [];
    for (const r of rows) {
      const row: any = {};
      for (const t of TARGETS) {
        const col = map[t.key];
        if (col) row[t.key] = (r[col] ?? '').trim();
      }
      if (row.attendance_type !== undefined) row.attendance_type = normalizeAttendance(row.attendance_type);
      if (row.ai_tool !== undefined) row.ai_tool = normalizeAiTool(row.ai_tool);
      const email = (row.email ?? '').toLowerCase();
      if (email && seen.has(email)) continue; // one account per email even if they bought several tickets
      seen.add(email);
      out.push(row);
    }
    return out;
  }, [rows, map]);

  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      setResult(await backend.importAttendees(mapped));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>Import the Eventbrite attendee export</h2>
      <p className="small muted">
        In Eventbrite, go to Reports, then Attendee summary, and export as CSV. Importing again is safe: existing accounts are
        updated, and answers an attendee already confirmed are kept.
      </p>
      <div className="field">
        <label htmlFor="csv">CSV file</label>
        <input id="csv" type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      {err && <p className="notice err">{err}</p>}

      {headers.length > 0 && (
        <>
          <h3>Match the columns</h3>
          <div className="grid-2">
            {TARGETS.map((t) => (
              <div className="field" key={t.key}>
                <label htmlFor={`map-${t.key}`}>{t.label}</label>
                <select id={`map-${t.key}`} value={map[t.key] ?? ''} onChange={(e) => setMap({ ...map, [t.key]: e.target.value || undefined })}>
                  <option value="">Not in this file</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <h3>Preview ({mapped.length} unique emails)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {TARGETS.filter((t) => map[t.key]).map((t) => (
                    <th key={t.key}>{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mapped.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {TARGETS.filter((t) => map[t.key]).map((t) => (
                      <td key={t.key}>{(r as any)[t.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn" style={{ marginTop: 12 }} disabled={busy || !map.email} onClick={run}>
            {busy ? 'Importing' : `Import ${mapped.length} attendees`}
          </button>
        </>
      )}

      {result && (
        <div className="notice ok" role="status" style={{ marginTop: 12 }}>
          Created {result.created}, updated {result.updated}, skipped {result.skipped}.
          {result.errors.length > 0 && (
            <ul>
              {result.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
