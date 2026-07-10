'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) || '').trim()
  return value || null
}

function requiredText(formData: FormData, key: string) {
  const value = textValue(formData, key)

  if (!value) {
    throw new Error(`${key} is required.`)
  }

  return value
}

function arrayValue(formData: FormData, key: string) {
  const value = textValue(formData, key)

  if (!value) {
    return []
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function dateTimeValue(formData: FormData, key: string) {
  const value = textValue(formData, key)

  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function jobPostPayload(formData: FormData) {
  const publicationStatus = requiredText(formData, 'publicationStatus')
  const publishedAt = dateTimeValue(formData, 'publishedAt')

  return {
    admin_note: textValue(formData, 'adminNote'),
    closed_at: dateTimeValue(formData, 'closedAt'),
    company_id: requiredText(formData, 'companyId'),
    contact_email: textValue(formData, 'contactEmail')?.toLowerCase() || null,
    description: textValue(formData, 'description'),
    job_type: textValue(formData, 'jobType'),
    location: textValue(formData, 'location'),
    publication_status: publicationStatus,
    published_at: publicationStatus === 'published' ? publishedAt || new Date().toISOString() : publishedAt,
    requirements: textValue(formData, 'requirements'),
    reward: textValue(formData, 'reward'),
    summary: textValue(formData, 'summary'),
    tags: arrayValue(formData, 'tags'),
    target_grade: textValue(formData, 'targetGrade'),
    title: requiredText(formData, 'title'),
    welcome_points: textValue(formData, 'welcomePoints'),
    work_style: textValue(formData, 'workStyle'),
  }
}

export async function createJobPost(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const payload = jobPostPayload(formData)
  const { data: jobPost, error } = await adminClient
    .from('job_posts')
    .insert(payload)
    .select('id, company_id, publication_status')
    .single()

  if (error || !jobPost) {
    redirect('/admin/job-posts/new?status=error')
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'job_post.create',
    admin_user_id: adminUser.id,
    details: { publication_status: jobPost.publication_status },
    target_id: jobPost.id,
    target_table: 'job_posts',
  })

  revalidatePath('/admin/job-posts')
  revalidatePath('/companies')
  revalidatePath(`/companies/${jobPost.company_id}`)
  redirect(`/admin/job-posts/${jobPost.id}/edit?status=created`)
}

export async function updateJobPost(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const jobPostId = requiredText(formData, 'jobPostId')
  const payload = jobPostPayload(formData)
  const { error } = await adminClient
    .from('job_posts')
    .update(payload)
    .eq('id', jobPostId)

  if (error) {
    redirect(`/admin/job-posts/${jobPostId}/edit?status=error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'job_post.update',
    admin_user_id: adminUser.id,
    details: { publication_status: payload.publication_status },
    target_id: jobPostId,
    target_table: 'job_posts',
  })

  revalidatePath('/admin/job-posts')
  revalidatePath(`/admin/job-posts/${jobPostId}/edit`)
  revalidatePath('/companies')
  revalidatePath(`/companies/${payload.company_id}`)
  redirect(`/admin/job-posts/${jobPostId}/edit?status=updated`)
}

export async function deleteJobPost(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const jobPostId = requiredText(formData, 'jobPostId')
  const expectedTitle = requiredText(formData, 'jobPostTitle')
  const enteredTitle = requiredText(formData, 'jobPostTitleConfirmation')
  const isConfirmed = formData.get('confirmDelete') === 'on'

  if (!isConfirmed) {
    redirect(`/admin/job-posts/${jobPostId}/edit?status=delete_confirm_required`)
  }

  if (enteredTitle !== expectedTitle) {
    redirect(`/admin/job-posts/${jobPostId}/edit?status=delete_title_mismatch`)
  }

  const { data: jobPost } = await adminClient
    .from('job_posts')
    .select('id, title, company_id')
    .eq('id', jobPostId)
    .maybeSingle()

  if (!jobPost) {
    redirect('/admin/job-posts?status=delete_not_found')
  }

  const { error } = await adminClient
    .from('job_posts')
    .delete()
    .eq('id', jobPostId)

  if (error) {
    redirect(`/admin/job-posts/${jobPostId}/edit?status=delete_error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'job_post.delete',
    admin_user_id: adminUser.id,
    details: { title: jobPost.title },
    target_id: jobPost.id,
    target_table: 'job_posts',
  })

  revalidatePath('/admin/job-posts')
  revalidatePath('/companies')
  revalidatePath(`/companies/${jobPost.company_id}`)
  redirect('/admin/job-posts?status=deleted')
}
