import { describe, expect, it } from 'vitest';
import { buildVars, fill, renderPrompt, useCaseLine } from '../lib/template';
import { mergeRemote, planHasMeasures, emptyPlan } from '../lib/store';
import { copyIssues, copyIssuesDeep } from '../lib/copyRules';
import { mergeContent, suggestionsFor } from '../lib/content';
import { DEFAULT_PROMPTS } from '../content/prompts';
import { DEFAULT_SECTIONS } from '../content/sections';
import { DEFAULT_LIBRARY } from '../content/library';
import { DEFAULT_SUGGESTIONS } from '../content/suggestions';
import type { Op } from '../lib/backend';
import type { Profile, UserData, UseCase } from '../lib/types';

const profile: Profile = {
  user_id: 'u1', email: 'a@b.co', first_name: 'Pat', last_name: null, organization: 'Corner Hardware',
  industry: 'Retail', role: 'Owner or founder', size_band: '2 to 10', attendance_type: 'in_person',
  ai_tool: 'claude', eventbrite_order_id: null, consent_at: null, onboarded_at: null, last_section: null,
};
const uc = (over: Partial<UseCase> = {}): UseCase => ({
  id: 'x', name: 'Quote replies', area: 'communication', description: 'Draft replies', source_section: 's4',
  is_suggested: false, suggestion_key: null, impact: 4, effort: 2, risk: 1, current_value: 6, target_value: 2,
  unit: 'hours per week', is_pilot_candidate: true, created_at: '2026-11-13T10:00:00Z', updated_at: '2026-11-13T10:00:00Z', ...over,
});
const data = (over: Partial<UserData> = {}): UserData => ({ profile, captures: {}, useCases: {}, plan: null, progress: {}, ...over });

describe('templating', () => {
  it('fills known variables and shows readable placeholders for empty ones', () => {
    expect(fill('Hi {{organization}} in {{industry}}', { organization: 'Acme', industry: '' })).toBe('Hi Acme in [your industry]');
    expect(fill('{{unknown_thing}}', {})).toBe('[unknown thing]');
  });

  it('labels all four CRIT parts in order', () => {
    const r = renderPrompt(DEFAULT_PROMPTS.starter_context, buildVars(data()));
    expect(r.parts.map((p) => p.label)).toEqual(['Context', 'Role', 'Interview', 'Task']);
    expect(r.text).toMatch(/^CONTEXT\n/);
    expect(r.text).toContain('Corner Hardware');
    expect(r.text).toContain('2 to 10 employees');
  });

  it('builds the use case list for the composer', () => {
    const vars = buildVars(data({ useCases: { x: uc() } }));
    expect(vars.use_case_list).toContain('1. Quote replies (Communication): Draft replies');
    expect(vars.use_case_list).toContain('impact 4/5');
    expect(vars.use_case_list).toContain('today 6 hours per week');
    expect(vars.chosen_use_case).toBe('Quote replies');
    expect(useCaseLine(uc({ area: null, description: null, impact: null, effort: null, risk: null, current_value: null, target_value: null, is_pilot_candidate: false }), 0)).toBe('1. Quote replies');
  });

  it('every prompt in the build has all four CRIT parts and a version', () => {
    for (const p of Object.values(DEFAULT_PROMPTS)) {
      expect(p.context && p.role && p.interview && p.task, p.key).toBeTruthy();
      expect(p.version).toBeGreaterThan(0);
    }
  });

  it('every section references prompts that exist', () => {
    for (const s of DEFAULT_SECTIONS)
      for (const b of s.blocks) if (b.type === 'prompt') expect(DEFAULT_PROMPTS[b.prompt], `${s.key}:${b.prompt}`).toBeTruthy();
  });
});

describe('90-day plan', () => {
  it('needs current, target, unit and stop condition to be complete', () => {
    const p = emptyPlan();
    expect(planHasMeasures(p)).toBe(false);
    expect(planHasMeasures({ ...p, current_value: 6, target_value: 2, unit: 'hours', stop_condition: '' })).toBe(false);
    expect(planHasMeasures({ ...p, current_value: 0, target_value: 2, unit: 'hours', stop_condition: 'after 6 weeks' })).toBe(true);
  });
});

describe('offline merge', () => {
  const remote = {
    profile: { ...profile, organization: 'Server Org' },
    captures: [{ section_key: 's2', field_key: 'keynote_idea', value: 'server', updated_at: '2026-11-13T09:00:00Z' }],
    useCases: [uc({ id: 'r1', name: 'Server case' })],
    plan: null,
    progress: [{ section_key: 's0', completed_at: '2026-11-13T08:30:00Z' }],
  };

  it('server wins when nothing is pending', () => {
    const local = data({ captures: { 's2.keynote_idea': { section_key: 's2', field_key: 'keynote_idea', value: 'stale', updated_at: '' } } });
    const m = mergeRemote(remote, local, new Map());
    expect(m.captures['s2.keynote_idea'].value).toBe('server');
    expect(m.profile.organization).toBe('Server Org');
    expect(m.progress.s0).toBeTruthy();
  });

  it('keeps local changes that have not synced yet', () => {
    const local = data({
      captures: { 's2.keynote_idea': { section_key: 's2', field_key: 'keynote_idea', value: 'typed offline', updated_at: '' } },
      useCases: { l1: uc({ id: 'l1', name: 'Offline case' }) },
      progress: {},
    });
    const outbox = new Map<string, Op>([
      ['captures:s2.keynote_idea', { id: 'captures:s2.keynote_idea', table: 'captures', kind: 'upsert', row: {}, seq: 1 }],
      ['use_cases:l1', { id: 'use_cases:l1', table: 'use_cases', kind: 'upsert', row: {}, seq: 2 }],
      ['use_cases:r1', { id: 'use_cases:r1', table: 'use_cases', kind: 'delete', row: { id: 'r1' }, seq: 3 }],
      ['section_progress:s0', { id: 'section_progress:s0', table: 'section_progress', kind: 'delete', row: { section_key: 's0' }, seq: 4 }],
      ['profiles:me', { id: 'profiles:me', table: 'profiles', kind: 'upsert', row: { organization: 'Local Org' }, seq: 5 }],
    ]);
    const m = mergeRemote(remote, local, outbox);
    expect(m.captures['s2.keynote_idea'].value).toBe('typed offline');
    expect(m.useCases.l1?.name).toBe('Offline case');
    expect(m.useCases.r1).toBeUndefined();
    expect(m.progress.s0).toBeUndefined();
    expect(m.profile.organization).toBe('Local Org');
  });
});

describe('copy standards (C4, C6)', () => {
  it('flags em dashes, "policy", and "not X but Y"', () => {
    expect(copyIssues('AI — great')).toHaveLength(1);
    expect(copyIssues('Our AI policy')).toHaveLength(1);
    expect(copyIssues("It's not a tool, but a partner")).toHaveLength(1);
    expect(copyIssues('Write your AI guidelines.')).toHaveLength(0);
  });

  it('all built-in content passes', () => {
    expect(copyIssuesDeep([DEFAULT_PROMPTS, DEFAULT_SECTIONS, DEFAULT_LIBRARY, DEFAULT_SUGGESTIONS])).toEqual([]);
  });
});

describe('content overrides', () => {
  it('database rows override defaults and retired items disappear', () => {
    const b = mergeContent({
      prompts: [{ key: 'starter_context', data: { title: 'New title' }, version: 2, as_of: '2026-10-20', retired: false }],
      library_items: [{ key: 'glossary', data: {}, version: 2, as_of: '2026-10-20', retired: true }],
    });
    expect(b.prompts.starter_context.title).toBe('New title');
    expect(b.prompts.starter_context.version).toBe(2);
    expect(b.prompts.starter_context.task).toBe(DEFAULT_PROMPTS.starter_context.task);
    expect(b.library.find((i) => i.key === 'glossary')).toBeUndefined();
  });

  it('suggestions match industry and role, most specific first', () => {
    const s = suggestionsFor(DEFAULT_SUGGESTIONS, 'Retail', 'Owner or founder');
    expect(s[0].industries).toContain('Retail');
    expect(s.every((x) => (x.industries.length === 0 || x.industries.includes('Retail')) && (x.roles.length === 0 || x.roles.includes('Owner or founder')))).toBe(true);
  });
});
