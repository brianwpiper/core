// Prompt templating. Everything happens in the browser (constraint C1).
// Variables look like {{organization}}. Empty values become a readable
// placeholder so the prompt still works when pasted.

import type { PromptCard, UserData, UseCase, Settings } from './types';
import { AREA_LABELS, AI_TOOL_LABELS } from './options';

export const PLACEHOLDERS: Record<string, string> = {
  first_name: '[your name]',
  organization: '[your business]',
  industry: '[your industry]',
  role: '[your role]',
  size_band: '[number of employees]',
  ai_tool: '[your AI tool]',
  attendance: '[in person or virtual]',
  concerns: '[your top concerns about AI]',
  keynote_idea: '[an idea from the keynote]',
  opportunity_areas: '[the areas where AI could help most]',
  use_case_list: '[your list of possible AI uses]',
  chosen_use_case: '[the use case you picked]',
  chosen_use_case_description: '[what that use case involves]',
  chosen_use_case_baseline: '[how it works today, with a number]',
  tools_seen: '[tools you saw today]',
  tool_comparison: '[the tools you compared]',
  chosen_tool: '[the tool you chose]',
  plan_opportunity: '[the opportunity]',
  plan_people: '[who is involved]',
  plan_actions: '[your first actions]',
  plan_guardrails: '[your guardrails]',
  plan_measure: '[current number, target number, unit]',
  plan_stop: '[when you would stop or change course]',
  plan_checkin: '[check-in date]',
  next_step: '[your next step]',
};

export type Vars = Record<string, string>;

export function fill(template: string, vars: Vars): string {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_m, name: string) => {
    const v = vars[name];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    return PLACEHOLDERS[name] ?? `[${name.replace(/_/g, ' ')}]`;
  });
}

export const CRIT_LABELS = {
  context: 'Context',
  role: 'Role',
  interview: 'Interview',
  task: 'Task',
} as const;

export type CritPart = keyof typeof CRIT_LABELS;
export const CRIT_ORDER: CritPart[] = ['context', 'role', 'interview', 'task'];

export function renderPrompt(card: PromptCard, vars: Vars) {
  const parts = CRIT_ORDER.map((k) => ({ key: k, label: CRIT_LABELS[k], text: fill(card[k] ?? '', vars).trim() }));
  const text = parts.map((p) => `${p.label.toUpperCase()}\n${p.text}`).join('\n\n');
  return { parts, text };
}

// --- Variables built from the attendee's own entries ------------------------

const cap = (d: UserData, section: string, field: string) => d.captures[`${section}.${field}`]?.value;

const asText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'object') return '';
  return String(v);
};

export function fmtNumber(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function baselineText(u: Pick<UseCase, 'current_value' | 'target_value' | 'unit'>) {
  const unit = u.unit?.trim() ?? '';
  const cur = fmtNumber(u.current_value);
  const tgt = fmtNumber(u.target_value);
  if (!cur && !tgt) return '';
  const bits = [];
  if (cur) bits.push(`today ${cur} ${unit}`.trim());
  if (tgt) bits.push(`target ${tgt} ${unit}`.trim());
  return bits.join(', ');
}

export function useCaseLine(u: UseCase, i: number) {
  const bits = [`${i + 1}. ${u.name}`];
  if (u.area) bits.push(`(${AREA_LABELS[u.area] ?? u.area})`);
  if (u.description) bits.push(`: ${u.description}`);
  const ratings = [
    u.impact ? `impact ${u.impact}/5` : '',
    u.effort ? `effort ${u.effort}/5` : '',
    u.risk ? `risk ${u.risk}/5` : '',
  ].filter(Boolean);
  if (ratings.length) bits.push(`. My ratings: ${ratings.join(', ')}`);
  const base = baselineText(u);
  if (base) bits.push(`. Numbers: ${base}`);
  if (u.is_pilot_candidate) bits.push('. Starred as a pilot candidate');
  return bits.join(' ').replace(/ :/g, ':').replace(/ \./g, '.');
}

export function sortedUseCases(d: UserData) {
  return Object.values(d.useCases).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function chosenUseCase(d: UserData): UseCase | null {
  const id = (d.plan?.use_case_id as string) || (asText(cap(d, 's4', 'pilot_id')) as string);
  if (id && d.useCases[id]) return d.useCases[id];
  const starred = sortedUseCases(d).find((u) => u.is_pilot_candidate);
  return starred ?? null;
}

export function buildVars(d: UserData, settings?: Partial<Settings>): Vars {
  const p = d.profile;
  const list = sortedUseCases(d);
  const chosen = chosenUseCase(d);

  const toolsSeen = (cap(d, 's5', 'tools_seen') as any[] | undefined) ?? [];
  const compare = (cap(d, 's6', 'tool_compare') as any[] | undefined) ?? [];
  const plan = d.plan;

  const concerns = [
    ...((cap(d, 's1', 'concerns') as string[] | undefined) ?? []).map((c) => CONCERN_TEXT[c] ?? c),
    asText(cap(d, 's1', 'concerns_other')),
  ].filter(Boolean);

  const areas = ((cap(d, 's3', 'opportunity_areas') as string[] | undefined) ?? []).map(
    (a) => AREA_LABELS[a as keyof typeof AREA_LABELS] ?? a,
  );

  const aiTool = p.ai_tool ? AI_TOOL_LABELS[p.ai_tool] ?? p.ai_tool : '';

  const planMeasure =
    plan && (plan.current_value !== null || plan.target_value !== null)
      ? `from ${fmtNumber(plan.current_value) || '?'} to ${fmtNumber(plan.target_value) || '?'} ${plan.unit ?? ''}`.trim()
      : '';

  return {
    first_name: p.first_name ?? '',
    organization: p.organization ?? '',
    industry: p.industry && p.industry !== 'Other' ? p.industry.toLowerCase() : '',
    role: p.role && p.role !== 'Other' ? p.role.toLowerCase() : '',
    size_band: p.size_band ? `${p.size_band} employees` : '',
    ai_tool: aiTool && p.ai_tool !== 'none' ? aiTool : '',
    attendance: p.attendance_type === 'virtual' ? 'virtually' : p.attendance_type === 'in_person' ? 'in person' : '',
    concerns: concerns.join('; '),
    keynote_idea: asText(cap(d, 's2', 'keynote_idea')),
    opportunity_areas: areas.join(', '),
    use_case_list: list.map(useCaseLine).join('\n'),
    chosen_use_case: plan?.opportunity || chosen?.name || '',
    chosen_use_case_description: chosen?.description ?? '',
    chosen_use_case_baseline: chosen ? baselineText(chosen) : '',
    tools_seen: toolsSeen
      .filter((t) => t?.name)
      .map((t) => `${t.name}${t.goodAt ? ` (good at: ${t.goodAt})` : ''}${t.fit ? `, fit for me: ${t.fit}` : ''}`)
      .join('\n'),
    tool_comparison: compare
      .filter((t) => t?.name)
      .map(
        (t) =>
          `${t.name}: fit ${t.fit ?? '?'}/5, cost ${t.cost ?? '?'}/5, ease of adoption ${t.ease ?? '?'}/5, data handling ${t.data ?? '?'}/5`,
      )
      .join('\n'),
    chosen_tool: plan?.tool || asText(cap(d, 's6', 'chosen_tool')),
    plan_opportunity: plan?.opportunity ?? '',
    plan_people: plan?.people ?? '',
    plan_actions: (plan?.actions ?? []).filter(Boolean).map((a, i) => `${i + 1}. ${a}`).join('\n'),
    plan_guardrails: plan?.guardrails ?? '',
    plan_measure: planMeasure,
    plan_stop: plan?.stop_condition ?? '',
    plan_checkin: plan?.checkin_date ?? settings?.day90Date ?? '',
    next_step: asText(cap(d, 's8', 'next_step')),
  };
}

export const CONCERN_TEXT: Record<string, string> = {
  data_privacy: 'keeping customer and business data private',
  accuracy: 'wrong or made-up answers',
  oversight: 'knowing who checks the output',
  cost: 'cost and unclear return',
  skills: 'my team not having the skills yet',
  trust: 'customers or staff not trusting it',
  legal: 'legal and copyright questions',
  jobs: 'what it means for jobs on my team',
  security: 'security of the tools themselves',
};
