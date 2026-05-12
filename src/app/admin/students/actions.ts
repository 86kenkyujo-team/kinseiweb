'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { buildDeepDiveAnswersFromForm } from '@/lib/studentProfileQuestions'

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

function publicStudentPayload(formData: FormData) {
  return {
    attributes: arrayValue(formData, 'attributes'),
    catch_copy: requiredText(formData, 'catchCopy'),
    desired_industries: arrayValue(formData, 'desiredIndustries'),
    display_name: requiredText(formData, 'displayName'),
    faculty: requiredText(formData, 'faculty'),
    grade: requiredText(formData, 'grade'),
    initials: requiredText(formData, 'initials'),
    location: textValue(formData, 'location'),
    profile_image_url: textValue(formData, 'profileImageUrl'),
    profile_summary: textValue(formData, 'profileSummary'),
    publication_status: requiredText(formData, 'publicationStatus'),
    tiktok_url: textValue(formData, 'tiktokUrl'),
    video_url: textValue(formData, 'videoUrl'),
  }
}

function memberProfilePayload(formData: FormData, studentId: string) {
  return {
    career_axis: arrayValue(formData, 'careerAxis'),
    decision_axis: textValue(formData, 'decisionAxis'),
    deep_dive_answers: buildDeepDiveAnswersFromForm(formData),
    future_vision: textValue(formData, 'futureVision'),
    meeting_preference: textValue(formData, 'meetingPreference'),
    motivation_detail: textValue(formData, 'motivationDetail'),
    real_name: textValue(formData, 'realName'),
    student_id: studentId,
    thinking_style: textValue(formData, 'thinkingStyle'),
    values_text: textValue(formData, 'valuesText'),
  }
}

export async function createStudent(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const studentPayload = publicStudentPayload(formData)
  const { data: student, error } = await adminClient
    .from('students')
    .insert(studentPayload)
    .select('id, publication_status')
    .single()

  if (error || !student) {
    redirect('/admin/students/new?status=error')
  }

  await adminClient
    .from('student_member_profiles')
    .upsert(memberProfilePayload(formData, student.id), { onConflict: 'student_id' })

  await Promise.all([
    adminClient.from('student_publication_logs').insert({
      admin_user_id: adminUser.id,
      next_status: student.publication_status,
      note: '学生登録時の初期ステータス',
      student_id: student.id,
    }),
    adminClient.from('admin_activity_logs').insert({
      action: 'student.create',
      admin_user_id: adminUser.id,
      details: { publication_status: student.publication_status },
      target_id: student.id,
      target_table: 'students',
    }),
  ])

  revalidatePath('/admin')
  revalidatePath('/admin/students')
  revalidatePath('/students')
  revalidatePath('/members/students')
  redirect(`/admin/students/${student.id}/edit?status=created`)
}

export async function updateStudent(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const studentId = requiredText(formData, 'studentId')
  const previousStatus = textValue(formData, 'previousStatus')
  const nextStatus = requiredText(formData, 'publicationStatus')

  const { error } = await adminClient
    .from('students')
    .update(publicStudentPayload(formData))
    .eq('id', studentId)

  if (error) {
    redirect(`/admin/students/${studentId}/edit?status=error`)
  }

  await adminClient
    .from('student_member_profiles')
    .upsert(memberProfilePayload(formData, studentId), { onConflict: 'student_id' })

  if (previousStatus !== nextStatus) {
    await adminClient.from('student_publication_logs').insert({
      admin_user_id: adminUser.id,
      next_status: nextStatus,
      note: textValue(formData, 'publicationNote'),
      previous_status: previousStatus,
      student_id: studentId,
    })
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'student.update',
    admin_user_id: adminUser.id,
    details: { publication_status: nextStatus },
    target_id: studentId,
    target_table: 'students',
  })

  revalidatePath('/admin')
  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}/edit`)
  revalidatePath('/students')
  revalidatePath('/members/students')
  redirect(`/admin/students/${studentId}/edit?status=updated`)
}
