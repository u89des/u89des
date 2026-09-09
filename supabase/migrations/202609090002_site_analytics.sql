begin;
create table public.site_visits (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seq integer not null,
  source text not null,
  country text not null,
  device text not null,
  browser text not null,
  depth integer not null default 0,
  seconds integer not null default 0,
  last_section text not null default 'work',
  sections text[] not null default '{}',
  contact_open boolean not null default false,
  service_open boolean not null default false,
  contact_sent boolean not null default false,
  project_sent boolean not null default false
);
create index site_visits_created on public.site_visits(created_at);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from public, anon, authenticated;
grant all on public.site_visits to service_role;

create function public.record_site_visit(p jsonb) returns boolean language plpgsql security definer set search_path='' as $$
begin
  if (p->>'seq')::integer not between 1 and 500 then return false; end if;
  if not exists(select 1 from public.site_visits where id=(p->>'id')::uuid) then
    perform pg_advisory_xact_lock(80909002);
    if (select count(*) from public.site_visits where created_at>now()-interval '1 minute')>=1000 then return false; end if;
  end if;
  delete from public.site_visits where created_at<now()-interval '90 days';
  insert into public.site_visits(id,seq,source,country,device,browser,depth,seconds,last_section,sections,contact_open,service_open,contact_sent,project_sent)
  values((p->>'id')::uuid,(p->>'seq')::integer,p->>'source',p->>'country',p->>'device',p->>'browser',(p->>'depth')::integer,(p->>'seconds')::integer,p->>'last_section',array(select jsonb_array_elements_text(p->'sections')),(p->>'contact_open')::boolean,(p->>'service_open')::boolean,(p->>'contact_sent')::boolean,(p->>'project_sent')::boolean)
  on conflict(id) do update set updated_at=now(),seq=excluded.seq,
    depth=greatest(site_visits.depth,excluded.depth),seconds=greatest(site_visits.seconds,excluded.seconds),
    last_section=excluded.last_section,sections=array(select distinct unnest(site_visits.sections||excluded.sections)),
    contact_open=site_visits.contact_open or excluded.contact_open,service_open=site_visits.service_open or excluded.service_open,
    contact_sent=site_visits.contact_sent or excluded.contact_sent,project_sent=site_visits.project_sent or excluded.project_sent
  where excluded.seq>site_visits.seq;
  return true;
end $$;

create function public.site_analytics_report(p_days integer default 7) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  delete from public.site_visits where created_at<now()-interval '90 days';
  with v as (select * from public.site_visits where created_at>=date_trunc('day',now() at time zone 'Asia/Riyadh') at time zone 'Asia/Riyadh' - (greatest(1,least(p_days,90))-1)*interval '1 day')
  select jsonb_build_object(
    'visits',(select count(*) from v),
    'active',(select count(*) from v where updated_at>now()-interval '2 minutes'),
    'avgSeconds',coalesce((select round(avg(seconds)) from v),0),
    'avgDepth',coalesce((select round(avg(depth)) from v),0),
    'contactOpen',(select count(*) from v where contact_open),
    'serviceOpen',(select count(*) from v where service_open),
    'contactSent',(select count(*) from v where contact_sent),
    'projectSent',(select count(*) from v where project_sent),
    'daily',coalesce((select jsonb_agg(t order by t.day) from (select to_char(created_at at time zone 'Asia/Riyadh','YYYY-MM-DD') as day,count(*) as count from v group by 1) t),'[]'),
    'devices',coalesce((select jsonb_agg(t order by count desc) from (select device as name,count(*) as count from v group by 1) t),'[]'),
    'browsers',coalesce((select jsonb_agg(t order by count desc) from (select browser as name,count(*) as count from v group by 1) t),'[]'),
    'sources',coalesce((select jsonb_agg(t order by count desc) from (select source as name,count(*) as count from v group by 1 order by count(*) desc limit 20) t),'[]'),
    'countries',coalesce((select jsonb_agg(t order by count desc) from (select country as name,count(*) as count from v group by 1) t),'[]'),
    'reach',coalesce((select jsonb_agg(t) from (select s as name,count(*) as count from v cross join lateral unnest(sections) s group by s) t),'[]'),
    'stops',coalesce((select jsonb_agg(t order by count desc) from (select last_section as name,count(*) as count from v where updated_at<now()-interval '2 minutes' group by 1) t),'[]'),
    'recent',coalesce((select jsonb_agg(t) from (select created_at,source,country,device,browser,seconds,depth,last_section,contact_sent,project_sent from v order by created_at desc limit 30) t),'[]')
  ) into result;
  return result;
end $$;
revoke all on function public.record_site_visit(jsonb) from public,anon,authenticated;
revoke all on function public.site_analytics_report(integer) from public,anon,authenticated;
grant execute on function public.record_site_visit(jsonb),public.site_analytics_report(integer) to service_role;
commit;
