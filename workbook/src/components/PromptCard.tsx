import { useMemo, useState, type ReactNode } from 'react';
import { useApp, useData } from '../app/AppContext';
import { buildVars, renderPrompt } from '../lib/template';
import type { PromptCard as Card } from '../lib/types';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and some in-app webviews
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function highlightPlaceholders(text: string): ReactNode[] {
  return text.split(/(\[[^\]\n]{2,80}\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={i} className="placeholder-var">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

interface Props {
  promptKey?: string;
  card?: Card;
  extraVars?: Record<string, string>;
  defaultOpen?: boolean;
}

export function PromptCard({ promptKey, card: cardProp, extraVars, defaultOpen }: Props) {
  const { content, store, settings } = useApp();
  const data = useData();
  const card = cardProp ?? (promptKey ? content.prompts[promptKey] : undefined);
  const [copied, setCopied] = useState<null | 'ok' | 'fail'>(null);
  const [open, setOpen] = useState(!!defaultOpen);

  const rendered = useMemo(
    () => (card ? renderPrompt(card, { ...buildVars(data, settings), ...extraVars }) : null),
    [card, data, settings, extraVars],
  );
  if (!card || !rendered) return null;

  const onCopy = async () => {
    const ok = await copyText(rendered.text);
    setCopied(ok ? 'ok' : 'fail');
    if (ok) store.logLink(`prompt:${card.key}@v${card.version}`);
  };

  const headingId = `prompt-${card.key}`;
  return (
    <section className={`card prompt-card ${open ? '' : 'collapsed'}`} aria-labelledby={headingId}>
      <h3 id={headingId}>{card.title}</h3>
      <p className="when">{card.when}</p>
      <div className="crit-parts" id={`${headingId}-body`}>
        {rendered.parts.map((p) => (
          <div key={p.key} className={`crit-part ${p.key}`}>
            <span className="crit-label">{p.label}</span>
            {highlightPlaceholders(p.text)}
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn big" onClick={onCopy}>
          Copy prompt
        </button>
        <button
          type="button"
          className="btn ghost"
          aria-expanded={open}
          aria-controls={`${headingId}-body`}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Show less' : 'Show full prompt'}
        </button>
      </div>
      <div aria-live="polite">
        {copied === 'ok' && (
          <p className="copy-confirm">Copied. Paste this into your AI tool. Keep that chat open, you'll build on it.</p>
        )}
        {copied === 'fail' && (
          <p className="notice err">Your browser blocked copying. Tap "Show full prompt", then select the text and copy it.</p>
        )}
      </div>
      <p className="prompt-meta">
        Highlighted text in [brackets] is a gap to fill in. Prompt {card.key}, version {card.version}.
      </p>
    </section>
  );
}
