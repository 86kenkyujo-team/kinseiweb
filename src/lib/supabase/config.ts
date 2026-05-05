export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  return {
    isConfigured: Boolean(url && publishableKey),
    publishableKey,
    url,
  }
}

export function getSupabaseAdminEnv() {
  const { url } = getSupabaseBrowserEnv()
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  return {
    isConfigured: Boolean(url && secretKey),
    secretKey,
    url,
  }
}
