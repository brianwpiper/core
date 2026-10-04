-- Main Street Event AI Summit workbook: move role helpers off the public API

-- Policies reference functions by identity, so they keep working after the move.
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.has_role(text) set schema private;
alter function public.is_admin() set schema private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.has_role('admin');
$$;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not private.is_admin() then
    new.email := old.email;
    new.eventbrite_order_id := old.eventbrite_order_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Repoint the dashboard's role check at the moved helper.
do $$
declare src text;
begin
  select pg_get_functiondef('public.dashboard_summary()'::regprocedure) into src;
  src := replace(src, 'public.has_role(', 'private.has_role(');
  execute src;
end;
$$;

create index if not exists sections_updated_by_idx on public.sections (updated_by);
