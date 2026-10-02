import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useData } from '../app/AppContext';
import { PlanComposer, PlanForm, PlanExport } from '../components/Plan';
import { PromptCard } from '../components/PromptCard';
import { TextInput, useCapture } from '../components/Field';
import { planRows } from '../lib/planText';
import { AREA_LABELS } from '../lib/options';
import { baselineText, sortedUseCases } from '../lib/template';
import { downloadFile } from '../lib/pdf';

export function PlanPage() {
  return (
    <main id="main">
      <p className="small muted">
        Your plan lives in <Link to="/s/s7">Section 7</Link>. It is also here so you can find it fast.
      </p>
      <PlanForm />
      <PlanComposer />
    </main>
  );
}

export function Day90Page() {
  const { settings, store } = useApp();
  const data = useData();
  const [note, setNote] = useCapture<string>('day90', 'what_changed');
  const [surveyDone, setSurveyDone] = useCapture<boolean>('day90', 'survey_done');
  const today = new Date().toISOString().slice(0, 10);
  const open = today >= settings.day90Date;
  const dateText = new Date(`${settings.day90Date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const list = sortedUseCases(data);

  return (
    <main id="main">
      <h1>Day 90</h1>
      {!open && (
        <p className="notice info">
          Your day-90 review opens on {dateText}. Here is a preview of what you will see. We will email you a reminder.
        </p>
      )}

      <section className="card" aria-labelledby="d90-plan">
        <h2 id="d90-plan">My 90-day plan</h2>
        {data.plan ? (
          <dl>
            {planRows(data.plan, settings.day90Date).map(([label, value]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <dt className="small muted" style={{ fontWeight: 700 }}>
                  {label}
                </dt>
                <dd style={{ margin: 0, whiteSpace: 'pre-line' }}>{value || 'Not filled in'}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted">
            No plan yet. <Link to="/s/s7">Build it in Section 7.</Link>
          </p>
        )}
        {data.plan && <PlanExport />}
      </section>

      <section className="card" aria-labelledby="d90-list">
        <h2 id="d90-list">My use case list</h2>
        {list.length === 0 && <p className="muted">No use cases saved.</p>}
        <ul>
          {list.map((u) => (
            <li key={u.id}>
              <strong>{u.name}</strong>
              {u.is_pilot_candidate && ' ★'}
              {u.area && ` (${AREA_LABELS[u.area]})`}
              {baselineText(u) && <span className="muted">. {baselineText(u)}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="d90-note">
        <h2 id="d90-note">What changed?</h2>
        <TextInput
          label="In a few lines: what happened, and what is your number today?"
          value={note ?? ''}
          onChange={setNote}
          max={500}
          multiline
        />
      </section>

      <PromptCard promptKey="day90_review" />

      <section className="card" aria-labelledby="d90-survey">
        <h2 id="d90-survey">Day-90 survey</h2>
        <p>Five minutes. Your answers shape the outcome report and next year's Summit.</p>
        <div className="row">
          {settings.surveyUrl ? (
            <a
              className="btn"
              href={settings.surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => store.logLink('day90_survey')}
            >
              Take the survey <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <button className="btn" type="button" disabled>
              Survey link coming in February
            </button>
          )}
          <label className="check">
            <input type="checkbox" checked={!!surveyDone} onChange={(e) => setSurveyDone(e.target.checked)} />
            <span>I completed the survey</span>
          </label>
        </div>
      </section>
    </main>
  );
}

export function MyDataPage() {
  const { store, backend, session, signOut } = useApp();
  const data = useData();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState('');

  const download = () => {
    const out = {
      exported_at: new Date().toISOString(),
      profile: data.profile,
      captures: Object.values(data.captures),
      use_cases: Object.values(data.useCases),
      plan: data.plan,
      sections_done: data.progress,
    };
    downloadFile('my-summit-workbook.json', JSON.stringify(out, null, 2), 'application/json');
  };

  const del = async () => {
    try {
      await store.flush();
      await backend.deleteMyData(session!.userId);
      store.clearLocal(session!.userId);
      setMsg('Your entries were deleted. You will now be signed out.');
      setTimeout(() => signOut(), 1500);
    } catch (e) {
      setMsg(`Could not delete right now: ${(e as Error).message}. Please try again when you are online.`);
    }
  };

  return (
    <main id="main">
      <h1>My data</h1>
      <section className="card">
        <h2>What we store</h2>
        <p>
          Your profile, the short answers you type in this workbook, your use case list, your 90-day plan, which sections you
          finished, and which links and prompts you opened. Only you can see your entries. Facilitators see room totals. Your
          answers are combined with everyone else's for the day-90 outcome report.
        </p>
      </section>
      <section className="card">
        <h2>Download</h2>
        <p>Get a copy of everything you have entered, as a file.</p>
        <button type="button" className="btn secondary" onClick={download}>
          Download my data
        </button>
      </section>
      <section className="card">
        <h2>Delete</h2>
        <p>
          This removes all your entries, your plan, and your profile answers. Your login stays so you can come back, but your
          workbook will be empty. This cannot be undone.
        </p>
        {msg && (
          <p className="notice info" role="status">
            {msg}
          </p>
        )}
        {confirming ? (
          <div className="row">
            <button type="button" className="btn danger" onClick={del}>
              Yes, delete everything
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn danger" onClick={() => setConfirming(true)}>
            Delete my entries
          </button>
        )}
      </section>
    </main>
  );
}
