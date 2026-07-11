-- Repair student/member RLS after column-level grants were hardened.
-- Policy expressions must not directly read private student columns as the
-- authenticated caller. These helpers keep the private comparison server-side.

create or replace function private.is_student_owner(target_student_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.students s
    where s.id = target_student_id
      and s.auth_user_id = (select auth.uid())
  )
$$;

create or replace function private.is_published_student(target_student_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.students s
    where s.id = target_student_id
      and s.publication_status = 'published'
  )
$$;

create or replace function private.can_student_contact(target_student_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.students s
    where s.id = target_student_id
      and s.auth_user_id = (select auth.uid())
      and s.login_status in ('invited', 'active')
      and s.profile_share_status = 'enabled'
  )
$$;

revoke all on function private.is_student_owner(uuid) from public;
revoke all on function private.is_published_student(uuid) from public;
revoke all on function private.can_student_contact(uuid) from public;
revoke all on function private.current_company_id() from public;
revoke all on function private.is_active_company_member() from public;
revoke all on function private.is_admin_user() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_student_owner(uuid) to authenticated;
grant execute on function private.is_published_student(uuid) to authenticated;
grant execute on function private.can_student_contact(uuid) to authenticated;
grant execute on function private.current_company_id() to authenticated;
grant execute on function private.is_active_company_member() to authenticated;
grant execute on function private.is_admin_user() to authenticated;

drop policy if exists "Students can view their own record" on public.students;
create policy "Students can view their own record"
on public.students
for select
to authenticated
using (private.is_student_owner(id));

drop policy if exists "Active companies can view member student profiles" on public.student_member_profiles;
create policy "Active companies can view member student profiles"
on public.student_member_profiles
for select
to authenticated
using (
  private.is_active_company_member()
  and private.is_published_student(student_id)
);

drop policy if exists "Students can view their own member profile" on public.student_member_profiles;
create policy "Students can view their own member profile"
on public.student_member_profiles
for select
to authenticated
using (private.is_student_owner(student_id));

drop policy if exists "Students can create their own contact history" on public.student_company_contacts;
create policy "Students can create their own contact history"
on public.student_company_contacts
for insert
to authenticated
with check (
  status = 'mail_client_opened'
  and private.can_student_contact(student_id)
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
using (private.is_student_owner(student_id));

drop policy if exists "Companies can create their own interview requests" on public.interview_requests;
create policy "Companies can create their own interview requests"
on public.interview_requests
for insert
to authenticated
with check (
  company_id = private.current_company_id()
  and private.is_active_company_member()
  and private.is_published_student(student_id)
);

-- Re-assert the media bucket and policies so environments that missed the
-- original storage migration become consistent when migrations are applied.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'student-media',
  'student-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can view student media metadata" on storage.objects;
create policy "Admins can view student media metadata"
on storage.objects for select to authenticated
using (bucket_id = 'student-media' and private.is_admin_user());

drop policy if exists "Admins can upload student media" on storage.objects;
create policy "Admins can upload student media"
on storage.objects for insert to authenticated
with check (bucket_id = 'student-media' and private.is_admin_user());

drop policy if exists "Admins can update student media" on storage.objects;
create policy "Admins can update student media"
on storage.objects for update to authenticated
using (bucket_id = 'student-media' and private.is_admin_user())
with check (bucket_id = 'student-media' and private.is_admin_user());

drop policy if exists "Admins can delete student media" on storage.objects;
create policy "Admins can delete student media"
on storage.objects for delete to authenticated
using (bucket_id = 'student-media' and private.is_admin_user());
