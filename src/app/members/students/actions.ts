'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createInterviewRequest(formData: FormData) {
  const studentId = String(formData.get('studentId') || '')
  const requestReason = String(formData.get('requestReason') || '').trim()
  const preferredMethod = String(formData.get('preferredMethod') || '').trim()
  const preferredSchedule = String(formData.get('preferredSchedule') || '').trim()

  if (!studentId || !requestReason || !preferredMethod) {
    redirect('/members/students?request=missing')
  }

  const supabase = await createClient()

  if (!supabase) {
    redirect('/members/students?request=setup')
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    redirect('/login?next=/members/students')
  }

  const serviceClient = createAdminClient()

  if (!serviceClient) {
    redirect('/members/students?request=setup')
  }

  const { data: company } = await serviceClient
    .from('companies')
    .select('id, membership_status')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!company || !['active', 'trial'].includes(company.membership_status)) {
    redirect('/membership-inactive')
  }

  const { data: student } = await serviceClient
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('publication_status', 'published')
    .maybeSingle()

  if (!student) {
    redirect('/members/students?request=error')
  }

  const { error } = await serviceClient.from('interview_requests').insert({
    company_id: company.id,
    preferred_method: preferredMethod,
    preferred_schedule: preferredSchedule || null,
    request_reason: requestReason,
    student_id: studentId,
  })

  if (error) {
    redirect('/members/students?request=error')
  }

  revalidatePath('/members/students')
  redirect('/members/students?request=sent')
}
