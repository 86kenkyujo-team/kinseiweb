-- Student login MVP: public companies, job posts, and student contact history.

alter table public.students
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists login_email text,
  add column if not exists login_status text not null default 'not_invited',
  add column if not exists profile_share_status text not null default 'disabled',
  add column if not exists profile_confirmed_at timestamptz,
  add column if not exists profile_share_consent_at timestamptz;

alter table public.students
  drop constraint if exists students_login_status_check,
  add constraint students_login_status_check
    check (login_status in ('not_invited', 'invited', 'active', 'suspended')),
  drop constraint if exists students_profile_share_status_check,
  add constraint students_profile_share_status_check
    check (profile_share_status in ('disabled', 'enabled'));

alter table public.companies
  add column if not exists logo_url text,
  add column if not exists industry_category text,
  add column if not exists company_description text,
  add column if not exists public_website_url text,
  add column if not exists public_contact_email text,
  add column if not exists public_location text,
  add column if not exists public_tags text[] not null default '{}'::text[],
  add column if not exists public_status text not null default 'draft',
  add column if not exists sort_order integer not null default 100;

alter table public.companies
  drop constraint if exists companies_public_status_check,
  add constraint companies_public_status_check
    check (public_status in ('draft', 'published', 'archived'));

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  summary text,
  description text,
  job_type text,
  target_grade text,
  location text,
  work_style text,
  reward text,
  requirements text,
  welcome_points text,
  tags text[] not null default '{}'::text[],
  contact_email text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  closed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_company_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  job_post_id uuid references public.job_posts(id) on delete set null,
  contact_email text not null,
  mail_subject text not null,
  mail_body_snapshot text not null,
  profile_snapshot jsonb not null default '{}'::jsonb,
  consent_at timestamptz not null default now(),
  status text not null default 'mail_client_opened'
    check (status in ('mail_client_opened', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists job_posts_set_updated_at on public.job_posts;
create trigger job_posts_set_updated_at
before update on public.job_posts
for each row execute function public.set_updated_at();

drop trigger if exists student_company_contacts_set_updated_at on public.student_company_contacts;
create trigger student_company_contacts_set_updated_at
before update on public.student_company_contacts
for each row execute function public.set_updated_at();

alter table public.job_posts enable row level security;
alter table public.student_company_contacts enable row level security;

drop policy if exists "Students can view their own record" on public.students;
create policy "Students can view their own record"
on public.students
for select
to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists "Students can view their own member profile" on public.student_member_profiles;
create policy "Students can view their own member profile"
on public.student_member_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_member_profiles.student_id
      and s.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Published companies are publicly visible" on public.companies;
create policy "Published companies are publicly visible"
on public.companies
for select
to anon, authenticated
using (public_status = 'published');

drop policy if exists "Published job posts are publicly visible" on public.job_posts;
create policy "Published job posts are publicly visible"
on public.job_posts
for select
to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1
    from public.companies c
    where c.id = job_posts.company_id
      and c.public_status = 'published'
  )
);

drop policy if exists "Students can create their own contact history" on public.student_company_contacts;
create policy "Students can create their own contact history"
on public.student_company_contacts
for insert
to authenticated
with check (
  status = 'mail_client_opened'
  and exists (
    select 1
    from public.students s
    where s.id = student_company_contacts.student_id
      and s.auth_user_id = (select auth.uid())
      and s.login_status in ('invited', 'active')
      and s.profile_share_status = 'enabled'
  )
  and exists (
    select 1
    from public.companies c
    where c.id = student_company_contacts.company_id
      and c.public_status = 'published'
  )
  and (
    student_company_contacts.job_post_id is null
    or exists (
      select 1
      from public.job_posts jp
      where jp.id = student_company_contacts.job_post_id
        and jp.company_id = student_company_contacts.company_id
        and jp.publication_status = 'published'
    )
  )
);

drop policy if exists "Students can view their own contact history" on public.student_company_contacts;
create policy "Students can view their own contact history"
on public.student_company_contacts
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_company_contacts.student_id
      and s.auth_user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can manage job posts" on public.job_posts;
create policy "Admins can manage job posts"
on public.job_posts
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage student contact history" on public.student_company_contacts;
create policy "Admins can manage student contact history"
on public.student_company_contacts
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

grant select (
  id,
  company_name,
  logo_url,
  industry_category,
  company_description,
  public_website_url,
  public_contact_email,
  public_location,
  public_tags,
  public_status,
  sort_order
) on public.companies to anon, authenticated;
grant select on public.students to authenticated;
grant select on public.student_member_profiles to authenticated;
grant select on public.job_posts to anon, authenticated;
grant select, insert on public.student_company_contacts to authenticated;
grant all on public.job_posts to authenticated;
grant all on public.student_company_contacts to authenticated;

create unique index if not exists students_auth_user_id_unique_idx
  on public.students(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists students_login_email_unique_idx
  on public.students(lower(login_email))
  where login_email is not null;

create index if not exists students_login_status_idx on public.students(login_status);
create index if not exists companies_public_status_sort_idx
  on public.companies(public_status, sort_order, company_name);
create index if not exists job_posts_company_publication_idx
  on public.job_posts(company_id, publication_status);
create index if not exists student_company_contacts_student_id_idx
  on public.student_company_contacts(student_id, created_at desc);
create index if not exists student_company_contacts_company_id_idx
  on public.student_company_contacts(company_id, created_at desc);
