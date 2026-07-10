'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getStudentPasswordUpdateRedirectUrl, requireAdmin } from '@/lib/admin/auth'
import {
  setStudentAccessLinkFlash,
  type StudentAccessKind,
} from '@/lib/admin/studentAccessLinkFlash'
import { buildDeepDiveAnswersFromForm } from '@/lib/studentProfileQuestions'
import { createAdminClient } from '@/lib/supabase/admin'

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
    login_email: textValue(formData, 'loginEmail')?.toLowerCase() || null,
    login_status: requiredText(formData, 'loginStatus'),
    profile_image_url: textValue(formData, 'profileImageUrl'),
    profile_share_status: requiredText(formData, 'profileShareStatus'),
    profile_summary: textValue(formData, 'profileSummary'),
    publication_status: requiredText(formData, 'publicationStatus'),
    tiktok_url: textValue(formData, 'tiktokUrl'),
    video_url: textValue(formData, 'videoUrl'),
  }
}

type AuthEmailError = {
  code?: string
  message?: string
  status?: number
}

type LinkProperties = {
  action_link: string
  hashed_token?: string
  verification_type?: string
}

type StudentAccessLinkResult =
  | { accessKind: StudentAccessKind; actionLink: string; status: 'ok'; userId: string }
  | { errorStatus: string; status: 'error' }

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
  console.error(`[admin students] ${context}`, {
    code: error?.code,
    message: error?.message,
    status: error?.status,
  })
}

function buildStudentAccessActionLink(properties: LinkProperties, redirectTo?: string) {
  if (!redirectTo || !properties.hashed_token || !properties.verification_type) {
    return properties.action_link
  }

  const siteOrigin = new URL(redirectTo).origin
  const url = new URL('/auth/confirm', siteOrigin)
  url.searchParams.set('token_hash', properties.hashed_token)
  url.searchParams.set('type', properties.verification_type)
  url.searchParams.set('next', '/student/profile')

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

async function generateStudentAccessLink(
  serviceClient: NonNullable<ReturnType<typeof createAdminClient>>,
  values: { email: string; studentDisplayName: string },
): Promise<StudentAccessLinkResult> {
  const redirectTo = getStudentPasswordUpdateRedirectUrl()
  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.generateLink({
    email: values.email,
    options: {
      data: {
        student_display_name: values.studentDisplayName,
        user_type: 'student',
      },
      redirectTo,
    },
    type: 'invite',
  })

  if (!inviteError && inviteData.user && inviteData.properties?.action_link) {
    return {
      accessKind: 'invite',
      actionLink: buildStudentAccessActionLink(inviteData.properties, redirectTo),
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

  const existingUser = await findAuthUserByEmail(serviceClient, values.email)

  if (!existingUser) {
    logAuthLinkError('existing auth user not found after duplicate invite', inviteError)
    return {
      errorStatus: 'auth_user_lookup_error',
      status: 'error',
    }
  }

  const { data: resetData, error: resetError } = await serviceClient.auth.admin.generateLink({
    email: values.email,
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
    actionLink: buildStudentAccessActionLink(resetData.properties, redirectTo),
    status: 'ok',
    userId: existingUser.id,
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
  revalidatePath('/student/profile')
  redirect(`/admin/students/${studentId}/edit?status=updated`)
}

export async function generateStudentAccessLinkForStudent(formData: FormData) {
  const { adminClient, adminUser } = await requireAdmin()
  const serviceClient = createAdminClient()
  const studentId = requiredText(formData, 'studentId')
  const studentDisplayName = requiredText(formData, 'studentDisplayName')
  const loginEmail = requiredText(formData, 'loginEmail').toLowerCase()

  if (!serviceClient) {
    redirect(`/admin/students/${studentId}/edit?status=service_key_missing`)
  }

  const accessLinkResult = await generateStudentAccessLink(serviceClient, {
    email: loginEmail,
    studentDisplayName,
  })

  if (accessLinkResult.status === 'error') {
    redirect(`/admin/students/${studentId}/edit?status=${accessLinkResult.errorStatus}`)
  }

  const { data: duplicateAuthStudent } = await adminClient
    .from('students')
    .select('id')
    .eq('auth_user_id', accessLinkResult.userId)
    .neq('id', studentId)
    .maybeSingle()

  if (duplicateAuthStudent) {
    redirect(`/admin/students/${studentId}/edit?status=auth_user_duplicate_student`)
  }

  const { error: updateStudentError } = await adminClient
    .from('students')
    .update({
      auth_user_id: accessLinkResult.userId,
      login_email: loginEmail,
      login_status: 'invited',
    })
    .eq('id', studentId)

  if (updateStudentError) {
    redirect(`/admin/students/${studentId}/edit?status=error`)
  }

  await adminClient.from('admin_activity_logs').insert({
    action: 'student.access_link_generate',
    admin_user_id: adminUser.id,
    details: { access_kind: accessLinkResult.accessKind, login_email: loginEmail },
    target_id: studentId,
    target_table: 'students',
  })

  await setStudentAccessLinkFlash({
    accessKind: accessLinkResult.accessKind,
    actionLink: accessLinkResult.actionLink,
    contactEmail: loginEmail,
    createdAt: new Date().toISOString(),
    studentDisplayName,
    studentId,
  })

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}/edit`)

  const generatedStatus =
    accessLinkResult.accessKind === 'password_reset' ? 'student_password_reset_link_generated' : 'student_invite_link_generated'

  redirect(`/admin/students/${studentId}/edit?status=${generatedStatus}`)
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
