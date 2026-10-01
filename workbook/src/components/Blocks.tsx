import { useMemo } from 'react';
import { useApp, useData } from '../app/AppContext';
import { suggestionsFor } from '../lib/content';
import { AREA_LABELS, FIT_OPTIONS } from '../lib/options';
import { sortedUseCases } from '../lib/template';
import { SELF_ASSESSMENT } from '../content/settings';
import type { Block } from '../lib/types';
import { CaptureField, Scale, TextInput, useCapture } from './Field';
import { Markdown } from './Markdown';
import { PromptCard } from './PromptCard';
import { UseCaseList } from './UseCases';
import { PlanForm, PlanComposer } from './Plan';

export function CritExplainer() {
  return (
    <div className="crit-grid" role="list" aria-label="The four parts of CRIT">
      <div className="crit-tile c" role="listitem">
        <b>C</b>
        <strong>Context</strong>
        <p>Your situation, your business, your goal.</p>
      </div>
      <div className="crit-tile r" role="listitem">
        <b>R</b>
        <strong>Role</strong>
        <p>Who the AI should act as.</p>
      </div>
      <div className="crit-tile i" role="listitem">
        <b>I</b>
        <strong>Interview</strong>
        <p>Have it ask you questions first, one at a time.</p>
      </div>
      <div className="crit-tile t" role="listitem">
        <b>T</b>
        <strong>Task</strong>
        <p>Exactly what you want back.</p>
      </div>
    </div>
  );
}

export function SelfAssessment() {
  const [answers, setAnswers] = useCapture<Record<string, number>>('s3', 'assessment');
  const a = answers ?? {};
  const totals = useMemo(() => {
    const t: Record<string, { sum: number; n: number }> = {};
    for (const q of SELF_ASSESSMENT) {
      t[q.area] ??= { sum: 0, n: 0 };
      if (a[q.key]) {
        t[q.area].sum += a[q.key];
        t[q.area].n++;
      }
    }
    return Object.entries(t)
      .filter(([, v]) => v.n > 0)
      .map(([area, v]) => ({ area, avg: v.sum / v.n }))
      .sort((x, y) => y.avg - x.avg);
  }, [a]);
  const answered = Object.keys(a).length;

  return (
    <section className="card" aria-labelledby="sa-h">
      <h3 id="sa-h">Quick self-assessment</h3>
      <p className="small muted">How true is each statement for your business? 1 means not at all, 5 means very much.</p>
      {SELF_ASSESSMENT.map((q) => (
        <Scale
          key={q.key}
          name={`sa-${q.key}`}
          label={q.text}
          value={a[q.key]}
          low="Not at all"
          high="Very much"
          onChange={(v) => setAnswers({ ...a, [q.key]: v })}
        />
      ))}
      {answered > 0 && (
        <div className="notice info" aria-live="polite">
          <strong>Where your scores are highest:</strong>{' '}
          {totals
            .slice(0, 3)
            .map((t) => `${AREA_LABELS[t.area as keyof typeof AREA_LABELS]} (${t.avg.toFixed(1)})`)
            .join(', ')}
        </div>
      )}
    </section>
  );
}

export function Suggestions() {
  const { content, store } = useApp();
  const data = useData();
  const list = suggestionsFor(content.suggestions, data.profile.industry, data.profile.role).slice(0, 8);
  const added = new Set(Object.values(data.useCases).map((u) => u.suggestion_key).filter(Boolean));
  return (
    <section className="card" aria-labelledby="sug-h">
      <h3 id="sug-h">Businesses like yours often start here</h3>
      <p className="small muted">
        Starting points picked for {data.profile.industry ? `${data.profile.industry.toLowerCase()} businesses` : 'businesses like yours'}
        {data.profile.role ? ` and people in ${data.profile.role.toLowerCase()} roles` : ''}. These are ideas to react to. Only you know
        which ones fit.
      </p>
      <ul className="section-list">
        {list.map((s) => (
          <li key={s.key} className="uc">
            <div className="uc-head">
              <div className="uc-name">
                {s.name} <span className="pill">{AREA_LABELS[s.area]}</span>
              </div>
            </div>
            <p className="small" style={{ margin: '4px 0 8px' }}>
              {s.description}
            </p>
            {added.has(s.key) ? (
              <span className="pill done">On your list</span>
            ) : (
              <button
                type="button"
                className="btn secondary small"
                onClick={() =>
                  store.saveUseCase({
                    name: s.name,
                    area: s.area,
                    description: s.description,
                    is_suggested: true,
                    suggestion_key: s.key,
                    source_section: 'suggested',
                  })
                }
              >
                + Add to my list
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PilotPicker() {
  const { store } = useApp();
  const data = useData();
  const [pilot, setPilot] = useCapture<string>('s4', 'pilot_id');
  const list = sortedUseCases(data);
  const starred = list.filter((u) => u.is_pilot_candidate);
  const options = starred.length ? starred : list;

  return (
    <section className="card" aria-labelledby="pilot-h">
      <h3 id="pilot-h">Choose your pilot candidate</h3>
      {list.length === 0 ? (
        <p className="muted">Add a few use cases to your list first.</p>
      ) : (
        <>
          <p className="small muted">
            {starred.length ? 'Pick one of your starred ideas.' : 'Star your favorites above, or pick from your whole list.'} This
            becomes the starting point for your 90-day plan.
          </p>
          <fieldset>
            <legend className="sr-only">Pilot candidate</legend>
            <div className="choices">
              {options.map((u) => (
                <label key={u.id} className="choice">
                  <input
                    type="radio"
                    name="pilot"
                    checked={pilot === u.id}
                    onChange={() => {
                      setPilot(u.id);
                      if (!u.is_pilot_candidate) store.saveUseCase({ ...u, is_pilot_candidate: true });
                    }}
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </section>
  );
}

type ToolSeen = { name: string; goodAt: string; fit: string };

export function ToolsSeen() {
  const [value, setValue] = useCapture<ToolSeen[]>('s5', 'tools_seen');
  const rows = value?.length ? value : [{ name: '', goodAt: '', fit: '' }];
  const update = (i: number, patch: Partial<ToolSeen>) => setValue(rows.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  return (
    <section className="card" aria-labelledby="ts-h">
      <h3 id="ts-h">Tools I saw</h3>
      {rows.map((r, i) => (
        <div key={i} className="uc">
          <TextInput label={`Tool ${i + 1} name`} value={r.name} onChange={(v) => update(i, { name: v })} max={60} />
          <TextInput label="What it is good at" value={r.goodAt} onChange={(v) => update(i, { goodAt: v })} max={140} />
          <fieldset>
            <legend>Fit for one of my use cases?</legend>
            <div className="row">
              {FIT_OPTIONS.map((o) => (
                <label key={o.value} className="choice">
                  <input type="radio" name={`fit-${i}`} checked={r.fit === o.value} onChange={() => update(i, { fit: o.value })} />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {rows.length > 1 && (
            <button type="button" className="btn ghost small" onClick={() => setValue(rows.filter((_, j) => j !== i))}>
              Remove
            </button>
          )}
        </div>
      ))}
      {rows.length < 8 && (
        <button type="button" className="btn secondary" onClick={() => setValue([...rows, { name: '', goodAt: '', fit: '' }])}>
          + Add another tool
        </button>
      )}
    </section>
  );
}

type Compare = { name: string; fit?: number; cost?: number; ease?: number; data?: number };
const CRITERIA: { key: keyof Compare; label: string; low: string; high: string }[] = [
  { key: 'fit', label: 'Fit for my use case', low: 'Poor', high: 'Great' },
  { key: 'cost', label: 'Cost', low: 'Expensive', high: 'Affordable' },
  { key: 'ease', label: 'Ease of adoption', low: 'Hard', high: 'Easy' },
  { key: 'data', label: 'Data handling', low: 'Worrying', high: 'Reassuring' },
];

export function ToolCompare() {
  const [value, setValue] = useCapture<Compare[]>('s6', 'tool_compare');
  const [, setChosen] = useCapture<string>('s6', 'chosen_tool');
  const rows = value?.length ? value : [{ name: '' }, { name: '' }];
  const update = (i: number, patch: Partial<Compare>) => setValue(rows.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  const score = (r: Compare) => CRITERIA.reduce((s, c) => s + ((r[c.key] as number) || 0), 0);

  return (
    <section className="card" aria-labelledby="tc-h">
      <h3 id="tc-h">Compare 2 or 3 tools</h3>
      <p className="small muted">Score each from 1 to 5. Higher is better on every line, so cost 5 means affordable.</p>
      {rows.map((r, i) => (
        <div key={i} className="uc">
          <TextInput label={`Tool ${i + 1}`} value={r.name} onChange={(v) => update(i, { name: v })} max={60} />
          {CRITERIA.map((c) => (
            <Scale
              key={c.key}
              name={`tc-${i}-${c.key}`}
              label={c.label}
              low={c.low}
              high={c.high}
              value={r[c.key] as number | undefined}
              onChange={(v) => update(i, { [c.key]: v })}
            />
          ))}
          <div className="row">
            <span className="pill">Total {score(r)} of 20</span>
            {r.name.trim() && (
              <button type="button" className="btn ghost small" onClick={() => setChosen(r.name.trim())}>
                Choose this tool
              </button>
            )}
            {rows.length > 2 && (
              <button type="button" className="btn ghost small" onClick={() => setValue(rows.filter((_, j) => j !== i))}>
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
      {rows.length < 3 && (
        <button type="button" className="btn secondary" onClick={() => setValue([...rows, { name: '' }])}>
          + Add a third tool
        </button>
      )}
    </section>
  );
}

export function CompanionLink({ target }: { target: 'pilot_tool' | 'guidelines_tool' }) {
  const { settings, store } = useApp();
  const url = target === 'pilot_tool' ? settings.pilotToolUrl : settings.guidelinesToolUrl;
  const title = target === 'pilot_tool' ? 'Pilot and Use Case Selection Tool' : 'AI Guidelines Tool';
  const body =
    target === 'pilot_tool'
      ? 'Compare your ideas side by side and pick a pilot. It gives you a PDF to upload into your AI tool.'
      : 'Write a first set of AI guidelines for your team. It gives you a PDF to upload into your AI tool.';
  return (
    <section className="card" aria-labelledby={`comp-${target}`} style={{ borderLeft: '5px solid var(--accent)' }}>
      <h3 id={`comp-${target}`}>{title}</h3>
      <p>{body}</p>
      {url ? (
        <a className="btn accent" href={url} target="_blank" rel="noopener noreferrer" onClick={() => store.logLink(target)}>
          Open the {title} <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <button type="button" className="btn accent" aria-disabled="true" disabled>
          Link coming soon
        </button>
      )}
    </section>
  );
}

export function ClosingLinks() {
  const { settings, store } = useApp();
  const d90 = new Date(`${settings.day90Date}T12:00:00`);
  const links = [
    { url: settings.communityUrl, label: 'Join the Main Street AI community', target: 'community' },
    { url: settings.meetupsUrl, label: 'See upcoming meetups', target: 'meetups' },
  ].filter((l) => l.url);
  return (
    <section className="card" aria-labelledby="close-h">
      <h3 id="close-h">Stay connected</h3>
      <p>
        <strong>Your day-90 check-in:</strong>{' '}
        {d90.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}. Log back in
        then to see your plan, write what changed, and take the short survey.
      </p>
      {links.length ? (
        <div className="row">
          {links.map((l) => (
            <a key={l.target} className="btn secondary" href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => store.logLink(l.target)}>
              {l.label}
            </a>
          ))}
        </div>
      ) : (
        <p className="muted small">Community and meetup links will appear here.</p>
      )}
    </section>
  );
}

export function ListComposer() {
  const data = useData();
  const n = Object.keys(data.useCases).length;
  return (
    <>
      {n < 2 && <p className="notice info">Add at least 2 use cases to get the most from this prompt.</p>}
      <PromptCard promptKey="use_case_ranker" />
    </>
  );
}

export function BlockView({ block, section }: { block: Block; section: string }) {
  switch (block.type) {
    case 'text':
      return (
        <div>
          {block.title && <h2>{block.title}</h2>}
          <Markdown text={block.body} />
        </div>
      );
    case 'callout':
      return (
        <div className={`callout ${block.tone}`}>
          {block.title && <h3>{block.title}</h3>}
          {block.body}
        </div>
      );
    case 'prompt':
      return <PromptCard promptKey={block.prompt} />;
    case 'field':
      return (
        <div className="card">
          <CaptureField section={section} field={block.field} />
        </div>
      );
    case 'companion':
      return <CompanionLink target={block.target} />;
    case 'crit-example':
      return <CritExplainer />;
    case 'self-assessment':
      return <SelfAssessment />;
    case 'suggestions':
      return <Suggestions />;
    case 'use-cases':
      return <UseCaseList mode={block.mode} section={section} />;
    case 'pilot-picker':
      return <PilotPicker />;
    case 'list-composer':
      return <ListComposer />;
    case 'tools-seen':
      return <ToolsSeen />;
    case 'tool-compare':
      return <ToolCompare />;
    case 'plan':
      return <PlanForm />;
    case 'plan-composer':
      return <PlanComposer />;
    case 'closing-links':
      return <ClosingLinks />;
    default:
      return null;
  }
}
