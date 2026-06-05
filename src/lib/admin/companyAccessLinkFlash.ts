import { cookies } from 'next/headers'

export type CompanyAccessKind = 'invite' | 'password_reset'

export type CompanyAccessLinkFlash = {
  accessKind: CompanyAccessKind
  actionLink: string
  companyId: string
  companyName: string
  contactEmail: string
  contactName: string
  createdAt: string
}

const cookieName = 'kinsei_company_access_link'

export async function setCompanyAccessLinkFlash(payload: CompanyAccessLinkFlash) {
  const cookieStore = await cookies()
  const encodedValue = Buffer.from(JSON.stringify(payload)).toString('base64url')

  cookieStore.set(cookieName, encodedValue, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: '/admin/companies',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getCompanyAccessLinkFlash() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(cookieName)?.value

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(rawValue, 'base64url').toString('utf8')) as CompanyAccessLinkFlash
  } catch {
    return null
  }
}
