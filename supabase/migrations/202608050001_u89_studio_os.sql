begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  default_currency text not null default 'SAR',
  timezone text not null default 'Asia/Riyadh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'accountant', 'collaborator', 'client')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  display_name text not null,
  phone text,
  notification_preferences jsonb not null default '{"email": true, "whatsapp": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  preferred_contact text not null default 'whatsapp',
  notification_channels text[] not null default array['whatsapp']::text[],
  notes text,
  status text not null default 'lead' check (status in ('lead', 'active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  reference text not null default ('REQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  project_name text not null,
  service_id text not null,
  service_name text not null,
  goal text,
  audience text,
  budget text,
  requested_deadline date,
  form_answers jsonb not null default '{}'::jsonb,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'needs_info', 'accepted', 'declined', 'converted')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  request_id uuid references public.service_requests(id) on delete set null,
  reference text not null default ('PRJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  name text not null,
  service_id text not null,
  service_name text not null,
  status text not null default 'brief' check (status in ('brief', 'quote', 'contract', 'active', 'proof', 'delivery', 'follow_up', 'completed', 'paused', 'cancelled')),
  current_stage text not null default 'brief',
  next_action text,
  start_date date,
  due_date date,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.brief_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  service_id text not null,
  title text not null,
  description text,
  schema jsonb not null default '{"sections": []}'::jsonb,
  enabled boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, service_id, title)
);

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid references public.brief_templates(id) on delete set null,
  reference text not null default ('BRF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  template_snapshot jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'sent', 'in_progress', 'submitted', 'needs_changes', 'approved')),
  sent_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference),
  unique (project_id)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  brief_id uuid not null references public.briefs(id) on delete restrict,
  reference text not null default ('Q-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  currency text not null default 'SAR',
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0 and discount <= subtotal),
  total numeric(14, 2) generated always as (subtotal - discount) stored,
  scope text not null,
  deliverables jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  payment_plan jsonb not null default '[50, 50]'::jsonb,
  revision_rounds integer,
  first_proof_days integer not null default 14,
  revision_days integer not null default 7,
  validity_days integer not null default 10,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'superseded')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  reference text not null default ('C-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  body jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'client_signed', 'signed', 'void')),
  client_signer_name text,
  client_signed_at timestamptz,
  owner_signed_at timestamptz,
  client_signature_evidence jsonb,
  owner_signature_evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  reference text not null default ('INV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  invoice_type text not null default 'non_tax' check (invoice_type in ('non_tax')),
  installment_number integer not null default 1,
  installment_label text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'SAR',
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'issued', 'sent', 'overdue', 'paid', 'cancelled')),
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_retainer_request_id uuid,
  parent_work_order_id uuid references public.work_orders(id) on delete cascade,
  work_kind text not null default 'whole' check (work_kind in ('whole', 'part')),
  reference text not null default ('WO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title text not null,
  description text not null,
  owner_recommendations text,
  creative_core text,
  creative_rationale text,
  creative_notes text,
  delegation_scope text,
  execution_mode text not null default 'owner_led' check (execution_mode in ('owner_led', 'delegated', 'collaborative')),
  creative_stage text not null default 'exploration' check (creative_stage in ('exploration', 'concept', 'direction', 'production')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  requires_client_approval boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'creative_development', 'direction_ready', 'owner_production', 'dispatched', 'in_progress', 'internal_review', 'changes_requested', 'owner_approved', 'client_review', 'completed', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  dispatched_at timestamptz,
  owner_approved_by uuid references auth.users(id) on delete set null,
  owner_approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

alter table public.work_orders add column if not exists parent_work_order_id uuid references public.work_orders(id) on delete cascade;
alter table public.work_orders add column if not exists work_kind text not null default 'whole' check (work_kind in ('whole', 'part'));

create table if not exists public.work_order_assignees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_label text,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (work_order_id, user_id)
);

create table if not exists public.work_order_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_label text not null,
  body text not null,
  message_type text not null default 'message' check (message_type in ('message', 'recommendation', 'decision', 'system')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaborator_claims (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  work_order_id uuid references public.work_orders(id) on delete set null,
  collaborator_user_id uuid references auth.users(id) on delete set null,
  reference text not null default ('COL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  collaborator_name text not null,
  item_name text not null,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  amount numeric(14, 2) generated always as (unit_price * quantity) stored,
  currency text not null default 'SAR',
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'due', 'paid', 'rejected')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.collaborator_rates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  collaborator_user_id uuid references auth.users(id) on delete cascade,
  collaborator_name text not null,
  item_name text not null,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  currency text not null default 'SAR',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, collaborator_user_id, item_name, currency)
);

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  claim_id uuid references public.collaborator_claims(id) on delete set null,
  direction text not null check (direction in ('income', 'expense')),
  category text not null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'SAR',
  exchange_rate_to_sar numeric(14, 6),
  amount_sar numeric(14, 2),
  status text not null default 'planned' check (status in ('planned', 'due', 'cleared', 'cancelled')),
  occurred_on date,
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.retainers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  monthly_fee numeric(14, 2) not null default 0,
  currency text not null default 'SAR',
  included_units jsonb not null default '[]'::jsonb,
  request_rules jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  unique (project_id)
);

create table if not exists public.retainer_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  retainer_id uuid not null references public.retainers(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text not null default ('RR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title text not null,
  request_type text not null,
  brief text not null,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  requested_due_date date,
  assignee_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'triage', 'assigned', 'in_progress', 'review', 'changes_requested', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

alter table public.work_orders
  add constraint work_orders_source_retainer_request_fk
  foreign key (source_retainer_request_id) references public.retainer_requests(id) on delete set null;

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assignee_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'changes_requested', 'done', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_client_visible boolean not null default false,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  version integer not null default 1,
  title text not null,
  note text,
  status text not null default 'internal_review' check (status in ('internal_review', 'sent', 'approved', 'changes_requested', 'superseded')),
  client_note text,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  message_id uuid references public.work_order_messages(id) on delete set null,
  proof_id uuid references public.proofs(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  category text not null default 'general' check (category in ('brief', 'source', 'proof', 'contract', 'invoice', 'delivery', 'general')),
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  is_client_visible boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text,
  recipient_phone text,
  channels text[] not null default array['in_app']::text[],
  kind text not null,
  subject text not null,
  message text not null,
  action_url text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'partial', 'failed', 'read', 'cancelled')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_label text not null,
  event_type text not null,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  owner_name_ar text not null,
  owner_name_en text,
  email text not null,
  phone text not null,
  bank_name text,
  bank_account text,
  bank_iban text,
  vat_registered boolean not null default false,
  quote_validity_days integer not null default 10,
  first_proof_days integer not null default 14,
  revision_days integer not null default 7,
  restart_days integer not null default 10,
  finalization_days integer not null default 14,
  payment_plans jsonb not null default '[{"label":"دفعتان","percentages":[50,50]}]'::jsonb,
  collaborator_currencies text[] not null default array['SAR', 'USD', 'EUR']::text[],
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_site_content (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  published boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_user_idx on public.memberships(user_id, status);
create index if not exists memberships_workspace_role_idx on public.memberships(workspace_id, role, status);
create index if not exists clients_workspace_user_idx on public.clients(workspace_id, user_id);
create index if not exists requests_workspace_status_idx on public.service_requests(workspace_id, status, created_at desc);
create index if not exists projects_workspace_client_idx on public.projects(workspace_id, client_id, status);
create index if not exists tasks_workspace_assignee_idx on public.project_tasks(workspace_id, assignee_user_id, status);
create index if not exists work_orders_workspace_project_idx on public.work_orders(workspace_id, project_id, status, created_at desc);
create index if not exists work_orders_parent_idx on public.work_orders(parent_work_order_id, status) where parent_work_order_id is not null;
create index if not exists work_order_assignees_user_idx on public.work_order_assignees(workspace_id, user_id, work_order_id);
create index if not exists work_order_messages_order_idx on public.work_order_messages(work_order_id, created_at);
create index if not exists invoices_workspace_status_idx on public.invoices(workspace_id, status, due_date);
create index if not exists claims_workspace_user_idx on public.collaborator_claims(workspace_id, collaborator_user_id, status);
create index if not exists rates_workspace_user_idx on public.collaborator_rates(workspace_id, collaborator_user_id, active);
create index if not exists financial_entries_workspace_date_idx on public.financial_entries(workspace_id, occurred_on desc, status);
create index if not exists retainers_workspace_status_idx on public.retainers(workspace_id, status, end_date);
create index if not exists retainer_requests_workspace_status_idx on public.retainer_requests(workspace_id, status, requested_due_date);
create index if not exists notifications_pending_idx on public.notifications(status, created_at) where status in ('pending', 'failed');
create index if not exists activity_workspace_project_idx on public.activity_events(workspace_id, project_id, created_at desc);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'workspaces', 'memberships', 'clients', 'service_requests', 'projects',
    'brief_templates', 'briefs', 'quotes', 'contracts', 'invoices',
    'collaborator_claims', 'collaborator_rates', 'financial_entries', 'retainers',
    'retainer_requests', 'project_tasks', 'work_orders', 'work_order_messages', 'proofs', 'project_files',
    'notifications', 'studio_settings', 'public_site_content'
  ] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', table_name);
    execute format(
      'create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create or replace function private.protect_signed_contract_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (old.client_signed_at is not null or old.owner_signed_at is not null)
    and (
      new.body is distinct from old.body
      or new.quote_id is distinct from old.quote_id
      or new.project_id is distinct from old.project_id
      or new.workspace_id is distinct from old.workspace_id
    ) then
    raise exception 'Signed contract content is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_signed_contract_content on public.contracts;
create trigger protect_signed_contract_content
before update on public.contracts
for each row execute function private.protect_signed_contract_content();

create or replace function private.protect_paid_invoice_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'paid'
    and (
      new.amount is distinct from old.amount
      or new.currency is distinct from old.currency
      or new.project_id is distinct from old.project_id
      or new.client_id is distinct from old.client_id
      or new.contract_id is distinct from old.contract_id
      or new.installment_number is distinct from old.installment_number
    ) then
    raise exception 'Paid invoice financial content is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_paid_invoice_content on public.invoices;
create trigger protect_paid_invoice_content
before update on public.invoices
for each row execute function private.protect_paid_invoice_content();

create or replace function private.protect_workflow_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and new.status is distinct from old.status then
    raise exception 'Workflow status changes must use an approved workflow action';
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['projects', 'briefs', 'quotes', 'contracts', 'invoices', 'collaborator_claims', 'work_orders', 'proofs'] loop
    execute format('drop trigger if exists protect_workflow_status_change on public.%I', table_name);
    execute format(
      'create trigger protect_workflow_status_change before update on public.%I for each row execute function private.protect_workflow_status_change()',
      table_name
    );
  end loop;
end;
$$;

create or replace function private.has_workspace_role(target_workspace_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.workspace_id = target_workspace_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_workspace_role(target_workspace_id, array['owner', 'manager', 'accountant', 'collaborator', 'client']);
$$;

create or replace function private.is_work_order_assignee(target_work_order_id uuid, require_dispatched boolean default true)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_order_assignees a
    join public.work_orders w on w.id = a.work_order_id
    where a.work_order_id = target_work_order_id
      and a.user_id = (select auth.uid())
      and (not require_dispatched or w.dispatched_at is not null)
      and w.status <> 'cancelled'
  );
$$;

create or replace function private.is_project_work_assignee(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_orders w
    join public.work_order_assignees a on a.work_order_id = w.id
    where w.project_id = target_project_id
      and w.dispatched_at is not null
      and w.status <> 'cancelled'
      and a.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_access_work_order(target_work_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_orders w
    where w.id = target_work_order_id
      and (
        private.has_workspace_role(w.workspace_id, array['owner', 'manager'])
        or private.is_work_order_assignee(w.id, true)
      )
  );
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        private.has_workspace_role(p.workspace_id, array['owner', 'manager', 'accountant'])
        or exists (
          select 1 from public.clients c
          where c.id = p.client_id and c.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.project_tasks t
          where t.project_id = p.id and t.assignee_user_id = (select auth.uid())
        )
        or private.is_project_work_assignee(p.id)
      )
  );
$$;

create or replace function private.is_project_client(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    join public.clients c on c.id = p.client_id
    where p.id = target_project_id
      and c.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_project_assignee(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_project_work_assignee(target_project_id)
    or exists (
      select 1
      from public.project_tasks t
      where t.project_id = target_project_id
        and t.assignee_user_id = (select auth.uid())
    );
$$;

create or replace function private.can_read_project_file(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_files f
    where f.storage_path = target_storage_path
      and (
        private.has_workspace_role(f.workspace_id, array['owner', 'manager'])
        or (
          f.work_order_id is not null
          and private.is_work_order_assignee(f.work_order_id, true)
          and f.category not in ('contract', 'invoice', 'delivery')
        )
        or (f.work_order_id is null and private.is_project_assignee(f.project_id) and f.category not in ('contract', 'invoice', 'delivery'))
        or (private.is_project_client(f.project_id) and (f.is_client_visible or f.uploaded_by = (select auth.uid())))
      )
  );
$$;

create or replace function private.notify_project_client(
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
    target_workspace_id, p.id, c.user_id, c.email, c.phone,
    case
      when 'in_app' = any(c.notification_channels) then c.notification_channels
      else array_append(c.notification_channels, 'in_app')
    end,
    notification_kind, notification_subject, notification_message, notification_action_url
  from public.projects p
  join public.clients c on c.id = p.client_id
  where p.id = target_project_id
    and p.workspace_id = target_workspace_id;
$$;

create or replace function private.notify_workspace_owner(
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
    workspace_id, project_id, recipient_user_id, recipient_email,
    channels, kind, subject, message, action_url
  )
  select
    target_workspace_id, target_project_id, m.user_id, s.email,
    case when s.email is null then array['in_app']::text[] else array['in_app', 'email']::text[] end,
    notification_kind, notification_subject, notification_message, notification_action_url
  from public.memberships m
  left join public.studio_settings s on s.workspace_id = m.workspace_id
  where m.workspace_id = target_workspace_id
    and m.role = 'owner'
    and m.status = 'active'
  order by m.created_at
  limit 1;
$$;

create or replace function private.notify_work_order_assignees(
  target_work_order_id uuid,
  notification_kind text,
  notification_subject text,
  notification_message text
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
    w.workspace_id, w.project_id, a.user_id, u.email, m.phone,
    array['in_app']::text[]
      || case when coalesce((m.notification_preferences->>'email')::boolean, false) and u.email is not null then array['email']::text[] else array[]::text[] end
      || case when coalesce((m.notification_preferences->>'whatsapp')::boolean, false) and m.phone is not null then array['whatsapp']::text[] else array[]::text[] end,
    notification_kind, notification_subject, notification_message,
    '/portal/work-orders/' || w.id::text
  from public.work_orders w
  join public.work_order_assignees a on a.work_order_id = w.id
  left join public.memberships m on m.workspace_id = w.workspace_id and m.user_id = a.user_id
  left join auth.users u on u.id = a.user_id
  where w.id = target_work_order_id
    and w.dispatched_at is not null;
$$;

create or replace function public.submit_service_request(
  p_workspace_slug text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_workspace public.workspaces%rowtype;
  target_client_id uuid;
  request_id uuid;
  request_reference text;
  owner_user_id uuid;
  owner_email text;
  channel_values text[];
begin
  select * into target_workspace
  from public.workspaces
  where slug = lower(trim(p_workspace_slug));

  if target_workspace.id is null then
    raise exception 'Workspace not found';
  end if;

  if coalesce(trim(p_payload->>'name'), '') = ''
    or coalesce(trim(p_payload->>'organization'), '') = ''
    or coalesce(trim(p_payload->>'email'), '') = ''
    or coalesce(trim(p_payload->>'phone'), '') = '' then
    raise exception 'Missing required contact data';
  end if;
  if octet_length(p_payload::text) > 50000 then
    raise exception 'Request payload is too large';
  end if;

  channel_values := case p_payload->>'notifications'
    when 'واتساب والبريد' then array['whatsapp', 'email']::text[]
    when 'البريد الإلكتروني' then array['email']::text[]
    else array['whatsapp']::text[]
  end;

  insert into public.clients (
    workspace_id, company_name, contact_name, email, phone,
    preferred_contact, notification_channels, status
  ) values (
    target_workspace.id,
    trim(p_payload->>'organization'),
    trim(p_payload->>'name'),
    lower(trim(p_payload->>'email')),
    trim(p_payload->>'phone'),
    coalesce(p_payload->>'communication', 'واتساب'),
    channel_values,
    'lead'
  )
  on conflict (workspace_id, email) do update set
    company_name = excluded.company_name,
    contact_name = excluded.contact_name,
    phone = excluded.phone,
    preferred_contact = excluded.preferred_contact,
    notification_channels = excluded.notification_channels,
    updated_at = now()
  returning id into target_client_id;

  if exists (
    select 1 from public.service_requests sr
    where sr.workspace_id = target_workspace.id
      and sr.client_id = target_client_id
      and sr.created_at > now() - interval '2 minutes'
  ) then
    raise exception 'Please wait before submitting another request';
  end if;

  insert into public.service_requests (
    workspace_id, client_id, project_name, service_id, service_name,
    goal, audience, budget, requested_deadline, form_answers
  ) values (
    target_workspace.id,
    target_client_id,
    coalesce(nullif(trim(p_payload->>'project'), ''), 'مشروع جديد'),
    coalesce(nullif(trim(p_payload->>'serviceId'), ''), 'service-unknown'),
    coalesce(nullif(trim(p_payload->>'serviceName'), ''), 'خدمة إبداعية'),
    p_payload->>'goal',
    p_payload->>'audience',
    p_payload->>'budget',
    nullif(p_payload->>'deadline', '')::date,
    p_payload
  ) returning id, reference into request_id, request_reference;

  insert into public.activity_events (
    workspace_id, actor_label, event_type, label, metadata
  ) values (
    target_workspace.id,
    trim(p_payload->>'name'),
    'request.created',
    'وصل طلب خدمة جديد من الموقع',
    jsonb_build_object('request_id', request_id, 'reference', request_reference)
  );

  select m.user_id, s.email into owner_user_id, owner_email
  from public.memberships m
  left join public.studio_settings s on s.workspace_id = m.workspace_id
  where m.workspace_id = target_workspace.id
    and m.role = 'owner'
    and m.status = 'active'
  order by m.created_at
  limit 1;

  insert into public.notifications (
    workspace_id, recipient_user_id, recipient_email, channels,
    kind, subject, message, action_url
  ) values (
    target_workspace.id,
    owner_user_id,
    owner_email,
    array['in_app', 'email']::text[],
    'request.created',
    'طلب مشروع جديد',
    'وصل طلب جديد من ' || trim(p_payload->>'organization') || ' برقم ' || request_reference,
    '/workspace/requests/' || request_id::text
  );

  return jsonb_build_object('id', request_id, 'reference', request_reference);
end;
$$;

create or replace function public.get_public_site_content(p_workspace_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select c.content
  from public.public_site_content c
  join public.workspaces w on w.id = c.workspace_id
  where w.slug = lower(trim(p_workspace_slug))
    and c.published = true
  limit 1;
$$;

create or replace function public.accept_service_request(
  p_request_id uuid,
  p_template_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.service_requests%rowtype;
  template_row public.brief_templates%rowtype;
  project_id uuid;
  brief_id uuid;
  client_row public.clients%rowtype;
begin
  select * into request_row from public.service_requests where id = p_request_id for update;
  if request_row.id is null then raise exception 'Request not found'; end if;
  if not private.has_workspace_role(request_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if request_row.status not in ('new', 'needs_info', 'accepted') then raise exception 'Request cannot be accepted from its current status'; end if;

  if p_template_id is not null then
    select * into template_row from public.brief_templates
    where id = p_template_id and workspace_id = request_row.workspace_id and enabled = true;
  else
    select * into template_row from public.brief_templates
    where workspace_id = request_row.workspace_id
      and service_id in (request_row.service_id, 'any')
      and enabled = true
    order by case when service_id = request_row.service_id then 0 else 1 end, updated_at desc
    limit 1;
  end if;
  if template_row.id is null then raise exception 'No active brief template for this service'; end if;

  insert into public.projects (
    workspace_id, client_id, request_id, name, service_id, service_name,
    status, current_stage, next_action, due_date, metadata
  ) values (
    request_row.workspace_id, request_row.client_id, request_row.id,
    request_row.project_name, request_row.service_id, request_row.service_name,
    'brief', 'brief', 'ينتظر تعبئة البريف', request_row.requested_deadline,
    jsonb_build_object('goal', request_row.goal, 'audience', request_row.audience)
  ) returning id into project_id;

  insert into public.briefs (
    workspace_id, project_id, template_id, template_snapshot, status, sent_at
  ) values (
    request_row.workspace_id, project_id, template_row.id,
    jsonb_build_object('title', template_row.title, 'description', template_row.description, 'schema', template_row.schema, 'version', template_row.version),
    'sent', now()
  ) returning id into brief_id;

  update public.service_requests set status = 'converted', reviewed_by = (select auth.uid()), reviewed_at = now() where id = request_row.id;
  update public.clients set status = 'active' where id = request_row.client_id returning * into client_row;

  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (request_row.workspace_id, project_id, (select auth.uid()), 'الإدارة', 'request.accepted', 'تم قبول الطلب وإرسال البريف');

  insert into public.notifications (
    workspace_id, project_id, recipient_user_id, recipient_email, recipient_phone,
    channels, kind, subject, message, action_url
  ) values (
    request_row.workspace_id, project_id, client_row.user_id, client_row.email, client_row.phone,
    array_append(client_row.notification_channels, 'in_app'), 'brief.sent',
    'بريف مشروعك جاهز', 'أكمل بريف ' || request_row.project_name || ' لنبدأ إعداد العرض.',
    '/portal/projects/' || project_id::text || '/brief'
  );

  return jsonb_build_object('project_id', project_id, 'brief_id', brief_id);
end;
$$;

create or replace function public.submit_brief(p_brief_id uuid, p_answers jsonb)
returns public.briefs
language plpgsql
security definer
set search_path = ''
as $$
declare
  brief_row public.briefs%rowtype;
begin
  select * into brief_row from public.briefs where id = p_brief_id for update;
  if brief_row.id is null then raise exception 'Brief not found'; end if;
  if not private.is_project_client(brief_row.project_id) then raise exception 'Forbidden'; end if;
  if brief_row.status not in ('sent', 'in_progress', 'needs_changes') then raise exception 'Brief cannot be submitted from its current status'; end if;
  update public.briefs set answers = p_answers, status = 'submitted', submitted_at = now()
  where id = p_brief_id returning * into brief_row;
  update public.projects set next_action = 'مراجعة البريف واعتماده' where id = brief_row.project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (brief_row.workspace_id, brief_row.project_id, (select auth.uid()), 'العميل', 'brief.submitted', 'أرسل العميل إجابات البريف');
  perform private.notify_workspace_owner(
    brief_row.workspace_id, brief_row.project_id, 'brief.submitted',
    'البريف جاهز للمراجعة', 'أكمل العميل بريف المشروع وأصبح بانتظار قرارك.',
    '/workspace/projects/' || brief_row.project_id::text || '/brief'
  );
  return brief_row;
end;
$$;

create or replace function public.approve_brief(p_brief_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  brief_row public.briefs%rowtype;
  quote_id uuid;
  scope_text text;
  settings_row public.studio_settings%rowtype;
begin
  select * into brief_row from public.briefs where id = p_brief_id for update;
  if brief_row.id is null then raise exception 'Brief not found'; end if;
  if not private.has_workspace_role(brief_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if brief_row.status <> 'submitted' then raise exception 'Only a submitted brief can be approved'; end if;

  update public.briefs set status = 'approved', approved_at = now(), approved_by = (select auth.uid()) where id = p_brief_id;
  scope_text := coalesce(
    nullif(brief_row.answers->>'required', ''),
    nullif(brief_row.answers->>'deliverables', ''),
    'يحدد نطاق العمل من البريف المعتمد.'
  );
  select * into settings_row from public.studio_settings where workspace_id = brief_row.workspace_id;
  insert into public.quotes (
    workspace_id, project_id, brief_id, scope, deliverables, status,
    first_proof_days, revision_days, validity_days
  )
  values (
    brief_row.workspace_id, brief_row.project_id, brief_row.id, scope_text,
    jsonb_build_array(scope_text), 'draft',
    coalesce(settings_row.first_proof_days, 14),
    coalesce(settings_row.revision_days, 7),
    coalesce(settings_row.quote_validity_days, 10)
  )
  returning id into quote_id;
  update public.projects set status = 'quote', current_stage = 'quote', next_action = 'مراجعة عرض السعر وإرساله' where id = brief_row.project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (brief_row.workspace_id, brief_row.project_id, (select auth.uid()), 'الإدارة', 'brief.approved', 'تم اعتماد البريف وفتح عرض السعر');
  return quote_id;
end;
$$;

create or replace function public.send_quote(p_quote_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = ''
as $$
declare
  quote_row public.quotes%rowtype;
  client_row public.clients%rowtype;
  plan_total numeric;
begin
  select * into quote_row from public.quotes where id = p_quote_id for update;
  if quote_row.id is null then raise exception 'Quote not found'; end if;
  if not private.has_workspace_role(quote_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if quote_row.status <> 'draft' or quote_row.total <= 0 then raise exception 'Quote must be a priced draft'; end if;
  if not exists (select 1 from public.briefs where id = quote_row.brief_id and status = 'approved') then raise exception 'Brief approval is required'; end if;
  select sum(value::numeric) into plan_total from jsonb_array_elements_text(quote_row.payment_plan);
  if plan_total <> 100 then raise exception 'Payment plan must equal 100 percent'; end if;
  update public.quotes set status = 'sent', valid_until = current_date + validity_days
  where id = p_quote_id returning * into quote_row;
  select c.* into client_row from public.projects p join public.clients c on c.id = p.client_id where p.id = quote_row.project_id;
  update public.projects set next_action = 'ينتظر اعتماد عرض السعر' where id = quote_row.project_id;
  insert into public.notifications (workspace_id, project_id, recipient_user_id, recipient_email, recipient_phone, channels, kind, subject, message, action_url)
  values (quote_row.workspace_id, quote_row.project_id, client_row.user_id, client_row.email, client_row.phone, array_append(client_row.notification_channels, 'in_app'), 'quote.sent', 'عرض السعر جاهز', 'راجع عرض السعر واعتمده من مساحة مشروعك.', '/portal/projects/' || quote_row.project_id::text || '/quote');
  return quote_row;
end;
$$;

create or replace function public.respond_to_quote(p_quote_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  quote_row public.quotes%rowtype;
  contract_id uuid;
begin
  select * into quote_row from public.quotes where id = p_quote_id for update;
  if quote_row.id is null then raise exception 'Quote not found'; end if;
  if not private.is_project_client(quote_row.project_id) then raise exception 'Forbidden'; end if;
  if quote_row.status not in ('sent', 'viewed') then raise exception 'Quote is not open for a response'; end if;
  if quote_row.valid_until is not null and quote_row.valid_until < current_date then
    raise exception 'Quote has expired';
  end if;
  if not p_accept then
    update public.quotes set status = 'declined' where id = p_quote_id;
    update public.projects set next_action = 'مراجعة رفض العرض والتواصل مع العميل' where id = quote_row.project_id;
    perform private.notify_workspace_owner(
      quote_row.workspace_id, quote_row.project_id, 'quote.declined',
      'رفض العميل عرض السعر', 'راجع ملاحظات العميل وتواصل معه لتحديد الخطوة التالية.',
      '/workspace/projects/' || quote_row.project_id::text || '/quote'
    );
    return jsonb_build_object('accepted', false);
  end if;
  update public.quotes set status = 'accepted', accepted_at = now() where id = p_quote_id;
  insert into public.contracts (workspace_id, project_id, quote_id, body, status)
  values (
    quote_row.workspace_id, quote_row.project_id, quote_row.id,
    jsonb_build_object(
      'scope', quote_row.scope,
      'deliverables', quote_row.deliverables,
      'exclusions', quote_row.exclusions,
      'payment_plan', quote_row.payment_plan,
      'total', quote_row.total,
      'currency', quote_row.currency,
      'terms', jsonb_build_array(
        'يبدأ التنفيذ بعد توقيع الطرفين واستلام الدفعة الأولى والمعلومات اللازمة.',
        'تقدم البروفة الأولى خلال ' || quote_row.first_proof_days || ' يوم عمل من اكتمال متطلبات البدء.',
        'تنفذ كل جولة تعديل متفق عليها خلال ' || quote_row.revision_days || ' أيام عمل من استلام ملاحظات مجمعة وواضحة.',
        'تبقى الأفكار والمقترحات غير المعتمدة ملكاً لمقدم الخدمة، وتنتقل حقوق استخدام المخرجات النهائية بعد سداد كامل المستحقات.',
        'يعتمد النطاق والمخرجات والاستثناءات وخطة الدفعات الواردة في عرض السعر الملحق بهذا العقد.'
      )
    ),
    'sent'
  ) returning id into contract_id;
  update public.projects set status = 'contract', current_stage = 'contract', next_action = 'توقيع العقد' where id = quote_row.project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (quote_row.workspace_id, quote_row.project_id, (select auth.uid()), 'العميل', 'quote.accepted', 'اعتمد العميل عرض السعر');
  perform private.notify_workspace_owner(
    quote_row.workspace_id, quote_row.project_id, 'quote.accepted',
    'اعتمد العميل عرض السعر', 'العقد أصبح جاهزاً لتوقيع مقدم الخدمة.',
    '/workspace/projects/' || quote_row.project_id::text || '/contract'
  );
  return jsonb_build_object('accepted', true, 'contract_id', contract_id);
end;
$$;

create or replace function public.sign_contract(p_contract_id uuid, p_signer_name text)
returns public.contracts
language plpgsql
security definer
set search_path = ''
as $$
declare
  contract_row public.contracts%rowtype;
  quote_row public.quotes%rowtype;
  project_row public.projects%rowtype;
  is_client boolean;
  is_manager boolean;
  percentage numeric;
  payment_index integer;
begin
  select * into contract_row from public.contracts where id = p_contract_id for update;
  if contract_row.id is null then raise exception 'Contract not found'; end if;
  is_client := private.is_project_client(contract_row.project_id);
  is_manager := private.has_workspace_role(contract_row.workspace_id, array['owner', 'manager']);
  if not is_client and not is_manager then raise exception 'Forbidden'; end if;
  if contract_row.status in ('signed', 'void') then raise exception 'Contract is already closed'; end if;
  if coalesce(trim(p_signer_name), '') = '' then raise exception 'Signer name is required'; end if;

  if is_client then
    update public.contracts set
      client_signer_name = trim(p_signer_name),
      client_signed_at = now(),
      client_signature_evidence = jsonb_build_object('user_id', (select auth.uid()), 'method', 'authenticated_acceptance'),
      status = case when owner_signed_at is not null then 'signed' else 'client_signed' end
    where id = p_contract_id returning * into contract_row;
  else
    update public.contracts set
      owner_signed_at = now(),
      owner_signature_evidence = jsonb_build_object('user_id', (select auth.uid()), 'name', trim(p_signer_name), 'method', 'authenticated_acceptance'),
      status = case when client_signed_at is not null then 'signed' else status end
    where id = p_contract_id returning * into contract_row;
  end if;

  if contract_row.status = 'signed' and not exists (select 1 from public.invoices where contract_id = contract_row.id) then
    select * into quote_row from public.quotes where id = contract_row.quote_id;
    select * into project_row from public.projects where id = contract_row.project_id;
    for percentage, payment_index in
      select value::numeric, ordinality::integer
      from jsonb_array_elements_text(quote_row.payment_plan) with ordinality
    loop
      insert into public.invoices (
        workspace_id, project_id, client_id, contract_id, installment_number,
        installment_label, amount, currency, due_date, status
      ) values (
        contract_row.workspace_id, contract_row.project_id, project_row.client_id, contract_row.id,
        payment_index, 'الدفعة ' || payment_index,
        round(quote_row.total * percentage / 100, 2), quote_row.currency,
        case when payment_index = 1 then current_date else null end,
        case when payment_index = 1 then 'issued' else 'draft' end
      );
    end loop;
    update public.projects set next_action = 'تحصيل الدفعة الأولى' where id = contract_row.project_id;
  end if;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (
    contract_row.workspace_id, contract_row.project_id, (select auth.uid()),
    case when is_client then 'العميل' else 'الإدارة' end,
    case when contract_row.status = 'signed' then 'contract.signed' else 'contract.partially_signed' end,
    case when contract_row.status = 'signed' then 'اكتمل توقيع العقد من الطرفين' else 'وقع أحد الطرفين العقد' end
  );
  if is_client then
    perform private.notify_workspace_owner(
      contract_row.workspace_id, contract_row.project_id, 'contract.client_signed',
      'وقع العميل العقد',
      case when contract_row.status = 'signed' then 'اكتمل العقد وصدرت فاتورة الدفعة الأولى.' else 'راجع العقد وأكمل توقيع مقدم الخدمة.' end,
      '/workspace/projects/' || contract_row.project_id::text || '/contract'
    );
    if contract_row.status = 'signed' then
      perform private.notify_project_client(
        contract_row.workspace_id, contract_row.project_id, 'invoice.issued',
        'صدرت فاتورة الدفعة الأولى',
        'اكتمل توقيع العقد. راجع تعليمات الدفعة الأولى من مساحة المشروع.',
        '/portal/projects/' || contract_row.project_id::text || '/finance'
      );
    end if;
  else
    perform private.notify_project_client(
      contract_row.workspace_id, contract_row.project_id,
      case when contract_row.status = 'signed' then 'invoice.issued' else 'contract.owner_signed' end,
      case when contract_row.status = 'signed' then 'صدرت فاتورة الدفعة الأولى' else 'العقد جاهز لتوقيعك' end,
      case when contract_row.status = 'signed' then 'اكتمل توقيع العقد. راجع تعليمات الدفعة الأولى من مساحة المشروع.' else 'وقع مقدم الخدمة العقد وأصبح بانتظار توقيعك.' end,
      '/portal/projects/' || contract_row.project_id::text || '/contract'
    );
  end if;
  return contract_row;
end;
$$;

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_payment_method text,
  p_payment_reference text default null
)
returns public.invoices
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice_row public.invoices%rowtype;
begin
  select * into invoice_row from public.invoices where id = p_invoice_id for update;
  if invoice_row.id is null then raise exception 'Invoice not found'; end if;
  if not private.has_workspace_role(invoice_row.workspace_id, array['owner', 'manager', 'accountant']) then raise exception 'Forbidden'; end if;
  if invoice_row.status = 'paid' then return invoice_row; end if;
  if invoice_row.status not in ('issued', 'sent', 'overdue') then raise exception 'Invoice is not open for payment'; end if;
  update public.invoices set status = 'paid', payment_method = p_payment_method, payment_reference = p_payment_reference, paid_at = now()
  where id = p_invoice_id returning * into invoice_row;
  insert into public.financial_entries (
    workspace_id, project_id, invoice_id, direction, category, description,
    amount, currency, status, occurred_on, reference, created_by
  ) values (
    invoice_row.workspace_id, invoice_row.project_id, invoice_row.id, 'income', 'client_payment',
    invoice_row.installment_label, invoice_row.amount, invoice_row.currency, 'cleared', current_date,
    invoice_row.payment_reference, (select auth.uid())
  );
  if invoice_row.installment_number = 1 then
    update public.projects set status = 'active', current_stage = 'active', start_date = coalesce(start_date, current_date), next_action = 'إنشاء أول طلب عمل وتوجيهه للفريق' where id = invoice_row.project_id;
  end if;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (invoice_row.workspace_id, invoice_row.project_id, (select auth.uid()), 'الحسابات', 'invoice.paid', 'تم تسجيل تحصيل دفعة العميل', jsonb_build_object('invoice_id', invoice_row.id, 'reference', invoice_row.reference));
  perform private.notify_project_client(
    invoice_row.workspace_id, invoice_row.project_id, 'invoice.paid',
    'تم تأكيد استلام الدفعة', 'سجلنا دفعتك بنجاح، ويمكنك متابعة المرحلة التالية من مساحة المشروع.',
    '/portal/projects/' || invoice_row.project_id::text || '/finance'
  );
  return invoice_row;
end;
$$;

create or replace function public.approve_collaborator_claim(p_claim_id uuid)
returns public.collaborator_claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_row public.collaborator_claims%rowtype;
begin
  select * into claim_row from public.collaborator_claims where id = p_claim_id for update;
  if claim_row.id is null then raise exception 'Claim not found'; end if;
  if not private.has_workspace_role(claim_row.workspace_id, array['owner', 'manager', 'accountant']) then raise exception 'Forbidden'; end if;
  if claim_row.status <> 'submitted' then raise exception 'Only a submitted claim can be approved'; end if;
  update public.collaborator_claims set status = 'due' where id = p_claim_id returning * into claim_row;
  return claim_row;
end;
$$;

create or replace function public.record_claim_payment(
  p_claim_id uuid,
  p_payment_reference text,
  p_exchange_rate_to_sar numeric default null
)
returns public.collaborator_claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_row public.collaborator_claims%rowtype;
  sar_amount numeric;
begin
  select * into claim_row from public.collaborator_claims where id = p_claim_id for update;
  if claim_row.id is null then raise exception 'Claim not found'; end if;
  if not private.has_workspace_role(claim_row.workspace_id, array['owner', 'manager', 'accountant']) then raise exception 'Forbidden'; end if;
  if claim_row.status = 'paid' then return claim_row; end if;
  if claim_row.status not in ('approved', 'due') then raise exception 'Claim must be approved before payment'; end if;
  if claim_row.currency <> 'SAR' and p_exchange_rate_to_sar is null then raise exception 'Exchange rate is required for foreign currency'; end if;
  sar_amount := case when claim_row.currency = 'SAR' then claim_row.amount else round(claim_row.amount * p_exchange_rate_to_sar, 2) end;
  update public.collaborator_claims set status = 'paid', paid_at = now() where id = p_claim_id returning * into claim_row;
  insert into public.financial_entries (
    workspace_id, project_id, claim_id, direction, category, description,
    amount, currency, exchange_rate_to_sar, amount_sar, status, occurred_on,
    reference, created_by
  ) values (
    claim_row.workspace_id, claim_row.project_id, claim_row.id, 'expense', 'collaborator_payment',
    claim_row.item_name, claim_row.amount, claim_row.currency,
    case when claim_row.currency = 'SAR' then 1 else p_exchange_rate_to_sar end,
    sar_amount, 'cleared', current_date, p_payment_reference, (select auth.uid())
  );
  return claim_row;
end;
$$;

create or replace function public.create_work_order(
  p_project_id uuid,
  p_title text,
  p_description text,
  p_owner_recommendations text default null,
  p_creative_core text default null,
  p_creative_rationale text default null,
  p_creative_notes text default null,
  p_delegation_scope text default null,
  p_execution_mode text default 'owner_led',
  p_priority text default 'normal',
  p_due_date date default null,
  p_requires_client_approval boolean default false,
  p_assignee_user_ids uuid[] default array[]::uuid[],
  p_source_retainer_request_id uuid default null
)
returns public.work_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
  work_order_row public.work_orders%rowtype;
  requested_assignees integer;
  inserted_assignees integer;
begin
  select * into project_row from public.projects where id = p_project_id;
  if project_row.id is null then raise exception 'Project not found'; end if;
  if not private.has_workspace_role(project_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_description), '') = '' then raise exception 'Title and instructions are required'; end if;
  if p_execution_mode not in ('owner_led', 'delegated', 'collaborative') then raise exception 'Invalid execution mode'; end if;
  if p_priority not in ('low', 'normal', 'high', 'urgent') then raise exception 'Invalid priority'; end if;
  if p_source_retainer_request_id is not null and not exists (
    select 1 from public.retainer_requests r
    where r.id = p_source_retainer_request_id
      and r.project_id = project_row.id
      and r.workspace_id = project_row.workspace_id
  ) then raise exception 'Retainer request does not belong to this project'; end if;

  insert into public.work_orders (
    workspace_id, project_id, source_retainer_request_id, title, description,
    owner_recommendations, creative_core, creative_rationale, creative_notes,
    delegation_scope, execution_mode, priority, due_date, requires_client_approval, created_by
  ) values (
    project_row.workspace_id, project_row.id, p_source_retainer_request_id, trim(p_title), trim(p_description),
    nullif(trim(p_owner_recommendations), ''), nullif(trim(p_creative_core), ''), nullif(trim(p_creative_rationale), ''),
    nullif(trim(p_creative_notes), ''), nullif(trim(p_delegation_scope), ''), p_execution_mode,
    p_priority, p_due_date, p_requires_client_approval, (select auth.uid())
  ) returning * into work_order_row;

  select count(distinct value) into requested_assignees from unnest(coalesce(p_assignee_user_ids, array[]::uuid[])) as ids(value);
  insert into public.work_order_assignees (workspace_id, work_order_id, user_id, role_label, assigned_by)
  select project_row.workspace_id, work_order_row.id, ids.value, m.display_name, (select auth.uid())
  from (select distinct value from unnest(coalesce(p_assignee_user_ids, array[]::uuid[])) as values(value)) ids
  join public.memberships m on m.workspace_id = project_row.workspace_id
    and m.user_id = ids.value
    and m.status = 'active'
    and m.role in ('manager', 'collaborator');
  get diagnostics inserted_assignees = row_count;
  if inserted_assignees <> requested_assignees then raise exception 'One or more assignees are not active collaborators'; end if;

  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (project_row.workspace_id, project_row.id, (select auth.uid()), 'عبد الوهاب', 'work_order.created', 'فتح عبد الوهاب مساحة عمل إبداعية خاصة', jsonb_build_object('work_order_id', work_order_row.id, 'reference', work_order_row.reference, 'execution_mode', p_execution_mode));
  return work_order_row;
end;
$$;

create or replace function public.save_work_order_assignees(p_work_order_id uuid, p_user_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
  requested_assignees integer;
  inserted_assignees integer;
begin
  select * into work_order_row from public.work_orders where id = p_work_order_id for update;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  if not private.has_workspace_role(work_order_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if work_order_row.status not in ('draft', 'creative_development', 'direction_ready', 'owner_production') then raise exception 'Assignees can only change before delegation'; end if;
  select count(distinct value) into requested_assignees from unnest(coalesce(p_user_ids, array[]::uuid[])) as ids(value);
  delete from public.work_order_assignees where work_order_id = work_order_row.id;
  insert into public.work_order_assignees (workspace_id, work_order_id, user_id, role_label, assigned_by)
  select work_order_row.workspace_id, work_order_row.id, ids.value, m.display_name, (select auth.uid())
  from (select distinct value from unnest(coalesce(p_user_ids, array[]::uuid[])) as values(value)) ids
  join public.memberships m on m.workspace_id = work_order_row.workspace_id
    and m.user_id = ids.value
    and m.status = 'active'
    and m.role in ('manager', 'collaborator');
  get diagnostics inserted_assignees = row_count;
  if inserted_assignees <> requested_assignees then raise exception 'One or more assignees are not active collaborators'; end if;
  return inserted_assignees;
end;
$$;

create or replace function public.advance_owner_work_order(p_work_order_id uuid, p_status text)
returns public.work_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
  allowed boolean := false;
begin
  if p_status not in ('creative_development', 'direction_ready', 'owner_production') then raise exception 'Invalid owner work status'; end if;
  select * into work_order_row from public.work_orders where id = p_work_order_id for update;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  if not private.has_workspace_role(work_order_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  allowed := (work_order_row.status = 'draft' and p_status = 'creative_development')
    or (work_order_row.status = 'creative_development' and p_status = 'direction_ready')
    or (work_order_row.status = 'direction_ready' and p_status = 'owner_production')
    or (work_order_row.status = 'changes_requested' and p_status = 'owner_production');
  if not allowed then raise exception 'Creative work cannot move to that stage'; end if;
  if p_status in ('direction_ready', 'owner_production')
    and (coalesce(trim(work_order_row.creative_core), '') = '' or coalesce(trim(work_order_row.creative_rationale), '') = '') then
    raise exception 'Creative core and rationale are required';
  end if;
  update public.work_orders
  set status = p_status,
      creative_stage = case p_status when 'creative_development' then 'concept' when 'direction_ready' then 'direction' else 'production' end,
      execution_mode = case when p_status = 'owner_production' then 'owner_led' else execution_mode end
  where id = work_order_row.id
  returning * into work_order_row;
  update public.projects
  set next_action = case p_status when 'creative_development' then 'عبد الوهاب يطور الفكرة الإبداعية' when 'direction_ready' then 'عبد الوهاب يقرر أسلوب تنفيذ الاتجاه' else 'عبد الوهاب ينفذ الاتجاه الإبداعي' end
  where id = work_order_row.project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (work_order_row.workspace_id, work_order_row.project_id, (select auth.uid()), 'عبد الوهاب', 'work_order.owner_advanced', case p_status when 'creative_development' then 'بدأ عبد الوهاب تطوير الفكرة' when 'direction_ready' then 'ثبت عبد الوهاب الاتجاه الإبداعي' else 'بدأ عبد الوهاب تنفيذ الاتجاه بنفسه' end, jsonb_build_object('work_order_id', work_order_row.id, 'status', p_status));
  return work_order_row;
end;
$$;

create or replace function public.dispatch_work_order(p_work_order_id uuid)
returns public.work_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
begin
  select * into work_order_row from public.work_orders where id = p_work_order_id for update;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  if not private.has_workspace_role(work_order_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if work_order_row.status not in ('draft', 'creative_development', 'direction_ready', 'owner_production') then raise exception 'Work order cannot be dispatched from its current status'; end if;
  if not exists (select 1 from public.work_order_assignees where work_order_id = work_order_row.id) then raise exception 'Assign at least one collaborator before dispatch'; end if;
  update public.work_orders set status = 'dispatched', creative_stage = 'production', execution_mode = 'delegated', delegation_scope = coalesce(nullif(trim(delegation_scope), ''), description), dispatched_at = now()
  where id = work_order_row.id returning * into work_order_row;
  update public.projects set next_action = 'متابعة الجزء الإنتاجي تحت قيادة عبد الوهاب' where id = work_order_row.project_id;
  insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type)
  values (work_order_row.workspace_id, work_order_row.id, (select auth.uid()), 'النظام', 'وجّه عبد الوهاب هذا العمل إلى المتعاون المحدد.', 'system');
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (work_order_row.workspace_id, work_order_row.project_id, (select auth.uid()), 'عبد الوهاب', 'work_order.dispatched', 'وجّه عبد الوهاب عملاً إلى متعاون', jsonb_build_object('work_order_id', work_order_row.id, 'work_kind', work_order_row.work_kind));
  perform private.notify_work_order_assignees(work_order_row.id, 'work_order.dispatched', 'عمل جديد من عبد الوهاب', work_order_row.title || '، افتح المطلوب والملفات من لوحتك.');
  return work_order_row;
end;
$$;

create or replace function public.start_work_order(p_work_order_id uuid)
returns public.work_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
begin
  select * into work_order_row from public.work_orders where id = p_work_order_id for update;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  if not private.is_work_order_assignee(work_order_row.id, true) then raise exception 'Forbidden'; end if;
  if work_order_row.status not in ('dispatched', 'changes_requested') then raise exception 'Work order cannot start from its current status'; end if;
  update public.work_orders set status = 'in_progress' where id = work_order_row.id returning * into work_order_row;
  return work_order_row;
end;
$$;

create or replace function public.post_work_order_message(p_work_order_id uuid, p_body text, p_message_type text default 'message')
returns public.work_order_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
  message_row public.work_order_messages%rowtype;
  author_name text;
  is_manager boolean;
begin
  select * into work_order_row from public.work_orders where id = p_work_order_id;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  is_manager := private.has_workspace_role(work_order_row.workspace_id, array['owner', 'manager']);
  if not is_manager and not private.is_work_order_assignee(work_order_row.id, true) then raise exception 'Forbidden'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Message is required'; end if;
  if p_message_type not in ('message', 'recommendation') then raise exception 'Invalid message type'; end if;
  select coalesce(m.display_name, 'عضو الفريق') into author_name
  from public.memberships m
  where m.workspace_id = work_order_row.workspace_id and m.user_id = (select auth.uid())
  limit 1;
  insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type)
  values (work_order_row.workspace_id, work_order_row.id, (select auth.uid()), coalesce(author_name, 'عضو الفريق'), trim(p_body), p_message_type)
  returning * into message_row;
  if is_manager then
    perform private.notify_work_order_assignees(work_order_row.id, 'work_order.message', 'رسالة جديدة في طلب العمل', trim(p_body));
  else
    perform private.notify_workspace_owner(work_order_row.workspace_id, work_order_row.project_id, 'work_order.message', 'رسالة جديدة من متعاون', trim(p_body), '/workspace/work-orders/' || work_order_row.id::text);
  end if;
  return message_row;
end;
$$;

create or replace function public.submit_work_order_proof(p_work_order_id uuid, p_title text, p_note text default null)
returns public.proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
  proof_row public.proofs%rowtype;
  next_version integer;
  proof_file_id uuid;
begin
  select * into work_order_row from public.work_orders where id = p_work_order_id for update;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  if not private.is_work_order_assignee(work_order_row.id, true) then raise exception 'Forbidden'; end if;
  if work_order_row.status not in ('dispatched', 'in_progress', 'changes_requested') then raise exception 'Work order is not ready for a proof'; end if;
  select id into proof_file_id from public.project_files
  where work_order_id = work_order_row.id and category = 'proof'
    and uploaded_by = (select auth.uid()) and proof_id is null
  order by created_at desc limit 1;
  if proof_file_id is null then raise exception 'Upload a proof file before submitting'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.proofs where project_id = work_order_row.project_id;
  update public.proofs set status = 'superseded'
  where work_order_id = work_order_row.id and status in ('internal_review', 'changes_requested');
  insert into public.proofs (workspace_id, project_id, work_order_id, version, title, note, status, submitted_by)
  values (work_order_row.workspace_id, work_order_row.project_id, work_order_row.id, next_version, trim(p_title), nullif(trim(p_note), ''), 'internal_review', (select auth.uid()))
  returning * into proof_row;
  update public.project_files set proof_id = proof_row.id where id = proof_file_id;
  update public.work_orders set status = 'internal_review' where id = work_order_row.id;
  update public.projects set status = 'proof', current_stage = 'proof', next_action = 'مراجعة بروفات طلبات العمل داخلياً' where id = work_order_row.project_id;
  insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type, metadata)
  values (work_order_row.workspace_id, work_order_row.id, (select auth.uid()), 'المتعاون', coalesce(nullif(trim(p_note), ''), 'رفع المتعاون بروفة جديدة للاعتماد.'), 'system', jsonb_build_object('proof_id', proof_row.id, 'version', proof_row.version));
  perform private.notify_workspace_owner(work_order_row.workspace_id, work_order_row.project_id, 'work_order.proof', 'بروفة جديدة تحتاج قرارك', work_order_row.title || '، افتح غرفة الطلب لاعتمادها أو طلب تعديل.', '/workspace/work-orders/' || work_order_row.id::text);
  return proof_row;
end;
$$;

create or replace function public.submit_owner_work_order_proof(p_work_order_id uuid, p_title text, p_note text default null)
returns public.proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  work_order_row public.work_orders%rowtype;
  proof_row public.proofs%rowtype;
  next_version integer;
  proof_file_id uuid;
begin
  select * into work_order_row from public.work_orders where id = p_work_order_id for update;
  if work_order_row.id is null then raise exception 'Work order not found'; end if;
  if not private.has_workspace_role(work_order_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if work_order_row.status not in ('creative_development', 'direction_ready', 'owner_production', 'changes_requested') then raise exception 'Owner work is not ready for a proof'; end if;
  select id into proof_file_id from public.project_files
  where work_order_id = work_order_row.id and category = 'proof'
    and uploaded_by = (select auth.uid()) and proof_id is null
  order by created_at desc limit 1;
  if proof_file_id is null then raise exception 'Upload a proof file before submitting'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.proofs where project_id = work_order_row.project_id;
  update public.proofs set status = 'superseded'
  where work_order_id = work_order_row.id and status in ('internal_review', 'changes_requested');
  insert into public.proofs (workspace_id, project_id, work_order_id, version, title, note, status, submitted_by)
  values (work_order_row.workspace_id, work_order_row.project_id, work_order_row.id, next_version, trim(p_title), nullif(trim(p_note), ''), 'internal_review', (select auth.uid()))
  returning * into proof_row;
  update public.project_files set proof_id = proof_row.id where id = proof_file_id;
  update public.work_orders set status = 'internal_review', creative_stage = 'production' where id = work_order_row.id;
  update public.projects set status = 'proof', current_stage = 'proof', next_action = 'قرار عبد الوهاب على بروفته قبل مشاركتها' where id = work_order_row.project_id;
  insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type, metadata)
  values (work_order_row.workspace_id, work_order_row.id, (select auth.uid()), 'عبد الوهاب', coalesce(nullif(trim(p_note), ''), 'حفظ عبد الوهاب بروفة من عمله في بوابة القرار.'), 'system', jsonb_build_object('proof_id', proof_row.id, 'version', proof_row.version, 'owner_authored', true));
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (work_order_row.workspace_id, work_order_row.project_id, (select auth.uid()), 'عبد الوهاب', 'work_order.owner_proof', 'حفظ عبد الوهاب بروفته في بوابة القرار', jsonb_build_object('work_order_id', work_order_row.id, 'proof_id', proof_row.id));
  return proof_row;
end;
$$;

create or replace function public.review_work_order_proof(p_proof_id uuid, p_decision text, p_note text default null, p_send_to_client boolean default false)
returns public.proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  proof_row public.proofs%rowtype;
  work_order_row public.work_orders%rowtype;
begin
  if p_decision not in ('approved', 'changes_requested') then raise exception 'Invalid proof decision'; end if;
  select * into proof_row from public.proofs where id = p_proof_id for update;
  if proof_row.id is null or proof_row.work_order_id is null then raise exception 'Work order proof not found'; end if;
  select * into work_order_row from public.work_orders where id = proof_row.work_order_id for update;
  if not private.has_workspace_role(work_order_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if proof_row.status <> 'internal_review' then raise exception 'Proof is not waiting for internal review'; end if;
  if p_decision = 'changes_requested' and coalesce(trim(p_note), '') = '' then raise exception 'Revision note is required'; end if;

  if p_decision = 'changes_requested' then
    update public.proofs set status = 'changes_requested', client_note = trim(p_note), reviewed_at = now() where id = proof_row.id returning * into proof_row;
    update public.work_orders set status = 'changes_requested' where id = work_order_row.id;
    insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type, metadata)
    values (work_order_row.workspace_id, work_order_row.id, (select auth.uid()), 'عبد الوهاب', trim(p_note), 'decision', jsonb_build_object('decision', 'changes_requested', 'proof_id', proof_row.id));
    perform private.notify_work_order_assignees(work_order_row.id, 'work_order.changes', 'ملاحظات تعديل من عبد الوهاب', trim(p_note));
  else
    if p_send_to_client then
      update public.proofs set status = 'sent', reviewed_at = now() where id = proof_row.id returning * into proof_row;
      update public.project_files set is_client_visible = true where proof_id = proof_row.id and category = 'proof';
      update public.work_orders set status = 'client_review', owner_approved_by = (select auth.uid()), owner_approved_at = now() where id = work_order_row.id;
      perform private.notify_project_client(work_order_row.workspace_id, work_order_row.project_id, 'proof.sent', 'بروفة جديدة بانتظار قرارك', 'راجع البروفة من مساحة المشروع واختر الاعتماد أو اطلب تعديلاً.', '/portal/projects/' || work_order_row.project_id::text || '/proof');
    else
      update public.proofs set status = 'approved', reviewed_at = now() where id = proof_row.id returning * into proof_row;
      update public.work_orders set status = 'completed', owner_approved_by = (select auth.uid()), owner_approved_at = now(), completed_at = now() where id = work_order_row.id;
    end if;
    insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type, metadata)
    values (work_order_row.workspace_id, work_order_row.id, (select auth.uid()), 'عبد الوهاب', coalesce(nullif(trim(p_note), ''), case when p_send_to_client then 'اعتمدت البروفة داخلياً وأرسلتها إلى العميل.' else 'اعتمدت البروفة وأغلقت طلب العمل.' end), 'decision', jsonb_build_object('decision', 'approved', 'proof_id', proof_row.id, 'sent_to_client', p_send_to_client));
    perform private.notify_work_order_assignees(work_order_row.id, 'work_order.approved', 'اعتمد عبد الوهاب البروفة', case when p_send_to_client then 'اعتمدت البروفة داخلياً وانتقلت إلى مراجعة العميل.' else 'اكتمل طلب العمل واعتمدت البروفة.' end);
  end if;
  return proof_row;
end;
$$;

create or replace function public.update_assigned_task_status(p_task_id uuid, p_status text)
returns public.project_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_row public.project_tasks%rowtype;
begin
  if p_status not in ('todo', 'in_progress', 'review', 'changes_requested', 'done') then raise exception 'Invalid task status'; end if;
  select * into task_row from public.project_tasks where id = p_task_id for update;
  if task_row.id is null then raise exception 'Task not found'; end if;
  if task_row.assignee_user_id <> (select auth.uid()) and not private.has_workspace_role(task_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  update public.project_tasks set status = p_status, completed_at = case when p_status = 'done' then now() else null end
  where id = p_task_id returning * into task_row;
  return task_row;
end;
$$;

create or replace function public.submit_proof(
  p_project_id uuid,
  p_task_id uuid,
  p_title text,
  p_note text default null,
  p_send_to_client boolean default false
)
returns public.proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
  proof_row public.proofs%rowtype;
  next_version integer;
  is_manager boolean;
begin
  select * into project_row from public.projects where id = p_project_id;
  if project_row.id is null then raise exception 'Project not found'; end if;
  is_manager := private.has_workspace_role(project_row.workspace_id, array['owner', 'manager']);
  if not is_manager and not private.is_project_assignee(project_row.id) then raise exception 'Forbidden'; end if;
  if p_send_to_client and not is_manager then raise exception 'Internal approval is required before sending a proof to the client'; end if;
  if not is_manager and p_task_id is null then raise exception 'A collaborator proof must be linked to an assigned task'; end if;
  if p_task_id is not null and not exists (
    select 1
    from public.project_tasks t
    where t.id = p_task_id
      and t.project_id = project_row.id
      and t.workspace_id = project_row.workspace_id
      and (
        is_manager
        or (t.assignee_user_id = (select auth.uid()) and t.status in ('in_progress', 'changes_requested'))
      )
  ) then raise exception 'Task is not eligible for this proof'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.proofs where project_id = p_project_id;
  update public.proofs set status = 'superseded' where project_id = p_project_id and status in ('internal_review', 'sent', 'changes_requested');
  insert into public.proofs (workspace_id, project_id, task_id, version, title, note, status, submitted_by)
  values (project_row.workspace_id, project_row.id, p_task_id, next_version, p_title, p_note, case when p_send_to_client then 'sent' else 'internal_review' end, (select auth.uid()))
  returning * into proof_row;
  update public.project_files
  set proof_id = proof_row.id,
      is_client_visible = p_send_to_client
  where id = (
    select id
    from public.project_files
    where project_id = p_project_id
      and category = 'proof'
      and uploaded_by = (select auth.uid())
      and proof_id is null
    order by created_at desc
    limit 1
  );
  if p_task_id is not null then update public.project_tasks set status = 'review' where id = p_task_id; end if;
  update public.projects set status = 'proof', current_stage = 'proof', next_action = case when p_send_to_client then 'ينتظر قرار العميل على البروفة' else 'مراجعة البروفة داخلياً' end where id = p_project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (project_row.workspace_id, project_row.id, (select auth.uid()), 'الفريق', 'proof.submitted', case when p_send_to_client then 'أرسلت بروفة إلى العميل' else 'رفعت بروفة للمراجعة الداخلية' end, jsonb_build_object('proof_id', proof_row.id, 'version', proof_row.version));
  if p_send_to_client then
    perform private.notify_project_client(
      project_row.workspace_id, project_row.id, 'proof.sent',
      'بروفة جديدة بانتظار قرارك', 'راجع البروفة من مساحة المشروع واختر الاعتماد أو اطلب تعديلاً واضحاً.',
      '/portal/projects/' || project_row.id::text || '/proof'
    );
  end if;
  return proof_row;
end;
$$;

create or replace function public.send_proof_to_client(p_proof_id uuid)
returns public.proofs
language plpgsql
security definer
set search_path = ''
as $$
declare
  proof_row public.proofs%rowtype;
begin
  select * into proof_row from public.proofs where id = p_proof_id for update;
  if proof_row.id is null then raise exception 'Proof not found'; end if;
  if not private.has_workspace_role(proof_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if proof_row.status <> 'internal_review' then raise exception 'Only an internally reviewed proof can be sent'; end if;
  if not exists (select 1 from public.project_files where proof_id = proof_row.id and category = 'proof') then raise exception 'Proof file is required'; end if;
  update public.proofs set status = 'sent' where id = p_proof_id returning * into proof_row;
  update public.project_files set is_client_visible = true where proof_id = proof_row.id and category = 'proof';
  update public.projects set status = 'proof', current_stage = 'proof', next_action = 'ينتظر قرار العميل على البروفة' where id = proof_row.project_id;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (proof_row.workspace_id, proof_row.project_id, (select auth.uid()), 'الإدارة', 'proof.sent', 'اعتمدت الإدارة البروفة وأرسلتها للعميل', jsonb_build_object('proof_id', proof_row.id, 'version', proof_row.version));
  perform private.notify_project_client(
    proof_row.workspace_id, proof_row.project_id, 'proof.sent',
    'بروفة جديدة بانتظار قرارك', 'راجع ملف البروفة من مساحة المشروع واختر الاعتماد أو اطلب تعديلاً واضحاً.',
    '/portal/projects/' || proof_row.project_id::text || '/proof'
  );
  return proof_row;
end;
$$;

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
  update public.proofs set status = p_decision, client_note = p_note, reviewed_at = now()
  where id = p_proof_id returning * into proof_row;
  if proof_row.task_id is not null then
    update public.project_tasks set status = case when p_decision = 'approved' then 'done' else 'changes_requested' end where id = proof_row.task_id;
  end if;
  if proof_row.work_order_id is not null then
    update public.work_orders
    set status = case when p_decision = 'approved' then 'completed' else 'changes_requested' end,
        completed_at = case when p_decision = 'approved' then now() else null end
    where id = proof_row.work_order_id;
    insert into public.work_order_messages (workspace_id, work_order_id, author_user_id, author_label, body, message_type, metadata)
    values (proof_row.workspace_id, proof_row.work_order_id, (select auth.uid()), 'العميل', coalesce(nullif(trim(p_note), ''), case when p_decision = 'approved' then 'اعتمد العميل البروفة.' else 'طلب العميل تعديلاً على البروفة.' end), 'decision', jsonb_build_object('decision', p_decision, 'proof_id', proof_row.id));
  end if;
  if p_decision = 'approved' then
    update public.invoices
    set status = 'issued', due_date = current_date
    where id = (
      select id from public.invoices
      where project_id = proof_row.project_id and status = 'draft'
      order by installment_number
      limit 1
    );
  end if;
  update public.projects set next_action = case when p_decision = 'approved' then 'تحصيل الدفعة التالية أو تجهيز التسليم' else 'تنفيذ ملاحظات العميل' end where id = proof_row.project_id;
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

create or replace function public.release_project_delivery(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
begin
  select * into project_row from public.projects where id = p_project_id for update;
  if project_row.id is null then raise exception 'Project not found'; end if;
  if not private.has_workspace_role(project_row.workspace_id, array['owner', 'manager']) then raise exception 'Forbidden'; end if;
  if project_row.status not in ('active', 'proof') then raise exception 'Project is not ready for delivery'; end if;
  if not exists (select 1 from public.project_files where project_id = p_project_id and category = 'delivery') then raise exception 'Delivery files are required'; end if;
  if exists (select 1 from public.invoices where project_id = p_project_id and status not in ('paid', 'cancelled')) then raise exception 'All project invoices must be paid before delivery'; end if;
  update public.project_files set is_client_visible = true where project_id = p_project_id and category = 'delivery';
  update public.projects set status = 'delivery', current_stage = 'delivery', next_action = 'ينتظر تأكيد العميل على الاستلام' where id = p_project_id returning * into project_row;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (project_row.workspace_id, project_row.id, (select auth.uid()), 'الإدارة', 'delivery.released', 'تم فتح ملفات التسليم النهائي للعميل');
  perform private.notify_project_client(
    project_row.workspace_id, project_row.id, 'delivery.released',
    'التسليم النهائي جاهز', 'ملفات مشروعك النهائية جاهزة للتنزيل وتأكيد الاستلام.',
    '/portal/projects/' || project_row.id::text || '/delivery'
  );
  return project_row;
end;
$$;

create or replace function public.confirm_project_delivery(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
begin
  select * into project_row from public.projects where id = p_project_id for update;
  if project_row.id is null then raise exception 'Project not found'; end if;
  if not private.is_project_client(project_row.id) then raise exception 'Forbidden'; end if;
  if project_row.status <> 'delivery' then raise exception 'Delivery is not open'; end if;
  update public.projects set status = 'follow_up', current_stage = 'follow_up', next_action = 'متابعة رضا العميل وإغلاق المشروع' where id = p_project_id returning * into project_row;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label)
  values (project_row.workspace_id, project_row.id, (select auth.uid()), 'العميل', 'delivery.confirmed', 'أكد العميل استلام الملفات النهائية');
  perform private.notify_workspace_owner(
    project_row.workspace_id, project_row.id, 'delivery.confirmed',
    'أكد العميل استلام التسليم النهائي', 'انتقل إلى متابعة الرضا ثم أغلق المشروع عندما تكتمل المتابعة.',
    '/workspace/projects/' || project_row.id::text
  );
  return project_row;
end;
$$;

create or replace function public.submit_project_feedback(
  p_project_id uuid,
  p_rating integer,
  p_note text default null
)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
begin
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  select * into project_row from public.projects where id = p_project_id for update;
  if project_row.id is null then raise exception 'Project not found'; end if;
  if not private.is_project_client(project_row.id) then raise exception 'Forbidden'; end if;
  if project_row.status <> 'follow_up' then raise exception 'Project is not ready for feedback'; end if;
  update public.projects
  set status = 'completed',
      current_stage = 'completed',
      next_action = null,
      completed_at = now(),
      metadata = metadata || jsonb_build_object(
        'feedback', jsonb_build_object('rating', p_rating, 'note', p_note, 'submitted_at', now(), 'user_id', (select auth.uid()))
      )
  where id = p_project_id
  returning * into project_row;
  insert into public.activity_events (workspace_id, project_id, actor_user_id, actor_label, event_type, label, metadata)
  values (project_row.workspace_id, project_row.id, (select auth.uid()), 'العميل', 'project.feedback_submitted', 'أرسل العميل تقييم المشروع وأغلق رحلة التنفيذ', jsonb_build_object('rating', p_rating));
  perform private.notify_workspace_owner(
    project_row.workspace_id, project_row.id, 'project.completed',
    'اكتمل المشروع ووصل تقييم العميل', 'راجع التقييم واحفظ ما يفيد المشاريع القادمة.',
    '/workspace/projects/' || project_row.id::text
  );
  return project_row;
end;
$$;

create or replace function public.get_project_payment_instructions(p_project_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  project_row public.projects%rowtype;
  settings_row public.studio_settings%rowtype;
begin
  select * into project_row from public.projects where id = p_project_id;
  if project_row.id is null then raise exception 'Project not found'; end if;
  if not private.is_project_client(project_row.id)
    and not private.has_workspace_role(project_row.workspace_id, array['owner', 'manager', 'accountant']) then
    raise exception 'Forbidden';
  end if;
  select * into settings_row from public.studio_settings where workspace_id = project_row.workspace_id;
  return jsonb_build_object(
    'beneficiary', settings_row.owner_name_ar,
    'bank_name', settings_row.bank_name,
    'bank_account', settings_row.bank_account,
    'bank_iban', settings_row.bank_iban
  );
end;
$$;

create or replace function public.claim_pending_notifications(p_limit integer default 25)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select n.id
    from public.notifications n
    where n.attempts < 5
      and (
        n.status in ('pending', 'failed')
        or (n.status = 'processing' and n.updated_at < now() - interval '15 minutes')
      )
    order by n.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  update public.notifications n
  set status = 'processing',
      attempts = n.attempts + 1,
      last_error = null,
      updated_at = now()
  from candidates c
  where n.id = c.id
  returning n.*;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_row public.notifications%rowtype;
begin
  select * into notification_row from public.notifications where id = p_notification_id for update;
  if notification_row.id is null then raise exception 'Notification not found'; end if;
  if notification_row.recipient_user_id <> (select auth.uid()) then raise exception 'Forbidden'; end if;
  update public.notifications set read_at = coalesce(read_at, now()) where id = p_notification_id returning * into notification_row;
  return notification_row;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.service_requests enable row level security;
alter table public.projects enable row level security;
alter table public.brief_templates enable row level security;
alter table public.briefs enable row level security;
alter table public.quotes enable row level security;
alter table public.contracts enable row level security;
alter table public.invoices enable row level security;
alter table public.collaborator_claims enable row level security;
alter table public.collaborator_rates enable row level security;
alter table public.financial_entries enable row level security;
alter table public.retainers enable row level security;
alter table public.retainer_requests enable row level security;
alter table public.project_tasks enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_assignees enable row level security;
alter table public.work_order_messages enable row level security;
alter table public.proofs enable row level security;
alter table public.project_files enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;
alter table public.studio_settings enable row level security;
alter table public.public_site_content enable row level security;

create policy "members view workspace" on public.workspaces
  for select to authenticated
  using (private.is_workspace_member(id));
create policy "owners update workspace" on public.workspaces
  for update to authenticated
  using (private.has_workspace_role(id, array['owner']))
  with check (private.has_workspace_role(id, array['owner']));

create policy "members view allowed memberships" on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "owners manage memberships" on public.memberships
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner']))
  with check (private.has_workspace_role(workspace_id, array['owner']));

create policy "internal team view clients" on public.clients
  for select to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']) or user_id = (select auth.uid()));
create policy "managers manage clients" on public.clients
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "managers view requests" on public.service_requests
  for select to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers manage requests" on public.service_requests
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view projects" on public.projects
  for select to authenticated
  using (private.can_access_project(id));
create policy "managers manage projects" on public.projects
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "internal team view brief templates" on public.brief_templates
  for select to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers manage brief templates" on public.brief_templates
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view briefs" on public.briefs
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or private.is_project_client(project_id)
    or (private.is_project_assignee(project_id) and status = 'approved')
  );
create policy "managers manage briefs" on public.briefs
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view quotes" on public.quotes
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or private.is_project_client(project_id)
  );
create policy "managers manage quotes" on public.quotes
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view contracts" on public.contracts
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or private.is_project_client(project_id)
  );
create policy "managers manage contracts" on public.contracts
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "finance and client view invoices" on public.invoices
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
  );
create policy "finance manage invoices" on public.invoices
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']));

create policy "finance and collaborator view claims" on public.collaborator_claims
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or collaborator_user_id = (select auth.uid())
  );
create policy "collaborator submits own claims" on public.collaborator_claims
  for insert to authenticated
  with check (
    collaborator_user_id = (select auth.uid())
    and (
      (work_order_id is not null and private.is_work_order_assignee(work_order_id, true))
      or (work_order_id is null and private.is_project_assignee(project_id))
    )
    and (work_order_id is null or exists (
      select 1 from public.work_orders w
      where w.id = work_order_id and w.project_id = project_id and w.workspace_id = workspace_id
    ))
    and status = 'submitted'
    and paid_at is null
  );
create policy "finance manage claims" on public.collaborator_claims
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']));

create policy "finance and collaborator view rates" on public.collaborator_rates
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or collaborator_user_id = (select auth.uid())
  );
create policy "managers manage rates" on public.collaborator_rates
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']));

create policy "finance views ledger" on public.financial_entries
  for select to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']));
create policy "finance manages ledger" on public.financial_entries
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']));

create policy "project participants view retainers" on public.retainers
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or private.is_project_client(project_id)
  );
create policy "managers manage retainers" on public.retainers
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "retainer participants view requests" on public.retainer_requests
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or private.is_project_client(project_id)
    or assignee_user_id = (select auth.uid())
  );
create policy "clients create retainer requests" on public.retainer_requests
  for insert to authenticated
  with check (
    private.is_project_client(project_id)
    and exists (
      select 1
      from public.retainers r
      where r.id = retainer_id
        and r.project_id = project_id
        and r.workspace_id = workspace_id
        and r.status = 'active'
        and current_date between r.start_date and r.end_date
    )
    and assignee_user_id is null
    and status = 'new'
  );
create policy "managers update retainer requests" on public.retainer_requests
  for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view tasks" on public.project_tasks
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or assignee_user_id = (select auth.uid())
    or (private.is_project_client(project_id) and is_client_visible)
  );
create policy "managers update tasks" on public.project_tasks
  for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers create tasks" on public.project_tasks
  for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers delete tasks" on public.project_tasks
  for delete to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "work order participants view orders" on public.work_orders
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or private.is_work_order_assignee(id, true)
  );
create policy "managers create work orders" on public.work_orders
  for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers update work orders" on public.work_orders
  for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers delete draft work orders" on public.work_orders
  for delete to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']) and status = 'draft');

create policy "work order participants view assignees" on public.work_order_assignees
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or private.is_work_order_assignee(work_order_id, true)
  );
create policy "managers manage work order assignees" on public.work_order_assignees
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "work order participants view messages" on public.work_order_messages
  for select to authenticated
  using (private.can_access_work_order(work_order_id));

create policy "project participants view proofs" on public.proofs
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or (work_order_id is not null and private.is_work_order_assignee(work_order_id, true))
    or (work_order_id is null and private.is_project_assignee(project_id))
    or (private.is_project_client(project_id) and status in ('sent', 'approved', 'changes_requested'))
  );
create policy "managers manage proofs" on public.proofs
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view file records" on public.project_files
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or (work_order_id is not null and private.is_work_order_assignee(work_order_id, true) and category not in ('contract', 'invoice', 'delivery'))
    or (work_order_id is null and private.is_project_assignee(project_id) and category not in ('contract', 'invoice', 'delivery'))
    or (private.is_project_client(project_id) and (is_client_visible or uploaded_by = (select auth.uid())))
  );
create policy "project participants create file records" on public.project_files
  for insert to authenticated
  with check (
    private.can_access_project(project_id)
    and split_part(storage_path, '/', 1) = workspace_id::text
    and split_part(storage_path, '/', 2) = project_id::text
    and uploaded_by = (select auth.uid())
    and (invoice_id is null or exists (select 1 from public.invoices i where i.id = invoice_id and i.project_id = project_id and i.workspace_id = workspace_id))
    and (work_order_id is null or exists (
      select 1 from public.work_orders w
      where w.id = work_order_id and w.project_id = project_id and w.workspace_id = workspace_id
        and (private.has_workspace_role(workspace_id, array['owner', 'manager']) or private.is_work_order_assignee(w.id, true))
    ))
    and (
      private.has_workspace_role(workspace_id, array['owner', 'manager'])
      or (is_client_visible = false and proof_id is null)
    )
  );
create policy "managers update file records" on public.project_files
  for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "users view own notifications" on public.notifications
  for select to authenticated
  using (recipient_user_id = (select auth.uid()) or private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "managers create notifications" on public.notifications
  for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "project participants view activity" on public.activity_events
  for select to authenticated
  using (
    private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant'])
    or (project_id is not null and private.is_project_client(project_id))
    or (
      project_id is not null
      and private.is_project_assignee(project_id)
      and event_type not like 'invoice.%'
      and event_type not like 'quote.%'
      and event_type not like 'contract.%'
      and event_type not like 'claim.%'
      and event_type not like 'payment.%'
    )
  );
create policy "members create activity" on public.activity_events
  for insert to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'manager'])
    or (project_id is not null and private.can_access_project(project_id))
  );

create policy "owners view studio settings" on public.studio_settings
  for select to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']));
create policy "owners manage studio settings" on public.studio_settings
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner']))
  with check (private.has_workspace_role(workspace_id, array['owner']));

create policy "public reads published site" on public.public_site_content
  for select to anon, authenticated
  using (published = true or private.has_workspace_role(workspace_id, array['owner', 'manager']));
create policy "owners manage public site" on public.public_site_content
  for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'manager']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'manager']));

grant usage on schema public to anon, authenticated;
grant select on public.public_site_content to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on function public.submit_service_request(text, jsonb) from public;
revoke all on function public.get_public_site_content(text) from public;
revoke all on function public.accept_service_request(uuid, uuid) from public, anon;
revoke all on function public.submit_brief(uuid, jsonb) from public, anon;
revoke all on function public.approve_brief(uuid) from public, anon;
revoke all on function public.send_quote(uuid) from public, anon;
revoke all on function public.respond_to_quote(uuid, boolean) from public, anon;
revoke all on function public.sign_contract(uuid, text) from public, anon;
revoke all on function public.record_invoice_payment(uuid, text, text) from public, anon;
revoke all on function public.approve_collaborator_claim(uuid) from public, anon;
revoke all on function public.record_claim_payment(uuid, text, numeric) from public, anon;
revoke all on function public.create_work_order(uuid, text, text, text, text, text, text, text, text, text, date, boolean, uuid[], uuid) from public, anon;
revoke all on function public.save_work_order_assignees(uuid, uuid[]) from public, anon;
revoke all on function public.advance_owner_work_order(uuid, text) from public, anon;
revoke all on function public.dispatch_work_order(uuid) from public, anon;
revoke all on function public.start_work_order(uuid) from public, anon;
revoke all on function public.post_work_order_message(uuid, text, text) from public, anon;
revoke all on function public.submit_work_order_proof(uuid, text, text) from public, anon;
revoke all on function public.submit_owner_work_order_proof(uuid, text, text) from public, anon;
revoke all on function public.review_work_order_proof(uuid, text, text, boolean) from public, anon;
revoke all on function public.update_assigned_task_status(uuid, text) from public, anon;
revoke all on function public.submit_proof(uuid, uuid, text, text, boolean) from public, anon;
revoke all on function public.send_proof_to_client(uuid) from public, anon;
revoke all on function public.review_proof(uuid, text, text) from public, anon;
revoke all on function public.release_project_delivery(uuid) from public, anon;
revoke all on function public.confirm_project_delivery(uuid) from public, anon;
revoke all on function public.submit_project_feedback(uuid, integer, text) from public, anon;
revoke all on function public.get_project_payment_instructions(uuid) from public, anon;
revoke all on function public.claim_pending_notifications(integer) from public, anon, authenticated;
revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.submit_service_request(text, jsonb) to anon, authenticated;
grant execute on function public.get_public_site_content(text) to anon, authenticated;
grant execute on function public.accept_service_request(uuid, uuid) to authenticated;
grant execute on function public.submit_brief(uuid, jsonb) to authenticated;
grant execute on function public.approve_brief(uuid) to authenticated;
grant execute on function public.send_quote(uuid) to authenticated;
grant execute on function public.respond_to_quote(uuid, boolean) to authenticated;
grant execute on function public.sign_contract(uuid, text) to authenticated;
grant execute on function public.record_invoice_payment(uuid, text, text) to authenticated;
grant execute on function public.approve_collaborator_claim(uuid) to authenticated;
grant execute on function public.record_claim_payment(uuid, text, numeric) to authenticated;
grant execute on function public.create_work_order(uuid, text, text, text, text, text, text, text, text, text, date, boolean, uuid[], uuid) to authenticated;
grant execute on function public.save_work_order_assignees(uuid, uuid[]) to authenticated;
grant execute on function public.advance_owner_work_order(uuid, text) to authenticated;
grant execute on function public.dispatch_work_order(uuid) to authenticated;
grant execute on function public.start_work_order(uuid) to authenticated;
grant execute on function public.post_work_order_message(uuid, text, text) to authenticated;
grant execute on function public.submit_work_order_proof(uuid, text, text) to authenticated;
grant execute on function public.submit_owner_work_order_proof(uuid, text, text) to authenticated;
grant execute on function public.review_work_order_proof(uuid, text, text, boolean) to authenticated;
grant execute on function public.update_assigned_task_status(uuid, text) to authenticated;
grant execute on function public.submit_proof(uuid, uuid, text, text, boolean) to authenticated;
grant execute on function public.send_proof_to_client(uuid) to authenticated;
grant execute on function public.review_proof(uuid, text, text) to authenticated;
grant execute on function public.release_project_delivery(uuid) to authenticated;
grant execute on function public.confirm_project_delivery(uuid) to authenticated;
grant execute on function public.submit_project_feedback(uuid, integer, text) to authenticated;
grant execute on function public.get_project_payment_instructions(uuid) to authenticated;
grant execute on function public.claim_pending_notifications(integer) to service_role;
grant execute on function public.mark_notification_read(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  524288000,
  array[
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ]
)
on conflict (id) do nothing;

create policy "project participants read stored files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-files'
    and private.can_read_project_file(name)
  );
create policy "project participants upload stored files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and array_length(storage.foldername(name), 1) >= 2
    and private.can_access_project(((storage.foldername(name))[2])::uuid)
    and exists (
      select 1
      from public.projects p
      where p.id = ((storage.foldername(name))[2])::uuid
        and p.workspace_id = ((storage.foldername(name))[1])::uuid
    )
  );
create policy "managers update stored files" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'project-files'
    and array_length(storage.foldername(name), 1) >= 2
    and private.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner', 'manager'])
  )
  with check (
    bucket_id = 'project-files'
    and array_length(storage.foldername(name), 1) >= 2
    and private.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner', 'manager'])
  );
create policy "managers delete stored files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-files'
    and array_length(storage.foldername(name), 1) >= 2
    and private.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner', 'manager'])
  );

commit;
