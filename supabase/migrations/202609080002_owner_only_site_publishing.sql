-- Draft preparation is delegated through the server. Publishing stays owner-only.
drop policy if exists "owners manage public site" on public.public_site_content;
create policy "owners manage public site" on public.public_site_content
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner']))
  with check (private.has_workspace_role(workspace_id, array['owner']));
