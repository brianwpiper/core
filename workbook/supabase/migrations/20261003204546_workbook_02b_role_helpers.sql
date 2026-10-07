-- Main Street Event AI Summit workbook: role-check helpers

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

revoke execute on function public.has_role(text) from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
