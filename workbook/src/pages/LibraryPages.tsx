import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Markdown } from '../components/Markdown';
import { PromptCard } from '../components/PromptCard';
import { CompanionLink } from '../components/Blocks';
import { downloadFile, downloadTextPdf } from '../lib/pdf';
import { CRIT_LABELS, CRIT_ORDER } from '../lib/template';
import type { LibraryItem } from '../lib/types';

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export function LibraryPage() {
  const { content } = useApp();
  const cats = ['All', ...new Set(content.library.map((i) => i.category)), 'Prompt library'];
  const [cat, setCat] = useState('All');
  const items = content.library.filter((i) => cat === 'All' || i.category === cat);

  return (
    <main id="main">
      <h1>Resource library</h1>
      <p>
        Come back to these any time. AI tools change quickly, so every item shows when it was last checked. The printed handout
        is a snapshot of the day; this library is the version we keep current.
      </p>
      <div className="tabs" role="tablist" aria-label="Categories">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} type="button">
            {c}
          </button>
        ))}
      </div>

      {cat === 'Prompt library' ? (
        <>
          <p className="muted">Every prompt from the day, filled in with your own answers so far.</p>
          {Object.values(content.prompts).map((p) => (
            <PromptCard key={p.key} card={p} />
          ))}
        </>
      ) : (
        <ul className="section-list">
          {items.map((i) => (
            <li key={i.key}>
              <Link to={`/library/${i.key}`} className="section-link">
                <span className="grow">
                  <strong>{i.title}</strong>
                  <span className="slot" style={{ display: 'block' }}>
                    {i.summary}
                  </span>
                  <span className="slot" style={{ display: 'block' }}>
                    {i.category} · As of {fmtDate(i.as_of)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function itemAsText(i: LibraryItem) {
  return `${i.title}\nAs of ${i.as_of}. ${i.changelog}\n\n${i.body.replace(/\*\*/g, '')}\n`;
}

export function LibraryItemPage() {
  const { key } = useParams();
  const { content, store } = useApp();
  const item = content.library.find((i) => i.key === key);
  if (!item) {
    return (
      <main id="main">
        <h1>Not found</h1>
        <Link to="/library">Back to the library</Link>
      </main>
    );
  }
  const slug = item.key.replace(/_/g, '-');
  return (
    <main id="main">
      <p>
        <Link to="/library">← Library</Link>
      </p>
      <article className="card">
        <span className="pill">{item.category}</span>
        <h1 style={{ marginTop: 8 }}>{item.title}</h1>
        <p className="small muted">
          As of {fmtDate(item.as_of)}. {item.changelog}
        </p>
        <Markdown text={item.body} />
      </article>
      {item.key === 'crit_card' && (
        <div className="card">
          <h2>CRIT at a glance</h2>
          <ol>
            {CRIT_ORDER.map((k) => (
              <li key={k}>
                <strong>{CRIT_LABELS[k]}</strong>
              </li>
            ))}
          </ol>
        </div>
      )}
      {item.link === 'guidelines_tool' && <CompanionLink target="guidelines_tool" />}
      {item.key === 'companion_apps' && (
        <>
          <CompanionLink target="pilot_tool" />
          <CompanionLink target="guidelines_tool" />
        </>
      )}
      <section className="card">
        <h2>Use this in your AI tool</h2>
        <p className="small">Download this item and upload it to your AI tool as reference material.</p>
        <div className="row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              store.logLink(`library:${item.key}`);
              downloadFile(`${slug}.txt`, itemAsText(item));
            }}
          >
            Download text file
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              store.logLink(`library:${item.key}`);
              downloadTextPdf(item.title, item.as_of, item.body);
            }}
          >
            Download PDF
          </button>
        </div>
      </section>
    </main>
  );
}
