'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { buildDeepDiveAnswersFromForm } from '@/lib/studentProfileQuestions'

const studentMediaBucket = process.env.NEXT_PUBLIC_STUDENT_MEDIA_BUCKET || 'student-media'

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

function getStudentMediaStoragePath(url: string | null) {
  if (!url) {
    return null
  }

  try {
    const pathname = new URL(url).pathname
    const bucketMarker = `/storage/v1/object/public/${studentMediaBucket}/`
    const markerIndex = pathname.indexOf(bucketMarker)

    if (markerIndex === -1) {
      return null
    }

    return decodeURIComponent(pathname.slice(markerIndex + bucketMarker.length))
  } catch {
    return null
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

export async function deleteStudent(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const studentId = requiredText(formData, 'studentId')
  const expectedStudentName = requiredText(formData, 'studentName')
  const enteredStudentName = requiredText(formData, 'studentNameConfirmation')
  const isConfirmed = formData.get('confirmDelete') === 'on'

  if (!isConfirmed) {
    redirect(`/admin/students/${studentId}/edit?status=delete_confirm_required`)
  }

  if (enteredStudentName !== expectedStudentName) {
    redirect(`/admin/students/${studentId}/edit?status=delete_name_mismatch`)
  }

  const { data: student } = await adminClient
    .from('students')
    .select('id, display_name, profile_image_url, video_url')
    .eq('id', studentId)
    .maybeSingle()

  if (!student) {
    redirect('/admin/students?status=delete_not_found')
  }

  const mediaPaths = Array.from(
    new Set(
      [student.profile_image_url, student.video_url]
        .map((url) => getStudentMediaStoragePath(url))
        .filter((path): path is string => Boolean(path)),
    ),
  )

  const { count: interviewRequestCount } = await adminClient
    .from('interview_requests')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)

  const { error: interviewDeleteError } = await adminClient
    .from('interview_requests')
    .delete()
    .eq('student_id', studentId)

  if (interviewDeleteError) {
    redirect(`/admin/students/${studentId}/edit?status=delete_error`)
  }

  const { error: studentDeleteError } = await adminClient
    .from('students')
    .delete()
    .eq('id', studentId)

  if (studentDeleteError) {
    redirect(`/admin/students/${studentId}/edit?status=delete_error`)
  }

  let mediaDeleteErrorMessage: string | null = null

  if (mediaPaths.length > 0) {
    const { error: mediaDeleteError } = await adminClient.storage
      .from(studentMediaBucket)
      .remove(mediaPaths)

    if (mediaDeleteError) {
      mediaDeleteErrorMessage = mediaDeleteError.message
      console.error('[admin students] media delete failed', {
        message: mediaDeleteError.message,
        paths: mediaPaths,
        studentId,
      })
    }
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'student.delete',
    admin_user_id: adminUser.id,
    details: {
      deleted_interview_request_count: interviewRequestCount || 0,
      deleted_media_count: mediaPaths.length,
      display_name: student.display_name,
      media_delete_error: mediaDeleteErrorMessage,
    },
    target_id: student.id,
    target_table: 'students',
  })

  revalidatePath('/admin')
  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}/edit`)
  revalidatePath('/students')
  revalidatePath('/members/students')
  redirect('/admin/students?status=deleted')
}
