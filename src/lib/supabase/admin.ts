import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdminEnv } from './config'

export function createAdminClient() {
  const { secretKey, url } = getSupabaseAdminEnv()

  if (!url || !secretKey) {
    return null
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
