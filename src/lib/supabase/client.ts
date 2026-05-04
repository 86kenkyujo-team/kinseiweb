'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseBrowserEnv } from './config'

export function createClient() {
  const { publishableKey, url } = getSupabaseBrowserEnv()

  if (!url || !publishableKey) {
    throw new Error('Supabase environment variables are not configured.')
  }

  return createBrowserClient(url, publishableKey)
}
