-- Admin operations support for KINSEI member database.
-- The admin UI uses service-role access server-side only.

alter table public.companies
  add column if not exists contract_status_note text,
  add column if not exists contract_start_date date,
  add column if not exists contract_end_date date,
  add column if not exists next_check_date date,
  add column if not exists admin_note text,
  add column if not exists created_by_admin_id uuid,
  add column if not exists last_status_changed_at timestamptz;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.company_status_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  admin_user_id uuid references public.admin_users(id) on delete set null,
  previous_status text,
  next_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_publication_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  admin_user_id uuid references public.admin_users(id) on delete set null,
  previous_status text,
  next_status text not null,
  note text,
  created_at timestamptz not null default now()
);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.company_status_logs enable row level security;
alter table public.student_publication_logs enable row level security;

create index if not exists admin_users_auth_user_id_idx on public.admin_users(auth_user_id);
create index if not exists companies_next_check_date_idx on public.companies(next_check_date);
create index if not exists admin_activity_logs_created_at_idx on public.admin_activity_logs(created_at);
create index if not exists company_status_logs_company_id_idx on public.company_status_logs(company_id);
create index if not exists student_publication_logs_student_id_idx on public.student_publication_logs(student_id);
