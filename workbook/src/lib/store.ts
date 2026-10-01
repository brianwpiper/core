// Offline-first store (constraint C3).
//
// Every change is written to this browser's storage first, synchronously, so
// nothing typed is lost if the tab closes or the wifi drops. Changes also go
// into an outbox. The outbox flushes to the server after a short pause in
// typing, and retries with backoff (plus jitter, so 1,200 devices that come
// back online together do not all retry in the same second).

import type { Backend, Op, RemoteUserData, SyncTable } from './backend';
import type { Capture, CaptureValue, Plan, Profile, UseCase, UserData } from './types';
import { readJSON, writeJSON, removePrefix, uid } from './storage';

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'retrying';

export interface StoreState {
  data: UserData | null;
  status: SyncStatus;
  pending: number;
  lastSyncedAt: string | null;
  loadError: string | null;
}

const DEBOUNCE_MS = 1200;
const MAX_BACKOFF_MS = 60_000;

export const emptyPlan = (): Plan => ({
  use_case_id: null,
  opportunity: null,
  people: null,
  actions: [],
  guardrails: null,
  tool: null,
  current_value: null,
  target_value: null,
  unit: null,
  stop_condition: null,
  checkin_date: null,
  completed_at: null,
  updated_at: new Date().toISOString(),
});

export function planHasMeasures(p: Plan | null | undefined) {
  return !!(
    p &&
    p.current_value !== null &&
    p.current_value !== undefined &&
    !Number.isNaN(p.current_value) &&
    p.target_value !== null &&
    p.target_value !== undefined &&
    !Number.isNaN(p.target_value) &&
    p.unit?.trim() &&
    p.stop_condition?.trim()
  );
}

const now = () => new Date().toISOString();

/** Server rows win, except where this device has a change still waiting to sync. */
export function mergeRemote(remote: RemoteUserData, local: UserData | null, outbox: Map<string, Op>): UserData {
  const pending = (id: string) => outbox.has(id);
  const captures: Record<string, Capture> = {};
  for (const c of remote.captures) captures[`${c.section_key}.${c.field_key}`] = c;
  const useCases: Record<string, UseCase> = {};
  for (const u of remote.useCases) useCases[u.id] = { ...u, current_value: num(u.current_value), target_value: num(u.target_value) };
  const progress: Record<string, string> = {};
  for (const p of remote.progress) if (p.completed_at) progress[p.section_key] = p.completed_at;
  let plan = remote.plan
    ? { ...remote.plan, current_value: num(remote.plan.current_value), target_value: num(remote.plan.target_value), actions: remote.plan.actions ?? [] }
    : null;
  let profile = remote.profile;

  if (local) {
    for (const [k, c] of Object.entries(local.captures)) if (pending(`captures:${k}`)) captures[k] = c;
    for (const [id, u] of Object.entries(local.useCases)) if (pending(`use_cases:${id}`)) useCases[id] = u;
    for (const op of outbox.values()) if (op.table === 'use_cases' && op.kind === 'delete') delete useCases[op.row.id];
    for (const k of SECTION_PROGRESS_KEYS(local, remote)) {
      if (!pending(`section_progress:${k}`)) continue;
      if (local.progress[k]) progress[k] = local.progress[k];
      else delete progress[k];
    }
    if (pending('plans:me')) plan = local.plan;
    const profOp = outbox.get('profiles:me');
    if (profOp) profile = { ...profile, ...profOp.row };
  }
  return { profile, captures, useCases, plan, progress };
}

function SECTION_PROGRESS_KEYS(local: UserData, remote: RemoteUserData) {
  return new Set([...Object.keys(local.progress), ...remote.progress.map((p) => p.section_key)]);
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export class WorkbookStore {
  private state: StoreState = { data: null, status: 'saved', pending: 0, lastSyncedAt: null, loadError: null };
  private listeners = new Set<() => void>();
  private outbox = new Map<string, Op>();
  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private failures = 0;
  private userId: string | null = null;

  constructor(private backend: Backend) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.schedule(200));
      window.addEventListener('offline', () => this.set({ status: this.outbox.size ? 'offline' : this.state.status }));
      // Last chance to sync when the tab is hidden (phone locked, tab switched).
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush();
      });
    }
  }

  // --- React wiring ---------------------------------------------------------
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  getState = () => this.state;
  private set(patch: Partial<StoreState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  private get keys() {
    const u = this.userId!;
    return { data: `wb:v1:${u}:data`, outbox: `wb:v1:${u}:outbox` };
  }

  // --- Lifecycle ------------------------------------------------------------
  async load(userId: string) {
    this.userId = userId;
    const local = readJSON<UserData | null>(this.keys.data, null);
    const ops = readJSON<Op[]>(this.keys.outbox, []);
    this.outbox = new Map(ops.map((o) => [o.id, o]));
    this.seq = ops.reduce((m, o) => Math.max(m, o.seq), 0);
    // Show what this device already has straight away, even offline.
    if (local) this.set({ data: local, pending: this.outbox.size, loadError: null });

    try {
      const remote = await this.backend.pullUserData(userId);
      if (this.userId !== userId) return;
      // Merge against what is on screen now: the person may have typed while we waited.
      const merged = mergeRemote(remote, this.state.data ?? local, this.outbox);
      writeJSON(this.keys.data, merged);
      this.set({ data: merged, loadError: null, lastSyncedAt: now() });
    } catch (e) {
      if (!local) this.set({ loadError: (e as Error).message || 'Could not load your workbook.' });
    }
    this.schedule(500);
  }

  unload() {
    this.flush();
    this.userId = null;
    this.outbox.clear();
    this.set({ data: null, status: 'saved', pending: 0, loadError: null });
  }

  /** Remove everything this device holds for the user. */
  clearLocal(userId: string) {
    removePrefix(`wb:v1:${userId}:`);
  }

  // --- Writes -----------------------------------------------------------------
  private mutate(fn: (d: UserData) => UserData, ops: Omit<Op, 'seq'>[]) {
    const d = this.state.data;
    if (!d) return;
    const next = fn(d);
    for (const op of ops) {
      const prev = this.outbox.get(op.id);
      const row = op.table === 'profiles' && prev && op.kind === 'upsert' ? { ...prev.row, ...op.row } : op.row;
      this.outbox.set(op.id, { ...op, row, seq: ++this.seq });
    }
    writeJSON(this.keys.data, next);
    writeJSON(this.keys.outbox, [...this.outbox.values()]);
    this.set({ data: next, pending: this.outbox.size, status: navigator.onLine ? 'saving' : 'offline' });
    this.schedule();
  }

  setCapture(section: string, field: string, value: CaptureValue) {
    const k = `${section}.${field}`;
    const c: Capture = { section_key: section, field_key: field, value, updated_at: now() };
    this.mutate((d) => ({ ...d, captures: { ...d.captures, [k]: c } }), [
      { id: `captures:${k}`, table: 'captures', kind: 'upsert', row: c },
    ]);
  }

  setProfile(patch: Partial<Profile>) {
    const clean = { ...patch };
    delete (clean as any).user_id;
    delete (clean as any).email;
    this.mutate((d) => ({ ...d, profile: { ...d.profile, ...clean } }), [
      { id: 'profiles:me', table: 'profiles', kind: 'upsert', row: clean },
    ]);
  }

  setLastSection(key: string) {
    if (this.state.data && this.state.data.profile.last_section !== key) this.setProfile({ last_section: key });
  }

  saveUseCase(input: Partial<UseCase> & { name: string }): string {
    const d = this.state.data;
    const id = input.id ?? uid();
    const prev = d?.useCases[id];
    const u: UseCase = {
      id,
      area: null,
      description: null,
      source_section: null,
      is_suggested: false,
      suggestion_key: null,
      impact: null,
      effort: null,
      risk: null,
      current_value: null,
      target_value: null,
      unit: null,
      is_pilot_candidate: false,
      created_at: now(),
      ...prev,
      ...input,
      updated_at: now(),
    };
    this.mutate((dd) => ({ ...dd, useCases: { ...dd.useCases, [id]: u } }), [
      { id: `use_cases:${id}`, table: 'use_cases', kind: 'upsert', row: u },
    ]);
    return id;
  }

  deleteUseCase(id: string) {
    this.mutate(
      (d) => {
        const useCases = { ...d.useCases };
        delete useCases[id];
        return { ...d, useCases };
      },
      [{ id: `use_cases:${id}`, table: 'use_cases', kind: 'delete', row: { id } }],
    );
  }

  setPlan(patch: Partial<Plan>) {
    const d = this.state.data;
    if (!d) return;
    const plan: Plan = { ...(d.plan ?? emptyPlan()), ...patch, updated_at: now() };
    // A complete plan that loses a required measure is no longer complete.
    if (plan.completed_at && !planHasMeasures(plan)) plan.completed_at = null;
    this.mutate((dd) => ({ ...dd, plan }), [{ id: 'plans:me', table: 'plans', kind: 'upsert', row: plan }]);
  }

  setSectionDone(section: string, done: boolean) {
    const at = now();
    this.mutate(
      (d) => {
        const progress = { ...d.progress };
        if (done) progress[section] = at;
        else delete progress[section];
        return { ...d, progress };
      },
      [
        {
          id: `section_progress:${section}`,
          table: 'section_progress',
          kind: done ? 'upsert' : 'delete',
          row: { section_key: section, completed_at: at },
        },
      ],
    );
  }

  logLink(target: string) {
    const id = uid();
    this.mutate((d) => d, [{ id: `link_events:${id}`, table: 'link_events', kind: 'upsert', row: { id, target, opened_at: now() } }]);
  }

  // --- Sync -------------------------------------------------------------------
  private schedule(ms = DEBOUNCE_MS) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), ms);
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.flushing || !this.userId) return;
    if (this.outbox.size === 0) {
      this.set({ status: 'saved', pending: 0 });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.set({ status: 'offline' });
      return;
    }
    this.flushing = true;
    this.set({ status: 'saving' });
    const batch = [...this.outbox.values()].sort((a, b) => a.seq - b.seq);
    const userId = this.userId;
    try {
      await this.backend.push(userId, batch);
      if (this.userId !== userId) return;
      // Only clear ops that were not changed again while the request was in flight.
      for (const op of batch) if (this.outbox.get(op.id)?.seq === op.seq) this.outbox.delete(op.id);
      writeJSON(this.keys.outbox, [...this.outbox.values()]);
      this.failures = 0;
      this.set({ status: this.outbox.size ? 'saving' : 'saved', pending: this.outbox.size, lastSyncedAt: now() });
      if (this.outbox.size) this.schedule(300);
    } catch {
      this.failures++;
      const backoff = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.failures);
      const jitter = Math.random() * backoff * 0.5;
      this.set({ status: navigator.onLine ? 'retrying' : 'offline' });
      this.schedule(backoff + jitter);
    } finally {
      this.flushing = false;
    }
  }

  /** For "Download my data". */
  exportLocal() {
    return this.state.data;
  }
}

export const tableOf = (id: string) => id.split(':')[0] as SyncTable;
