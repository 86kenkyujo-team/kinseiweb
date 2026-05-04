-- 企業会員限定 学生データベース MVP schema
-- Target: Supabase Postgres
-- Created: 2026-05-04

create schema if not exists private;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text not null,
  contact_email text not null unique,
  membership_status text not null default 'active'
    check (membership_status in ('active', 'trial', 'past_due', 'suspended', 'cancelled')),
  plan_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  initials text not null,
  faculty text not null,
  grade text not null,
  location text,
  attributes text[] not null default '{}',
  desired_industries text[] not null default '{}',
  catch_copy text not null,
  tiktok_url text,
  profile_summary text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_member_profiles (
  student_id uuid primary key references public.students(id) on delete cascade,
  real_name text,
  values_text text,
  thinking_style text,
  career_axis text[] not null default '{}',
  motivation_detail text,
  decision_axis text,
  future_vision text,
  deep_dive_answers jsonb not null default '[]'::jsonb,
  meeting_preference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  request_reason text not null,
  preferred_method text not null,
  preferred_schedule text,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'introduced', 'declined', 'closed')),
  created_at timestamptz not null default now()
);

create or replace function private.current_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select c.id
  from public.companies c
  where c.auth_user_id = (select auth.uid())
  limit 1
$$;

create or replace function private.is_active_company_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.companies c
    where c.auth_user_id = (select auth.uid())
      and c.membership_status in ('active', 'trial')
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists student_member_profiles_set_updated_at on public.student_member_profiles;
create trigger student_member_profiles_set_updated_at
before update on public.student_member_profiles
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.students enable row level security;
alter table public.student_member_profiles enable row level security;
alter table public.interview_requests enable row level security;

drop policy if exists "Companies can view their own record" on public.companies;
create policy "Companies can view their own record"
on public.companies
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
);

drop policy if exists "Published students are publicly visible" on public.students;
create policy "Published students are publicly visible"
on public.students
for select
to anon, authenticated
using (
  publication_status = 'published'
);

drop policy if exists "Active companies can view member student profiles" on public.student_member_profiles;
create policy "Active companies can view member student profiles"
on public.student_member_profiles
for select
to authenticated
using (
  private.is_active_company_member()
  and exists (
    select 1
    from public.students s
    where s.id = student_member_profiles.student_id
      and s.publication_status = 'published'
  )
);

drop policy if exists "Companies can create their own interview requests" on public.interview_requests;
create policy "Companies can create their own interview requests"
on public.interview_requests
for insert
to authenticated
with check (
  company_id = private.current_company_id()
  and private.is_active_company_member()
  and exists (
    select 1
    from public.students s
    where s.id = interview_requests.student_id
      and s.publication_status = 'published'
  )
);

drop policy if exists "Companies can view their own interview requests" on public.interview_requests;
create policy "Companies can view their own interview requests"
on public.interview_requests
for select
to authenticated
using (
  company_id = private.current_company_id()
);

create index if not exists companies_auth_user_id_idx on public.companies(auth_user_id);
create index if not exists companies_membership_status_idx on public.companies(membership_status);
create index if not exists students_publication_status_idx on public.students(publication_status);
create index if not exists interview_requests_company_id_idx on public.interview_requests(company_id);
create index if not exists interview_requests_student_id_idx on public.interview_requests(student_id);
