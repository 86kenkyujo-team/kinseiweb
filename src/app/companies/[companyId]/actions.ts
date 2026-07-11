'use server'

import {
  buildMailBody,
  buildMailSubject,
  buildMailtoUrl,
  buildStudentProfileSnapshot,
  getContactEmail,
  type ContactCompany,
  type ContactJobPost,
} from '@/lib/student/contactMail'
import { getStudentContext } from '@/lib/student/auth'
import { createAdminClient } from '@/lib/supabase/admin'

type ContactActionResult =
  | { error: string; ok: false }
  | { mailtoUrl: string; ok: true }

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) || '').trim()
  return value || null
}

export async function createCompanyContactMailto(formData: FormData): Promise<ContactActionResult> {
  const companyId = textValue(formData, 'companyId')
  const jobPostId = textValue(formData, 'jobPostId')
  const consentAccepted = formData.get('profileConsent') === 'on'

  if (!companyId) {
    return { error: '企業情報を確認できませんでした。', ok: false }
  }

  if (!consentAccepted) {
    return { error: 'プロフィール情報共有への同意が必要です。', ok: false }
  }

  const context = await getStudentContext()

  if (!context.studentClient || !context.user) {
    return { error: '学生ログインが必要です。', ok: false }
  }

  if (!context.student) {
    return { error: '学生プロフィールが紐づいていません。KINSEI運営へ確認してください。', ok: false }
  }

  if (context.student.profile_share_status !== 'enabled') {
    return { error: 'プロフィール共有が有効になっていません。KINSEI運営へ確認してください。', ok: false }
  }

  if (context.student.login_status === 'suspended') {
    return { error: '学生ログインが停止中です。KINSEI運営へ確認してください。', ok: false }
  }

  if (!['invited', 'active'].includes(context.student.login_status)) {
    return { error: '学生ログイン設定が有効化されていません。KINSEI運営へ確認してください。', ok: false }
  }

  const serviceClient = createAdminClient()

  if (!serviceClient) {
    return { error: '連絡導線を利用するためのサーバー設定が不足しています。KINSEI運営へ確認してください。', ok: false }
  }

  const { data: company } = await serviceClient
    .from('companies')
    .select('company_name, public_contact_email')
    .eq('id', companyId)
    .eq('public_status', 'published')
    .maybeSingle<ContactCompany>()

  if (!company) {
    return { error: '公開中の企業情報が見つかりません。', ok: false }
  }

  let jobPost: ContactJobPost = null

  if (jobPostId) {
    const { data } = await serviceClient
      .from('job_posts')
      .select('title, contact_email')
      .eq('id', jobPostId)
      .eq('company_id', companyId)
      .eq('publication_status', 'published')
      .maybeSingle<NonNullable<ContactJobPost>>()

    if (!data) {
      return { error: '公開中の求人情報が見つかりません。', ok: false }
    }

    jobPost = data
  }

  const contactEmail = getContactEmail(company, jobPost)

  if (!contactEmail) {
    return { error: 'この企業には学生向け公開メールが設定されていません。', ok: false }
  }

  const subject = buildMailSubject(company, context.student, jobPost)
  const body = buildMailBody(company, context.student, jobPost)
  const profileSnapshot = buildStudentProfileSnapshot(context.student)

  const consentAt = new Date().toISOString()
  const { error: consentUpdateError } = await serviceClient
    .from('students')
    .update({ profile_share_consent_at: consentAt })
    .eq('id', context.student.id)

  if (consentUpdateError) {
    return { error: 'プロフィール共有の同意日時を保存できませんでした。運営へ確認してください。', ok: false }
  }

  const { error } = await serviceClient
    .from('student_company_contacts')
    .insert({
      company_id: companyId,
      contact_email: contactEmail,
      consent_at: consentAt,
      job_post_id: jobPostId,
      mail_body_snapshot: body,
      mail_subject: subject,
      profile_snapshot: profileSnapshot,
      status: 'mail_client_opened',
      student_id: context.student.id,
    })

  if (error) {
    return { error: '連絡導線利用履歴を保存できませんでした。時間をおいて再度お試しください。', ok: false }
  }

  return {
    mailtoUrl: buildMailtoUrl(contactEmail, subject, body),
    ok: true,
  }
}
