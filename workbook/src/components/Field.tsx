import { useId } from 'react';
import { useApp, useData } from '../app/AppContext';
import type { FieldDef } from '../lib/types';

export function useCapture<T = unknown>(section: string, field: string): [T | undefined, (v: T) => void] {
  const { store } = useApp();
  const data = useData();
  const value = data.captures[`${section}.${field}`]?.value as T | undefined;
  return [value, (v: T) => store.setCapture(section, field, v as any)];
}

export function isFilled(v: unknown) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'boolean') return v;
  return true;
}

export function TextInput(props: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  help?: string;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const auto = useId();
  const id = props.id ?? auto;
  const helpId = `${id}-help`;
  const len = props.value?.length ?? 0;
  return (
    <div className="field">
      <label htmlFor={id}>
        {props.label} {props.required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      {props.help && (
        <p className="help" id={helpId}>
          {props.help}
        </p>
      )}
      {props.multiline ? (
        <textarea
          id={id}
          value={props.value ?? ''}
          maxLength={props.max}
          placeholder={props.placeholder}
          aria-describedby={props.help ? helpId : undefined}
          aria-required={props.required}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={props.type ?? 'text'}
          value={props.value ?? ''}
          maxLength={props.max}
          placeholder={props.placeholder}
          aria-describedby={props.help ? helpId : undefined}
          aria-required={props.required}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      {props.max && len > props.max * 0.7 && (
        <div className="counter" aria-live="polite">
          {len} of {props.max} characters
        </div>
      )}
    </div>
  );
}

export function NumberInput(props: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  required?: boolean;
  help?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {props.label} {props.required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      {props.help && <p className="help">{props.help}</p>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        placeholder={props.placeholder}
        aria-required={props.required}
        value={props.value === null || props.value === undefined ? '' : String(props.value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return props.onChange(null);
          const n = Number(raw);
          props.onChange(Number.isFinite(n) ? n : null);
        }}
      />
    </div>
  );
}

export function Scale({
  label,
  value,
  onChange,
  low = 'Low',
  high = 'High',
  name,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number) => void;
  low?: string;
  high?: string;
  name: string;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="scale">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <span>
              {n}
              <span className="sr-only">{n === 1 ? ` (${low})` : n === 5 ? ` (${high})` : ''}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="scale-labels" aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

export function CaptureField({ section, field }: { section: string; field: FieldDef }) {
  const { store } = useApp();
  const [value, setValue] = useCapture<any>(section, field.key);
  const [other, setOther] = useCapture<string>(section, `${field.key}_other`);
  const name = useId();

  const save = (v: any) => {
    setValue(v);
    if (field.syncProfile) store.setProfile({ [field.syncProfile]: v } as any);
  };

  if (field.kind === 'checkbox') {
    return (
      <div className="field">
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => save(e.target.checked)} />
          <span>{field.label}</span>
        </label>
        {field.help && <p className="help">{field.help}</p>}
      </div>
    );
  }

  if (field.kind === 'choice') {
    return (
      <fieldset>
        <legend>
          {field.label} {field.required && <span className="required-mark" aria-hidden="true">*</span>}
        </legend>
        {field.help && <p className="help">{field.help}</p>}
        <div className="choices">
          {field.options?.map((o) => (
            <label key={o.value} className="choice">
              <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => save(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.kind === 'multi') {
    const selected: string[] = Array.isArray(value) ? value : [];
    const max = field.max ?? 99;
    const toggle = (v: string) =>
      save(selected.includes(v) ? selected.filter((x) => x !== v) : selected.length < max ? [...selected, v] : selected);
    return (
      <fieldset>
        <legend>
          {field.label} {field.required && <span className="required-mark" aria-hidden="true">*</span>}
        </legend>
        {field.help && <p className="help">{field.help}</p>}
        <div className="choices">
          {field.options?.map((o) => {
            const on = selected.includes(o.value);
            const disabled = !on && selected.length >= max;
            return (
              <label key={o.value} className={`choice ${disabled ? 'disabled' : ''}`}>
                <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(o.value)} />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
        <p className="small muted" aria-live="polite">
          {selected.length} of {max} chosen
        </p>
        {field.allowOther && (
          <TextInput label="Other (optional)" value={other ?? ''} onChange={setOther} max={120} />
        )}
      </fieldset>
    );
  }

  if (field.kind === 'number') {
    return (
      <NumberInput
        label={field.label}
        value={typeof value === 'number' ? value : null}
        onChange={save}
        required={field.required}
        help={field.help}
      />
    );
  }

  return (
    <TextInput
      label={field.label}
      value={typeof value === 'string' ? value : ''}
      onChange={save}
      max={field.max ?? (field.kind === 'textarea' ? 500 : 200)}
      help={field.help}
      required={field.required}
      placeholder={field.placeholder}
      multiline={field.kind === 'textarea'}
    />
  );
}
