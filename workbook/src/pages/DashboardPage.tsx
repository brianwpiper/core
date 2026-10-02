// Facilitator dashboard: aggregate counts only, never individual entries.
// Polls one summary call every 45 seconds. Designed to be projected.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { AI_TOOL_LABELS, AREA_LABELS, CONCERN_OPTIONS } from '../lib/options';
import type { DashboardSummary } from '../lib/types';

const POLL_MS = 45_000;
const CONCERN_LABELS = Object.fromEntries(CONCERN_OPTIONS.map((c) => [c.value, c.label]));

function Num({ n }: { n: number | null | undefined }) {
  return n === null || n === undefined ? <span className="suppressed">fewer than 5</span> : <>{n.toLocaleString()}</>;
}

function Bars({ data, labels, order }: { data: Record<string, number | null>; labels?: Record<string, string>; order?: string[] }) {
  const entries = (order ?? Object.keys(data).sort((a, b) => (data[b] ?? 0) - (data[a] ?? 0))).map(
    (k) => [k, data[k] ?? null] as const,
  );
  const max = Math.max(1, ...entries.map(([, v]) => v ?? 0));
  if (!entries.length) return <p className="suppressed">No answers yet.</p>;
  return (
    <div>
      {entries.map(([k, v]) => (
        <div className="bar-row" key={k}>
          <span>{labels?.[k] ?? k}</span>
          <span className="bar" aria-hidden="true">
            <span style={{ width: `${((v ?? 0) / max) * 100}%` }} />
          </span>
          <span className="num">
            <Num n={v} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Pct({ part, whole }: { part: number | null; whole: number | null }) {
  if (part === null || whole === null || whole === 0) return <span className="suppressed">not enough data yet</span>;
  return <>{Math.round((part / whole) * 100)}%</>;
}

export function DashboardPage() {
  const { backend, content, live, backend: b } = useApp();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stop = false;
    let t: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const d = await backend.dashboardSummary();
        if (!stop) {
          setData(d);
          setError('');
        }
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
      if (!stop) t = setTimeout(load, POLL_MS);
    };
    load();
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [backend]);

  const sectionLabels = Object.fromEntries(content.sections.map((s) => [s.key, `${s.number}. ${s.short}`]));
  const liveSection = content.sections.find((s) => s.key === live.current_section_key);
  const toolLabels = { ...AI_TOOL_LABELS };

  return (
    <div className="dash">
      <div className="row" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>The room right now</h1>
        {liveSection && (
          <span className="pill live" style={{ fontSize: '1rem' }}>
            Live: {liveSection.number}. {liveSection.short}
          </span>
        )}
        <span className="grow" />
        <span className="label small">
          {data ? `Updated ${new Date(data.generated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Loading'}
          {b.mode === 'demo' && ' · sample data'}
        </span>
        <Link to="/" className="small">
          Exit
        </Link>
      </div>
      {error && <p className="notice err">Could not load: {error}</p>}
      {data && (
        <div className="grid">
          <section className="tile">
            <div className="label">Logged in</div>
            <div className="big">
              <Num n={data.attendees.logged_in} />
            </div>
            <p className="label">
              In person <Num n={data.attendees.in_person} /> · Virtual <Num n={data.attendees.virtual} />
            </p>
            <p className="label">
              Active in the last 15 minutes: <Num n={data.attendees.active_15m} />
            </p>
          </section>

          <section className="tile">
            <div className="label">Plans with all required measures</div>
            <div className="big">
              <Pct part={data.plans.measures_complete} whole={data.plans.started} />
            </div>
            <p className="label">
              Plans started <Num n={data.plans.started} /> · Marked complete <Num n={data.plans.marked_complete} />
            </p>
          </section>

          <section className="tile">
            <h2>Sections finished</h2>
            <Bars data={data.sections} labels={sectionLabels} order={content.sections.map((s) => s.key)} />
          </section>

          <section className="tile">
            <h2>Top concerns</h2>
            <Bars data={data.concerns} labels={CONCERN_LABELS} />
          </section>

          <section className="tile">
            <h2>Opportunity areas chosen</h2>
            <Bars data={data.opportunity_areas} labels={AREA_LABELS} />
          </section>

          <section className="tile">
            <h2>Use cases by area</h2>
            <Bars data={data.use_case_areas} labels={AREA_LABELS} />
          </section>

          {(['impact', 'effort', 'risk'] as const).map((k) => (
            <section className="tile" key={k}>
              <h2>{k[0].toUpperCase() + k.slice(1)} ratings (1 to 5)</h2>
              <Bars data={data.ratings[k]} order={['1', '2', '3', '4', '5']} />
            </section>
          ))}

          <section className="tile">
            <h2>Tools chosen for pilots</h2>
            <Bars data={data.chosen_tools} labels={toolLabels} />
          </section>

          <section className="tile">
            <h2>AI tools people use</h2>
            <Bars data={data.ai_tools} labels={toolLabels} />
          </section>
        </div>
      )}
      <p className="label small" style={{ marginTop: 20 }}>
        Counts only. Any group smaller than 5 people is hidden so no one can be identified.
      </p>
    </div>
  );
}
