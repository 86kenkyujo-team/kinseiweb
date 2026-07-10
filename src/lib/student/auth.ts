import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type StudentMemberProfile = {
  career_axis: string[] | null
  decision_axis: string | null
  deep_dive_answers: unknown
  future_vision: string | null
  meeting_preference: string | null
  motivation_detail: string | null
  real_name: string | null
  thinking_style: string | null
  values_text: string | null
}

export type StudentAccount = {
  attributes: string[] | null
  auth_user_id: string | null
  catch_copy: string
  desired_industries: string[] | null
  display_name: string
  faculty: string
  grade: string
  id: string
  initials: string
  location: string | null
  login_email: string | null
  login_status: string
  profile_confirmed_at: string | null
  profile_image_url: string | null
  profile_share_consent_at: string | null
  profile_share_status: string
  profile_summary: string | null
  student_member_profiles: StudentMemberProfile | StudentMemberProfile[] | null
  tiktok_url: string | null
  video_url: string | null
}

export function getSafeStudentNextPath(requestedNextPath?: string | null) {
  return requestedNextPath?.startsWith('/') && !requestedNextPath.startsWith('//')
    ? requestedNextPath
    : '/student/profile'
}

export async function getStudentContext() {
  const supabase = await createClient()

  if (!supabase) {
    return {
      isConfigured: false,
      student: null,
      studentClient: null,
      user: null,
    }
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    return {
      isConfigured: true,
      student: null,
      studentClient: supabase,
      user: null,
    }
  }

  const studentProfileClient = createAdminClient() || supabase
  const { data: student } = await studentProfileClient
    .from('students')
    .select(
      `
        id,
        auth_user_id,
        login_email,
        login_status,
        profile_share_status,
        profile_confirmed_at,
        profile_share_consent_at,
        display_name,
        initials,
        faculty,
        grade,
        location,
        attributes,
        desired_industries,
        catch_copy,
        profile_summary,
        profile_image_url,
        tiktok_url,
        video_url,
        student_member_profiles (
          real_name,
          values_text,
          thinking_style,
          career_axis,
          motivation_detail,
          decision_axis,
          future_vision,
          meeting_preference,
          deep_dive_answers
        )
      `,
    )
    .eq('auth_user_id', user.id)
    .maybeSingle<StudentAccount>()

  return {
    isConfigured: true,
    student: student || null,
    studentClient: supabase,
    user,
  }
}

export async function requireStudent(nextPath = '/student/profile') {
  const context = await getStudentContext()

  if (!context.isConfigured || !context.studentClient) {
    return context as {
      isConfigured: false
      student: null
      studentClient: null
      user: null
    }
  }

  if (!context.user) {
    redirect(`/student/login?next=${encodeURIComponent(nextPath)}`)
  }

  if (!context.student) {
    return context as {
      isConfigured: true
      student: null
      studentClient: NonNullable<typeof context.studentClient>
      user: NonNullable<typeof context.user>
    }
  }

  return context as {
    isConfigured: true
    student: NonNullable<typeof context.student>
    studentClient: NonNullable<typeof context.studentClient>
    user: NonNullable<typeof context.user>
  }
}

export function normalizeStudentProfile(profile: StudentAccount['student_member_profiles']) {
  if (Array.isArray(profile)) {
    return profile[0] || null
  }

  return profile || null
}
