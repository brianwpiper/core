-- Main Street Event AI Summit workbook: tables

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'facilitator')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

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
