// Copy standards from the design doc (C4 and C6), checked in the admin editor
// and by `npm run check:copy`. Keep in step with scripts/check-copy.mjs.

export const COPY_RULES: { id: string; test: RegExp; message: string }[] = [
  { id: 'em-dash', test: /—/, message: 'Contains an em dash. Use a period, comma, or colon instead.' },
  { id: 'policy', test: /\bpolic(y|ies)\b/i, message: 'Says "policy". Say "guidelines" instead.' },
  {
    id: 'not-but',
    test: /\bnot\s+(?:just\s+|only\s+)?[^.;:!?\n]{1,40}?,?\s+but\s/i,
    message: 'Looks like "not X but Y" phrasing. Say what it is directly.',
  },
];

export function copyIssues(text: string): string[] {
  return COPY_RULES.filter((r) => r.test.test(text)).map((r) => r.message);
}

export function copyIssuesDeep(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'string') copyIssues(v).forEach((m) => found.add(m));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(value);
  return [...found];
}
