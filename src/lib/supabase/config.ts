export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  return {
    isConfigured: Boolean(url && publishableKey),
    publishableKey,
    url,
  }
}
