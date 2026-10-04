-- Main Street Event AI Summit workbook: row-level security

alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.captures enable row level security;
alter table public.use_cases enable row level security;
alter table public.plans enable row level security;
alter table public.section_progress enable row level security;
alter table public.link_events enable row level security;
alter table public.help_requests enable row level security;
alter table public.sections enable row level security;
alter table public.prompts enable row level security;
alter table public.library_items enable row level security;
alter table public.suggestions enable row level security;
alter table public.live_state enable row level security;

-- Roles: you can see your own; admins manage all.
create policy "roles: read own" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "roles: admin write" on public.user_roles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Profiles: own row, admins all. Inserts happen through the auth trigger.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

-- Attendee-owned tables share one pattern.
do $$
declare t text;
begin
  foreach t in array array['captures', 'use_cases', 'plans', 'section_progress', 'link_events'] loop
    execute format(
      'create policy "%1$s: own rows" on public.%1$I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: admin read" on public.%1$I for select to authenticated
         using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Help requests: anyone may file one; admins read and resolve.
create policy "help: anyone can file" on public.help_requests
  for insert to anon, authenticated with check (resolved_at is null);
create policy "help: admin read" on public.help_requests
  for select to authenticated using ((select public.is_admin()));
create policy "help: admin update" on public.help_requests
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Content and live state: every signed-in user reads; admins write.
do $$
declare t text;
begin
  foreach t in array array['sections', 'prompts', 'library_items', 'suggestions', 'live_state'] loop
    execute format(
      'create policy "%1$s: read" on public.%1$I for select to authenticated using (true)', t);
    execute format(
      'create policy "%1$s: admin write" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant insert on public.help_requests to anon;
