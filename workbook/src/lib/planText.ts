import type { Plan, Profile } from './types';
import { fmtNumber } from './template';
import { EVENT_NAME } from '../content/settings';

export function planRows(plan: Plan, defaultCheckin: string): [string, string][] {
  const actions = plan.actions.filter((a) => a?.trim());
  return [
    ['Opportunity', plan.opportunity ?? ''],
    ['People involved', plan.people ?? ''],
    ['First actions', actions.map((a, i) => `${i + 1}. ${a}`).join('\n')],
    ['Guardrails', plan.guardrails ?? ''],
    ['Tool', plan.tool ?? ''],
    [
      'Success measure',
      plan.current_value !== null || plan.target_value !== null
        ? `From ${fmtNumber(plan.current_value) || '?'} to ${fmtNumber(plan.target_value) || '?'} ${plan.unit ?? ''}`.trim()
        : '',
    ],
    ['Stop or change condition', plan.stop_condition ?? ''],
    ['Check-in date', plan.checkin_date || defaultCheckin],
  ];
}

export function planToText(plan: Plan, profile: Profile, defaultCheckin: string) {
  const who = [profile.first_name, profile.organization].filter(Boolean).join(', ');
  const lines = [`My 90-day AI plan${who ? ` (${who})` : ''}`, `From the ${EVENT_NAME}`, ''];
  for (const [label, value] of planRows(plan, defaultCheckin)) {
    lines.push(`${label}:`);
    lines.push(value ? value : '(not filled in yet)');
    lines.push('');
  }
  return lines.join('\n').trim();
}
