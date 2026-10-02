import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Backend, Op, SyncTable, ExportTable } from './backend';
import type { ContentRow, ContentTable, Role } from './types';

const CONFLICT: Record<SyncTable, string> = {
  profiles: 'user_id',
  captures: 'user_id,section_key,field_key',
  use_cases: 'id',
  plans: 'user_id',
  section_progress: 'user_id,section_key',
  link_events: 'id',
};

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const toSession = (s: any) => (s?.user ? { userId: s.user.id as string, email: (s.user.email ?? '') as string } : null);

  return {
    mode: 'supabase',

    async getSession() {
      const { data } = await sb.auth.getSession();
      return toSession(data.session);
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
      return () => data.subscription.unsubscribe();
    },

    async requestLogin(email) {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
      });
      if (error) {
        // Supabase answers "Signups not allowed for otp" when the email has no account.
        const notFound = /signup|not allowed|not found/i.test(error.message);
        return { ok: false, error: notFound ? 'not_registered' : error.message };
      }
      return { ok: true };
    },

    async verifyCode(email, code) {
      const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async getRoles(userId) {
      const rows = check(await sb.from('user_roles').select('role').eq('user_id', userId)) as { role: Role }[];
      return rows.map((r) => r.role);
    },

    async fileHelpRequest(r) {
      check(await sb.from('help_requests').insert(r));
    },

    async pullUserData(userId) {
      const [profile, captures, useCases, plan, progress] = await Promise.all([
        sb.from('profiles').select('*').eq('user_id', userId).single(),
        sb.from('captures').select('section_key,field_key,value,updated_at').eq('user_id', userId),
        sb.from('use_cases').select('*').eq('user_id', userId),
        sb.from('plans').select('*').eq('user_id', userId).maybeSingle(),
        sb.from('section_progress').select('section_key,completed_at').eq('user_id', userId),
      ]);
      return {
        profile: check(profile),
        captures: check(captures) ?? [],
        useCases: check(useCases) ?? [],
        plan: check(plan) ?? null,
        progress: check(progress) ?? [],
      } as any;
    },

    async push(userId, ops) {
      const groups = new Map<string, Op[]>();
      for (const op of ops) {
        const k = `${op.table}|${op.kind}`;
        groups.set(k, [...(groups.get(k) ?? []), op]);
      }
      for (const [k, group] of groups) {
        const [table, kind] = k.split('|') as [SyncTable, Op['kind']];
        if (table === 'profiles') {
          const patch = Object.assign({}, ...group.map((g) => g.row));
          delete patch.user_id;
          check(await sb.from('profiles').update(patch).eq('user_id', userId));
        } else if (kind === 'upsert') {
          const rows = group.map((g) => ({ ...g.row, user_id: userId }));
          check(
            await sb.from(table).upsert(rows, {
              onConflict: CONFLICT[table],
              ignoreDuplicates: table === 'link_events',
            }),
          );
        } else if (table === 'use_cases') {
          check(await sb.from('use_cases').delete().in('id', group.map((g) => g.row.id)));
        } else if (table === 'section_progress') {
          check(
            await sb
              .from('section_progress')
              .delete()
              .eq('user_id', userId)
              .in('section_key', group.map((g) => g.row.section_key)),
          );
        }
      }
    },

    async touch(userId) {
      await sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('user_id', userId);
    },

    async deleteMyData() {
      check(await sb.rpc('delete_my_data'));
    },

    async fetchContentRows() {
      const tables: ContentTable[] = ['sections', 'prompts', 'library_items', 'suggestions'];
      const res = await Promise.all(tables.map((t) => sb.from(t).select('key,data,version,as_of,retired,updated_at')));
      const out = {} as Record<ContentTable, ContentRow[]>;
      tables.forEach((t, i) => (out[t] = (check(res[i]) as ContentRow[]) ?? []));
      return out;
    },

    async saveContentRow(table, row) {
      const { data: u } = await sb.auth.getUser();
      check(
        await sb
          .from(table)
          .upsert({ ...row, updated_at: new Date().toISOString(), updated_by: u.user?.id }, { onConflict: 'key' }),
      );
    },

    async fetchLiveState() {
      const row = check(await sb.from('live_state').select('current_section_key,settings,updated_at').eq('id', 1).maybeSingle());
      return (row as any) ?? { current_section_key: null, settings: {} };
    },

    async saveLiveState(patch) {
      check(await sb.from('live_state').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1));
    },

    async dashboardSummary() {
      return check(await sb.rpc('dashboard_summary')) as any;
    },

    async listAttendees() {
      const [profiles, roles] = await Promise.all([
        fetchAll(sb, 'profiles', 'user_id,email,first_name,last_name,organization,industry,attendance_type,onboarded_at,last_seen_at'),
        fetchAll(sb, 'user_roles', 'user_id,role'),
      ]);
      const byUser = new Map<string, Role[]>();
      for (const r of roles as any[]) byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
      return (profiles as any[])
        .map((p) => ({ ...p, roles: byUser.get(p.user_id) ?? [] }))
        .sort((a, b) => (a.email as string).localeCompare(b.email));
    },

    async importAttendees(rows) {
      const total = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
      for (let i = 0; i < rows.length; i += 100) {
        const { data, error } = await sb.functions.invoke('admin-users', {
          body: { action: 'import', rows: rows.slice(i, i + 100) },
        });
        if (error) throw new Error(error.message);
        total.created += data.created;
        total.updated += data.updated;
        total.skipped += data.skipped;
        total.errors.push(...data.errors);
      }
      return total;
    },

    async changeEmail(userId, email) {
      const { data, error } = await sb.functions.invoke('admin-users', {
        body: { action: 'change_email', user_id: userId, email },
      });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
    },

    async setRole(userId, role, on) {
      if (on) check(await sb.from('user_roles').upsert({ user_id: userId, role }));
      else check(await sb.from('user_roles').delete().eq('user_id', userId).eq('role', role));
    },

    async listHelpRequests() {
      return check(await sb.from('help_requests').select('*').order('created_at', { ascending: false })) as any;
    },

    async resolveHelpRequest(id) {
      check(await sb.from('help_requests').update({ resolved_at: new Date().toISOString() }).eq('id', id));
    },

    async exportTable(table: ExportTable) {
      return fetchAll(sb, table, '*');
    },
  };
}

// PostgREST returns at most 1,000 rows per request by default, so page through.
async function fetchAll(sb: SupabaseClient, table: string, columns: string) {
  const out: Record<string, unknown>[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const rows = check(await sb.from(table).select(columns).range(from, from + size - 1)) as any[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}
