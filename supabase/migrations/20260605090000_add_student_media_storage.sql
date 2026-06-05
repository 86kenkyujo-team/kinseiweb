-- Storage bucket for public student profile images and introduction videos.
-- Files are public because the student DB renders these media URLs directly.

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
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-media'
  and private.is_admin_user()
);

drop policy if exists "Admins can upload student media" on storage.objects;
create policy "Admins can upload student media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-media'
  and private.is_admin_user()
);

drop policy if exists "Admins can update student media" on storage.objects;
create policy "Admins can update student media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-media'
  and private.is_admin_user()
)
with check (
  bucket_id = 'student-media'
  and private.is_admin_user()
);

drop policy if exists "Admins can delete student media" on storage.objects;
create policy "Admins can delete student media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-media'
  and private.is_admin_user()
);
