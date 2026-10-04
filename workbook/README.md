# Main Street Event AI Summit: Digital Workbook

The one place attendees work from during the Summit (Friday, November 13, 2026) and return to at day 90.
Built from *Design Document v0.1*. Vite + React + TypeScript front end, Supabase back end.

## Try it now (demo mode)

No accounts or servers needed. Everything is stored in your browser.

```bash
cd workbook
npm install
npm run dev        # open http://localhost:5173
```

Log in with any email. The code is **123456**. On the login screen, "Demo: preview as" lets you see the
attendee, facilitator, or admin view. The dashboard shows sample numbers in demo mode.

## How the design doc's constraints are met

| # | Constraint | Where |
|---|---|---|
| C1 | No live LLM calls | Prompts are filled in the browser from templates (`src/lib/template.ts`). There is no AI API anywhere. |
| C2 | Short fields only | Character limits in the UI and `check` constraints in the database (4 KB max per answer). |
| C3 | Survives bad wifi | Every change is written to the browser first, then synced after a short pause, with retries, backoff, and jitter (`src/lib/store.ts`). Indicator shows *Saved / Saving / Offline, will sync*. |
| C4, C6 | "Guidelines", no em dashes, no "not X but Y" | `npm run check:copy` scans the app. The admin content editor blocks saving copy that breaks the rules. |
| C5 | CRIT only | Every prompt card has the four labeled parts (`src/content/prompts.ts`). |
| C7 | Account persists | Accounts live in Supabase Auth; the Day 90 page shows the plan and use case list. |
| C8 | Mobile-first, WCAG 2.1 AA target | Large tap targets, labeled fields, focus outlines, live regions, AA color contrast. |

## Where things live

```
src/content/      Default content: sections, prompts, suggestions, library, settings  <- edit wording here
src/lib/          Data layer: store (offline sync), backends (Supabase + demo), templating, PDFs
src/components/   Prompt card, fields, use case list, plan, section blocks
src/pages/        Login, welcome, home, sections, library, day 90, my data, dashboard, admin
supabase/         Database schema and security, admin edge function, login email template
loadtest/         k6 load test for 1,500 simulated attendees
e2e/              Browser smoke test (demo mode)
```

Content in `src/content/` ships with the build. Admins can override any item from **Admin > Content**
without a deploy. An edited item is stored in the database and wins over the built-in version.

**Theme:** all colors and fonts are variables at the top of `src/styles.css`. Swap in the brand colors there.

## Going live with Supabase

The live project is **MainStreetEvent** (`owmcdbvvqadskvtbourl`, https://owmcdbvvqadskvtbourl.supabase.co).

Done (October 4):
- [x] Pro plan
- [x] Database tables, row-level security, account hooks, dashboard function (`supabase/migrations/`, versions 01 to 06)
- [x] `admin-users` edge function deployed
- [x] Security rules tested: attendees see only their own rows, cannot change their email, cannot open the dashboard; admins see all

Still to do:
1. **"Delete my entries" function.** Open the Supabase SQL Editor, paste
   `supabase/migrations/20261004060000_workbook_07_delete_my_data.sql`, and click Run.
   (The setup tool asks for a human to confirm anything containing a delete command, so this one is run by hand.)
2. **Auth settings** (Dashboard > Authentication):
   - Turn **off** "Allow new users to sign up". Accounts come only from the Eventbrite import.
   - Email OTP length: **6**. OTP expiry: 3600 seconds.
   - Site URL: your workbook domain (for example `https://workbook.mainstreetevent.com`). Add it, and the Vercel URL, to Redirect URLs.
   - Email template "Magic Link": paste `supabase/templates/magic_link.html`. It contains both the link and the 6-digit code.
   - **Custom SMTP** (Resend or Postmark). The built-in sender cannot handle 1,200 login emails. Raise the auth email rate limit after SMTP is set up.
   - Database connections for Auth: switch to a percentage-based allocation (Supabase's advisor flags the fixed 10).
3. **Make yourself and Quinn admins.** Dashboard > Authentication > Users > Add user > Create new user
   (your email, tick auto-confirm). Then in the SQL Editor:
   ```sql
   insert into user_roles (user_id, role)
   select user_id, r from profiles, unnest(array['admin','facilitator']) r
   where email in ('brian@...', 'quinn@...');
   ```
   After that, give facilitators their role from **Admin > Attendees** in the workbook.
4. **Front end env vars** (Vercel > Project > Settings > Environment Variables), then redeploy:
   ```
   VITE_SUPABASE_URL=https://owmcdbvvqadskvtbourl.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable key from Supabase > Project Settings > API Keys>
   ```
5. **Domain:** Vercel > Settings > Domains, add `workbook.mainstreetevent.com`.

Applying the schema to a fresh project (for example a load-test copy): `supabase link --project-ref <ref>` then `supabase db push`.

## Running the event

- **Import attendees:** Admin > Import Eventbrite. Upload the attendee CSV, check the column matches, import. Safe to re-run; answers an attendee already confirmed are kept.
- **Live now:** Admin > Live now. Attendees see the change within about a minute.
- **Wrong email?** Requests appear in Admin > Help requests. Use "Find attendee", then "Change email".
- **Dashboard:** `/dashboard`. Counts only, groups under 5 are hidden. Built to be projected.
- **Export:** Admin > Export gives CSVs for the day-90 outcome report.
- **Companion app and survey links:** Admin > Live now & settings.

## Checks

```bash
npm run check      # copy rules + type check + unit tests
npm run build      # production build
node e2e/smoke.mjs ./shots   # with `npm run dev` running and playwright-core installed
```

Load test (staging project only, before November 1): see the header of `loadtest/k6-attendee-saves.js`.
Access tokens from `make-test-users.mjs` expire after an hour, so generate them right before the run.

## Still to decide (from the design doc's open questions)

- Companion app URLs and whether they share this login (settings fields are ready).
- Who reviews `src/content/suggestions.ts` (currently a draft) and `tool_strengths` in the library (marked DRAFT).
- Hosting domain, community and meetup links, day-90 survey URL.
- Whether lightning round presenters get the facilitator role (one checkbox in Admin > Attendees).
