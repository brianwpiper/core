// Tiny renderer for library and section text. Supports paragraphs, "## " headings,
// "- " bullets, "1. " numbered lists, and **bold**. No raw HTML is ever rendered.
import { Fragment, type ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function Markdown({ text, className = 'md' }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  const out: ReactNode[] = [];
  blocks.forEach((block, bi) => {
    const lines = block.split('\n');
    let para: string[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;
    const flushPara = () => {
      if (para.length) out.push(<p key={`${bi}-p-${out.length}`}>{inline(para.join(' '))}</p>);
      para = [];
    };
    const flushList = () => {
      if (!list) return;
      const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
      out.push(list.ordered ? <ol key={`${bi}-ol-${out.length}`}>{items}</ol> : <ul key={`${bi}-ul-${out.length}`}>{items}</ul>);
      list = null;
    };
    for (const line of lines) {
      const h = line.match(/^##\s+(.*)/);
      const ul = line.match(/^\s*[-*]\s+(.*)/);
      const ol = line.match(/^\s*\d+\.\s+(.*)/);
      if (h) {
        flushPara();
        flushList();
        out.push(<h2 key={`${bi}-h-${out.length}`}>{inline(h[1])}</h2>);
      } else if (ul || ol) {
        flushPara();
        const ordered = !!ol;
        if (!list || list.ordered !== ordered) {
          flushList();
          list = { ordered, items: [] };
        }
        list.items.push((ul ?? ol)![1]);
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
  });
  return <div className={className}>{out}</div>;
}
