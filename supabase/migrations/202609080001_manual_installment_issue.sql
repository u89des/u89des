create or replace function public.review_proof(p_proof_id uuid, p_decision text, p_note text default null)
returns public.proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  proof_row public.proofs%rowtype;
begin
  if p_decision not in ('approved', 'changes_requested') then raise exception 'Invalid proof decision'; end if;
  select * into proof_row from public.proofs where id = p_proof_id for update;
  if proof_row.id is null then raise exception 'Proof not found'; end if;
  if not private.is_project_client(proof_row.project_id) then raise exception 'Forbidden'; end if;
  if proof_row.status <> 'sent' then raise exception 'Proof is not open for review'; end if;
  if p_decision = 'changes_requested' and coalesce(trim(p_note), '') = '' then raise exception 'Revision note is required'; end if;
  update public.proofs set status = p_decision, client_note = p_note, reviewed_at = now()
  where id = p_proof_id returning * into proof_row;
  if proof_row.task_id is not null then
    update public.project_tasks set status = case when p_decision = 'approved' then 'done' else 'review' end where id = proof_row.task_id;
  end if;
  if proof_row.work_order_id is not null then
    update public.work_orders
    set status = case when p_decision = 'approved' then 'completed' else 'client_revision' end,
        completed_at = case when p_decision = 'approved' then now() else null end
    where id = proof_row.work_order_id;
    if p_decision = 'approved' then
      insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type, metadata)
      values (proof_row.workspace_id, proof_row.work_order_id, (select auth.uid()), 'العميل', 'اعتمد العميل البروفة.', 'decision', jsonb_build_object('decision', p_decision, 'proof_id', proof_row.id));
    end if;
  end if;
  update public.projects set next_action = case when p_decision = 'approved' then 'تحصيل الدفعة التالية أو تجهيز التسليم' else 'عبد الوهاب يراجع طلب التعديل ويقرر من ينفذه' end where id = proof_row.project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (proof_row.workspace_id, proof_row.project_id, (select auth.uid()), 'العميل', 'proof.reviewed', case when p_decision = 'approved' then 'اعتمد العميل البروفة' else 'طلب العميل تعديلاً على البروفة' end, jsonb_build_object('proof_id', proof_row.id, 'decision', p_decision));
  perform private.notify_workspace_owner(
    proof_row.workspace_id, proof_row.project_id, 'proof.reviewed',
    case when p_decision = 'approved' then 'اعتمد العميل البروفة' else 'طلب العميل تعديلاً' end,
    case when p_decision = 'approved' then 'يمكنك الانتقال إلى الدفعة التالية أو تجهيز التسليم.' else coalesce(nullif(trim(p_note), ''), 'راجع قرار العميل وملاحظاته في المشروع.') end,
    '/workspace/projects/' || proof_row.project_id::text || '/proof'
  );
  return proof_row;
end;

$$;

create or replace function public.issue_project_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql security definer set search_path = ''
as $$
declare invoice_row public.invoices%rowtype;
begin
  select * into invoice_row from public.invoices where id = p_invoice_id for update;
  if invoice_row.id is null then raise exception 'Invoice not found'; end if;
  if not private.has_workspace_role(invoice_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if invoice_row.status <> 'draft' then raise exception 'Only draft invoices can be issued'; end if;
  if not exists (select 1 from public.contracts where project_id = invoice_row.project_id and status = 'signed') then raise exception 'A signed contract is required'; end if;
  update public.invoices set status = 'issued', due_date = current_date where id = p_invoice_id returning * into invoice_row;
  insert into public.activity_events(workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values(invoice_row.workspace_id, invoice_row.project_id, (select auth.uid()), 'الإدارة', 'invoice.issued', 'أصدرت الإدارة الدفعة بقرار مباشر');
  return invoice_row;
end;
$$;
revoke all on function public.issue_project_invoice(uuid) from public, anon;
grant execute on function public.issue_project_invoice(uuid) to authenticated;
