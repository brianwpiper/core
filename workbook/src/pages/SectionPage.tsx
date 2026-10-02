import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp, useData } from '../app/AppContext';
import { useUi } from '../app/UiContext';
import { BlockView } from '../components/Blocks';
import { isFilled } from '../components/Field';
import { PrivacyNote } from '../components/PrivacyNote';
import { planHasMeasures } from '../lib/store';
import type { Section, UserData } from '../lib/types';

export function missingFor(section: Section, data: UserData): string[] {
  const missing: string[] = [];
  for (const key of section.required ?? []) {
    if (!isFilled(data.captures[`${section.key}.${key}`]?.value)) {
      const block = section.blocks.find((b) => b.type === 'field' && b.field.key === key);
      if (block?.type === 'field') missing.push(block.field.label);
      else if (key === 'pilot_id') missing.push('Choose your pilot candidate');
      else missing.push(key);
    }
  }
  if (section.requiresPlan && !planHasMeasures(data.plan)) missing.push('Your plan\'s success measure and stop or change condition');
  return missing;
}

const CAPTURE_BLOCKS = new Set(['field', 'self-assessment', 'use-cases', 'tools-seen', 'tool-compare', 'plan', 'pilot-picker']);

export function SectionPage() {
  const { key } = useParams();
  const { content, store, live } = useApp();
  const data = useData();
  const { setCurrentSection, openDrawer } = useUi();
  const idx = content.sections.findIndex((s) => s.key === key);
  const section = content.sections[idx];

  useEffect(() => {
    if (!section) return;
    setCurrentSection(section.key);
    store.setLastSection(section.key);
    window.scrollTo(0, 0);
    return () => setCurrentSection(null);
  }, [section?.key]);

  if (!section) {
    return (
      <main id="main">
        <h1>Section not found</h1>
        <Link to="/">Back to home</Link>
      </main>
    );
  }

  const prev = content.sections[idx - 1];
  const next = content.sections[idx + 1];
  const done = !!data.progress[section.key];
  const missing = missingFor(section, data);
  const hasCaptures = section.blocks.some((b) => CAPTURE_BLOCKS.has(b.type));
  const isLive = live.current_section_key === section.key;

  return (
    <main id="main">
      <div className="section-head">
        <p className="eyebrow">
          Section {section.number} · {section.slot}
          {section.people ? ` · ${section.people}` : ''} {isLive && <span className="pill live">Live now</span>}{' '}
          {done && <span className="pill done">Done</span>}
        </p>
        <h1>{section.title}</h1>
        <p>{section.intro}</p>
      </div>
      {hasCaptures && <PrivacyNote />}

      {section.blocks.map((b, i) => (
        <BlockView key={`${section.key}-${i}`} block={b} section={section.key} />
      ))}

      <section className="card" aria-labelledby="done-h">
        <h2 id="done-h" className="sr-only">
          Finish this section
        </h2>
        {done ? (
          <div className="row">
            <span className="pill done">Section done</span>
            <button type="button" className="btn ghost small" onClick={() => store.setSectionDone(section.key, false)}>
              Mark as not done
            </button>
          </div>
        ) : (
          <>
            {missing.length > 0 && (
              <p className="small muted">
                To finish this section: {missing.join('; ')}.
              </p>
            )}
            <button
              type="button"
              className="btn big"
              disabled={missing.length > 0}
              onClick={() => store.setSectionDone(section.key, true)}
            >
              Mark this section done
            </button>
          </>
        )}
      </section>

      <div className="section-footer">
        {prev ? (
          <Link className="btn secondary" to={`/s/${prev.key}`}>
            ← {prev.number}. {prev.short}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" to={`/s/${next.key}`}>
            {next.number}. {next.short} →
          </Link>
        ) : (
          <Link className="btn" to="/">
            Back to home
          </Link>
        )}
      </div>

      <button type="button" className="btn accent fab" onClick={openDrawer} aria-haspopup="dialog">
        + Use case
      </button>
    </main>
  );
}
