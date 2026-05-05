-- Allow authenticated admin users to operate the admin UI without exposing
-- service-role credentials to the browser or requiring them for normal CRUD.

create or replace function private.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = (select auth.uid())
  )
$$;

drop policy if exists "Admin users can view admin users" on public.admin_users;
create policy "Admin users can view admin users"
on public.admin_users
for select
to authenticated
using (private.is_admin_user());

drop policy if exists "Admins can manage companies" on public.companies;
create policy "Admins can manage companies"
on public.companies
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage students" on public.students;
create policy "Admins can manage students"
on public.students
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage member student profiles" on public.student_member_profiles;
create policy "Admins can manage member student profiles"
on public.student_member_profiles
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage interview requests" on public.interview_requests;
create policy "Admins can manage interview requests"
on public.interview_requests
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage admin activity logs" on public.admin_activity_logs;
create policy "Admins can manage admin activity logs"
on public.admin_activity_logs
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage company status logs" on public.company_status_logs;
create policy "Admins can manage company status logs"
on public.company_status_logs
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());

drop policy if exists "Admins can manage student publication logs" on public.student_publication_logs;
create policy "Admins can manage student publication logs"
on public.student_publication_logs
for all
to authenticated
using (private.is_admin_user())
with check (private.is_admin_user());
