-- Main Street Event AI Summit workbook: attendees cannot change their own email or Eventbrite id

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

revoke execute on function public.protect_profile_columns() from public, anon, authenticated;
