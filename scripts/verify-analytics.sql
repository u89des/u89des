-- Transaction-only fixture. No test visits persist.
begin;
do $$
declare
  p jsonb := '{"id":"a2345678-1234-4123-8123-123456789abc","seq":1,"source":"qa.invalid","country":"SA","device":"mobile","browser":"Safari","depth":10,"seconds":5,"last_section":"work","sections":["work"],"contact_open":false,"service_open":false,"contact_sent":false,"project_sent":false}'::jsonb;
  r jsonb;
begin
  assert not has_table_privilege('anon','public.site_visits','SELECT'), 'Anonymous table exposed';
  assert not has_table_privilege('authenticated','public.site_visits','SELECT'), 'Member table exposed';
  assert not has_function_privilege('authenticated','public.site_analytics_report(integer)','EXECUTE'), 'Member report exposed';
  assert not has_function_privilege('anon','public.record_site_visit(jsonb)','EXECUTE'), 'Anonymous RPC exposed';
  assert public.record_site_visit(p);
  assert public.record_site_visit(p || '{"seq":3,"depth":80,"seconds":30,"last_section":"services","sections":["services"],"contact_open":true}'::jsonb);
  assert public.record_site_visit(p || '{"seq":2}'::jsonb);
  assert (select depth=80 and seconds=30 and seq=3 and last_section='services' and contact_open and sections @> array['work','services'] from public.site_visits where id=(p->>'id')::uuid), 'Out-of-order update regressed';
  r := public.site_analytics_report(7);
  assert (r->>'visits')::integer >= 1 and jsonb_array_length(r->'reach')>=2, 'Report aggregation failed';
end $$;
select 'PASS: ingestion, section union, stale updates, report aggregation, private privileges. Fixtures rolled back.' as analytics_verification;
rollback;
