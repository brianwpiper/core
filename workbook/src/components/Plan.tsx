import { useEffect, useId, useState } from 'react';
import { useApp, useData } from '../app/AppContext';
import { planHasMeasures, emptyPlan } from '../lib/store';
import { chosenUseCase, sortedUseCases } from '../lib/template';
import { planToText } from '../lib/planText';
import { downloadPlanPdf } from '../lib/pdf';
import type { Plan } from '../lib/types';
import { NumberInput, TextInput } from './Field';
import { PromptCard, copyText } from './PromptCard';

export function PlanForm() {
  const { store, settings } = useApp();
  const data = useData();
  const plan: Plan = data.plan ?? emptyPlan();
  const set = (patch: Partial<Plan>) => store.setPlan(patch);
  const list = sortedUseCases(data);
  const selectId = useId();
  const dateId = useId();

  // First visit: pre-fill from the chosen use case and tool.
  useEffect(() => {
    if (data.plan) return;
    const uc = chosenUseCase(data);
    const tool = data.captures['s6.chosen_tool']?.value;
    if (!uc && !tool) return;
    store.setPlan({
      use_case_id: uc?.id ?? null,
      opportunity: uc ? [uc.name, uc.description].filter(Boolean).join(': ') : null,
      current_value: uc?.current_value ?? null,
      target_value: uc?.target_value ?? null,
      unit: uc?.unit ?? null,
      tool: typeof tool === 'string' ? tool : null,
      checkin_date: settings.day90Date,
    });
  }, []);

  const pickUseCase = (id: string) => {
    const uc = data.useCases[id];
    if (!uc) return set({ use_case_id: null });
    set({
      use_case_id: id,
      opportunity: [uc.name, uc.description].filter(Boolean).join(': '),
      current_value: plan.current_value ?? uc.current_value,
      target_value: plan.target_value ?? uc.target_value,
      unit: plan.unit || uc.unit,
    });
  };

  const actions = [0, 1, 2].map((i) => plan.actions[i] ?? '');
  const missing = [
    plan.current_value === null && 'current number',
    plan.target_value === null && 'target number',
    !plan.unit?.trim() && 'unit',
    !plan.stop_condition?.trim() && 'stop or change condition',
  ].filter(Boolean) as string[];
  const complete = !!plan.completed_at;

  return (
    <section className="card" aria-labelledby="plan-h">
      <h2 id="plan-h">My 90-day plan</h2>
      {complete && <p className="notice ok">Plan marked complete. You can still edit it.</p>}

      <div className="field">
        <label htmlFor={selectId}>Start from a use case on my list</label>
        <select id={selectId} value={plan.use_case_id ?? ''} onChange={(e) => pickUseCase(e.target.value)}>
          <option value="">Choose one</option>
          {list.map((u) => (
            <option key={u.id} value={u.id}>
              {u.is_pilot_candidate ? '★ ' : ''}
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <TextInput label="The opportunity" value={plan.opportunity ?? ''} onChange={(v) => set({ opportunity: v })} max={300} multiline />
      <TextInput
        label="People involved"
        value={plan.people ?? ''}
        onChange={(v) => set({ people: v })}
        max={300}
        placeholder="Roles are fine, for example: me, our office manager"
      />

      <fieldset>
        <legend>First actions (up to 3)</legend>
        {actions.map((a, i) => (
          <TextInput
            key={i}
            label={`Action ${i + 1}`}
            value={a}
            max={160}
            onChange={(v) => {
              const next = [...actions];
              next[i] = v;
              set({ actions: next });
            }}
          />
        ))}
      </fieldset>

      <TextInput
        label="Guardrails"
        value={plan.guardrails ?? ''}
        onChange={(v) => set({ guardrails: v })}
        max={500}
        multiline
        help="Point to the guidelines you wrote in the AI Guidelines Tool. For example: no customer names in prompts; I review every draft before it goes out."
      />
      <TextInput label="Tool" value={plan.tool ?? ''} onChange={(v) => set({ tool: v })} max={80} />

      <fieldset className="callout" style={{ whiteSpace: 'normal' }}>
        <legend style={{ fontSize: '1.05rem' }}>How you will measure success (required)</legend>
        <p className="small" style={{ marginTop: 0 }}>
          These numbers are your baseline. At day 90 you will compare against them.
        </p>
        <div className="grid-2">
          <NumberInput label="Current state (number)" value={plan.current_value} onChange={(v) => set({ current_value: v })} required placeholder="6" />
          <NumberInput label="Target (number)" value={plan.target_value} onChange={(v) => set({ target_value: v })} required placeholder="2" />
        </div>
        <TextInput label="Unit" value={plan.unit ?? ''} onChange={(v) => set({ unit: v })} max={40} required placeholder="hours per week" />
        <TextInput
          label="Stop or change condition"
          value={plan.stop_condition ?? ''}
          onChange={(v) => set({ stop_condition: v })}
          max={300}
          multiline
          required
          help="When would you stop or change course? For example: if it still takes more than 4 hours a week after 6 weeks."
        />
      </fieldset>

      <div className="field">
        <label htmlFor={dateId}>Check-in date</label>
        <input id={dateId} type="date" value={plan.checkin_date || settings.day90Date} onChange={(e) => set({ checkin_date: e.target.value })} />
      </div>

      <div aria-live="polite">
        {!planHasMeasures(plan) && <p className="notice info">To mark your plan complete, fill in: {missing.join(', ')}.</p>}
      </div>
      <div className="row">
        {complete ? (
          <button type="button" className="btn secondary" onClick={() => set({ completed_at: null })}>
            Mark as not complete
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={!planHasMeasures(plan)}
            onClick={() => {
              set({ completed_at: new Date().toISOString() });
              store.setSectionDone('s7', true);
            }}
          >
            Mark plan complete
          </button>
        )}
      </div>
      <PlanExport />
    </section>
  );
}

export function PlanExport() {
  const { settings } = useApp();
  const data = useData();
  const [copied, setCopied] = useState(false);
  const plan = data.plan ?? emptyPlan();
  return (
    <div className="row" style={{ marginTop: 14 }}>
      <button type="button" className="btn secondary" onClick={() => downloadPlanPdf(plan, data.profile, settings.day90Date)}>
        Download one-page PDF
      </button>
      <button
        type="button"
        className="btn secondary"
        onClick={async () => setCopied(await copyText(planToText(plan, data.profile, settings.day90Date)))}
      >
        Copy plan as text
      </button>
      <span aria-live="polite" className="small">
        {copied && 'Copied. Paste it into your AI tool.'}
      </span>
    </div>
  );
}

export function PlanComposer() {
  return (
    <>
      <h2>Pressure-test your plan</h2>
      <p>This prompt is built from your plan above. Paste it into the same AI chat you have used all day.</p>
      <PromptCard promptKey="plan_pressure_test" />
    </>
  );
}
