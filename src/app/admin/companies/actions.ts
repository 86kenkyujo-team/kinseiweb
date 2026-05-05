'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminRedirectUrl, requireAdmin } from '@/lib/admin/auth'

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

export async function createCompany(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const companyName = requiredText(formData, 'companyName')
  const contactName = requiredText(formData, 'contactName')
  const contactEmail = requiredText(formData, 'contactEmail').toLowerCase()
  const membershipStatus = requiredText(formData, 'membershipStatus')
  const planName = textValue(formData, 'planName')
  const contractStatusNote = textValue(formData, 'contractStatusNote')
  const contractStartDate = textValue(formData, 'contractStartDate')
  const contractEndDate = textValue(formData, 'contractEndDate')
  const nextCheckDate = textValue(formData, 'nextCheckDate')
  const adminNote = textValue(formData, 'adminNote')

  const { data: existingCompany } = await adminClient
    .from('companies')
    .select('id')
    .eq('contact_email', contactEmail)
    .maybeSingle()

  if (existingCompany) {
    redirect('/admin/companies/new?status=duplicate')
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    contactEmail,
    {
      data: {
        company_name: companyName,
        contact_name: contactName,
      },
      redirectTo: getAdminRedirectUrl(),
    },
  )

  if (inviteError || !inviteData.user) {
    redirect('/admin/companies/new?status=invite_error')
  }

  const { data: company, error: insertError } = await adminClient
    .from('companies')
    .insert({
      admin_note: adminNote,
      auth_user_id: inviteData.user.id,
      company_name: companyName,
      contact_email: contactEmail,
      contact_name: contactName,
      contract_end_date: contractEndDate,
      contract_start_date: contractStartDate,
      contract_status_note: contractStatusNote,
      created_by_admin_id: adminUser.id,
      last_status_changed_at: new Date().toISOString(),
      membership_status: membershipStatus,
      next_check_date: nextCheckDate,
      plan_name: planName,
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
      next_status: membershipStatus,
      note: '企業登録時の初期ステータス',
    }),
    adminClient.from('admin_activity_logs').insert({
      action: 'company.create',
      admin_user_id: adminUser.id,
      details: { contact_email: contactEmail, membership_status: membershipStatus },
      target_id: company.id,
      target_table: 'companies',
    }),
  ])

  revalidatePath('/admin')
  revalidatePath('/admin/companies')
  redirect(`/admin/companies/${company.id}?status=created`)
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

export async function resendCompanyInvite(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const companyId = requiredText(formData, 'companyId')
  const contactEmail = requiredText(formData, 'contactEmail').toLowerCase()

  const { error } = await adminClient.auth.admin.inviteUserByEmail(contactEmail, {
    redirectTo: getAdminRedirectUrl(),
  })

  if (error) {
    redirect(`/admin/companies/${companyId}?status=invite_error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'company.invite_resend',
    admin_user_id: adminUser.id,
    details: { contact_email: contactEmail },
    target_id: companyId,
    target_table: 'companies',
  })

  redirect(`/admin/companies/${companyId}?status=invite_sent`)
}
