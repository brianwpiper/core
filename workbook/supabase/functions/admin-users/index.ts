// Admin-only account management for the workbook.
//
// Actions (POST JSON body):
//   { action: "import", rows: ImportRow[] }       create or update accounts from the Eventbrite export
//   { action: "change_email", user_id, email }    correct an attendee's login email
//
// The caller must be signed in and hold the admin role. Uses the service role key,
// which never leaves this function.

import { createClient } from 'npm:@supabase/supabase-js@2';

type ImportRow = {
  email: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  industry?: string;
  role?: string;
  size_band?: string;
  attendance_type?: string;
  ai_tool?: string;
  eventbrite_order_id?: string;
};

const PROFILE_FIELDS = [
  'first_name', 'last_name', 'organization', 'industry', 'role',
  'size_band', 'attendance_type', 'ai_tool', 'eventbrite_order_id',
] as const;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Who is calling?
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller?.user) return json({ error: 'Not signed in' }, 401);

  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleRow) return json({ error: 'Admin role required' }, 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (body.action === 'import') {
    const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows.slice(0, 200) : [];
    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const raw of rows) {
      const email = String(raw.email ?? '').trim().toLowerCase();
      if (!emailOk(email)) {
        results.skipped++;
        results.errors.push(`Invalid email: ${raw.email ?? '(blank)'}`);
        continue;
      }

      const { data: existing } = await admin
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      let userId: string | undefined = existing?.user_id;
      if (!userId) {
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (error || !created.user) {
          results.errors.push(`${email}: ${error?.message ?? 'could not create'}`);
          continue;
        }
        userId = created.user.id;
        results.created++;
      } else {
        results.updated++;
      }

      // Eventbrite fills gaps. Once an attendee has confirmed their profile,
      // their own answers win over the import.
      const patch: Record<string, string> = {};
      for (const f of PROFILE_FIELDS) {
        const v = raw[f];
        if (v === undefined || v === null || String(v).trim() === '') continue;
        const current = existing?.[f];
        if (!existing?.onboarded_at || current === null || current === undefined || current === '') {
          patch[f] = String(v).trim();
        }
      }
      if (patch.attendance_type && !['in_person', 'virtual'].includes(patch.attendance_type)) {
        delete patch.attendance_type;
      }
      if (Object.keys(patch).length) {
        const { error } = await admin.from('profiles').update(patch).eq('user_id', userId);
        if (error) results.errors.push(`${email}: ${error.message}`);
      }
    }
    return json(results);
  }

  if (body.action === 'change_email') {
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!body.user_id || !emailOk(email)) return json({ error: 'user_id and a valid email are required' }, 400);
    const { error } = await admin.auth.admin.updateUserById(body.user_id, {
      email,
      email_confirm: true,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
});
