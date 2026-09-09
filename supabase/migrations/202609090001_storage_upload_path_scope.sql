begin;

-- In the nested project query, unqualified "name" binds to p.name rather than
-- storage.objects.name. Qualify the outer column without changing role scope.
alter policy "project participants upload stored files" on storage.objects
  with check (
    bucket_id = 'project-files'
    and array_length(storage.foldername(name), 1) >= 2
    and private.can_access_project(((storage.foldername(name))[2])::uuid)
    and exists (
      select 1 from public.projects p
      where p.id = ((storage.foldername(objects.name))[2])::uuid
        and p.workspace_id = ((storage.foldername(objects.name))[1])::uuid
    )
  );

-- Also qualify metadata references inside invoice/work-order subqueries so a
-- file cannot be attached to a record from a different project or workspace.
alter policy "project participants create file records" on public.project_files
  with check (
    private.can_access_project(project_id)
    and split_part(storage_path, '/', 1) = workspace_id::text
    and split_part(storage_path, '/', 2) = project_id::text
    and uploaded_by = (select auth.uid())
    and exists (select 1 from public.projects p where p.id = project_files.project_id and p.workspace_id = project_files.workspace_id)
    and (invoice_id is null or exists (
      select 1 from public.invoices i where i.id = project_files.invoice_id
        and i.project_id = project_files.project_id and i.workspace_id = project_files.workspace_id
    ))
    and (work_order_id is null or exists (
      select 1 from public.work_orders w where w.id = project_files.work_order_id
        and w.project_id = project_files.project_id and w.workspace_id = project_files.workspace_id
        and (private.has_workspace_role(project_files.workspace_id, array['owner', 'manager']) or private.is_work_order_assignee(w.id, true))
    ))
    and (private.has_workspace_role(workspace_id, array['owner', 'manager']) or (is_client_visible = false and proof_id is null))
  );

commit;
