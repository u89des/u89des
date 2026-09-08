-- Every actionable notification with an email address must also leave the app by email.
create or replace function private.ensure_notification_email_channel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.channels := coalesce(new.channels, array[]::text[]);
  if not ('in_app' = any(new.channels)) then
    new.channels := array_append(new.channels, 'in_app');
  end if;
  if nullif(trim(new.recipient_email), '') is not null and not ('email' = any(new.channels)) then
    new.channels := array_append(new.channels, 'email');
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_require_email on public.notifications;
create trigger notifications_require_email
before insert or update of recipient_email, channels on public.notifications
for each row execute function private.ensure_notification_email_channel();

create or replace function private.notify_workspace_finance_roles(
  target_workspace_id uuid,
  target_project_id uuid,
  notification_kind text,
  notification_subject text,
  notification_message text,
  notification_action_url text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (
    workspace_id, project_id, recipient_user_id, recipient_email, recipient_phone,
    channels, kind, subject, message, action_url
  )
  select
    target_workspace_id,
    target_project_id,
    m.user_id,
    case when m.role = 'owner' then coalesce(nullif(s.email, ''), u.email) else u.email end,
    m.phone,
    array['in_app']::text[]
      || case when coalesce(case when m.role = 'owner' then coalesce(nullif(s.email, ''), u.email) else u.email end, '') <> '' then array['email']::text[] else array[]::text[] end
      || case when coalesce((m.notification_preferences->>'whatsapp')::boolean, false) and m.phone is not null then array['whatsapp']::text[] else array[]::text[] end,
    notification_kind,
    notification_subject,
    notification_message,
    notification_action_url
  from public.memberships m
  left join auth.users u on u.id = m.user_id
  left join public.studio_settings s on s.workspace_id = m.workspace_id
  where m.workspace_id = target_workspace_id
    and m.role in ('owner', 'accountant')
    and m.status = 'active';
$$;

create or replace function private.notify_financial_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_url text;
begin
  target_url := '/studio?section=finance&target=' || new.id::text;

  if tg_table_name = 'invoices' then
    if tg_op = 'INSERT' and new.status in ('issued', 'sent') then
      perform private.notify_workspace_finance_roles(
        new.workspace_id, new.project_id, 'invoice.issued',
        'صدرت فاتورة عميل', new.installment_label || ' بقيمة ' || new.amount || ' ' || new.currency || '.', target_url
      );
    elsif tg_op = 'UPDATE' and new.status = 'paid' and old.status is distinct from new.status then
      perform private.notify_workspace_finance_roles(
        new.workspace_id, new.project_id, 'invoice.paid',
        'تم تحصيل دفعة عميل', new.installment_label || ' بقيمة ' || new.amount || ' ' || new.currency || '.', target_url
      );
    end if;
  elsif tg_table_name = 'collaborator_claims' then
    if tg_op = 'INSERT' and new.status in ('submitted', 'due', 'approved') then
      perform private.notify_workspace_finance_roles(
        new.workspace_id, new.project_id, 'claim.due',
        'استحقاق متعاون جديد', new.item_name || ' بقيمة ' || new.amount || ' ' || new.currency || '.', target_url
      );
      if new.collaborator_user_id is not null then
        insert into public.notifications (
          workspace_id, project_id, recipient_user_id, recipient_email, recipient_phone,
          channels, kind, subject, message, action_url
        )
        select
          new.workspace_id, new.project_id, m.user_id, u.email, m.phone,
          array['in_app', 'email']::text[]
            || case when coalesce((m.notification_preferences->>'whatsapp')::boolean, false) and m.phone is not null then array['whatsapp']::text[] else array[]::text[] end,
          'claim.due', 'تم تسجيل مستحقك', new.item_name || ' بقيمة ' || new.amount || ' ' || new.currency || '.', target_url
        from public.memberships m
        left join auth.users u on u.id = m.user_id
        where m.workspace_id = new.workspace_id and m.user_id = new.collaborator_user_id and m.status = 'active';
      end if;
    elsif tg_op = 'UPDATE' and new.status = 'paid' and old.status is distinct from new.status then
      perform private.notify_workspace_finance_roles(
        new.workspace_id, new.project_id, 'claim.paid',
        'تم تحويل مستحق متعاون', new.item_name || ' بقيمة ' || new.amount || ' ' || new.currency || '.', target_url
      );
      if new.collaborator_user_id is not null then
        insert into public.notifications (
          workspace_id, project_id, recipient_user_id, recipient_email, recipient_phone,
          channels, kind, subject, message, action_url
        )
        select
          new.workspace_id, new.project_id, m.user_id, u.email, m.phone,
          array['in_app', 'email']::text[]
            || case when coalesce((m.notification_preferences->>'whatsapp')::boolean, false) and m.phone is not null then array['whatsapp']::text[] else array[]::text[] end,
          'claim.paid', 'تم تحويل مستحقك', 'سجلنا تحويل ' || new.amount || ' ' || new.currency || ' لمستحق ' || new.item_name || '.', target_url
        from public.memberships m
        left join auth.users u on u.id = m.user_id
        where m.workspace_id = new.workspace_id and m.user_id = new.collaborator_user_id and m.status = 'active';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists invoice_finance_notifications on public.invoices;
create trigger invoice_finance_notifications
after insert or update of status on public.invoices
for each row execute function private.notify_financial_status_change();

drop trigger if exists collaborator_claim_finance_notifications on public.collaborator_claims;
create trigger collaborator_claim_finance_notifications
after insert or update of status on public.collaborator_claims
for each row execute function private.notify_financial_status_change();
