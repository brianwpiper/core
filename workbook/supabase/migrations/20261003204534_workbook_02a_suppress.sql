-- Main Street Event AI Summit workbook: small-group suppression helper

create or replace function public.suppress(n bigint)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case when n is null or n < 5 then null else n end;
$$;
