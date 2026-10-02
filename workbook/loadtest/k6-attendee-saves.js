// Load test: simulated attendees saving answers (design doc 7, target 1,500 users).
//
// Run against a STAGING Supabase project, never production.
// 1. Create test accounts and get their access tokens:
//      SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... node loadtest/make-test-users.mjs 1500 > loadtest/tokens.json
// 2. Run:  k6 run -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... loadtest/k6-attendee-saves.js
//
// Each virtual user behaves like an attendee: loads their data, then saves a few
// short answers every 20 to 60 seconds and polls the live-now marker each minute.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', () => JSON.parse(open('./tokens.json')));
const URL = __ENV.SUPABASE_URL;
const ANON = __ENV.SUPABASE_ANON_KEY;

export const options = {
  scenarios: {
    room: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 1500 }, // everyone arrives
        { duration: '10m', target: 1500 }, // a workshop in full swing
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:save}': ['p(95)<800'],
    'http_req_duration{kind:load}': ['p(95)<1500'],
  },
};

export default function () {
  const u = users[(__VU - 1) % users.length];
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${u.access_token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  };

  if (__ITER === 0) {
    const r = http.get(`${URL}/rest/v1/captures?select=section_key,field_key,value&user_id=eq.${u.user_id}`, { headers, tags: { kind: 'load' } });
    check(r, { 'load ok': (x) => x.status === 200 });
  }

  const body = JSON.stringify([
    { user_id: u.user_id, section_key: 's2', field_key: 'keynote_idea', value: `Idea ${__ITER}`, updated_at: new Date().toISOString() },
  ]);
  const s = http.post(`${URL}/rest/v1/captures?on_conflict=user_id,section_key,field_key`, body, { headers, tags: { kind: 'save' } });
  check(s, { 'save ok': (x) => x.status === 201 || x.status === 200 || x.status === 204 });

  if (__ITER % 2 === 0) {
    http.get(`${URL}/rest/v1/live_state?select=current_section_key,settings&id=eq.1`, { headers, tags: { kind: 'live' } });
  }
  sleep(20 + Math.random() * 40);
}
