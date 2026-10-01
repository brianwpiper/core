// Content = defaults shipped in the build, overridden by rows admins edit in
// the database. An empty database means "use the defaults".

import type { ContentBundle, ContentRow, ContentTable, LibraryItem, PromptCard, Section, Suggestion, Settings, LiveState } from './types';
import { DEFAULT_SECTIONS } from '../content/sections';
import { DEFAULT_PROMPTS } from '../content/prompts';
import { DEFAULT_SUGGESTIONS } from '../content/suggestions';
import { DEFAULT_LIBRARY } from '../content/library';
import { DEFAULT_SETTINGS } from '../content/settings';

export const DEFAULT_CONTENT: ContentBundle = {
  sections: DEFAULT_SECTIONS,
  prompts: DEFAULT_PROMPTS,
  suggestions: DEFAULT_SUGGESTIONS,
  library: DEFAULT_LIBRARY,
};

function apply<T extends { key: string }>(defaults: T[], rows: ContentRow[] | undefined): T[] {
  const byKey = new Map(defaults.map((d) => [d.key, d]));
  for (const r of rows ?? []) {
    byKey.set(r.key, { ...(byKey.get(r.key) ?? {}), ...r.data, key: r.key, version: r.version, as_of: r.as_of, retired: r.retired } as T);
  }
  return [...byKey.values()].filter((x: any) => !x.retired);
}

export function mergeContent(rows: Partial<Record<ContentTable, ContentRow[]>>): ContentBundle {
  const sections = apply<Section>(DEFAULT_SECTIONS, rows.sections).sort((a, b) => a.number - b.number);
  const prompts = Object.fromEntries(
    apply<PromptCard>(Object.values(DEFAULT_PROMPTS), rows.prompts).map((p) => [p.key, p]),
  );
  const suggestions = apply<Suggestion>(DEFAULT_SUGGESTIONS, rows.suggestions);
  const library = apply<LibraryItem>(DEFAULT_LIBRARY, rows.library_items);
  return { sections, prompts, suggestions, library };
}

/** Everything including retired items, for the admin editor. */
export function allContentItems(table: ContentTable, rows: ContentRow[]): any[] {
  const defaults: { key: string }[] =
    table === 'sections'
      ? DEFAULT_SECTIONS
      : table === 'prompts'
        ? Object.values(DEFAULT_PROMPTS)
        : table === 'suggestions'
          ? DEFAULT_SUGGESTIONS
          : DEFAULT_LIBRARY;
  const byKey = new Map<string, any>(defaults.map((d) => [d.key, { ...d, _source: 'default' }]));
  for (const r of rows) {
    byKey.set(r.key, {
      ...(byKey.get(r.key) ?? {}),
      ...r.data,
      key: r.key,
      version: r.version,
      as_of: r.as_of,
      retired: r.retired,
      _source: 'edited',
    });
  }
  return [...byKey.values()];
}

export function mergeSettings(live: LiveState | null): Settings {
  const s = { ...DEFAULT_SETTINGS };
  for (const [k, v] of Object.entries(live?.settings ?? {})) {
    if (typeof v === 'string' && v.trim() !== '') (s as any)[k] = v.trim();
  }
  return s;
}

export function suggestionsFor(all: Suggestion[], industry: string | null, role: string | null) {
  const match = (list: string[], v: string | null) => list.length === 0 || (!!v && list.includes(v));
  const scored = all
    .filter((s) => match(s.industries, industry) && match(s.roles, role))
    .map((s) => ({ s, score: (s.industries.length ? 2 : 0) + (s.roles.length ? 1 : 0) }));
  return scored.sort((a, b) => b.score - a.score).map((x) => x.s);
}
