-- نفذ ملف الترحيل أولاً، ثم أنشئ مستخدم المالك من Authentication > Users.
-- استبدل القيم الثلاث أدناه قبل تشغيل هذا الملف في SQL Editor.

do $$
declare
  owner_user_id uuid := '00000000-0000-0000-0000-000000000000';
  owner_email text := 'REPLACE_OWNER_EMAIL';
  owner_phone text := 'REPLACE_OWNER_PHONE';
  workspace_id uuid;
begin
  if owner_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'استبدل owner_user_id بمعرف المستخدم من Supabase Auth';
  end if;
  if not exists (select 1 from auth.users where id = owner_user_id and email = owner_email) then
    raise exception 'بيانات مستخدم المالك لا تطابق سجل Supabase Auth';
  end if;

  insert into public.workspaces (name, slug, default_currency, timezone)
  values ('U89 Studio OS', 'u89', 'SAR', 'Asia/Riyadh')
  on conflict (slug) do update set name = excluded.name
  returning id into workspace_id;

  insert into public.memberships (
    workspace_id, user_id, role, status, display_name, phone,
    notification_preferences
  ) values (
    workspace_id, owner_user_id, 'owner', 'active',
    'عبد الوهاب بن سليمان السويد', owner_phone,
    '{"email": true, "whatsapp": true}'::jsonb
  )
  on conflict (workspace_id, user_id) do update set
    role = 'owner',
    status = 'active',
    display_name = excluded.display_name,
    phone = excluded.phone;

  insert into public.studio_settings (
    workspace_id, owner_name_ar, owner_name_en, email, phone,
    vat_registered, collaborator_currencies
  ) values (
    workspace_id,
    'عبد الوهاب بن سليمان السويد',
    'Abdulwahab Suliman Alsaweed',
    owner_email,
    owner_phone,
    false,
    array['SAR', 'USD', 'EUR']::text[]
  )
  on conflict (workspace_id) do update set
    owner_name_ar = excluded.owner_name_ar,
    owner_name_en = excluded.owner_name_en,
    email = excluded.email,
    phone = excluded.phone;

  insert into public.public_site_content (workspace_id, published, content)
  values (workspace_id, false, '{"acceptingRequests": false}'::jsonb)
  on conflict (workspace_id) do nothing;
end;
$$;
