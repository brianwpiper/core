-- Main Street Event AI Summit workbook: facilitator dashboard (counts only, groups under 5 hidden)

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

revoke execute on function public.dashboard_summary() from public, anon;
grant execute on function public.dashboard_summary() to authenticated;
