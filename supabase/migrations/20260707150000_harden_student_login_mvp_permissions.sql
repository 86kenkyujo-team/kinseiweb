-- Harden Student login MVP Data API permissions.
-- Server-side actions fetch private contact/auth fields with the service role after
-- verifying the signed-in user, so public API roles only receive the columns needed
-- for browsing and own-history display.

revoke all privileges on table public.students from anon, authenticated;
revoke all privileges on table public.companies from anon, authenticated;
revoke all privileges on table public.job_posts from anon, authenticated;
revoke all privileges on table public.student_company_contacts from anon, authenticated;
revoke all privileges on table public.interview_requests from anon, authenticated;

revoke select (public_contact_email) on table public.companies from anon, authenticated;

grant select (
  id,
  display_name,
  initials,
  faculty,
  grade,
  location,
  attributes,
  desired_industries,
  catch_copy,
  profile_summary,
  profile_image_url,
  tiktok_url,
  video_url,
  publication_status
) on public.students to anon, authenticated;

grant select (
  id,
  company_name,
  logo_url,
  industry_category,
  company_description,
  public_website_url,
  public_location,
  public_tags,
  public_status,
  sort_order
) on public.companies to anon, authenticated;

grant select (
  id,
  company_id,
  title,
  summary,
  description,
  job_type,
  target_grade,
  location,
  work_style,
  reward,
  requirements,
  welcome_points,
  tags,
  publication_status,
  published_at,
  closed_at,
  created_at,
  updated_at
) on public.job_posts to anon, authenticated;

grant select (
  id,
  student_id,
  company_id,
  job_post_id,
  contact_email,
  mail_subject,
  mail_body_snapshot,
  profile_snapshot,
  consent_at,
  status,
  created_at,
  updated_at
) on public.student_company_contacts to authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;
