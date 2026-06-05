import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminUser = {
  auth_user_id: string
  display_name: string | null
  id: string
  role: string
}

export async function getAdminContext() {
  const supabase = await createClient()

  if (!supabase) {
    return {
      adminClient: null,
      adminUser: null,
      isConfigured: false,
      user: null,
    }
  }

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    return {
      adminClient: supabase,
      adminUser: null,
      isConfigured: true,
      user: null,
    }
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, auth_user_id, display_name, role')
    .eq('auth_user_id', user.id)
    .maybeSingle<AdminUser>()

  return {
    adminClient: supabase,
    adminUser: adminUser || null,
    isConfigured: true,
    user,
  }
}

export async function requireAdmin() {
  const context = await getAdminContext()

  if (!context.isConfigured || !context.adminClient) {
    redirect('/admin/login?next=/admin')
  }

  if (!context.user) {
    redirect('/admin/login?next=/admin')
  }

  if (!context.adminUser) {
    redirect('/membership-inactive')
  }

  return context as {
    adminClient: NonNullable<typeof context.adminClient>
    adminUser: NonNullable<typeof context.adminUser>
    isConfigured: true
    user: NonNullable<typeof context.user>
  }
}

export function getAdminRedirectUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (!siteUrl) {
    return undefined
  }

  const normalizedUrl = siteUrl.startsWith('http')
    ? siteUrl
    : `https://${siteUrl}`

  return `${normalizedUrl}/login?next=/members/students`
}
