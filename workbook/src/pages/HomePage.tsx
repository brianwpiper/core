import { Link } from 'react-router-dom';
import { useApp, useData } from '../app/AppContext';
import { SECTION_KEYS } from '../lib/options';

export function useProgress() {
  const data = useData();
  const done = SECTION_KEYS.filter((k) => data.progress[k]).length;
  return { done, total: SECTION_KEYS.length, pct: Math.round((done / SECTION_KEYS.length) * 100) };
}

export function HomePage() {
  const { content, live, settings } = useApp();
  const data = useData();
  const { done, total, pct } = useProgress();
  const last = content.sections.find((s) => s.key === data.profile.last_section);
  const nextUndone = content.sections.find((s) => !data.progress[s.key]);
  const today = new Date().toISOString().slice(0, 10);
  const day90Open = today >= settings.day90Date;

  return (
    <main id="main">
      <h1>Hi {data.profile.first_name || 'there'}</h1>

      {day90Open && (
        <section className="card" style={{ borderLeft: '5px solid var(--accent)' }}>
          <h2>Welcome back for day 90</h2>
          <p>See your plan, write down what changed, and take the short survey.</p>
          <Link className="btn" to="/day-90">
            Open my day-90 review
          </Link>
        </section>
      )}

      <section className="card" aria-labelledby="progress-h">
        <h2 id="progress-h">Your progress</h2>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={`${done} of ${total} sections done`}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="small muted" style={{ marginTop: 6 }}>
          {done} of {total} sections done
        </p>
        {last && last.key !== live.current_section_key ? (
          <Link className="btn" to={`/s/${last.key}`}>
            Pick up where you left off: {last.number}. {last.short}
          </Link>
        ) : (
          nextUndone &&
          !last && (
            <Link className="btn" to={`/s/${nextUndone.key}`}>
              Start with {nextUndone.number}. {nextUndone.short}
            </Link>
          )
        )}
      </section>

      <h2>Sections</h2>
      <p className="small muted">All sections are open. The gold one is where the room is right now.</p>
      <ol className="section-list">
        {content.sections.map((s) => {
          const isDone = !!data.progress[s.key];
          const isLive = live.current_section_key === s.key;
          return (
            <li key={s.key}>
              <Link to={`/s/${s.key}`} className={`section-link ${isDone ? 'done' : ''} ${isLive ? 'is-live' : ''}`}>
                <span className="section-num" aria-hidden="true">
                  {isDone ? '✓' : s.number}
                </span>
                <span className="grow">
                  <strong>{s.title}</strong>
                  <span className="slot" style={{ display: 'block' }}>
                    {s.slot}
                    {s.people ? `, ${s.people}` : ''}
                  </span>
                </span>
                {isLive && <span className="pill live">Live now</span>}
                {isDone && <span className="sr-only">Done</span>}
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Link to="/plan" className="section-link">
          <span className="grow">
            <strong>My 90-day plan</strong>
            <span className="slot" style={{ display: 'block' }}>
              {data.plan?.completed_at ? 'Complete' : data.plan ? 'In progress' : 'Not started'}
            </span>
          </span>
        </Link>
        <Link to="/library" className="section-link">
          <span className="grow">
            <strong>Resource library</strong>
            <span className="slot" style={{ display: 'block' }}>
              Prompts, CRIT card, tools, glossary
            </span>
          </span>
        </Link>
      </div>
    </main>
  );
}
