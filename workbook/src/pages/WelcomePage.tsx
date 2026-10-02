import { useId, useState } from 'react';
import { useApp, useData } from '../app/AppContext';
import { BrandMark } from '../components/Layout';
import { TextInput } from '../components/Field';
import { AI_TOOL_LABELS, INDUSTRIES, ROLES, SIZE_BANDS } from '../lib/options';
import type { Profile } from '../lib/types';

function Select({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const id = useId();
  // Keep an imported Eventbrite answer selectable even if it is not on our list.
  const opts = value && !options.some((o) => o.value === value) ? [{ value, label: value }, ...options] : options;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-required={required}>
        <option value="">Choose one</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const asOpts = (l: string[]) => l.map((x) => ({ value: x, label: x }));

export function WelcomePage() {
  const { store } = useApp();
  const data = useData();
  const [p, setP] = useState<Profile>(data.profile);
  const [agree, setAgree] = useState(!!data.profile.consent_at);
  const [error, setError] = useState('');
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = [
      !p.first_name?.trim() && 'first name',
      !p.organization?.trim() && 'organization',
      !p.industry && 'industry',
      !p.role && 'role',
      !p.attendance_type && 'how you are attending',
      !agree && 'the privacy note',
    ].filter(Boolean);
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}.`);
      return;
    }
    const now = new Date().toISOString();
    store.setProfile({
      first_name: p.first_name?.trim() ?? null,
      last_name: p.last_name,
      organization: p.organization?.trim() ?? null,
      industry: p.industry,
      role: p.role,
      size_band: p.size_band,
      attendance_type: p.attendance_type,
      ai_tool: p.ai_tool,
      consent_at: data.profile.consent_at ?? now,
      onboarded_at: now,
    });
    if (p.ai_tool) store.setCapture('s0', 'ai_tool', p.ai_tool);
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <header className="app-header">
        <div className="bar">
          <span className="brand">
            <BrandMark />
            <span className="brand-text">
              Summit Workbook<small>Main Street Event AI Summit</small>
            </span>
          </span>
        </div>
      </header>
      <main id="main">
        <h1>Welcome{data.profile.first_name ? `, ${data.profile.first_name}` : ''}</h1>
        <p>
          This workbook is where you will work all day at the Summit, and where you will come back at day 90. Two quick steps
          and you are in.
        </p>
        <form onSubmit={submit} noValidate>
          <section className="card" aria-labelledby="privacy-h">
            <h2 id="privacy-h">1. How your information is used</h2>
            <ul>
              <li>
                <strong>What we store:</strong> your profile and the short answers you type here. Nothing you type into your own AI
                tool comes back to us.
              </li>
              <li>
                <strong>Who can see it:</strong> only you. Facilitators see room-level totals, never your answers.
              </li>
              <li>
                <strong>How we use it:</strong> combined with everyone else's answers for the day-90 outcome report.
              </li>
              <li>
                <strong>Your control:</strong> you can download or delete your entries any time from "My data".
              </li>
            </ul>
            <label className="check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I understand how my information is used</span>
            </label>
          </section>

          <section className="card" aria-labelledby="profile-h">
            <h2 id="profile-h">2. Check your details</h2>
            <p className="small muted">
              We filled in what we had from registration. Your industry and role help us suggest ideas that fit your business.
            </p>
            <div className="grid-2">
              <TextInput label="First name" value={p.first_name ?? ''} onChange={(v) => set({ first_name: v })} max={80} required />
              <TextInput label="Last name" value={p.last_name ?? ''} onChange={(v) => set({ last_name: v })} max={80} />
            </div>
            <TextInput label="Organization" value={p.organization ?? ''} onChange={(v) => set({ organization: v })} max={160} required />
            <Select label="Industry" value={p.industry ?? ''} options={asOpts(INDUSTRIES)} onChange={(v) => set({ industry: v || null })} required />
            <Select label="Your role" value={p.role ?? ''} options={asOpts(ROLES)} onChange={(v) => set({ role: v || null })} required />
            <Select label="Number of employees" value={p.size_band ?? ''} options={asOpts(SIZE_BANDS)} onChange={(v) => set({ size_band: v || null })} />
            <fieldset>
              <legend>
                How are you attending? <span className="required-mark" aria-hidden="true">*</span>
              </legend>
              <div className="choices">
                {[
                  { v: 'in_person', l: 'In person' },
                  { v: 'virtual', l: 'Virtually' },
                ].map((o) => (
                  <label key={o.v} className="choice">
                    <input
                      type="radio"
                      name="attendance"
                      checked={p.attendance_type === o.v}
                      onChange={() => set({ attendance_type: o.v as Profile['attendance_type'] })}
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Select
              label="Which AI tool do you plan to use?"
              value={p.ai_tool ?? ''}
              options={Object.entries(AI_TOOL_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={(v) => set({ ai_tool: v || null })}
            />
          </section>
          {error && (
            <p className="notice err" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn big">
            Open my workbook
          </button>
        </form>
      </main>
    </div>
  );
}
