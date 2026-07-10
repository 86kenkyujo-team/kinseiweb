'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCompanyPasswordUpdateRedirectUrl, requireAdmin } from '@/lib/admin/auth'
import {
  setCompanyAccessLinkFlash,
  type CompanyAccessKind,
} from '@/lib/admin/companyAccessLinkFlash'
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
  companyDescription: string | null
  contactEmail: string
  contactName: string
  contractEndDate: string | null
  contractStartDate: string | null
  contractStatusNote: string | null
  industryCategory: string | null
  logoUrl: string | null
  membershipStatus: string
  nextCheckDate: string | null
  planName: string | null
  publicContactEmail: string | null
  publicLocation: string | null
  publicStatus: string
  publicTags: string[]
  publicWebsiteUrl: string | null
  sortOrder: number
}

type CompanyAccessLinkResult =
  | { accessKind: CompanyAccessKind; actionLink: string; status: 'ok'; userId: string }
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

function logAuthLinkError(context: string, error: AuthEmailError | null) {
  console.error(`[admin companies] ${context}`, {
    code: error?.code,
    message: error?.message,
    status: error?.status,
  })
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

function numberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(textValue(formData, key))
  return Number.isFinite(value) ? value : fallback
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
      logAuthLinkError('auth user lookup failed', error)
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

async function generateCompanyAccessLink(
  serviceClient: NonNullable<ReturnType<typeof createAdminClient>>,
  values: Pick<CompanyFormValues, 'companyName' | 'contactEmail' | 'contactName'>,
): Promise<CompanyAccessLinkResult> {
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
    return {
      accessKind: 'invite',
      actionLink: buildCompanyAccessActionLink(inviteData.properties, redirectTo),
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
    logAuthLinkError('invite link generation failed', inviteError)
    return {
      errorStatus: getInviteErrorStatus(inviteError),
      status: 'error',
    }
  }

  const existingUser = await findAuthUserByEmail(serviceClient, values.contactEmail)

  if (!existingUser) {
    logAuthLinkError('existing auth user not found after duplicate invite', inviteError)
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
    logAuthLinkError('password reset link generation failed', resetError)
    return {
      errorStatus: getPasswordResetErrorStatus(resetError),
      status: 'error',
    }
  }

  return {
    accessKind: 'password_reset',
    actionLink: buildCompanyAccessActionLink(resetData.properties, redirectTo),
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
      company_description: values.companyDescription,
      contact_email: values.contactEmail,
      contact_name: values.contactName,
      contract_end_date: values.contractEndDate,
      contract_start_date: values.contractStartDate,
      contract_status_note: values.contractStatusNote,
      created_by_admin_id: adminUser.id,
      industry_category: values.industryCategory,
      last_status_changed_at: new Date().toISOString(),
      logo_url: values.logoUrl,
      membership_status: values.membershipStatus,
      next_check_date: values.nextCheckDate,
      plan_name: values.planName,
      public_contact_email: values.publicContactEmail,
      public_location: values.publicLocation,
      public_status: values.publicStatus,
      public_tags: values.publicTags,
      public_website_url: values.publicWebsiteUrl,
      sort_order: values.sortOrder,
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
    companyDescription: textValue(formData, 'companyDescription'),
    contactEmail: requiredText(formData, 'contactEmail').toLowerCase(),
    contactName: requiredText(formData, 'contactName'),
    contractEndDate: textValue(formData, 'contractEndDate'),
    contractStartDate: textValue(formData, 'contractStartDate'),
    contractStatusNote: textValue(formData, 'contractStatusNote'),
    industryCategory: textValue(formData, 'industryCategory'),
    logoUrl: textValue(formData, 'logoUrl'),
    membershipStatus: requiredText(formData, 'membershipStatus'),
    nextCheckDate: textValue(formData, 'nextCheckDate'),
    planName: textValue(formData, 'planName'),
    publicContactEmail: textValue(formData, 'publicContactEmail')?.toLowerCase() || null,
    publicLocation: textValue(formData, 'publicLocation'),
    publicStatus: requiredText(formData, 'publicStatus'),
    publicTags: arrayValue(formData, 'publicTags'),
    publicWebsiteUrl: textValue(formData, 'publicWebsiteUrl'),
    sortOrder: numberValue(formData, 'sortOrder', 100),
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

  const accessLinkResult = await generateCompanyAccessLink(serviceClient, values)

  if (accessLinkResult.status === 'error') {
    redirect(`/admin/companies/new?status=${accessLinkResult.errorStatus}`)
  }

  const company = await insertCompany(adminClient, adminUser, values, accessLinkResult.userId)

  await setCompanyAccessLinkFlash({
    accessKind: accessLinkResult.accessKind,
    actionLink: accessLinkResult.actionLink,
    companyId: company.id,
    companyName: values.companyName,
    contactEmail: values.contactEmail,
    contactName: values.contactName,
    createdAt: new Date().toISOString(),
  })

  revalidatePath('/admin')
  revalidatePath('/admin/companies')
  revalidatePath('/companies')
  const createdStatus =
    accessLinkResult.accessKind === 'password_reset' ? 'created_existing_user_link' : 'created_link'

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
      company_description: textValue(formData, 'companyDescription'),
      contact_email: requiredText(formData, 'contactEmail').toLowerCase(),
      contact_name: requiredText(formData, 'contactName'),
      contract_end_date: textValue(formData, 'contractEndDate'),
      contract_start_date: textValue(formData, 'contractStartDate'),
      contract_status_note: textValue(formData, 'contractStatusNote'),
      industry_category: textValue(formData, 'industryCategory'),
      last_status_changed_at:
        previousStatus !== membershipStatus ? new Date().toISOString() : undefined,
      logo_url: textValue(formData, 'logoUrl'),
      membership_status: membershipStatus,
      next_check_date: textValue(formData, 'nextCheckDate'),
      plan_name: textValue(formData, 'planName'),
      public_contact_email: textValue(formData, 'publicContactEmail')?.toLowerCase() || null,
      public_location: textValue(formData, 'publicLocation'),
      public_status: requiredText(formData, 'publicStatus'),
      public_tags: arrayValue(formData, 'publicTags'),
      public_website_url: textValue(formData, 'publicWebsiteUrl'),
      sort_order: numberValue(formData, 'sortOrder', 100),
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
  revalidatePath('/companies')
  revalidatePath(`/companies/${companyId}`)
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
  revalidatePath('/companies')
  redirect('/admin/companies?status=deleted')
}

export async function generateCompanyAccessLinkForCompany(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const serviceClient = createAdminClient()
  const companyId = requiredText(formData, 'companyId')
  const contactEmail = requiredText(formData, 'contactEmail').toLowerCase()
  const companyName = requiredText(formData, 'companyName')
  const contactName = requiredText(formData, 'contactName')

  if (!serviceClient) {
    redirect(`/admin/companies/${companyId}?status=service_key_missing`)
  }

  const accessLinkResult = await generateCompanyAccessLink(serviceClient, {
    companyName,
    contactEmail,
    contactName,
  })

  if (accessLinkResult.status === 'error') {
    redirect(`/admin/companies/${companyId}?status=${accessLinkResult.errorStatus}`)
  }

  const { data: duplicateAuthCompany } = await adminClient
    .from('companies')
    .select('id')
    .eq('auth_user_id', accessLinkResult.userId)
    .neq('id', companyId)
    .maybeSingle()

  if (duplicateAuthCompany) {
    redirect(`/admin/companies/${companyId}?status=auth_user_duplicate_company`)
  }

  const { error: updateAuthUserError } = await adminClient
    .from('companies')
    .update({ auth_user_id: accessLinkResult.userId })
    .eq('id', companyId)

  if (updateAuthUserError) {
    redirect(`/admin/companies/${companyId}?status=error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'company.access_link_generate',
    admin_user_id: adminUser.id,
    details: { access_kind: accessLinkResult.accessKind, contact_email: contactEmail },
    target_id: companyId,
    target_table: 'companies',
  })

  await setCompanyAccessLinkFlash({
    accessKind: accessLinkResult.accessKind,
    actionLink: accessLinkResult.actionLink,
    companyId,
    companyName,
    contactEmail,
    contactName,
    createdAt: new Date().toISOString(),
  })

  const generatedStatus =
    accessLinkResult.accessKind === 'password_reset' ? 'password_reset_link_generated' : 'invite_link_generated'

  redirect(`/admin/companies/${companyId}?status=${generatedStatus}`)
}
