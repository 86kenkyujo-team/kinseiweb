import { cookies } from 'next/headers'

export type StudentAccessKind = 'invite' | 'password_reset'

export type StudentAccessLinkFlash = {
  accessKind: StudentAccessKind
  actionLink: string
  contactEmail: string
  createdAt: string
  studentDisplayName: string
  studentId: string
}

const cookieName = 'kinsei_student_access_link'

export async function setStudentAccessLinkFlash(payload: StudentAccessLinkFlash) {
  const cookieStore = await cookies()
  const encodedValue = Buffer.from(JSON.stringify(payload)).toString('base64url')

  cookieStore.set(cookieName, encodedValue, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: '/admin/students',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getStudentAccessLinkFlash() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(cookieName)?.value

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(rawValue, 'base64url').toString('utf8')) as StudentAccessLinkFlash
  } catch {
    return null
  }
}
