import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { TextInput } from '../../components/Field';
import { downloadFile } from '../../lib/pdf';
import type { ExportTable } from '../../lib/backend';
import type { HelpRequest, Settings } from '../../lib/types';
import { AttendeesTab, ImportTab } from './AdminAttendees';
import { ContentTab } from './AdminContent';

type Tab = 'live' | 'attendees' | 'import' | 'content' | 'help' | 'export';
const TABS: { key: Tab; label: string }[] = [
  { key: 'live', label: 'Live now & settings' },
  { key: 'attendees', label: 'Attendees' },
  { key: 'import', label: 'Import Eventbrite' },
  { key: 'content', label: 'Content' },
  { key: 'help', label: 'Help requests' },
  { key: 'export', label: 'Export' },
];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('live');
  const [emailSearch, setEmailSearch] = useState('');
  return (
    <main id="main" className="wide">
      <h1>Admin</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'live' && <LiveTab />}
      {tab === 'attendees' && <AttendeesTab initialSearch={emailSearch} />}
      {tab === 'import' && <ImportTab />}
      {tab === 'content' && <ContentTab />}
      {tab === 'help' && (
        <HelpTab
          onFix={(email) => {
            setEmailSearch(email);
            setTab('attendees');
          }}
        />
      )}
      {tab === 'export' && <ExportTab />}
    </main>
  );
}

function LiveTab() {
  const { backend, content, live, refreshLive, settings } = useApp();
  const [busy, setBusy] = useState(false);
  const [s, setS] = useState<Settings>(settings);
  const [msg, setMsg] = useState('');

  const setLive = async (key: string | null) => {
    setBusy(true);
    try {
      await backend.saveLiveState({ current_section_key: key });
      await refreshLive();
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await backend.saveLiveState({ settings: s });
      await refreshLive();
      setMsg('Settings saved. Attendees pick them up within about a minute.');
    } catch (err) {
      setMsg(`Could not save: ${(err as Error).message}`);
    }
  };

  return (
    <>
      <section className="card">
        <h2>Live now</h2>
        <p className="small muted">Attendees see the change within about a minute (the app checks every 60 to 75 seconds).</p>
        <div className="choices">
          {content.sections.map((sec) => (
            <button
              key={sec.key}
              type="button"
              className={`btn ${live.current_section_key === sec.key ? 'accent' : 'secondary'}`}
              disabled={busy}
              onClick={() => setLive(sec.key)}
              aria-pressed={live.current_section_key === sec.key}
              style={{ justifyContent: 'flex-start' }}
            >
              {sec.number}. {sec.title} <span className="small">({sec.slot})</span>
            </button>
          ))}
          <button type="button" className="btn ghost" disabled={busy} onClick={() => setLive(null)}>
            Clear "Live now"
          </button>
        </div>
      </section>

      <form className="card" onSubmit={saveSettings}>
        <h2>Links and dates</h2>
        {msg && <p className="notice info">{msg}</p>}
        <TextInput label="Pilot and Use Case Selection Tool URL" type="url" value={s.pilotToolUrl} onChange={(v) => setS({ ...s, pilotToolUrl: v })} max={300} />
        <TextInput label="AI Guidelines Tool URL" type="url" value={s.guidelinesToolUrl} onChange={(v) => setS({ ...s, guidelinesToolUrl: v })} max={300} />
        <TextInput label="Day-90 survey URL" type="url" value={s.surveyUrl} onChange={(v) => setS({ ...s, surveyUrl: v })} max={300} />
        <TextInput label="Community link" type="url" value={s.communityUrl} onChange={(v) => setS({ ...s, communityUrl: v })} max={300} />
        <TextInput label="Meetups link" type="url" value={s.meetupsUrl} onChange={(v) => setS({ ...s, meetupsUrl: v })} max={300} />
        <div className="grid-2">
          <TextInput label="Event date" type="date" value={s.eventDate} onChange={(v) => setS({ ...s, eventDate: v })} />
          <TextInput label="Day-90 date" type="date" value={s.day90Date} onChange={(v) => setS({ ...s, day90Date: v })} />
        </div>
        <button className="btn" type="submit">
          Save settings
        </button>
      </form>
    </>
  );
}

function HelpTab({ onFix }: { onFix: (email: string) => void }) {
  const { backend } = useApp();
  const [list, setList] = useState<HelpRequest[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const load = () => backend.listHelpRequests().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);
  const shown = (list ?? []).filter((h) => showResolved || !h.resolved_at);
  return (
    <section className="card">
      <div className="row">
        <h2 className="grow" style={{ margin: 0 }}>
          "Wrong email?" requests
        </h2>
        <button type="button" className="btn secondary small" onClick={load}>
          Refresh
        </button>
        <label className="check small">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          <span>Show resolved</span>
        </label>
      </div>
      {!list && <p>Loading</p>}
      {list && shown.length === 0 && <p className="muted">Nothing waiting.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Name</th>
              <th>Tried</th>
              <th>Registered as</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleString()}</td>
                <td>{h.name}</td>
                <td>{h.email_tried}</td>
                <td>{h.registered_email}</td>
                <td>{h.note}</td>
                <td>
                  <div className="row">
                    <button type="button" className="btn small secondary" onClick={() => onFix(h.registered_email || h.name || '')}>
                      Find attendee
                    </button>
                    {!h.resolved_at && (
                      <button type="button" className="btn small" onClick={() => backend.resolveHelpRequest(h.id).then(load)}>
                        Mark resolved
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function toCsv(rows: Record<string, unknown>[]) {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
}

const EXPORTS: { table: ExportTable; label: string }[] = [
  { table: 'profiles', label: 'Profiles' },
  { table: 'use_cases', label: 'Use cases' },
  { table: 'plans', label: '90-day plans' },
  { table: 'captures', label: 'Section answers' },
  { table: 'section_progress', label: 'Section progress' },
  { table: 'link_events', label: 'Links and prompt copies' },
  { table: 'help_requests', label: 'Help requests' },
];

function ExportTab() {
  const { backend } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const run = async (table: ExportTable) => {
    setBusy(table);
    setErr('');
    try {
      const rows = await backend.exportTable(table);
      downloadFile(`workbook-${table}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows), 'text/csv');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="card">
      <h2>Export data (CSV)</h2>
      <p className="small muted">
        For the day-90 outcome report. Each file links rows by user_id. These files contain personal information, so store them
        somewhere access is limited.
      </p>
      {err && <p className="notice err">{err}</p>}
      <div className="grid-2">
        {EXPORTS.map((e) => (
          <button key={e.table} type="button" className="btn secondary" disabled={!!busy} onClick={() => run(e.table)}>
            {busy === e.table ? 'Preparing' : e.label}
          </button>
        ))}
      </div>
    </section>
  );
}
