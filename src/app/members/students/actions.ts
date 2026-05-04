'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    redirect('/login?next=/members/students')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, membership_status')
    .single()

  if (!company || !['active', 'trial'].includes(company.membership_status)) {
    redirect('/membership-inactive')
  }

  const { error } = await supabase.from('interview_requests').insert({
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
