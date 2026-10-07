-- Main Street Event AI Summit workbook: "Delete my entries" for attendees (design doc section 8)

-- Removes only the signed-in person's own rows. Their login stays.
-- NOT YET APPLIED to the live project: paste into the Supabase SQL Editor and run.
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

revoke execute on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
