import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseBrowserEnv } from './config'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })
  const { publishableKey, url } = getSupabaseBrowserEnv()

  if (!url || !publishableKey) {
    return response
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  await supabase.auth.getClaims()

  return response
}
