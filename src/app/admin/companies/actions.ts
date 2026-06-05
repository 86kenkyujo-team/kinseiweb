'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCompanyPasswordUpdateRedirectUrl, requireAdmin } from '@/lib/admin/auth'
import {
  canSendCompanyAccessEmail,
  sendCompanyAccessEmail as sendKinseiCompanyAccessEmail,
} from '@/lib/email/companyAccessEmail'
import { createAdminClient } from '@/lib/supabase/admin'

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

type AuthEmailError = {
  code?: string
  message?: string
  status?: number
}

type CompanyFormValues = {
  adminNote: string | null
  companyName: string
  contactEmail: string
  contactName: string
  contractEndDate: string | null
  contractStartDate: string | null
  contractStatusNote: string | null
  membershipStatus: string
  nextCheckDate: string | null
  planName: string | null
}

type CompanyAccessEmailResult =
  | { emailKind: 'invite' | 'password_reset'; status: 'ok'; userId: string }
  | { errorStatus: string; status: 'error' }

type LinkProperties = {
  action_link: string
  hashed_token?: string
  verification_type?: string
}

function isAlreadyRegisteredInviteError(error: AuthEmailError | null) {
  return (
    error?.status === 422 &&
    /already been registered/i.test(error.message || '')
  )
}

function getInviteErrorStatus(error: AuthEmailError | null) {
  if (error?.code === 'email_address_invalid' || /email address .* is invalid/i.test(error?.message || '')) {
    return 'invite_email_invalid'
  }

  return 'invite_error'
}

function getPasswordResetErrorStatus(error: AuthEmailError | null) {
  if (error?.code === 'email_address_invalid' || /email address .* is invalid/i.test(error?.message || '')) {
    return 'invite_email_invalid'
  }

  return 'password_reset_error'
}

function logAuthEmailError(context: string, error: AuthEmailError | null) {
  console.error(`[admin companies] ${context}`, {
    code: error?.code,
    message: error?.message,
    status: error?.status,
  })
}

function logCustomEmailError(context: string, message: string) {
  console.error(`[admin companies] ${context}`, { message })
}

function buildCompanyAccessActionLink(properties: LinkProperties, redirectTo?: string) {
  if (!redirectTo || !properties.hashed_token || !properties.verification_type) {
    return properties.action_link
  }

  const siteOrigin = new URL(redirectTo).origin
  const url = new URL('/auth/confirm', siteOrigin)
  url.searchParams.set('token_hash', properties.hashed_token)
  url.searchParams.set('type', properties.verification_type)
  url.searchParams.set('next', '/members/students')

  return url.toString()
}

async function findAuthUserByEmail(
  serviceClient: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const normalizedEmail = email.toLowerCase()

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) {
      logAuthEmailError('auth user lookup failed', error)
      return null
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)

    if (user) {
      return user
    }

    if (!data.nextPage) {
      return null
    }
  }

  return null
}

async function sendCompanyAccessLinkEmail(
  serviceClient: NonNullable<ReturnType<typeof createAdminClient>>,
  values: Pick<CompanyFormValues, 'companyName' | 'contactEmail' | 'contactName'>,
): Promise<CompanyAccessEmailResult> {
  if (!canSendCompanyAccessEmail()) {
    return {
      errorStatus: 'email_service_missing',
      status: 'error',
    }
  }

  const redirectTo = getCompanyPasswordUpdateRedirectUrl()
  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.generateLink({
    email: values.contactEmail,
    options: {
      data: {
        company_name: values.companyName,
        contact_name: values.contactName,
      },
      redirectTo,
    },
    type: 'invite',
  })

  if (!inviteError && inviteData.user && inviteData.properties?.action_link) {
    const emailResult = await sendKinseiCompanyAccessEmail({
      actionLink: buildCompanyAccessActionLink(inviteData.properties, redirectTo),
      companyName: values.companyName,
      contactName: values.contactName,
      emailKind: 'invite',
      to: values.contactEmail,
    })

    if (emailResult.status !== 'ok') {
      if (emailResult.status === 'missing_config') {
        return {
          errorStatus: 'email_service_missing',
          status: 'error',
        }
      }

      logCustomEmailError('custom invite email failed', emailResult.message)
      await serviceClient.auth.admin.deleteUser(inviteData.user.id)
      return {
        errorStatus: 'custom_email_error',
        status: 'error',
      }
    }

    return {
      emailKind: 'invite',
      status: 'ok',
      userId: inviteData.user.id,
    }
  }

  if (!inviteError && inviteData.user) {
    await serviceClient.auth.admin.deleteUser(inviteData.user.id)
    return {
      errorStatus: 'invite_error',
      status: 'error',
    }
  }

  if (!isAlreadyRegisteredInviteError(inviteError)) {
    logAuthEmailError('invite link generation failed', inviteError)
    return {
      errorStatus: getInviteErrorStatus(inviteError),
      status: 'error',
    }
  }

  const existingUser = await findAuthUserByEmail(serviceClient, values.contactEmail)

  if (!existingUser) {
    logAuthEmailError('existing auth user not found after duplicate invite', inviteError)
    return {
      errorStatus: 'auth_user_lookup_error',
      status: 'error',
    }
  }

  const { data: resetData, error: resetError } = await serviceClient.auth.admin.generateLink({
    email: values.contactEmail,
    options: {
      redirectTo,
    },
    type: 'recovery',
  })

  if (resetError || !resetData.properties?.action_link) {
    logAuthEmailError('password reset link generation failed', resetError)
    return {
      errorStatus: getPasswordResetErrorStatus(resetError),
      status: 'error',
    }
  }

  const emailResult = await sendKinseiCompanyAccessEmail({
    actionLink: buildCompanyAccessActionLink(resetData.properties, redirectTo),
    companyName: values.companyName,
    contactName: values.contactName,
    emailKind: 'password_reset',
    to: values.contactEmail,
  })

  if (emailResult.status !== 'ok') {
    if (emailResult.status === 'missing_config') {
      return {
        errorStatus: 'email_service_missing',
        status: 'error',
      }
    }

    logCustomEmailError('custom password reset email failed', emailResult.message)
    return {
      errorStatus: 'custom_email_error',
      status: 'error',
    }
  }

  return {
    emailKind: 'password_reset',
    status: 'ok',
    userId: existingUser.id,
  }
}

async function insertCompany(
  adminClient: Awaited<ReturnType<typeof requireAdmin>>['adminClient'],
  adminUser: Awaited<ReturnType<typeof requireAdmin>>['adminUser'],
  values: CompanyFormValues,
  authUserId: string,
) {
  const { data: existingAuthCompany } = await adminClient
    .from('companies')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (existingAuthCompany) {
    redirect('/admin/companies/new?status=auth_user_duplicate_company')
  }

  const { data: company, error: insertError } = await adminClient
    .from('companies')
    .insert({
      admin_note: values.adminNote,
      auth_user_id: authUserId,
      company_name: values.companyName,
      contact_email: values.contactEmail,
      contact_name: values.contactName,
      contract_end_date: values.contractEndDate,
      contract_start_date: values.contractStartDate,
      contract_status_note: values.contractStatusNote,
      created_by_admin_id: adminUser.id,
      last_status_changed_at: new Date().toISOString(),
      membership_status: values.membershipStatus,
      next_check_date: values.nextCheckDate,
      plan_name: values.planName,
    })
    .select('id')
    .single()

  if (insertError || !company) {
    redirect('/admin/companies/new?status=company_error')
  }

  await Promise.all([
    adminClient.from('company_status_logs').insert({
      admin_user_id: adminUser.id,
      company_id: company.id,
      next_status: values.membershipStatus,
      note: '企業登録時の初期ステータス',
    }),
    adminClient.from('admin_activity_logs').insert({
      action: 'company.create',
      admin_user_id: adminUser.id,
      details: {
        contact_email: values.contactEmail,
        membership_status: values.membershipStatus,
      },
      target_id: company.id,
      target_table: 'companies',
    }),
  ])

  return company
}

export async function createCompany(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const serviceClient = createAdminClient()
  const values: CompanyFormValues = {
    adminNote: textValue(formData, 'adminNote'),
    companyName: requiredText(formData, 'companyName'),
    contactEmail: requiredText(formData, 'contactEmail').toLowerCase(),
    contactName: requiredText(formData, 'contactName'),
    contractEndDate: textValue(formData, 'contractEndDate'),
    contractStartDate: textValue(formData, 'contractStartDate'),
    contractStatusNote: textValue(formData, 'contractStatusNote'),
    membershipStatus: requiredText(formData, 'membershipStatus'),
    nextCheckDate: textValue(formData, 'nextCheckDate'),
    planName: textValue(formData, 'planName'),
  }

  const { data: existingCompany } = await adminClient
    .from('companies')
    .select('id')
    .eq('contact_email', values.contactEmail)
    .maybeSingle()

  if (existingCompany) {
    redirect('/admin/companies/new?status=duplicate')
  }

  if (!serviceClient) {
    redirect('/admin/companies/new?status=service_key_missing')
  }

  const accessEmailResult = await sendCompanyAccessLinkEmail(serviceClient, values)

  if (accessEmailResult.status === 'error') {
    redirect(`/admin/companies/new?status=${accessEmailResult.errorStatus}`)
  }

  const company = await insertCompany(adminClient, adminUser, values, accessEmailResult.userId)

  revalidatePath('/admin')
  revalidatePath('/admin/companies')
  const createdStatus =
    accessEmailResult.emailKind === 'password_reset' ? 'created_existing_user' : 'created'

  redirect(`/admin/companies/${company.id}?status=${createdStatus}`)
}

export async function updateCompany(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const companyId = requiredText(formData, 'companyId')
  const previousStatus = textValue(formData, 'previousStatus')
  const membershipStatus = requiredText(formData, 'membershipStatus')

  const { error } = await adminClient
    .from('companies')
    .update({
      admin_note: textValue(formData, 'adminNote'),
      company_name: requiredText(formData, 'companyName'),
      contact_email: requiredText(formData, 'contactEmail').toLowerCase(),
      contact_name: requiredText(formData, 'contactName'),
      contract_end_date: textValue(formData, 'contractEndDate'),
      contract_start_date: textValue(formData, 'contractStartDate'),
      contract_status_note: textValue(formData, 'contractStatusNote'),
      last_status_changed_at:
        previousStatus !== membershipStatus ? new Date().toISOString() : undefined,
      membership_status: membershipStatus,
      next_check_date: textValue(formData, 'nextCheckDate'),
      plan_name: textValue(formData, 'planName'),
    })
    .eq('id', companyId)

  if (error) {
    redirect(`/admin/companies/${companyId}?status=error`)
  }

  if (previousStatus !== membershipStatus) {
    await adminClient.from('company_status_logs').insert({
      admin_user_id: adminUser.id,
      company_id: companyId,
      next_status: membershipStatus,
      note: textValue(formData, 'statusNote'),
      previous_status: previousStatus,
    })
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'company.update',
    admin_user_id: adminUser.id,
    details: { membership_status: membershipStatus },
    target_id: companyId,
    target_table: 'companies',
  })

  revalidatePath('/admin')
  revalidatePath('/admin/companies')
  revalidatePath(`/admin/companies/${companyId}`)
  redirect(`/admin/companies/${companyId}?status=updated`)
}

export async function deleteCompany(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const companyId = requiredText(formData, 'companyId')
  const expectedCompanyName = requiredText(formData, 'companyName')
  const enteredCompanyName = requiredText(formData, 'companyNameConfirmation')
  const isConfirmed = formData.get('confirmDelete') === 'on'

  if (!isConfirmed) {
    redirect(`/admin/companies/${companyId}?status=delete_confirm_required`)
  }

  if (enteredCompanyName !== expectedCompanyName) {
    redirect(`/admin/companies/${companyId}?status=delete_name_mismatch`)
  }

  const { data: company } = await adminClient
    .from('companies')
    .select('id, company_name, contact_email')
    .eq('id', companyId)
    .maybeSingle()

  if (!company) {
    redirect('/admin/companies?status=delete_not_found')
  }

  const { count: interviewRequestCount } = await adminClient
    .from('interview_requests')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const { error: interviewDeleteError } = await adminClient
    .from('interview_requests')
    .delete()
    .eq('company_id', companyId)

  if (interviewDeleteError) {
    redirect(`/admin/companies/${companyId}?status=delete_error`)
  }

  const { error: companyDeleteError } = await adminClient
    .from('companies')
    .delete()
    .eq('id', companyId)

  if (companyDeleteError) {
    redirect(`/admin/companies/${companyId}?status=delete_error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'company.delete',
    admin_user_id: adminUser.id,
    details: {
      company_name: company.company_name,
      contact_email: company.contact_email,
      deleted_interview_request_count: interviewRequestCount || 0,
    },
    target_id: company.id,
    target_table: 'companies',
  })

  revalidatePath('/admin')
  revalidatePath('/admin/companies')
  redirect('/admin/companies?status=deleted')
}

export async function resendCompanyInvite(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const serviceClient = createAdminClient()
  const companyId = requiredText(formData, 'companyId')
  const contactEmail = requiredText(formData, 'contactEmail').toLowerCase()
  const companyName = requiredText(formData, 'companyName')
  const contactName = requiredText(formData, 'contactName')

  if (!serviceClient) {
    redirect(`/admin/companies/${companyId}?status=service_key_missing`)
  }

  const accessEmailResult = await sendCompanyAccessLinkEmail(serviceClient, {
    companyName,
    contactEmail,
    contactName,
  })

  if (accessEmailResult.status === 'error') {
    redirect(`/admin/companies/${companyId}?status=${accessEmailResult.errorStatus}`)
  }

  const { error: updateAuthUserError } = await adminClient
    .from('companies')
    .update({ auth_user_id: accessEmailResult.userId })
    .eq('id', companyId)

  if (updateAuthUserError) {
    redirect(`/admin/companies/${companyId}?status=error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'company.invite_resend',
    admin_user_id: adminUser.id,
    details: { contact_email: contactEmail, email_kind: accessEmailResult.emailKind },
    target_id: companyId,
    target_table: 'companies',
  })

  const sentStatus =
    accessEmailResult.emailKind === 'password_reset' ? 'password_reset_sent' : 'invite_sent'

  redirect(`/admin/companies/${companyId}?status=${sentStatus}`)
}
