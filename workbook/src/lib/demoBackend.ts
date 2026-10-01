// Demo mode: no server. Everything lives in this browser's storage so the
// whole app can be clicked through before Supabase is set up.
// Login code in demo mode is always 123456.

import type { Backend, Op, Session, AdminAttendee, ImportRow } from './backend';
import type { ContentRow, ContentTable, DashboardSummary, HelpRequest, LiveState, Profile, Role } from './types';
import { readJSON, writeJSON, uid, removeKey } from './storage';

export const DEMO_CODE = '123456';
const K = {
  session: 'wbdemo:session',
  previewRole: 'wbdemo:previewRole',
  users: 'wbdemo:users',
  data: (id: string) => `wbdemo:data:${id}`,
  content: 'wbdemo:content',
  live: 'wbdemo:live',
  help: 'wbdemo:help',
};

interface DemoUser {
  profile: Profile;
  roles: Role[];
}
interface DemoData {
  captures: Record<string, any>;
  useCases: Record<string, any>;
  plan: any;
  progress: Record<string, string | null>;
  links: any[];
}

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function emptyProfile(userId: string, email: string): Profile {
  return {
    user_id: userId,
    email,
    first_name: null,
    last_name: null,
    organization: null,
    industry: null,
    role: null,
    size_band: null,
    attendance_type: null,
    ai_tool: null,
    eventbrite_order_id: null,
    consent_at: null,
    onboarded_at: null,
    last_section: null,
  };
}

const SAMPLE_ATTENDEES: Partial<Profile>[] = [
  { email: 'pat@cornerhardware.example', first_name: 'Pat', organization: 'Corner Hardware', industry: 'Retail', attendance_type: 'in_person' },
  { email: 'jordan@brightdental.example', first_name: 'Jordan', organization: 'Bright Dental', industry: 'Health and wellness', attendance_type: 'virtual' },
  { email: 'sam@riverbistro.example', first_name: 'Sam', organization: 'River Bistro', industry: 'Restaurant and food service', attendance_type: 'in_person' },
];

function users(): Record<string, DemoUser> {
  const u = readJSON<Record<string, DemoUser> | null>(K.users, null);
  if (u) return u;
  const seeded: Record<string, DemoUser> = {};
  for (const s of SAMPLE_ATTENDEES) {
    const id = uid();
    seeded[s.email!] = { profile: { ...emptyProfile(id, s.email!), ...s }, roles: [] };
  }
  writeJSON(K.users, seeded);
  return seeded;
}
const saveUsers = (u: Record<string, DemoUser>) => writeJSON(K.users, u);
const findById = (id: string) => Object.values(users()).find((u) => u.profile.user_id === id);

function data(id: string): DemoData {
  return readJSON<DemoData>(K.data(id), { captures: {}, useCases: {}, plan: null, progress: {}, links: [] });
}

export function setDemoPreviewRole(role: Role) {
  writeJSON(K.previewRole, role);
}

export function createDemoBackend(): Backend {
  const listeners = new Set<(s: Session | null) => void>();
  const emit = (s: Session | null) => listeners.forEach((l) => l(s));

  return {
    mode: 'demo',

    async getSession() {
      return readJSON<Session | null>(K.session, null);
    },

    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async requestLogin(email) {
      await wait();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok: false, error: 'Please enter a valid email.' };
      return { ok: true };
    },

    async verifyCode(email, code) {
      await wait();
      if (code.trim() !== DEMO_CODE) return { ok: false, error: `In demo mode the code is ${DEMO_CODE}.` };
      const e = email.trim().toLowerCase();
      const all = users();
      if (!all[e]) all[e] = { profile: emptyProfile(uid(), e), roles: [] };
      const preview = readJSON<Role>(K.previewRole, 'attendee');
      all[e].roles = preview === 'admin' ? ['admin', 'facilitator'] : preview === 'facilitator' ? ['facilitator'] : [];
      saveUsers(all);
      const s = { userId: all[e].profile.user_id, email: e };
      writeJSON(K.session, s);
      emit(s);
      return { ok: true };
    },

    async signOut() {
      removeKey(K.session);
      emit(null);
    },

    async getRoles(userId) {
      return findById(userId)?.roles ?? [];
    },

    async fileHelpRequest(r) {
      const list = readJSON<HelpRequest[]>(K.help, []);
      list.unshift({
        id: uid(),
        email_tried: r.email_tried,
        name: r.name ?? null,
        registered_email: r.registered_email ?? null,
        note: r.note ?? null,
        resolved_at: null,
        created_at: new Date().toISOString(),
      });
      writeJSON(K.help, list);
    },

    async pullUserData(userId) {
      await wait(150);
      const u = findById(userId);
      if (!u) throw new Error('No such demo user');
      const d = data(userId);
      return {
        profile: u.profile,
        captures: Object.values(d.captures),
        useCases: Object.values(d.useCases),
        plan: d.plan,
        progress: Object.entries(d.progress).map(([section_key, completed_at]) => ({ section_key, completed_at })),
      };
    },

    async push(userId, ops: Op[]) {
      await wait(300);
      if (!navigator.onLine) throw new Error('offline');
      const d = data(userId);
      const all = users();
      const me = Object.values(all).find((u) => u.profile.user_id === userId);
      for (const op of ops) {
        const r = op.row;
        if (op.table === 'profiles' && me) me.profile = { ...me.profile, ...r };
        if (op.table === 'captures') d.captures[`${r.section_key}.${r.field_key}`] = r;
        if (op.table === 'use_cases') {
          if (op.kind === 'delete') delete d.useCases[r.id];
          else d.useCases[r.id] = r;
        }
        if (op.table === 'plans') d.plan = r;
        if (op.table === 'section_progress') {
          if (op.kind === 'delete') delete d.progress[r.section_key];
          else d.progress[r.section_key] = r.completed_at;
        }
        if (op.table === 'link_events') d.links.push(r);
      }
      writeJSON(K.data(userId), d);
      saveUsers(all);
    },

    async touch(userId) {
      const all = users();
      const me = Object.values(all).find((u) => u.profile.user_id === userId);
      if (me) {
        me.profile.last_seen_at = new Date().toISOString();
        saveUsers(all);
      }
    },

    async deleteMyData(userId) {
      removeKey(K.data(userId));
      const all = users();
      const me = Object.values(all).find((u) => u.profile.user_id === userId);
      if (me) {
        me.profile = { ...emptyProfile(userId, me.profile.email), first_name: me.profile.first_name };
        saveUsers(all);
      }
    },

    async fetchContentRows() {
      return readJSON<Record<ContentTable, ContentRow[]>>(K.content, {
        sections: [],
        prompts: [],
        library_items: [],
        suggestions: [],
      });
    },

    async saveContentRow(table, row) {
      const all = await this.fetchContentRows();
      all[table] = [...all[table].filter((r) => r.key !== row.key), { ...row, updated_at: new Date().toISOString() }];
      writeJSON(K.content, all);
    },

    async fetchLiveState() {
      return readJSON<LiveState>(K.live, { current_section_key: 's0', settings: {} });
    },

    async saveLiveState(patch) {
      const cur = await this.fetchLiveState();
      writeJSON(K.live, { ...cur, ...patch, settings: { ...cur.settings, ...(patch.settings ?? {}) } });
    },

    async dashboardSummary() {
      await wait(200);
      return fakeSummary();
    },

    async listAttendees(): Promise<AdminAttendee[]> {
      return Object.values(users()).map((u) => ({
        user_id: u.profile.user_id,
        email: u.profile.email,
        first_name: u.profile.first_name,
        last_name: u.profile.last_name,
        organization: u.profile.organization,
        industry: u.profile.industry,
        attendance_type: u.profile.attendance_type,
        onboarded_at: u.profile.onboarded_at,
        last_seen_at: u.profile.last_seen_at ?? null,
        roles: u.roles,
      }));
    },

    async importAttendees(rows: ImportRow[]) {
      await wait(400);
      const all = users();
      const res = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
      for (const r of rows) {
        const e = (r.email ?? '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
          res.skipped++;
          res.errors.push(`Invalid email: ${r.email || '(blank)'}`);
          continue;
        }
        const existing = all[e];
        if (existing) res.updated++;
        else res.created++;
        const base = existing?.profile ?? emptyProfile(uid(), e);
        const patch: any = {};
        for (const [k, v] of Object.entries(r)) {
          if (k === 'email' || v === undefined || String(v).trim() === '') continue;
          if (!base.onboarded_at || !(base as any)[k]) patch[k] = String(v).trim();
        }
        all[e] = { profile: { ...base, ...patch }, roles: existing?.roles ?? [] };
      }
      saveUsers(all);
      return res;
    },

    async changeEmail(userId, email) {
      const all = users();
      const entry = Object.entries(all).find(([, u]) => u.profile.user_id === userId);
      if (!entry) throw new Error('Not found');
      const e = email.trim().toLowerCase();
      if (all[e]) throw new Error('That email already has an account.');
      delete all[entry[0]];
      entry[1].profile.email = e;
      all[e] = entry[1];
      saveUsers(all);
    },

    async setRole(userId, role, on) {
      const all = users();
      const u = Object.values(all).find((x) => x.profile.user_id === userId);
      if (!u) return;
      u.roles = on ? [...new Set([...u.roles, role])] : u.roles.filter((r) => r !== role);
      saveUsers(all);
    },

    async listHelpRequests() {
      return readJSON<HelpRequest[]>(K.help, []);
    },

    async resolveHelpRequest(id) {
      writeJSON(
        K.help,
        readJSON<HelpRequest[]>(K.help, []).map((h) => (h.id === id ? { ...h, resolved_at: new Date().toISOString() } : h)),
      );
    },

    async exportTable(table) {
      const all = Object.values(users());
      if (table === 'profiles') return all.map((u) => ({ ...u.profile }));
      if (table === 'help_requests') return readJSON<HelpRequest[]>(K.help, []) as any;
      const rows: Record<string, unknown>[] = [];
      for (const u of all) {
        const d = data(u.profile.user_id);
        const id = u.profile.user_id;
        if (table === 'captures') Object.values(d.captures).forEach((c) => rows.push({ user_id: id, ...c }));
        if (table === 'use_cases') Object.values(d.useCases).forEach((c) => rows.push({ user_id: id, ...c }));
        if (table === 'plans' && d.plan) rows.push({ user_id: id, ...d.plan });
        if (table === 'section_progress')
          Object.entries(d.progress).forEach(([k, v]) => rows.push({ user_id: id, section_key: k, completed_at: v }));
        if (table === 'link_events') d.links.forEach((l) => rows.push({ user_id: id, ...l }));
      }
      return rows;
    },
  };
}

// A believable, slowly changing room for previewing the facilitator dashboard.
function fakeSummary(): DashboardSummary {
  const minutes = Math.floor(Date.now() / 60000);
  const wobble = (base: number, spread = 6) => base + ((minutes * 7 + base) % spread);
  const s = (n: number) => (n < 5 ? null : n);
  return {
    generated_at: new Date().toISOString(),
    min_group: 5,
    attendees: {
      registered: 1184,
      logged_in: wobble(842, 20),
      in_person: wobble(187, 4),
      virtual: wobble(655, 16),
      active_15m: wobble(611, 30),
    },
    sections: { s0: wobble(790), s1: wobble(702), s2: wobble(655), s3: wobble(540), s4: wobble(388), s5: s(3), s6: null, s7: null, s8: null },
    opportunity_areas: { communication: wobble(410), process: wobble(355), automation: wobble(298), decision_support: wobble(170), other: s(4) },
    concerns: {
      data_privacy: wobble(512),
      accuracy: wobble(466),
      oversight: wobble(301),
      cost: wobble(240),
      skills: wobble(388),
      trust: wobble(150),
      legal: wobble(122),
      jobs: wobble(95),
      security: wobble(201),
    },
    use_case_areas: { communication: wobble(620), process: wobble(540), automation: wobble(470), decision_support: wobble(210), other: wobble(60) },
    ratings: {
      impact: { 1: wobble(40), 2: wobble(120), 3: wobble(390), 4: wobble(520), 5: wobble(330) },
      effort: { 1: wobble(150), 2: wobble(420), 3: wobble(510), 4: wobble(240), 5: wobble(80) },
      risk: { 1: wobble(260), 2: wobble(480), 3: wobble(390), 4: wobble(140), 5: s(3) },
    },
    chosen_tools: { chatgpt: wobble(120), copilot: wobble(96), claude: wobble(71), gemini: wobble(40) },
    ai_tools: { chatgpt: wobble(330), copilot: wobble(190), claude: wobble(140), gemini: wobble(95), other: wobble(22), none: wobble(65) },
    plans: { started: wobble(210), measures_complete: wobble(120), marked_complete: wobble(64) },
  };
}
