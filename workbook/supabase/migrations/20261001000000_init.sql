-- Main Street Event AI Summit: Digital Workbook
-- Initial schema, row-level security, and the aggregate dashboard function.
--
-- Access model
--   Attendee:     reads and writes only their own rows.
--   Facilitator:  calls public.dashboard_summary() only. No access to individual rows.
--   Admin:        full access.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'facilitator')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(r text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = r
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

-- ---------------------------------------------------------------------------
-- Attendee data
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text check (char_length(first_name) <= 80),
  last_name text check (char_length(last_name) <= 80),
  organization text check (char_length(organization) <= 160),
  industry text check (char_length(industry) <= 80),
  role text check (char_length(role) <= 80),
  size_band text check (char_length(size_band) <= 40),
  attendance_type text check (attendance_type in ('in_person', 'virtual')),
  ai_tool text check (char_length(ai_tool) <= 40),
  eventbrite_order_id text,
  consent_at timestamptz,
  onboarded_at timestamptz,
  last_section text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_idx on public.profiles (lower(email));

-- Short structured answers keyed by section and field (constraint C2).
create table public.captures (
  user_id uuid not null references auth.users (id) on delete cascade,
  section_key text not null,
  field_key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, section_key, field_key),
  constraint captures_value_small check (pg_column_size(value) <= 4096)
);

create table public.use_cases (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  area text check (area in ('communication', 'process', 'automation', 'decision_support', 'other')),
  description text check (char_length(description) <= 300),
  source_section text,
  is_suggested boolean not null default false,
  suggestion_key text,
  impact smallint check (impact between 1 and 5),
  effort smallint check (effort between 1 and 5),
  risk smallint check (risk between 1 and 5),
  current_value numeric,
  target_value numeric,
  unit text check (char_length(unit) <= 40),
  is_pilot_candidate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index use_cases_user_idx on public.use_cases (user_id);

create table public.plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  use_case_id uuid,
  opportunity text check (char_length(opportunity) <= 300),
  people text check (char_length(people) <= 300),
  actions jsonb not null default '[]'::jsonb check (pg_column_size(actions) <= 2048),
  guardrails text check (char_length(guardrails) <= 500),
  tool text check (char_length(tool) <= 80),
  current_value numeric,
  target_value numeric,
  unit text check (char_length(unit) <= 40),
  stop_condition text check (char_length(stop_condition) <= 300),
  checkin_date date,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.section_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  section_key text not null,
  completed_at timestamptz,
  primary key (user_id, section_key)
);

create table public.link_events (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  target text not null check (char_length(target) <= 120),
  opened_at timestamptz not null default now()
);
create index link_events_user_idx on public.link_events (user_id);

-- "Wrong email?" requests. Written by people who cannot log in yet.
create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  email_tried text not null check (char_length(email_tried) <= 200),
  name text check (char_length(name) <= 120),
  registered_email text check (char_length(registered_email) <= 200),
  note text check (char_length(note) <= 500),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admin-editable content. The app ships default content in its build; a row
-- here with the same key overrides it, so an empty table means "use defaults".
-- ---------------------------------------------------------------------------

create table public.sections (
  key text primary key,
  data jsonb not null,
  version int not null default 1,
  as_of date not null default current_date,
  retired boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);
create table public.prompts (like public.sections including all);
create table public.library_items (like public.sections including all);
create table public.suggestions (like public.sections including all);

-- One row: which section the room is on, plus admin settings.
create table public.live_state (
  id int primary key default 1 check (id = 1),
  current_section_key text,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.live_state (id) values (1);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in step when an admin corrects an address.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Attendees cannot change their own email or Eventbrite id directly.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.email := old.email;
    new.eventbrite_order_id := old.eventbrite_order_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

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
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "roles: admin write" on public.user_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles: own row, admins all. Inserts happen through the auth trigger.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Attendee-owned tables share one pattern.
do $$
declare t text;
begin
  foreach t in array array['captures', 'use_cases', 'plans', 'section_progress', 'link_events'] loop
    execute format(
      'create policy "%1$s: own rows" on public.%1$I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format(
      'create policy "%1$s: admin read" on public.%1$I for select to authenticated
         using (public.is_admin())', t);
  end loop;
end;
$$;

-- Help requests: anyone may file one; admins read and resolve.
create policy "help: anyone can file" on public.help_requests
  for insert to anon, authenticated with check (resolved_at is null);
create policy "help: admin read" on public.help_requests
  for select to authenticated using (public.is_admin());
create policy "help: admin update" on public.help_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Content and live state: every signed-in user reads; admins write.
do $$
declare t text;
begin
  foreach t in array array['sections', 'prompts', 'library_items', 'suggestions', 'live_state'] loop
    execute format(
      'create policy "%1$s: read" on public.%1$I for select to authenticated using (true)', t);
    execute format(
      'create policy "%1$s: admin write" on public.%1$I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant insert on public.help_requests to anon;

-- ---------------------------------------------------------------------------
-- Attendee self-service: delete everything I entered (Section 8 of the design doc).
-- The account itself stays so the person can still log in.
-- ---------------------------------------------------------------------------

create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.captures where user_id = me;
  delete from public.use_cases where user_id = me;
  delete from public.plans where user_id = me;
  delete from public.section_progress where user_id = me;
  delete from public.link_events where user_id = me;
  update public.profiles
     set organization = null, industry = null, role = null, size_band = null,
         ai_tool = null, last_section = null, onboarded_at = null, consent_at = null
   where user_id = me;
end;
$$;
grant execute on function public.delete_my_data() to authenticated;

-- ---------------------------------------------------------------------------
-- Facilitator dashboard: counts only, nothing identifying.
-- Any count below the minimum group size (5) comes back as null, and the
-- client shows "fewer than 5". Staff accounts are left out of every count.
-- ---------------------------------------------------------------------------

create or replace function public.suppress(n bigint)
returns bigint
language sql
immutable
as $$
  select case when n is null or n < 5 then null else n end;
$$;

create or replace function public.dashboard_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not (public.has_role('facilitator') or public.has_role('admin')) then
    raise exception 'dashboard access requires the facilitator role';
  end if;

  with attendees as (
    select p.* from public.profiles p
    where not exists (select 1 from public.user_roles r where r.user_id = p.user_id)
  ),
  ids as (select user_id from attendees),
  caps as (select c.* from public.captures c join ids using (user_id)),
  ucs as (select u.* from public.use_cases u join ids using (user_id)),
  pls as (select pl.* from public.plans pl join ids using (user_id))
  select jsonb_build_object(
    'generated_at', now(),
    'min_group', 5,
    'attendees', (
      select jsonb_build_object(
        'registered', suppress(count(*)),
        'logged_in', suppress(count(*) filter (where onboarded_at is not null)),
        'in_person', suppress(count(*) filter (where onboarded_at is not null and attendance_type = 'in_person')),
        'virtual', suppress(count(*) filter (where onboarded_at is not null and attendance_type = 'virtual')),
        'active_15m', suppress(count(*) filter (where last_seen_at > now() - interval '15 minutes'))
      ) from attendees
    ),
    'sections', (
      select coalesce(jsonb_object_agg(section_key, suppress(n)), '{}'::jsonb)
      from (
        select sp.section_key, count(*) n
        from public.section_progress sp join ids using (user_id)
        where sp.completed_at is not null
        group by 1
      ) s
    ),
    'opportunity_areas', (
      select coalesce(jsonb_object_agg(v, suppress(n)), '{}'::jsonb)
      from (
        select v, count(*) n from caps, jsonb_array_elements_text(
          case when jsonb_typeof(value) = 'array' then value else '[]'::jsonb end) v
        where section_key = 's3' and field_key = 'opportunity_areas'
        group by 1
      ) s
    ),
    'concerns', (
      select coalesce(jsonb_object_agg(v, suppress(n)), '{}'::jsonb)
      from (
        select v, count(*) n from caps, jsonb_array_elements_text(
          case when jsonb_typeof(value) = 'array' then value else '[]'::jsonb end) v
        where section_key = 's1' and field_key = 'concerns'
        group by 1
      ) s
    ),
    'use_case_areas', (
      select coalesce(jsonb_object_agg(area, suppress(n)), '{}'::jsonb)
      from (select coalesce(area, 'other') area, count(*) n from ucs group by 1) s
    ),
    'ratings', jsonb_build_object(
      'impact', (select coalesce(jsonb_object_agg(impact, suppress(n)), '{}'::jsonb)
                 from (select impact, count(*) n from ucs where impact is not null group by 1) s),
      'effort', (select coalesce(jsonb_object_agg(effort, suppress(n)), '{}'::jsonb)
                 from (select effort, count(*) n from ucs where effort is not null group by 1) s),
      'risk',   (select coalesce(jsonb_object_agg(risk, suppress(n)), '{}'::jsonb)
                 from (select risk, count(*) n from ucs where risk is not null group by 1) s)
    ),
    'chosen_tools', (
      select coalesce(jsonb_object_agg(v, suppress(n)), '{}'::jsonb)
      from (
        select lower(trim(value #>> '{}')) v, count(*) n from caps
        where section_key = 's6' and field_key = 'chosen_tool'
          and jsonb_typeof(value) = 'string' and trim(value #>> '{}') <> ''
        group by 1
      ) s
    ),
    'ai_tools', (
      select coalesce(jsonb_object_agg(ai_tool, suppress(n)), '{}'::jsonb)
      from (select ai_tool, count(*) n from attendees where ai_tool is not null group by 1) s
    ),
    'plans', (
      select jsonb_build_object(
        'started', suppress(count(*)),
        'measures_complete', suppress(count(*) filter (
          where current_value is not null and target_value is not null
            and coalesce(trim(unit), '') <> '' and coalesce(trim(stop_condition), '') <> '')),
        'marked_complete', suppress(count(*) filter (where completed_at is not null))
      ) from pls
    )
  ) into result;

  return result;
end;
$$;
grant execute on function public.dashboard_summary() to authenticated;
