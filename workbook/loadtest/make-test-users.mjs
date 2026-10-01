// Creates N test attendees on a STAGING project and prints their tokens as JSON.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... node loadtest/make-test-users.mjs 1500 > loadtest/tokens.json
import { createClient } from '@supabase/supabase-js';

const n = Number(process.argv[2] ?? 100);
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const password = 'loadtest-' + Math.random().toString(36).slice(2);
const out = [];
for (let i = 0; i < n; i++) {
  const email = `loadtest+${i}@example.com`;
  await admin.auth.admin.createUser({ email, password, email_confirm: true }).catch(() => {});
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) {
    // Existing user from an earlier run: reset its password and retry.
    const { data: list } = await admin.from('profiles').select('user_id').eq('email', email).single();
    if (list) await admin.auth.admin.updateUserById(list.user_id, { password });
    const retry = await anon.auth.signInWithPassword({ email, password });
    if (retry.data.session) out.push({ user_id: retry.data.user.id, access_token: retry.data.session.access_token });
    continue;
  }
  out.push({ user_id: data.user.id, access_token: data.session.access_token });
}
console.log(JSON.stringify(out));
