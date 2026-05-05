'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) || '').trim()
  return value || null
}

export async function updateRequestStatus(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const requestId = textValue(formData, 'requestId')
  const status = textValue(formData, 'status')

  if (!requestId || !status) {
    redirect('/admin/requests?status=missing')
  }

  const { error } = await adminClient
    .from('interview_requests')
    .update({ status })
    .eq('id', requestId)

  if (error) {
    redirect('/admin/requests?status=error')
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'interview_request.update_status',
    admin_user_id: adminUser.id,
    details: { status },
    target_id: requestId,
    target_table: 'interview_requests',
  })

  revalidatePath('/admin')
  revalidatePath('/admin/requests')
  redirect('/admin/requests?status=updated')
}
